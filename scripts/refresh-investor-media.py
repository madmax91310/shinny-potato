"""Prepare reusable, licensed cutouts from the existing verified portrait registry.
No search-image discovery or invented faces. Missing permission/identity/model => initials.
A source digest changes only when the original local photo or provenance changes.
"""
import hashlib
import json
import os
from pathlib import Path
from investor_media_sources import resolve, reusable

ROOT = Path(__file__).resolve().parents[1]
SOURCES = ROOT / 'public/asset-art/investors/sources.json'
OUTPUT = ROOT / 'public/data/investors/media'
# Entity portfolios must not inherit a founder's portrait, especially after departure.
ENTITIES = {'berkshire', 'gates-trust', 'renaissance', 'baker-bros'}


def refresh():
    OUTPUT.mkdir(parents=True, exist_ok=True)
    manifest_path = OUTPUT / 'manifest.json'
    prior = json.loads(manifest_path.read_text()) if manifest_path.exists() else {}
    result = {}
    session = None
    for slug, source in json.loads(SOURCES.read_text()).items():
        metadata = {key: source.get(key) for key in ('source', 'url', 'author', 'license', 'title')}
        local = ROOT / 'public/asset-art' / source['file']
        digest = None
        if source.get('commonsPortrait') and slug not in ENTITIES:
            try:
                local, resolved = resolve(source, slug, OUTPUT)
                metadata.update(resolved)
            except Exception as error:
                retained = prior.get(slug, {})
                if isinstance(error, (OSError, TimeoutError)) and retained.get('status') == 'ready' and retained.get('wikidataId') == source['commonsPortrait']['wikidataId'] and retained.get('title') == source['commonsPortrait']['title'] and (ROOT/'public'/retained.get('file','')).is_file():
                    result[slug] = {**retained, 'reason': f'Dernier portrait vérifié conservé : {error}'}
                    continue
                metadata['resolutionError'] = str(error)
        metadata['status'] = 'initials'
        metadata['reason'] = 'Portrait non validé : '+metadata['resolutionError'] if metadata.get('resolutionError') else 'Réutilisation non documentée pour ce portrait.'
        if slug in ENTITIES:
            metadata['reason'] = 'Portefeuille d’une entité ; aucune attribution à son fondateur.'
        elif reusable(metadata.get('license', '')):
            try:
                # Official/manual substitutions go through the existing source registry.
                # Reuse the verified local source; no recurring remote photo download.
                digest = hashlib.sha256(local.read_bytes() + json.dumps(metadata, sort_keys=True).encode() + b'u2netp-v1').hexdigest()
                target = OUTPUT / f'{slug}-{digest[:16]}.png'
                if not target.exists():
                    from PIL import Image
                    from rembg import remove, new_session
                    if session is None:
                        session = new_session('u2netp', providers=['CPUExecutionProvider'])
                    image = Image.open(local).convert('RGBA')
                    if metadata.get('crop'):
                        box = metadata['crop']
                        if len(box)!=4 or not (0<=box[0]<box[2]<=image.width and 0<=box[1]<box[3]<=image.height):
                            raise ValueError('Cadrage vérifié incompatible avec la photo')
                        image=image.crop(tuple(box))
                    image.thumbnail((900, 1100))
                    cutout = remove(image, session=session, post_process_mask=True)
                    alpha = cutout.getchannel('A')
                    bbox = alpha.getbbox()
                    # Reject blank, opaque or obviously broken segmentation.
                    histogram = alpha.histogram()
                    if not bbox or histogram[0] < image.width * image.height * .02 or sum(histogram[100:]) < image.width * image.height * .08:
                        raise ValueError('Masque de détourage inexploitable')
                    cutout.crop(bbox).save(target, optimize=True)
                metadata.update(status='ready', reason=None, file=f'data/investors/media/{target.name}', sourceDigest=digest, adaptation='Détourage automatique u2netp ; proportions conservées.')
            except Exception as error:
                retained = prior.get(slug, {})
                if retained.get('status') == 'ready' and retained.get('sourceDigest') == locals().get('digest') and (ROOT / 'public' / retained.get('file', '')).is_file():
                    metadata = {**retained, 'reason': f'Dernier détourage valide conservé : {error}'}
                else:
                    metadata['reason'] = f'Détourage indisponible : {error}'
        result[slug] = metadata
        print(slug, metadata['status'], metadata.get('reason') or '')
    content = json.dumps(result, ensure_ascii=False, indent=2) + '\n'
    if not manifest_path.exists() or manifest_path.read_text() != content:
        temporary = manifest_path.with_suffix('.tmp')
        temporary.write_text(content)
        os.replace(temporary, manifest_path)


if __name__ == '__main__':
    refresh()
