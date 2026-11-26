/* Ortsansicht: Fotos bleiben bei ihrer Quelle, der Scraper-Export bleibt im Browser. */
const commonsBase = 'https://commons.wikimedia.org/wiki/File:';
const landmarkPhotos = [
  { lat: 47.0517, lon: 8.3074, title: 'Kapellbrücke, Luzern', file: 'Kapellbrücke_Luzern_2_by_Juliet_van_Ree.jpg', local: 'luzern', by: 'Jvanree · CC0' },
  { lat: 47.37146, lon: 8.54197, title: 'Limmat und Grossmünster, Zürich', file: 'Zurich_city_center.jpg', local: 'zuerich', by: 'Lovasoa · CC0' },
  { lat: 46.2044, lon: 6.1540, title: 'Jet d’eau, Genf', file: "JetD'Eau_Geneva.jpg", local: 'genf', by: 'Nilington · Gemeinfrei' },
  { lat: 46.9480, lon: 7.4478, title: 'Zytglogge, Bern', file: 'Bern,_Zytglogge.jpg', local: 'bern', licenseLabel: 'CC BY-SA 4.0', by: 'G.e.96gilgen · verkleinerte Vorschau', license: 'https://creativecommons.org/licenses/by-sa/4.0/' }
].map(photo => ({...photo, source: commonsBase + encodeURIComponent(photo.file), image: 'media/ortsfotos/' + photo.local + '.webp'}));

let importedPlaces = [], photoSelection = null, commonsRequest = null, importVersion = 0;

function photoLink(url, label) {
  const link = document.createElement('a');
  link.href = url;
  link.textContent = label;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  return link;
}

function showPhotoCard(photo) {
  const figure = document.createElement('figure'), caption = document.createElement('figcaption');
  if (photo.image) {
    const img = document.createElement('img');
    img.alt = photo.title;
    img.loading = 'lazy';
    img.referrerPolicy = 'no-referrer';
    img.addEventListener('error', () => { img.replaceWith('Vorschau nicht verfügbar'); }, { once: true });
    img.src = photo.image;
    const original = photoLink(photo.source, '');
    original.append(img);
    figure.append(original);
  }
  caption.append(photoLink(photo.source, photo.title));
  if (photo.by) caption.append(' · ' + photo.by);
  if (photo.license) caption.append(' · ', photoLink(photo.license, photo.licenseLabel || 'Lizenz'));
  if (photo.pano) caption.append(' · ', photoLink(photo.pano, 'Street View'));
  figure.append(caption);
  $('photo-gallery').append(figure);
}

function closePlacePhotos() {
  if (commonsRequest) commonsRequest.abort();
  commonsRequest = null;
  photoSelection = null;
  $('photo-gallery').replaceChildren();
  $('photo-status').textContent = '';
}

function googlePhotoURL(value) {
  try {
    const url = new URL(value);
    if (url.protocol === 'https:' && !url.username && !url.password && !url.port &&
        (/^lh\d+\.(googleusercontent|ggpht)\.com$/.test(url.hostname) || url.hostname === 'streetviewpixels-pa.googleapis.com')) return url.href;
  } catch {}
  return '';
}

function readPhotoExport(text) {
  const input = text.trim();
  let rows;
  try {
    const data = JSON.parse(input);
    rows = Array.isArray(data) ? data : [data];
  } catch {
    rows = input.split(/\r?\n/).filter(line => line.trim()).map(line => JSON.parse(line));
  }
  const places = [];
  for (const row of rows) {
    if (!row || typeof row !== 'object') continue;
    const lat = row.latitude, lon = row.longitude ?? row.longtitude;
    if (!Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) continue;
    const title = String(row.title || 'Ort auf Google Maps');
    const query = new URLSearchParams({api: '1', query: lat + ',' + lon});
    if (typeof row.place_id === 'string' && row.place_id) query.set('query_place_id', row.place_id);
    const source = 'https://www.google.com/maps/search/?' + query;
    let pano = '';
    try {
      const u = new URL(row.street_view_url), id = u.searchParams.get('pano');
      if (u.origin === 'https://www.google.com' && u.pathname.startsWith('/maps/') && id)
        pano = 'https://www.google.com/maps/@?' + new URLSearchParams({api: '1', map_action: 'pano', pano: id});
    } catch {}
    const images = Array.isArray(row.images) ? row.images.map(item => item?.image) : [];
    const urls = [...new Set([row.thumbnail, ...images].map(googlePhotoURL).filter(Boolean))];
    if (urls.length || pano) places.push({lat, lon, title, source, pano, urls});
  }
  return places;
}

function nearbyPhotos(x, z, entries) {
  return entries.map(entry => ({entry, distance: Math.hypot(WX(entry.lon) - x, WZ(entry.lat) - z)}))
    .filter(item => item.distance <= 2500).sort((a, b) => a.distance - b.distance).map(item => item.entry);
}

// Metadaten aus Commons enthalten formatierte Urhebernamen. Nur Text weiterverwenden.
function creditText(html) {
  const template = document.createElement('template');
  template.innerHTML = html || '';
  return template.content.textContent.trim();
}

async function showPlacePhotos(x, z) {
  closePlacePhotos();
  const selected = {x, z};
  photoSelection = selected;
  const photos = [];
  const seen = new Set();
  for (const place of nearbyPhotos(x, z, importedPlaces)) {
    for (const image of (place.urls.length ? place.urls : [''])) {
      const id = image || place.pano;
      if (seen.has(id)) continue;
      seen.add(id);
      photos.push({...place, image, by: 'Google Maps'});
      if (photos.length === 6) break;
    }
    if (photos.length === 6) break;
  }
  photos.push(...nearbyPhotos(x, z, landmarkPhotos));
  if (photos.length) {
    photos.slice(0, 6).forEach(showPhotoCard);
    return;
  }

  const request = new AbortController();
  commonsRequest = request;
  const timeout = setTimeout(() => request.abort(), 8000);
  const status = $('photo-status');
  status.textContent = 'Suche Ortsfotos …';
  try {
    const coord = (LAT_C - z / KZM).toFixed(6) + '|' + (LON_C + x / KXM).toFixed(6);
    const params = new URLSearchParams({
      action: 'query', format: 'json', formatversion: '2', origin: '*', generator: 'geosearch',
      ggscoord: coord, ggsradius: '2500', ggsnamespace: '6', ggslimit: '12', prop: 'imageinfo',
      iiprop: 'url|mime|extmetadata', iiurlwidth: '500', iiextmetadatafilter: 'Artist|LicenseShortName|LicenseUrl'
    });
    const res = await fetch('https://commons.wikimedia.org/w/api.php?' + params, {signal: request.signal, credentials: 'omit',
      headers: {'Api-User-Agent': 'HelvetiaOpenWorld/1.0 (https://github.com/Ardosssss/helvetia)'}});
    if (!res.ok) throw Error('Commons');
    const data = await res.json();
    if (photoSelection !== selected) return;
    if (data.error) throw Error('Commons');
    for (const page of data.query?.pages || []) {
      const info = page.imageinfo?.[0], meta = info?.extmetadata;
      if (!info?.thumburl || !info.descriptionurl || !['image/jpeg', 'image/webp', 'image/png'].includes(info.mime)) continue;
      const license = meta?.LicenseShortName?.value || '', artist = creditText(meta?.Artist?.value);
      if (!/^CC0$|^Public domain$|^CC BY(?:-SA)? [\d.]+$/i.test(license) || (!artist && /^CC BY/i.test(license))) continue;
      const licenseURL = meta?.LicenseUrl?.value || '';
      photos.push({image: info.thumburl, source: info.descriptionurl, title: page.title.replace(/^File:/, '').replace(/\.[^.]+$/, ''),
        by: [artist, license].filter(Boolean).join(' · '), license: /^https?:\/\/creativecommons\.org\//i.test(licenseURL) ? licenseURL : ''});
      if (photos.length === 4) break;
    }
    photos.forEach(showPhotoCard);
    status.textContent = photos.length ? '' : 'Keine Ortsfotos im Umkreis von 2,5 km gefunden.';
  } catch {
    if (photoSelection === selected) status.textContent = 'Ortsfotos konnten nicht geladen werden.';
  } finally {
    clearTimeout(timeout);
    if (commonsRequest === request) commonsRequest = null;
  }
}

$('photo-export').addEventListener('change', async event => {
  const input = event.currentTarget, file = input.files[0];
  if (!file) return;
  input.value = '';
  const version = ++importVersion, status = $('photo-import-status');
  try {
    const places = readPhotoExport(await file.text());
    if (version !== importVersion) return;
    if (!places.length) { status.textContent = 'Keine Orte mit Koordinaten und Bild- oder Street-View-Link gefunden.'; return; }
    importedPlaces = places;
    status.textContent = places.length + (places.length === 1 ? ' Ort für diese Sitzung geladen.' : ' Orte für diese Sitzung geladen.');
    if (photoSelection) showPlacePhotos(photoSelection.x, photoSelection.z);
  } catch {
    if (version === importVersion) status.textContent = 'Die Datei konnte nicht als JSON oder JSONL gelesen werden.';
  }
});
