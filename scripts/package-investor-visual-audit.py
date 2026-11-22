"""Package the tested browser downloads at native and two mobile widths."""
import argparse
from hashlib import sha256
import json
from pathlib import Path
import textwrap

from PIL import Image, ImageDraw, ImageFont


def contact_sheet(images, width, target):
    columns = 4
    height = round(width * 1350 / 1080)
    step_x, step_y = width + 16, height + 46
    sheet = Image.new('RGB', (step_x * columns + 16, step_y * ((len(images) + columns - 1) // columns) + 16), '#eeeeee')
    draw = ImageDraw.Draw(sheet)
    font = ImageFont.load_default(size=17)
    for index, (name, image) in enumerate(images):
        x, y = 16 + (index % columns) * step_x, 16 + (index // columns) * step_y
        sheet.paste(image, (x, y))
        draw.text((x, y + height + 5), name, fill='#161616', font=font)
    sheet.save(target)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('captures', type=Path)
    parser.add_argument('artifacts', type=Path)
    args = parser.parse_args()
    report = json.loads((args.captures / 'results.json').read_text())
    widths = (1080, 390, 320)
    sheets = {width: [] for width in widths[1:]}
    for width in widths:
        (args.artifacts / str(width)).mkdir(parents=True, exist_ok=True)
    for row in report['results']:
        if row['width'] != 1440 or row['status'] != 'ready':
            continue
        path = args.captures / f"{row['slug']}-1440.png"
        with Image.open(path) as image:
            image.verify()
        data = path.read_bytes()
        with Image.open(path) as image:
            image.load()
            assert image.size == (1080, 1350), row['slug']
            details = json.loads(image.info['Description'])
            assert details['total'] == row['total'] and details['periodEnd'] == row['period'], row['slug']
            assert sum(entry['value'] for entry in details['positions']) == row['total'], row['slug']
            if 'layout' in row:
                assert [(r['label'], r['value'], r['weight']) for r in row['layout']['entries']] == [
                    (r['label'], r['value'], r['weight']) for r in details['positions']], row['slug']
                assert bool(details['portrait']) != row.get('monogram', False), row['slug']
            for logo in details['visual']['logos']:
                if logo['status'] == 'load-failed':
                    raise ValueError(f"{row['slug']}: échec de chargement du logo {logo['id']}")
                if logo['status'] in ('label', 'sector'):
                    assert logo['id'] and logo['source'].startswith('https://'), logo
            row['png'] = {'sha256': sha256(data).hexdigest(), **details}
            (args.artifacts / '1080' / path.name.replace('-1440', '')).write_bytes(data)
            for width in widths[1:]:
                thumb = image.convert('RGB').resize((width, round(width * 1350 / 1080)), Image.Resampling.LANCZOS)
                thumb.save(args.artifacts / str(width) / path.name.replace('-1440', ''))
                sheets[width].append((row['investor'], thumb))
    for width, images in sheets.items():
        if images:
            contact_sheet(images, width, args.artifacts / f'planche-contact-{width}.png')
    (args.artifacts / 'rapport.json').write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n')
    counts = {status: sum(row['width'] == 1440 and row['status'] == status for row in report['results'])
              for status in ('ready', 'incomplete')}
    (args.artifacts / 'LISEZ-MOI.md').write_text(textwrap.dedent(f"""\
        # Audit visuel 13F

        {counts['ready']} téléchargements éditoriaux 1 080 × 1 350 vérifiés. {counts['incomplete']} profils sans PNG.
        Les dossiers 390 et 320 contiennent les réductions des mêmes fichiers. Les planches sont à taille réelle.
        Le rapport JSON documente les montants, le regroupement, les marques, les portraits et les contrôles Canvas.
        Erreurs de parcours enregistrées : {len(report['errors'])}.
        La conformité graphique reste soumise à une inspection humaine.
        """), encoding='utf-8')


if __name__ == '__main__':
    main()
