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

## Fotos und Spieloptik

Neue Spielstände beginnen in der Abendsonne. Sonnenstand und Tageszeit verändern die Farbe des Himmels, den Dunst über den Bergen, die Fensterbeleuchtung und die Lichtreflexe auf den Seen. Wohnblöcke, Büro- und Industriegebäude nutzen wiederholbare Fototexturen. Die Luftbilder und Dachformen kommen weiterhin von swisstopo.

Über **M → Ortsansicht** öffnest du Street View oder das Google-Satellitenbild an deiner Spielposition. Ein Klick auf einen Ort in der Landeskarte wählt dessen Koordinaten. Für eine eingebettete Strassenansicht kann der Betreiber in `src/head.html` bei `#photo-view` das Attribut `data-embed-key` mit einem für die Spieldomain und die Maps Embed API eingeschränkten Browser-Schlüssel setzen und `./build.sh` ausführen. Die Links funktionieren auch ohne Schlüssel. Street View hängt von der lokalen Abdeckung ab.

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
- Fassadenfotos (CC0), für das Spiel zugeschnitten und gekachelt. Wohnblock aus [rubberducks Fototexturen](https://opengameart.org/content/high-res-texture-pack-1), Büro und Industrie aus Scousers [building_hsp](https://opengameart.org/node/34314) und [building_center](https://opengameart.org/node/34291).
- Bäume und Strassenbelag (CC0). Die Laubkrone und der Belag verwenden Fotodetails aus [rubberducks Fototexturen](https://opengameart.org/content/high-res-texture-pack-1). Die Nadelbaumaufnahme stammt aus [High-res tree textures](https://opengameart.org/content/high-res-tree-textures).
