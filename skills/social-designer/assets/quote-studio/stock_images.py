"""Bounded Openverse search/import. The browser never supplies a remote fetch URL."""
import json
import re
import threading
import time
import uuid
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode, urlsplit
from urllib.request import Request, build_opener, HTTPRedirectHandler

import image_store

BASE = 'https://api.openverse.org/v1/'
LICENSES = {
    'cc0': ('CC0 1.0', 'https://creativecommons.org/publicdomain/zero/1.0/'),
    'pdm': ('Public Domain Mark 1.0', 'https://creativecommons.org/publicdomain/mark/1.0/'),
}
CACHE_SECONDS = 900
_cache = {}
_cache_lock = threading.Lock()
_imports = threading.Lock()


class StockError(ValueError):
    pass


class NoRedirect(HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        raise StockError('The image provider redirected this request. Try another image.')


def fetch(path, maximum):
    # All callers construct paths from constants, encoded search terms or strict UUIDs.
    if not path.startswith(('images/?', 'images/')) or '..' in path.split('?')[0]:
        raise StockError('Invalid image-provider request.')
    request = Request(BASE + path, headers={
        'User-Agent': 'SocialCreativeQuoteStudio/1.6 (local image editor)',
        'Accept': 'application/json,image/jpeg,image/png,image/webp',
    })
    deadline = time.monotonic() + 30
    try:
        with build_opener(NoRedirect()).open(request, timeout=12) as response:
            length = response.headers.get('Content-Length')
            if length and int(length) > maximum:
                raise StockError('This image is too large. Choose another background.')
            chunks = []; size = 0
            while True:
                chunk = response.read(min(65536, maximum + 1 - size))
                if not chunk:
                    return b''.join(chunks)
                chunks.append(chunk); size += len(chunk)
                if size > maximum:
                    raise StockError('This image is too large. Choose another background.')
                if time.monotonic() > deadline:
                    raise StockError('The image provider took too long. Try again.')
    except HTTPError as error:
        if error.code == 429:
            raise StockError('Image search is taking a short break. Try again later; saved project images still work.') from error
        raise StockError('The image provider could not return this item. Try again or choose another image.') from error
    except (URLError, TimeoutError, OSError) as error:
        raise StockError('Could not reach image search. Check your connection and try again.') from error


def public_url(value):
    if not isinstance(value, str) or len(value) > 2048:
        return ''
    try:
        parts = urlsplit(value)
        if parts.scheme != 'https' or not parts.hostname or parts.username or parts.password:
            return ''
    except ValueError:
        return ''
    return value


def candidate(record):
    try:
        identifier = str(uuid.UUID(record.get('id', '')))
    except (ValueError, TypeError, AttributeError):
        return None
    license_code = record.get('license')
    if license_code not in LICENSES or record.get('mature') is True:
        return None
    title = str(record.get('title') or 'Untitled photograph')[:120]
    # These directions call for photographs; do not knowingly label a generated result as one.
    if re.search(r'\b(ai generated|ai-generated|midjourney|adobe express ai|stable diffusion)\b', title, re.I):
        return None
    source = public_url(record.get('foreign_landing_url'))
    if not source:
        return None
    label, license_url = LICENSES[license_code]
    def dimension(key):
        value = record.get(key)
        return value if type(value) is int and 0 < value <= 100000 else None
    return {
        'id': identifier, 'title': title, 'credit': str(record.get('creator') or 'Creator not listed')[:300],
        'source': source, 'licenseCode': license_code, 'licenseLabel': label, 'licenseUrl': license_url,
        'thumbnail': BASE + 'images/' + identifier + '/thumb/',
        'width': dimension('width'), 'height': dimension('height'),
        'provider': 'Openverse', 'checked': image_store.now(),
    }


def search(value):
    if not isinstance(value, dict) or set(value) != {'query', 'page'}:
        raise StockError('Use a short image search and try again.')
    query = image_store.string(value['query'], 120, 'image search', True)
    page = value['page']
    if type(page) is not int or not 1 <= page <= 3:
        raise StockError('Choose a different search to find more images.')
    key = (query.casefold(), page)
    with _cache_lock:
        hit = _cache.get(key)
        if hit and time.monotonic() - hit[0] < CACHE_SECONDS:
            return hit[1]
    params = urlencode({'q': query, 'page': page, 'page_size': 12, 'license': 'cc0,pdm',
                        'extension': 'jpg,jpeg,png,webp', 'category': 'photograph', 'mature': 'false'})
    try:
        data = json.loads(fetch('images/?' + params, 2 * 1024 * 1024))
        results = [item for record in data['results'] if (item := candidate(record))]
        result = {'query': query, 'page': page, 'images': results,
                  'hasMore': page < min(int(data.get('page_count', 1)), 3), 'provider': 'Openverse'}
    except (KeyError, TypeError, json.JSONDecodeError) as error:
        raise StockError('Image search returned an unreadable response. Try again.') from error
    with _cache_lock:
        if len(_cache) >= 64:
            _cache.pop(next(iter(_cache)))
        _cache[key] = (time.monotonic(), result)
    return result


def import_image(output, value):
    if not isinstance(value, dict) or set(value) != {'project', 'id', 'style', 'placement', 'query'}:
        raise StockError('Choose an image from the search results.')
    project = image_store.project(value['project'])
    try:
        identifier = str(uuid.UUID(value['id']))
    except (ValueError, TypeError, AttributeError) as error:
        raise StockError('Choose an image from the search results.') from error
    query = image_store.string(value['query'], 120, 'image search', True)
    if value['style'] not in image_store.STYLES or value['placement'] not in ('center', 'top', 'bottom'):
        raise StockError('Choose an image direction and try again.')
    # Recheck the provider record at import; never trust license/source/URLs sent by the client.
    try:
        item = candidate(json.loads(fetch('images/' + identifier + '/', 256 * 1024)))
    except (TypeError, json.JSONDecodeError) as error:
        raise StockError('This image is unavailable. Choose another background.') from error
    if not item or item['id'] != identifier:
        raise StockError('This image no longer has a supported public-domain label. Choose another background.')
    with _imports:
        with image_store.store(output) as data:
            existing = next((image for image in data['images']
                             if image['project'] == project and image['source'] == item['source']), None)
            if existing:
                return existing
        raw = fetch('images/' + identifier + '/thumb/?full_size=true&compressed=false', 8 * 1024 * 1024)
        folder = Path(output); folder.mkdir(parents=True, exist_ok=True)
        temporary = folder / ('stock-import-' + str(uuid.uuid4()) + '.tmp')
        try:
            temporary.write_bytes(raw)
            brief = image_store.create(output, {
                'project': project, 'mode': 'find', 'style': value['style'], 'subject': query,
                'placement': value['placement'],
                'prompt': 'Direct image search: ' + query + '. Review the crop with the actual quote; no AI curation was performed.',
            })
            note = (item['licenseLabel'] + ' reported by Openverse on ' + item['checked'][:10] + '. '
                    + item['licenseUrl'] + ' Source license has not been independently verified. '
                    'Retain source credit; check the planned use before publishing.')
            try:
                return image_store.complete(output, brief['id'], temporary, item['title'], 'stock',
                                            item['source'], item['credit'], note)
            except Exception:
                image_store.cancel(output, project, brief['id'])
                raise
        finally:
            temporary.unlink(missing_ok=True)
