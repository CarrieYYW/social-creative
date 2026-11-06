import importlib.util
import tempfile
import unittest
from pathlib import Path
from types import SimpleNamespace

from quote_paths import validate_output

ROOT=Path(__file__).resolve().parent
spec=importlib.util.spec_from_file_location('quote_server',ROOT/'serve.py')
server=importlib.util.module_from_spec(spec)
spec.loader.exec_module(server)

class ServerBoundaryTest(unittest.TestCase):
 def test_foreign_host_cannot_read_page_key_or_library(self):
  with tempfile.TemporaryDirectory() as output:
   handler=server.Handler.__new__(server.Handler)
   handler.server=SimpleNamespace(key='test-page-key',output=Path(output),server_port=8787)
   handler.headers={'Host':'attacker.example:8787','X-Quote-Key':'test-page-key'}
   responses=[];handler.send=lambda status,data,kind=None:responses.append((status,data))
   for path in ('/','/api/images?project=test'):
    handler.path=path;handler.do_GET();self.assertEqual(responses[-1][0],403)
    self.assertNotIn('test-page-key',str(responses[-1][1]))
   handler.path='/api/save';handler.do_POST();self.assertEqual(responses[-1][0],403)
 def test_canonical_host_can_read_editor_and_authorized_library(self):
  with tempfile.TemporaryDirectory() as output:
   handler=server.Handler.__new__(server.Handler)
   handler.server=SimpleNamespace(key='test-page-key',output=Path(output),server_port=8787)
   handler.headers={'Host':'127.0.0.1:8787','X-Quote-Key':'test-page-key'}
   responses=[];handler.send=lambda status,data,kind=None:responses.append((status,data))
   handler.path='/';handler.do_GET();self.assertEqual(responses[-1][0],200)
   handler.path='/api/images?project=test';handler.do_GET();self.assertEqual(responses[-1],(200,{'requests':[],'images':[]}))
 def test_output_guard_protects_editor_skill_and_plugin_but_allows_client(self):
  with tempfile.TemporaryDirectory() as folder:
   base=Path(folder);plugin=base/'plugin';skill=plugin/'skills/social-designer';source=skill/'assets/quote-studio'
   source.mkdir(parents=True);(skill/'SKILL.md').write_text('skill');(plugin/'plugin.json').write_text('{}')
   for output in (source,source/'exports',skill/'assets/accidental-client-assets',plugin/'other-client-assets'):
    with self.subTest(output=output),self.assertRaises(ValueError):validate_output(output,source)
   self.assertEqual(validate_output(base/'client/artifacts',source),(base/'client/artifacts').resolve())
 def test_standalone_skill_and_plain_editor_guards(self):
  with tempfile.TemporaryDirectory() as folder:
   base=Path(folder);skill=base/'standalone';source=skill/'assets/quote-studio';source.mkdir(parents=True)
   (skill/'SKILL.md').write_text('skill')
   with self.assertRaises(ValueError):validate_output(skill/'assets/private',source)
   self.assertEqual(validate_output(base/'project',source),(base/'project').resolve())
   (skill/'SKILL.md').unlink()
   with self.assertRaises(ValueError):validate_output(source/'private',source)
   self.assertEqual(validate_output(skill/'client-project',source),(skill/'client-project').resolve())

if __name__=='__main__':unittest.main()
