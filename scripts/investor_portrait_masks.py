"""Reviewed alpha contours on an exact licensed photograph; RGB pixels stay original."""
import hashlib
from PIL import Image, ImageDraw, ImageFilter


def reviewed_cutout(image, spec, source_bytes):
    if hashlib.sha256(source_bytes).hexdigest() != spec['sourceSha256']:
        raise ValueError('Photo différente du masque revu')
    if list(image.size) != spec['size']:
        raise ValueError('Dimensions différentes du masque revu')
    scale = 3
    mask = Image.new('L', (image.width*scale, image.height*scale))
    draw = ImageDraw.Draw(mask)
    for polygon in spec['polygons']:
        if len(polygon)<3 or any(not (0<=x<=image.width and 0<=y<=image.height) for x,y in polygon):
            raise ValueError('Contour revu hors photographie')
        draw.polygon([(round(x*scale),round(y*scale)) for x,y in polygon], fill=255)
    mask = mask.filter(ImageFilter.GaussianBlur(spec.get('feather', .6)*scale)).resize(image.size, Image.Resampling.LANCZOS)
    # Remove only the reviewed yellow background between Gates' fine hair strands.
    chroma = spec.get('backgroundChroma')
    if chroma:
        rgb = image.convert('RGB')
        left, top, right, bottom = chroma['box']
        for y in range(top, bottom):
            for x in range(left, right):
                r, g, b = rgb.getpixel((x, y))
                if g>90 and r>g*chroma['minRedGreen'] and b<g*chroma['maxBlueGreen']:
                    mask.putpixel((x, y), 0)
    result = image.convert('RGBA'); result.putalpha(mask)
    return result
