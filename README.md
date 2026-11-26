# Helvetia Open World

Open-World-Spiel im Browser: die ganze Schweiz im Massstab 1:1 mit echtem Gelände.
28 Städte und Orte sowie der ganze Kanton Luzern enthalten jedes Gebäude und jede Strasse.

## Spielen

Das Spiel besteht nur aus statischen Dateien. Die grossen Spieldaten (Gelände, Luftbilder, Regionen, Bäume)
liegen nicht im Repository, sondern in einem Cloudflare-R2-Bucket; das Spiel lädt sie von dort
(`DATA_URL` in `src/a_core.js`). Lokal starten:

```sh
python3 -m http.server 8000
# dann http://localhost:8000 öffnen
```

Der Bucket gibt seine Dateien nur an eingetragene Adressen heraus (CORS). Für den lokalen Start entweder
`http://localhost:8000` in den CORS-Regeln des Buckets ergänzen oder die Daten mit der Pipeline selbst erzeugen
und `http://localhost:8000/?data=lokal` öffnen: dann liest das Spiel die Ordner `w/`, `r/`, `n/`, `z/` neben `index.html`.

Online über GitHub Pages: *Settings → Pages → Build and deployment → Deploy from a branch*,
Branch wählen, Ordner `/ (root)`.

### Steuerung

| Taste | Aktion |
|---|---|
| WASD / Pfeile | bewegen, fahren |
| Maus ziehen, Mausrad | umsehen, zoomen |
| E | ein- und aussteigen |
| G | Garage: Fahrzeug holen, Spezialfahrzeuge bestellen |
| C | Charakter wechseln |
| M | Karte, Reise in jeden Ort |
| P | echte Fotos aus der Umgebung (erscheint, wenn es in der Nähe welche gibt) |
| Shift / Leertaste | rennen · springen / Handbremse (Helikopter: sinken · steigen) |
| R | zurück auf die nächste Strasse |

Auf dem Handy erscheinen Joystick und Knöpfe automatisch.

## Fotos und Spieloptik

Neue Spielstände beginnen in der Abendsonne. Sonnenstand und Tageszeit verändern die Farbe des Himmels, den Dunst über den Bergen, die Fensterbeleuchtung und die Lichtreflexe auf den Seen. Wohnblöcke, Büro- und Industriegebäude nutzen wiederholbare Fototexturen. Im Kanton Luzern sowie in Biel, Nidau, Port, Lyssach und Interlaken bestimmt das eidgenössische Gebäuderegister die Fassade jedes Hauses (altes Wohnhaus mit Fensterläden, Holzhaus, Altstadt, Wohnblock, modernes Haus, Büro, Industrie, Scheune) und die Zahl der Fensterreihen. Die Luftbilder und Dachformen kommen weiterhin von swisstopo. Steildächer und Flachdächer tragen in der Nähe das scharfe Luftbild, Seen und Flüsse spiegeln den Himmel, und nachts schimmern die Strassen warm. Die scharfen Luftbilder laden auch auf dem Handy, dort in einem kleineren Umkreis.

Über **M → Ortsansicht** öffnest du Street View oder das Google-Satellitenbild an deiner Spielposition. Ein Klick auf einen Ort in der Landeskarte wählt dessen Koordinaten. Für eine eingebettete Strassenansicht kann der Betreiber in `src/head.html` bei `#photo-view` das Attribut `data-embed-key` mit einem für die Spieldomain und die Maps Embed API eingeschränkten Browser-Schlüssel setzen und `./build.sh` ausführen. Die Links funktionieren auch ohne Schlüssel. Street View hängt von der lokalen Abdeckung ab.

Unter **M → Ortsansicht → Fotos aus der Umgebung** erscheinen Fotos im Umkreis von 2,5 km. Für Zürich, Genf, Luzern und Bern sind Ansichten hinterlegt. An anderen Standorten sucht das Spiel auf Wikimedia Commons nach georeferenzierten Bildern. Zu jedem Foto führt ein Link zur Quelle.

Über **Fotos aus dem Google-Maps-Scraper laden** kannst du einen JSON- oder JSONL-Export aus [deinem Scraper](https://github.com/Ardosssss/google-maps-scraper) auswählen. Den Export erstellst du beim Suchlauf mit `-json -results orte.jsonl`. Die Ortsansicht ordnet die Treffer nach der Entfernung zum gewählten Ort. Die Bildquellen laden erst beim Öffnen der Ortsansicht. Die ausgewählte Datei bleibt im Browser und gilt für die laufende Sitzung. Ein vorhandenes Panorama lässt sich am jeweiligen Treffer mit **Street View** öffnen.

Unter **Ortsansicht → Eigenes Fassadenfoto ausprobieren** lässt sich ein eigenes oder freigegebenes Foto direkt im Spiel testen. Die Auswahl gilt für den Gebäudetyp während der aktuellen Sitzung. Für eine dauerhafte Änderung nimmt der Importer eine lokale Bilddatei oder den Freigabelink zu einer öffentlich lesbaren Bilddatei in Google Drive entgegen. Ein frontal aufgenommenes Rechteck mit zwei Fensterachsen und zwei Stockwerken passt auf das vorhandene Gebäuderaster.

```sh
python3 -m pip install Pillow
python3 pipeline/fassaden.py wohnblock mein-foto.jpg --crop 100 80 600 500
python3 pipeline/fassaden.py buero 'https://drive.google.com/file/d/DATEI_ID/view'
```

Die fertige WebP-Datei (512 × 512 Pixel) liegt in `media/fassaden/`. Mögliche Gebäudetypen sind `wohnblock`, `buero` und `industrie`. Mit dem Einchecken der Datei wird das Foto Teil der Spielwelt. Für die Ortsansicht gelten die [Google-Maps-Richtlinien](https://about.google/brand-resource-center/products-and-services/geo-guidelines/).

### Navigation auf der Minikarte

Eine rosa Linie führt auf befahrbaren Strassen zum nächsten lokalen Kurierpunkt, bei aktivem Auftrag zum Ziel. Sie erscheint, sobald das Ziel höchstens 3,5 km entfernt und über das geladene Strassennetz erreichbar ist. Die Wegsuche berücksichtigt die im Spiel gespeicherten Einbahnstrassen und verbindet Strassenstücke an ihren Knoten. Als Vorbild diente die A*-Suche von [Baritone](https://github.com/cabaletta/baritone). Der Browsercode ist eine eigenständige Implementierung für Helvetia.

## Aufbau

| Pfad | Inhalt |
|---|---|
| `index.html` | fertig gebautes Spiel (aus `src/`, nicht von Hand ändern) |
| `src/` | Quellcode: `head.html` (Seite, HUD), `a_core.js` (Grundlagen, Höhenmodell), `b_world.js` (Gelände, Luftbilder), `c_zone.js` (Regionen, Gebäude, Strassen), `d_ent.js` (Fahrzeuge, Figuren, Verkehr), `navigation.js` (lokale Strassenrouten), `e_game.js` (Ablauf, Karte, Garage, HUD) |
| `build.sh` | setzt `src/` zu `index.html` zusammen |
| `pipeline/` | Python-Skripte, die alle Daten aus den Quellen erzeugen und in den Bucket laden |

Die folgenden Ordner entstehen durch die Pipeline und liegen im R2-Bucket (nicht im Repository):

| Pfad | Inhalt |
|---|---|
| `w/` | Landesdaten: Höhenmodell 100 m (`dem*.png`), Luftbilder Schweiz (`ortho.jpg`, `n_*.jpg`) und Kanton Luzern (`l_*.jpg`), Ortsliste, Index mit Tunnelportalen |
| `r/` | 87 Regionen (je 8 × 8 km): `*.json` mit Strassen, Wasser, Bäumen, Höhenraster 25 m und den Gebäuden ohne Vermessungsdach; `*.b3z` mit den echten Dachformen (swissBUILDINGS3D, rund 470 000 Gebäude, komprimiertes Binärformat, siehe `pipeline/regions.py`); `*.trz` mit echten Bäumen (Standort, Höhe, Krone) im ganzen Kanton Luzern sowie in Biel, Nidau, Port, Lyssach und Interlaken (rund 5 Millionen Bäume in 44 Regionen) |
| `n/` | Hauptstrassen ausserhalb der Detailgebiete |
| `f/` | echte Fotos mit GPS-Position (Wikimedia Commons) rund um Beromünster für die Fotoansicht, `index.json` mit Autor, Lizenz und Quelle |
| `z/` | Luftbilder der 145 Orte (rund 1 m pro Pixel, auf das 800-m-Geländeraster ausgerichtet) und besonders scharfe 800-m-Kacheln `h_*.jpg` (0,4 m pro Pixel) für den ganzen Kanton Luzern sowie Biel, Nidau, Port, Lyssach und Interlaken (2620 Kacheln, rund 1,8 GB) |

Nach Änderungen in `src/`: `./build.sh` ausführen und `index.html` mit einchecken.

## Daten neu erzeugen

Die Skripte in `pipeline/` erwarten die Rohdaten in `data/` (nicht im Repository; alles zusammen rund 40 GB,
davon gut 25 GB Oberflächenmodell für die Bäume) und schreiben nach `w/`, `r/`, `n/`, `z/`. Benötigt: Python 3 mit `osmium`, `shapely`,
`numpy`, `scipy`, `pillow`, `tifffile`, `imagecodecs`, `pyproj`, `pyogrio`, `mapbox_earcut`.

```sh
mkdir -p data && cd data
curl -LO https://planet.osm.ch/switzerland-exact.osm.pbf && mv switzerland-exact.osm.pbf ch.osm.pbf
curl -Lo lu.osm.pbf https://download.openstreetmap.fr/extracts/europe/switzerland/lucerne-latest.osm.pbf
cd ../pipeline
python3 places.py          # Ortsliste (30 Städte und Orte + alle Orte im Kanton Luzern)
python3 coverage.py        # Detailgebiet und Regionenraster
python3 alti.py            # swissALTI3D-Höhenkacheln laden
python3 nat.py dem         # Höhenmodell Schweiz 100 m + Seen
python3 nat.py nat12       # Luftbild Schweiz 25 m/px
python3 nat.py lu14        # Luftbild Kanton Luzern 6,25 m/px
python3 aerial.py          # Luftbilder der Orte
python3 hires.py           # besonders scharfe Kacheln für das Schwerpunktgebiet (Kanton Luzern, Orte und Strecken in focus.py)
python3 b3d_list.py        # Kachelliste swissBUILDINGS3D 3.0 für das Detailgebiet
python3 b3d_fetch.py       # Dachflächen aus den CityGML-Kacheln (rund 4,5 GB Download; mit `baeume` nur das Schwerpunktgebiet, genügt für trees.py)
python3 b3d_gdb.py         # Kacheln, die es nur als FileGDB gibt (Genf, Lausanne, Wallis, Graubünden)
python3 gwr.py             # Gebäuderegister (BFS) für Luzern und Bern: Gebäudeart, Baujahr, Stockwerke je Gebäude
python3 regions.py         # Regionen, Landesstrassen, Tunnel, Index (nur einzelne Regionen nachführen: python3 regions.py -7_-4 --landesstrassen)
python3 trees.py           # echte Bäume im Schwerpunktgebiet (swissSURFACE3D minus swissALTI3D, rund 25 GB Download; braucht die Kacheln von hires.py)
python3 fotos.py           # echte Fotos mit GPS (Wikimedia Commons, aus data/neu/) für die Fotoansicht im Spiel -> f/
python3 upload.py          # geänderte Dateien aus w/, r/, n/, z/ in den R2-Bucket laden
```

`upload.py` überträgt nur, was sich seit dem letzten Lauf geändert hat (Prüfsummen in `manifest.json` im Bucket).
`python3 upload.py test` prüft den Zugang mit einer kleinen Testdatei, `--loeschen` entfernt Dateien im Bucket,
die es lokal nicht mehr gibt. Der Zugang braucht einen Cloudflare-API-Token mit dem Recht *Workers R2 Storage: Edit*
in der Umgebungsvariable `CLOUDFLARE_API_TOKEN`. Bucket, Konto und öffentliche Adresse stehen am Anfang des Skripts.

`pipeline/geo.py` enthält einen fest eingetragenen Pfad für das Zertifikatsbündel der
Entwicklungsumgebung; ausserhalb davon die Zeile mit `cafile=` anpassen.

## Quellen und Lizenzen

- Karten- und Gebäudedaten: © OpenStreetMap-Mitwirkende, [ODbL](https://www.openstreetmap.org/copyright).
  Die Dateien in `r/` und `n/` sind daraus abgeleitet und stehen ebenfalls unter der ODbL.
- Luftbilder (SWISSIMAGE), Höhenmodell (swissALTI3D), Dachformen der Gebäude (swissBUILDINGS3D 3.0) und Baumstandorte (aus swissSURFACE3D Raster): © [swisstopo](https://www.swisstopo.admin.ch).
- Gebäudeart, Bauperiode und Geschosszahl: Eidg. Gebäude- und Wohnungsregister (GWR), © [BFS](https://www.housing-stat.ch), OGD.
- Höhenmodell 100 m: Mapzen Terrain Tiles (u. a. SRTM, EU-DEM).
- Fotos in der Fotoansicht (Taste P): Wikimedia Commons, je Bild mit Autor und Lizenz (meist CC BY-SA 4.0) angezeigt; Quelle und Lizenz stehen in `f/index.json`.
- 3D-Bibliothek: [three.js](https://threejs.org) (MIT).
- Fassadenfotos (CC0), für das Spiel zugeschnitten und gekachelt. Wohnblock aus [rubberducks Fototexturen](https://opengameart.org/content/high-res-texture-pack-1), Büro und Industrie aus Scousers [building_hsp](https://opengameart.org/node/34314) und [building_center](https://opengameart.org/node/34291).
- Bäume und Strassenbelag (CC0). Die Laubkrone und der Belag verwenden Fotodetails aus [rubberducks Fototexturen](https://opengameart.org/content/high-res-texture-pack-1). Die Nadelbaumaufnahme stammt aus [High-res tree textures](https://opengameart.org/content/high-res-tree-textures).
