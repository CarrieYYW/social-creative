#!/usr/bin/env python3
"""Assistant handoff: inspect saved briefs; add real, reviewed images to the library."""
import argparse
import json
from pathlib import Path
import image_store
from quote_paths import validate_output

def main():
 parser=argparse.ArgumentParser(description=__doc__)
 parser.add_argument('--output',type=Path,required=True)
 sub=parser.add_subparsers(dest='action',required=True)
 ls=sub.add_parser('list');ls.add_argument('--project',required=True)
 done=sub.add_parser('complete');done.add_argument('--request',required=True);done.add_argument('--image',type=Path,required=True);done.add_argument('--title',required=True);done.add_argument('--origin',choices=['stock','generated'],required=True);done.add_argument('--source',default='');done.add_argument('--credit',required=True);done.add_argument('--license',required=True)
 args=parser.parse_args();output=args.output.resolve()
 try:output=validate_output(output)
 except ValueError as error:parser.error(str(error))
 try:
  result=image_store.listing(output,args.project) if args.action=='list' else image_store.complete(output,args.request,args.image,args.title,args.origin,args.source,args.credit,args.license)
  print(json.dumps(result,indent=2))
 except (ValueError,OSError) as error: parser.exit(1,str(error)+'\n')
if __name__=='__main__': main()
