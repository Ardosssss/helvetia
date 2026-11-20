# Helvetia Open World

Open-World-Spiel im Browser: die ganze Schweiz im Massstab 1:1 mit echtem Gelände.
27 Städte und der ganze Kanton Luzern enthalten jedes Gebäude und jede Strasse.

## Spielen

Das Spiel besteht nur aus statischen Dateien. Lokal starten:

```sh
python3 -m http.server 8000
# dann http://localhost:8000 öffnen
```

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
| Shift / Leertaste | rennen · springen / Handbremse (Helikopter: sinken · steigen) |
| R | zurück auf die nächste Strasse |

Auf dem Handy erscheinen Joystick und Knöpfe automatisch.

## Aufbau

| Pfad | Inhalt |
|---|---|
| `index.html` | fertig gebautes Spiel (aus `src/`, nicht von Hand ändern) |
| `src/` | Quellcode: `head.html` (Seite, HUD), `a_core.js` (Grundlagen, Höhenmodell), `b_world.js` (Gelände, Luftbilder), `c_zone.js` (Regionen, Gebäude, Strassen), `d_ent.js` (Fahrzeuge, Figuren, Verkehr), `e_game.js` (Ablauf, Karte, Garage, HUD) |
| `build.sh` | setzt `src/` zu `index.html` zusammen |
| `w/` | Landesdaten: Höhenmodell 100 m (`dem*.png`), Luftbilder Schweiz (`ortho.jpg`, `n_*.jpg`) und Kanton Luzern (`l_*.jpg`), Ortsliste, Index mit Tunnelportalen |
| `r/` | 86 Regionen (je 8 × 8 km): `*.json` mit Strassen, Wasser, Bäumen, Höhenraster 25 m und den Gebäuden ohne Vermessungsdach; `*.b3z` mit den echten Dachformen (swissBUILDINGS3D, rund 470 000 Gebäude, komprimiertes Binärformat, siehe `pipeline/regions.py`) |
| `n/` | Hauptstrassen ausserhalb der Detailgebiete |
| `z/` | scharfe Luftbilder der 142 Orte |
| `pipeline/` | Python-Skripte, die alle Daten aus den Quellen erzeugen |

Nach Änderungen in `src/`: `./build.sh` ausführen und `index.html` mit einchecken.

## Daten neu erzeugen

Die Skripte in `pipeline/` erwarten die Rohdaten in `data/` (nicht im Repository, rund 4 GB)
und schreiben nach `w/`, `r/`, `n/`, `z/`. Benötigt: Python 3 mit `osmium`, `shapely`,
`numpy`, `scipy`, `pillow`, `tifffile`, `imagecodecs`, `pyproj`, `pyogrio`, `mapbox_earcut`.

```sh
mkdir -p data && cd data
curl -LO https://planet.osm.ch/switzerland-exact.osm.pbf && mv switzerland-exact.osm.pbf ch.osm.pbf
curl -Lo lu.osm.pbf https://download.openstreetmap.fr/extracts/europe/switzerland/lucerne-latest.osm.pbf
cd ../pipeline
python3 places.py          # Ortsliste (27 Städte + Orte im Kanton Luzern)
python3 coverage.py        # Detailgebiet und Regionenraster
python3 alti.py            # swissALTI3D-Höhenkacheln laden
python3 nat.py dem         # Höhenmodell Schweiz 100 m + Seen
python3 nat.py nat12       # Luftbild Schweiz 25 m/px
python3 nat.py lu14        # Luftbild Kanton Luzern 6,25 m/px
python3 aerial.py          # Luftbilder der Orte
python3 b3d_list.py        # Kachelliste swissBUILDINGS3D 3.0 für das Detailgebiet
python3 b3d_fetch.py       # Dachflächen aus den CityGML-Kacheln (rund 4,5 GB Download)
python3 b3d_gdb.py         # Kacheln, die es nur als FileGDB gibt (Genf, Lausanne, Wallis, Graubünden)
python3 regions.py         # Regionen, Landesstrassen, Tunnel, Index
```

`pipeline/geo.py` enthält einen fest eingetragenen Pfad für das Zertifikatsbündel der
Entwicklungsumgebung; ausserhalb davon die Zeile mit `cafile=` anpassen.

## Quellen und Lizenzen

- Karten- und Gebäudedaten: © OpenStreetMap-Mitwirkende, [ODbL](https://www.openstreetmap.org/copyright).
  Die Dateien in `r/` und `n/` sind daraus abgeleitet und stehen ebenfalls unter der ODbL.
- Luftbilder (SWISSIMAGE), Höhenmodell (swissALTI3D) und Dachformen der Gebäude (swissBUILDINGS3D 3.0): © [swisstopo](https://www.swisstopo.admin.ch).
- Höhenmodell 100 m: Mapzen Terrain Tiles (u. a. SRTM, EU-DEM).
- 3D-Bibliothek: [three.js](https://threejs.org) (MIT).
