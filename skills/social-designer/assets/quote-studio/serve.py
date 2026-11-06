#!/usr/bin/env python3
"""Loopback-only quote prototype. No third-party Python packages required."""
from http.server import ThreadingHTTPServer, BaseHTTPRequestHandler
from pathlib import Path
import json, mimetypes, secrets, uuid, base64, argparse, re
from urllib.parse import urlsplit, parse_qs
import image_store
from quote_paths import validate_output
ROOT=Path(__file__).resolve().parent
class Handler(BaseHTTPRequestHandler):
 def log_message(self,*args): pass
 def send(self,status,data,kind='application/json'):
  if isinstance(data,dict): data=json.dumps(data).encode()
  if isinstance(data,str): data=data.encode()
  self.send_response(status);self.send_header('Content-Type',kind);self.send_header('Content-Length',str(len(data)));self.send_header('Cache-Control','no-store');self.send_header('X-Content-Type-Options','nosniff');self.end_headers();self.wfile.write(data)
 def valid_host(self):return self.headers.get('Host')==f'127.0.0.1:{self.server.server_port}'
 def do_GET(self):
  if not self.valid_host():return self.send(403,{'error':'Host rejected. Use the loopback editor URL.'})
  name=urlsplit(self.path).path
  if name=='/api/images':
   if self.headers.get('X-Quote-Key')!=self.server.key:return self.send(403,{'error':'Use the local editor controls.'})
   try:return self.send(200,image_store.listing(self.server.output,parse_qs(urlsplit(self.path).query).get('project',[''])[0]))
   except ValueError as e:return self.send(400,{'error':str(e)})
  if name.startswith('/images/'):
   if not re.fullmatch(r'/images/[a-f0-9-]{36}\.(png|jpg|webp)',name):return self.send(404,{'error':'Not found'})
   folder=(self.server.output/'images').resolve();file=(folder/Path(name).name).resolve()
   if not file.is_relative_to(folder) or not file.is_file():return self.send(404,{'error':'Not found'})
   return self.send(200,file.read_bytes(),mimetypes.guess_type(file)[0])
  if name in ('/','/index.html'):
   return self.send(200,(ROOT/'index.html').read_text().replace('__QUOTE_KEY__',self.server.key),'text/html; charset=utf-8')
  allowed=name in ['/app.js','/core.js','/style.css','/image-styles.js','/image-panel.js'] or (name.startswith('/fonts/') and Path(name).name in [x.name for x in (ROOT/'fonts').iterdir()]) or bool(re.fullmatch(r'/exports/[a-f0-9-]{36}\.(json|svg|png)',name))
  export=name.startswith('/exports/')
  base=self.server.output if export else ROOT
  file=(base/Path(name).name).resolve() if export else (ROOT/name.lstrip('/')).resolve()
  if not allowed or not file.is_relative_to(base) or not file.is_file():return self.send(404,{'error':'Not found'})
  self.send(200,file.read_bytes(),mimetypes.guess_type(file)[0] or 'application/octet-stream')
 def do_POST(self):
  if not self.valid_host():return self.send(403,{'error':'Host rejected. Use the loopback editor URL.'})
  if self.path not in ('/api/save','/api/image-request','/api/image-cancel') or self.headers.get('X-Quote-Key')!=self.server.key or not self.headers.get('Content-Type','').startswith('application/json'):return self.send(403,{'error':'Use the local editor controls.'})
  if self.headers.get('Origin') not in (None,f'http://127.0.0.1:{self.server.server_port}'):return self.send(403,{'error':'Origin rejected.'})
  try:
   length=int(self.headers.get('Content-Length',0))
   if length<=0 or length>18*1024*1024:raise ValueError('Project is too large.')
   value=json.loads(self.rfile.read(length))
   if self.path=='/api/image-request':return self.send(200,image_store.create(self.server.output,value))
   if self.path=='/api/image-cancel':
    if not isinstance(value,dict) or set(value)!={'project','id'}:raise ValueError('Invalid cancellation.')
    return self.send(200,image_store.cancel(self.server.output,value['project'],value['id']))
   kind=value.get('kind');data=value.get('data')
   if kind not in ['json','svg','png'] or not isinstance(data,str):raise ValueError('Invalid export.')
   if kind=='png':
    if not data.startswith('data:image/png;base64,'):raise ValueError('Invalid PNG.')
    output=base64.b64decode(data.split(',',1)[1],validate=True)
    if not output.startswith(b'\x89PNG\r\n\x1a\n'):raise ValueError('Invalid PNG.')
   else:
    if kind=='json':json.loads(data)
    elif not data.startswith('<svg '):raise ValueError('Invalid SVG.')
    output=data.encode()
   folder=self.server.output;folder.mkdir(parents=True,exist_ok=True);name=str(uuid.uuid4())+'.'+kind;(folder/name).write_bytes(output)
   self.send(200,{'url':'/exports/'+name})
  except Exception as e:self.send(400,{'error':str(e)})
if __name__=='__main__':
 parser=argparse.ArgumentParser();parser.add_argument('--port',type=int,default=8787);parser.add_argument('--output',type=Path,required=True);args=parser.parse_args();output=args.output.resolve();
 try:output=validate_output(output)
 except ValueError as error:parser.error(str(error))
 server=ThreadingHTTPServer(('127.0.0.1',args.port),Handler);server.key=secrets.token_urlsafe(24);server.output=output;print(f'Quote studio: http://127.0.0.1:{args.port}/',flush=True);server.serve_forever()
