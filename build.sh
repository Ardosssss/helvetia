#!/bin/sh
# Baut das Spiel aus src/ zusammen.
#   ./build.sh            -> index.html (eigenstaendige Seite, z. B. fuer GitHub Pages)
#   ./build.sh artifact   -> dist/artifact.html (Fragment fuer ein Claude-Artifact)
cd "$(dirname "$0")"
body() {
  cat src/head.html
  echo '<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/0.160.0/three.min.js"></script>'
  echo '<script>'; echo '(() => {'
  cat src/a_core.js src/b_world.js src/c_zone.js src/d_ent.js src/navigation.js src/e_game.js
  echo '})();'; echo '</script>'
}
if [ "$1" = "artifact" ]; then
  mkdir -p dist; body > dist/artifact.html; wc -c dist/artifact.html
else
  { printf '%s' '<!doctype html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><style>:root{color-scheme:dark;padding:env(safe-area-inset-top,0px) 0 env(safe-area-inset-bottom,0px)}*{box-sizing:border-box}body{margin:0;font:14px Arial,sans-serif}img{max-width:100%}[hidden]{display:none!important}</style></head><body>'
    body; printf '%s\n' '</body></html>'; } > index.html
  wc -c index.html
fi
