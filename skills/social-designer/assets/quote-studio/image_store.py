"""Project-scoped, local image requests and reviewed results. No remote execution."""
try:
 import fcntl
except ImportError:  # Windows standard-library equivalent; no extra package needed.
 fcntl=None
 import msvcrt
import json
import re
import uuid
from contextlib import contextmanager
from datetime import datetime, timezone
from pathlib import Path

STYLES={'water','botanical','light','tactile','atmosphere'}
def now(): return datetime.now(timezone.utc).isoformat()
def string(value, maximum, label, required=False):
 if not isinstance(value,str) or len(value)>maximum or (required and not value.strip()): raise ValueError('Invalid '+label+'.')
 return value.strip()
def project(value): return string(value,100,'project',True)
def identifier(value):
 if not isinstance(value,str) or not re.fullmatch(r'[a-f0-9-]{36}',value): raise ValueError('Invalid request ID.')
 return value
def request(value):
 if not isinstance(value,dict) or set(value)!={'project','mode','style','subject','placement','prompt'}: raise ValueError('Invalid image request.')
 result={**value,'project':project(value['project'])}
 if value['mode'] not in ('find','generate') or value['style'] not in STYLES or value['placement'] not in ('center','top','bottom'): raise ValueError('Invalid image direction.')
 result['subject']=string(value['subject'],500,'subject')
 result['prompt']=string(value['prompt'],5000,'image brief',True)
 return result
@contextmanager
def exclusive(handle):
 if fcntl:
  fcntl.flock(handle,fcntl.LOCK_EX)
 else:
  if handle.seek(0,2)==0:handle.write(b'0');handle.flush()
  handle.seek(0);msvcrt.locking(handle.fileno(),msvcrt.LK_LOCK,1)
 try:yield
 finally:
  if fcntl:fcntl.flock(handle,fcntl.LOCK_UN)
  else:handle.seek(0);msvcrt.locking(handle.fileno(),msvcrt.LK_UNLCK,1)
@contextmanager
def store(output):
 output=Path(output);output.mkdir(parents=True,exist_ok=True)
 with (output/'image-library.lock').open('a+b') as lock, exclusive(lock):
  path=output/'image-library.json'
  data=json.loads(path.read_text()) if path.exists() else {'version':1,'requests':[],'images':[]}
  yield data
  temporary=output/('image-library-'+str(uuid.uuid4())+'.tmp')
  temporary.write_text(json.dumps(data,indent=2));temporary.replace(path)
def create(output,value):
 item={**request(value),'id':str(uuid.uuid4()),'created':now(),'status':'waiting'}
 with store(output) as data: data['requests'].append(item)
 return item
def listing(output,name):
 name=project(name)
 with store(output) as data:
  return {'requests':[r for r in data['requests'] if r['project']==name][-30:][::-1], 'images':[r for r in data['images'] if r['project']==name][-24:][::-1]}
def cancel(output,name,request_id):
 name=project(name);request_id=identifier(request_id)
 with store(output) as data:
  item=next((r for r in data['requests'] if r['project']==name and r['id']==request_id),None)
  if not item or item['status']!='waiting': raise ValueError('This request is no longer waiting. Refresh the library.')
  item['status']='cancelled'
 return item
def complete(output,request_id,image,title,origin,source,credit,license_note):
 request_id=identifier(request_id)
 if origin not in ('generated','stock'): raise ValueError('Choose generated or stock provenance.')
 title=string(title,120,'title',True);credit=string(credit,300,'credit',True);license_note=string(license_note,1000,'license note',True)
 source=string(source,2048,'source URL')
 if source and not re.match(r'^https?://[^\s]+$',source): raise ValueError('Use an HTTP(S) source page.')
 if origin=='stock' and not source: raise ValueError('Retain the stock source page URL.')
 image=Path(image);raw=image.read_bytes()
 if len(raw)>8*1024*1024: raise ValueError('Choose an image smaller than 8 MB.')
 ext='png' if raw.startswith(b'\x89PNG\r\n\x1a\n') else 'jpg' if raw.startswith(b'\xff\xd8\xff') else 'webp' if raw[:4]==b'RIFF' and raw[8:12]==b'WEBP' else None
 if not ext: raise ValueError('Use a real PNG, JPEG or WebP image.')
 with store(output) as data:
  item=next((r for r in data['requests'] if r['id']==request_id),None)
  if not item or item['status']=='cancelled': raise ValueError('Request missing or cancelled.')
  image_id=str(uuid.uuid4());name=image_id+'.'+ext
  folder=Path(output)/'images';folder.mkdir(exist_ok=True);(folder/name).write_bytes(raw)
  result={'id':image_id,'project':item['project'],'requestId':request_id,'title':title,'origin':origin,'source':source,'credit':credit,'license':license_note,'prompt':item['prompt'],'style':item['style'],'url':'/images/'+name,'created':now()}
  data['images'].append(result);item['status']='ready'
 return result
