"""Erzeugt eine wiederholbare Fassadenkachel aus einem Foto oder einem öffentlichen Drive-Link."""
import argparse
import io
import os
from pathlib import Path
import re
import tempfile
from urllib.error import HTTPError, URLError
from urllib.parse import parse_qs, urlencode, urlsplit
from urllib.request import urlopen

from PIL import Image, ImageOps

CLASSES = ("wohnblock", "buero", "industrie")
DEST = Path(__file__).resolve().parents[1] / "media" / "fassaden"
MAX_BYTES = 32 * 1024 * 1024


def read_source(source):
    url = urlsplit(source)
    if url.scheme not in ("http", "https"):
        return Path(source).expanduser().open("rb")
    if url.scheme != "https" or url.hostname != "drive.google.com":
        raise ValueError("Eine lokale Bilddatei oder einen HTTPS-Freigabelink von Google Drive angeben.")
    query = parse_qs(url.query)
    match = re.fullmatch(r"/file/d/([\w-]+)(?:/(?:view|edit|preview))?/?", url.path)
    file_id = match[1] if match else query.get("id", [""])[0]
    if not re.fullmatch(r"[A-Za-z0-9_-]+", file_id):
        raise ValueError("Der Drive-Link muss auf eine einzelne Bilddatei zeigen.")
    params = {"id": file_id, "export": "download"}
    if "resourcekey" in query:
        params["resourcekey"] = query["resourcekey"][0]
    with urlopen("https://drive.usercontent.google.com/download?" + urlencode(params), timeout=30) as response:
        if response.headers.get_content_type() == "text/html":
            raise ValueError("Drive liefert eine Webseite. Die Freigabe prüfen oder das Foto lokal angeben.")
        data = response.read(MAX_BYTES + 1)
    if len(data) > MAX_BYTES:
        raise ValueError("Die Drive-Datei ist grösser als 32 MB.")
    return io.BytesIO(data)


def write_tile(source, kind, crop=None):
    with read_source(source) as stream, Image.open(stream) as raw:
        if raw.width * raw.height > 48_000_000:
            raise ValueError("Bitte ein Foto mit höchstens 48 Megapixeln wählen.")
        photo = ImageOps.exif_transpose(raw).convert("RGB")
        if crop:
            x, y, width, height = crop
            if min(x, y) < 0 or min(width, height) <= 0 or x + width > photo.width or y + height > photo.height:
                raise ValueError("Der Ausschnitt liegt ausserhalb des Fotos.")
            photo = photo.crop((x, y, x + width, y + height))
        tile = photo.resize((512, 512), Image.Resampling.LANCZOS)
    DEST.mkdir(parents=True, exist_ok=True)
    target = DEST / (kind + ".webp")
    with tempfile.NamedTemporaryFile(dir=DEST, delete=False) as temporary:
        temp = Path(temporary.name)
    try:
        tile.save(temp, "WEBP", quality=87, method=6)
        temp.chmod(0o644)
        os.replace(temp, target)
    finally:
        temp.unlink(missing_ok=True)
    return target


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("klasse", choices=CLASSES)
    parser.add_argument("foto", help="Bildpfad oder Freigabelink zu einer einzelnen Bilddatei in Google Drive")
    parser.add_argument("--crop", nargs=4, type=int, metavar=("X", "Y", "BREITE", "HÖHE"),
                        help="Ausschnitt mit zwei Fensterachsen und zwei Stockwerken in Pixeln")
    args = parser.parse_args()
    try:
        print(write_tile(args.foto, args.klasse, args.crop))
    except (OSError, ValueError, HTTPError, URLError, Image.DecompressionBombError) as error:
        parser.exit(1, f"Import fehlgeschlagen. {error}\n")
