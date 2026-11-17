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
        metadata.update({key: source[key] for key in ('excludePolygons', 'maskNote', 'maxPublicationScale') if key in source})
        if source.get('sourceSha256'):
            metadata.update({key: source[key] for key in ('person', 'licenseUrl', 'sourceSha1', 'sourceSha256', 'identitySource', 'identityVerified', 'checkedAt', 'crop', 'cropForSha1', 'cropNote') if key in source})
        local = ROOT / 'public/asset-art' / source['file']
        reviewed = None
        if source.get('reviewedMask'):
            mask_bytes = (ROOT / 'public/asset-art' / source['reviewedMask']).read_bytes()
            reviewed = json.loads(mask_bytes)
            metadata.update(reviewedMask=source['reviewedMask'], maskSha256=hashlib.sha256(mask_bytes).hexdigest())
            metadata.update({key: source[key] for key in ('crop', 'cropNote') if key in source})
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
        illustration = source.get('illustration', {})
        historical = slug in ENTITIES and illustration.get('person') == source.get('person') and illustration.get('nature') == 'historical-association' and bool(illustration.get('associationSource'))
        if historical:
            metadata.update(person=illustration['person'], illustration=illustration)
        metadata['status'] = 'initials'
        metadata['reason'] = 'Portrait non validé : '+metadata['resolutionError'] if metadata.get('resolutionError') else 'Réutilisation non documentée pour ce portrait.'
        if slug in ENTITIES and not historical:
            metadata['reason'] = 'Portefeuille d’une entité ; aucune attribution à son fondateur.'
        elif reusable(metadata.get('license', '')):
            try:
                # Official/manual substitutions go through the existing source registry.
                # Reuse the verified local source; no recurring remote photo download.
                if source.get('sourceSha256') and hashlib.sha256(local.read_bytes()).hexdigest()!=source['sourceSha256']:
                    raise ValueError('Photo locale différente de la source vérifiée')
                if source.get('sourceSha256') and metadata.get('crop') and metadata.get('cropForSha1') != hashlib.sha1(local.read_bytes()).hexdigest():
                    raise ValueError('Source du cadrage modifiée')
                digest = hashlib.sha256(local.read_bytes() + json.dumps(metadata, sort_keys=True).encode() + b'u2netp-v1').hexdigest()
                target = OUTPUT / f'{slug}-{digest[:16]}.png'
                if not target.exists():
                    from PIL import Image
                    image = Image.open(local).convert('RGBA')
                    if reviewed:
                        from investor_portrait_masks import reviewed_cutout
                        image = reviewed_cutout(image, reviewed, local.read_bytes())
                    if metadata.get('crop'):
                        box = metadata['crop']
                        if len(box)!=4 or not (0<=box[0]<box[2]<=image.width and 0<=box[1]<box[3]<=image.height):
                            raise ValueError('Cadrage vérifié incompatible avec la photo')
                        image=image.crop(tuple(box))
                    image.thumbnail((900, 1100))
                    if reviewed:
                        cutout = image
                    else:
                        from rembg import remove, new_session
                        if session is None:
                            session = new_session('u2netp', providers=['CPUExecutionProvider'])
                        cutout = remove(image, session=session, post_process_mask=True)
                    if reviewed and reviewed.get('refineEdges'):
                        from PIL import ImageChops
                        from rembg import remove, new_session
                        if session is None:
                            session = new_session('u2netp', providers=['CPUExecutionProvider'])
                        segmented = remove(image, session=session, post_process_mask=True)
                        cutout.putalpha(ImageChops.darker(image.getchannel('A'), segmented.getchannel('A')))
                    if metadata.get('excludePolygons'):
                        from PIL import ImageDraw
                        mask = cutout.getchannel('A')
                        draw = ImageDraw.Draw(mask)
                        # Reviewed source coordinates scale with the existing thumbnail.
                        original_width, original_height = Image.open(local).size
                        for polygon in metadata['excludePolygons']:
                            if len(polygon) < 3 or any(not (0 <= x <= original_width and 0 <= y <= original_height) for x, y in polygon):
                                raise ValueError('Masque de sujet incompatible avec la source')
                            draw.polygon([(round(x*image.width/original_width),round(y*image.height/original_height)) for x,y in polygon],fill=0)
                        cutout.putalpha(mask)
                    alpha = cutout.getchannel('A')
                    bbox = alpha.getbbox()
                    # Reject blank, opaque or obviously broken segmentation.
                    histogram = alpha.histogram()
                    if not bbox or histogram[0] < image.width * image.height * .02 or sum(histogram[100:]) < image.width * image.height * .08:
                        raise ValueError('Masque de détourage inexploitable')
                    cutout.crop(bbox).save(target, optimize=True)
                metadata.update(status='ready', reason=None, file=f'data/investors/media/{target.name}', sourceDigest=digest, adaptation='Détourage automatique u2netp ; proportions conservées.')
                if reviewed:
                    metadata['adaptation'] = 'Détourage et cadrage de publication revus sur la photographie originale ; pixels et proportions conservés.'
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
