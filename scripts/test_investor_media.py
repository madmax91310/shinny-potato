"""Unambiguous identity, reuse permission and content-addressed media cache."""
import hashlib
import io
import tempfile
from pathlib import Path
import unittest
from unittest.mock import patch
import investor_media_sources as media


class MediaTests(unittest.TestCase):
    def test_reviewed_photographs_keep_clothes_hair_and_hand(self):
        import json
        from PIL import Image
        from investor_portrait_masks import reviewed_cutout
        folder=Path(__file__).resolve().parents[1]/'public/asset-art/investors'
        cases={
            'gates-trust': ([(450,450),(550,1000),(450,1000),(100,900)],[(800,300),(50,100)]),
            'cathie-wood': ([(415,210),(220,330),(150,100)],[(270,80),(140,580)])
        }
        for slug,(subject,background) in cases.items():
            with self.subTest(slug=slug):
                source=(folder/f'{slug}.webp').read_bytes()
                image=Image.open(io.BytesIO(source)).convert('RGBA')
                spec=json.loads((folder/f'{slug}-mask.json').read_text())
                cutout=reviewed_cutout(image,spec,source)
                self.assertEqual(cutout.size,image.size)
                self.assertEqual(cutout.convert('RGB').tobytes(),image.convert('RGB').tobytes())
                for point in subject:self.assertGreaterEqual(cutout.getpixel(point)[3],250)
                for point in background:self.assertEqual(cutout.getpixel(point)[3],0)
                with self.assertRaisesRegex(ValueError,'Photo différente'):
                    reviewed_cutout(image,spec,b'changed photograph')

    def fixture(self, license='CC BY 2.0'):
        content=b'verified image bytes'
        source={'person':'Verified Investor','commonsPortrait':{'wikidataId':'Q123','title':'Verified Investor.jpg','identitySource':'https://official.example/team/investor'}}
        entity={'entities':{'Q123':{'claims':{'P18':[{'mainsnak':{'datavalue':{'value':'Verified Investor.jpg'}}}]}}}}
        info={'url':'https://upload.wikimedia.org/original.jpg','descriptionurl':'https://commons.wikimedia.org/wiki/File:Verified_Investor.jpg','size':len(content),'sha1':hashlib.sha1(content).hexdigest(),'extmetadata':{'LicenseShortName':{'value':license},'Artist':{'value':'<a>Verified artist</a>'}}}
        commons={'query':{'pages':{'1':{'imageinfo':[info]}}}}
        response=io.BytesIO(content);response.url=info['url']
        return source,entity,commons,response

    def test_licensed_portrait_is_cached_and_attributed(self):
        source,entity,commons,response=self.fixture()
        with tempfile.TemporaryDirectory() as temp:
            with patch.object(media,'remote_json',side_effect=[entity,commons,entity,commons]), patch.object(media.urllib.request,'urlopen',return_value=response) as download:
                path,meta=media.resolve(source,'investor',Path(temp))
                self.assertEqual(meta['author'],'Verified artist')
                self.assertEqual(meta['person'],'Verified Investor')
                self.assertTrue(meta['identityVerified'])
                self.assertEqual(media.resolve(source,'investor',Path(temp))[0],path)
                self.assertEqual(download.call_count,1)

    def test_changed_person_photo_association_is_refused(self):
        source,entity,commons,response=self.fixture()
        entity['entities']['Q123']['claims']['P18'][0]['mainsnak']['datavalue']['value']='Homonym.jpg'
        with tempfile.TemporaryDirectory() as temp, patch.object(media,'remote_json',return_value=entity):
            with self.assertRaisesRegex(ValueError,'Association Wikimedia modifiée'):media.resolve(source,'investor',Path(temp))

    def test_unknown_rights_are_refused(self):
        source,entity,commons,response=self.fixture('All rights reserved')
        with tempfile.TemporaryDirectory() as temp, patch.object(media,'remote_json',side_effect=[entity,commons]):
            with self.assertRaisesRegex(ValueError,'Licence'):media.resolve(source,'investor',Path(temp))

    def test_changed_download_is_refused(self):
        source,entity,commons,response=self.fixture();response=io.BytesIO(b'wrong bytes');response.url='https://upload.wikimedia.org/original.jpg'
        with tempfile.TemporaryDirectory() as temp, patch.object(media,'remote_json',side_effect=[entity,commons]), patch.object(media.urllib.request,'urlopen',return_value=response):
            with self.assertRaisesRegex(ValueError,'Empreinte'):media.resolve(source,'investor',Path(temp))

    def test_unsupported_redirect_is_refused(self):
        source,entity,commons,response=self.fixture();response.url='https://unverified.example/image.jpg'
        with tempfile.TemporaryDirectory() as temp, patch.object(media,'remote_json',side_effect=[entity,commons]), patch.object(media.urllib.request,'urlopen',return_value=response):
            with self.assertRaisesRegex(ValueError,'Redirection'):media.resolve(source,'investor',Path(temp))

    def test_network_failure_preserves_photo_but_identity_failure_removes_it(self):
        import importlib.util
        import json
        spec=importlib.util.spec_from_file_location('cutouts',Path(__file__).with_name('refresh-investor-media.py'))
        cutouts=importlib.util.module_from_spec(spec);spec.loader.exec_module(cutouts)
        for error,expected in [(OSError('offline'),'ready'),(ValueError('Identity changed'),'initials')]:
            with self.subTest(error=error), tempfile.TemporaryDirectory() as temp:
                root=Path(temp);out=root/'public/data/investors/media';out.mkdir(parents=True)
                source=self.fixture()[0];source.update(file='old.jpg',license='Source officielle')
                registry=root/'sources.json';registry.write_text(json.dumps({'investor':source}))
                (out/'verified.png').write_bytes(b'cached verified photo')
                (out/'manifest.json').write_text(json.dumps({'investor':{'status':'ready','wikidataId':'Q123','title':'Verified Investor.jpg','file':'data/investors/media/verified.png'}}))
                with patch.multiple(cutouts,ROOT=root,OUTPUT=out,SOURCES=registry), patch.object(cutouts,'resolve',side_effect=error):cutouts.refresh()
                self.assertEqual(json.loads((out/'manifest.json').read_text())['investor']['status'],expected)


if __name__=='__main__':unittest.main()
