import json
import io
import tempfile
import unittest
from contextlib import nullcontext
from pathlib import Path
from types import SimpleNamespace
from urllib.error import HTTPError
from unittest.mock import patch

import image_store
import stock_images as stock

ID = '905d9c20-bdda-4e84-94cb-7a6c1d595393'
RECORD = {'id':ID, 'title':'Misty Forest', 'creator':'Example photographer', 'license':'cc0',
          'foreign_landing_url':'https://example.com/photo', 'width':1600, 'height':2000}
VALUE = {'project':'one', 'id':ID, 'style':'water', 'placement':'center', 'query':'misty lake'}


class StockImagesTest(unittest.TestCase):
    def setUp(self):
        stock._cache.clear()

    def test_search_filters_unsupported_licenses_and_caches_normal_pagination(self):
        payload = {'results':[RECORD, {**RECORD,'license':'by-nc'}, {**RECORD,'title':'AI-generated landscape'}], 'page_count':20}
        with patch.object(stock,'fetch',return_value=json.dumps(payload).encode()) as fetch:
            result = stock.search({'query':'misty lake','page':1})
            self.assertEqual(len(result['images']),1)
            self.assertTrue(result['hasMore'])
            self.assertIn('license=cc0%2Cpdm',fetch.call_args.args[0])
            self.assertEqual(stock.search({'query':'misty lake','page':1}), result)
            self.assertEqual(fetch.call_count,1)
            self.assertFalse(stock.search({'query':'misty lake','page':3})['hasMore'])

    def test_arbitrary_urls_and_invalid_pagination_are_rejected_before_fetch(self):
        with patch.object(stock,'fetch') as fetch:
            for value in ({**VALUE,'id':'../../private'}, {**VALUE,'url':'http://127.0.0.1/secret'}, {**VALUE,'id':None}):
                with self.assertRaises(ValueError):stock.import_image('/tmp/unused',value)
            for page in (0,4,True,'1'):
                with self.assertRaises(ValueError):stock.search({'query':'lake','page':page})
            self.assertEqual(fetch.call_count,0)

    def test_import_uses_only_fixed_provider_paths_and_preserves_provenance(self):
        raster = b'\xff\xd8\xfforiginal-source-bytes'
        with tempfile.TemporaryDirectory() as folder, patch.object(stock,'fetch',side_effect=[json.dumps(RECORD).encode(), raster]) as fetch:
            image = stock.import_image(folder,VALUE)
            self.assertEqual(fetch.call_args_list[0].args[0],'images/'+ID+'/')
            self.assertEqual(fetch.call_args_list[1].args[0],'images/'+ID+'/thumb/?full_size=true&compressed=false')
            self.assertEqual(image['credit'],RECORD['creator'])
            self.assertEqual(image['source'],RECORD['foreign_landing_url'])
            self.assertIn('not been independently verified',image['license'])
            self.assertEqual((Path(folder)/image['url'].lstrip('/')).read_bytes(),raster)
            self.assertEqual(image_store.listing(folder,'two')['images'],[])
            self.assertEqual(image_store.listing(folder,'one')['requests'][0]['status'],'ready')
            self.assertFalse(list(Path(folder).glob('*.tmp')))

    def test_changed_license_and_mismatched_provider_id_block_import(self):
        with tempfile.TemporaryDirectory() as folder:
            for record in ({**RECORD,'license':'by-nd'}, {**RECORD,'id':'b0d3c032-1f98-4e63-a17e-890a9c270e71'}):
                with patch.object(stock,'fetch',return_value=json.dumps(record).encode()) as fetch:
                    with self.assertRaises(ValueError):stock.import_image(folder,VALUE)
                    self.assertEqual(fetch.call_count,1)
            self.assertFalse(list(Path(folder).glob('images/*')))

    def test_nonimage_response_cancels_request_and_cleans_temporary_file(self):
        with tempfile.TemporaryDirectory() as folder, patch.object(stock,'fetch',side_effect=[json.dumps(RECORD).encode(),b'<html>not an image</html>']):
            with self.assertRaises(ValueError):stock.import_image(folder,VALUE)
            self.assertFalse(list(Path(folder).glob('*.tmp')))
            self.assertEqual(image_store.listing(folder,'one')['requests'][0]['status'],'cancelled')
            self.assertEqual(image_store.listing(folder,'one')['images'],[])

    def test_repeated_selection_reuses_existing_project_image(self):
        with tempfile.TemporaryDirectory() as folder:
            with patch.object(stock,'fetch',side_effect=[json.dumps(RECORD).encode(),b'\xff\xd8\xffimage']):
                first=stock.import_image(folder,VALUE)
            with patch.object(stock,'fetch',return_value=json.dumps(RECORD).encode()) as fetch:
                second=stock.import_image(folder,VALUE)
                self.assertEqual(fetch.call_count,1)
            self.assertEqual(first['id'],second['id'])
            self.assertEqual(len(image_store.listing(folder,'one')['images']),1)

    def test_remote_reads_are_bounded_and_redirects_are_rejected(self):
        response = SimpleNamespace(headers={},read=io.BytesIO(b'x'*11).read)
        opener = SimpleNamespace(open=lambda *args,**kwargs:nullcontext(response))
        with patch.object(stock,'build_opener',return_value=opener):
            with self.assertRaisesRegex(stock.StockError,'too large'):stock.fetch('images/?q=lake',10)
        with self.assertRaises(stock.StockError):
            stock.NoRedirect().redirect_request(None,None,302,'Redirect',{},'http://127.0.0.1/private')
        error=HTTPError(stock.BASE,429,'Rate limited',{},None)
        opener=SimpleNamespace(open=lambda *args,**kwargs:(_ for _ in ()).throw(error))
        with patch.object(stock,'build_opener',return_value=opener):
            with self.assertRaisesRegex(stock.StockError,'short break'):stock.fetch('images/?q=lake',10)


if __name__ == '__main__':unittest.main()
