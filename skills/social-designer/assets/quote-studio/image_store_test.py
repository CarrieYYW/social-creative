import tempfile
import unittest
from pathlib import Path
import image_store as images

BRIEF={'project':'one','mode':'generate','style':'water','subject':'pond','placement':'center','prompt':'An original calm background. No words.'}
class ImageStoreTest(unittest.TestCase):
 def test_project_isolation_cancel_and_completion(self):
  with tempfile.TemporaryDirectory() as folder:
   a=images.create(folder,BRIEF);b=images.create(folder,{**BRIEF,'project':'two'})
   self.assertEqual([r['id'] for r in images.listing(folder,'one')['requests']],[a['id']])
   with self.assertRaises(ValueError):images.cancel(folder,'two',a['id'])
   images.cancel(folder,'one',a['id'])
   png=Path(folder)/'input.png';png.write_bytes(b'\x89PNG\r\n\x1a\nexample')
   with self.assertRaises(ValueError):images.complete(folder,a['id'],png,'test','generated','','AI','Original')
   item=images.complete(folder,b['id'],png,'test','generated','','AI','Original')
   self.assertEqual(images.listing(folder,'two')['requests'][0]['status'],'ready')
   self.assertEqual(images.listing(folder,'one')['images'],[])
   self.assertEqual(item['prompt'],BRIEF['prompt'])
   self.assertEqual((Path(folder)/item['url'].lstrip('/')).read_bytes(),png.read_bytes())
 def test_invalid_requests_and_stock_provenance(self):
  for patch in [{'mode':'shell'},{'style':'unknown'},{'placement':'elsewhere'},{'subject':[]},{'prompt':''},{'project':'x'*101},{'extra':True}]:
   with self.subTest(patch=patch), self.assertRaises(ValueError):images.request({**BRIEF,**patch})
  with tempfile.TemporaryDirectory() as folder:
   request=images.create(folder,{**BRIEF,'mode':'find'})
   file=Path(folder)/'sample.png';file.write_bytes(b'\x89PNG\r\n\x1a\nexample')
   for source in ['', 'javascript:alert(1)']:
    with self.assertRaises(ValueError):images.complete(folder,request['id'],file,'test','stock',source,'Photo credit','Source license')
   file.write_text('<svg>not a raster</svg>')
   with self.assertRaises(ValueError):images.complete(folder,request['id'],file,'test','stock','https://example.com','Photo credit','Source license')
if __name__=='__main__':unittest.main()
