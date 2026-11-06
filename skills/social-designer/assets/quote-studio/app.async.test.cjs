const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const {defaults}=require('./core.js');

const A='data:image/png;base64,QQ==',B='data:image/png;base64,Qg==';
function setup(){
 const elements=new Map(),decodes=new Map(),data=new Map();
 function element(id){if(!elements.has(id))elements.set(id,{id,type:'text',value:'',hidden:false,disabled:false,textContent:'',addEventListener(){},closest(){return this;},append(){},prepend(){}});return elements.get(id);}
 class Image{
  set src(value){this.uri=value;[this.naturalWidth,this.naturalHeight]=value===A?[2000,1000]:[1000,2000];}
  decode(){return new Promise((resolve,reject)=>{const list=decodes.get(this.uri)||[];list.push({resolve,reject});decodes.set(this.uri,list);});}
 }
 class FileReader{readAsDataURL(file){this.result=file.uri;queueMicrotask(()=>this.onload());}}
 const context=vm.createContext({QuoteCore:require('./core.js'),URLSearchParams,location:{search:'?project=test'},window:{},Image,FileReader,queueMicrotask,localStorage:{getItem:key=>data.get(key)||null,setItem:(key,value)=>data.set(key,value)},document:{querySelectorAll:()=>[],querySelector:selector=>element(selector),getElementById:element,addEventListener(){},createElement:()=>({getContext:()=>({measureText:text=>({width:text.length*10})})})}});
 const full=fs.readFileSync(__dirname+'/app.js','utf8');
 const source=full.slice(0,full.indexOf('(async()=>{try{await Promise.all'));
 vm.runInContext(source,context);vm.runInContext("assetsReady=true;tile=()=>'';",context);
 context.A=A;context.B=B;
 const run=code=>vm.runInContext(code,context);
 const result=code=>JSON.parse(run('JSON.stringify('+code+')'));
 const resolve=async uri=>{const item=decodes.get(uri)?.shift();assert.ok(item,'Expected an image decode for '+uri);item.resolve();await Promise.resolve();};
 return {run,result,resolve,elements,decodes,context};
}

test('a superseded decode cannot replace the current image dimensions',async()=>{
 const h=setup();h.run("s={...s,image:A};var first=loadImage();s={...s,image:B};var second=loadImage();");
 await h.resolve(B);await h.run('second');await h.resolve(A);await h.run('first');
 assert.deepEqual(h.result('window.quoteImageSize'),{w:1000,h:2000});
 assert.equal(h.run('window.quoteImageUri'),B);
 assert.equal(h.result('imageRect()').w,1080);
});
test('export waits for the current image geometry and recovers after decode',async()=>{
 const h=setup();h.run('s={...s,image:A,background:"photo"};var loading=loadImage();render();');
 assert.equal(h.elements.get('png').disabled,true);assert.equal(h.elements.get('svg').disabled,true);
 await h.resolve(A);await h.run('loading');h.run('render();');
 assert.equal(h.elements.get('png').disabled,false);assert.equal(h.elements.get('svg').disabled,false);
});
test('Cancel during project image decode leaves the current project unchanged',async()=>{
 const h=setup();h.run("pending=validate({...s,text:'Restored',image:A});var applying=$('apply').onclick();$('cancel').onclick();");
 await h.resolve(A);await h.run('applying');
 assert.equal(h.run('s.text'),defaults.text);assert.equal(h.run('s.image'),'');
 assert.equal(h.elements.get('restore').hidden,true);
});
test('reviewing a newer project while Apply waits cannot commit its unchecked image',async()=>{
 const h=setup();h.run("pending=validate({...s,text:'First',image:A});var applying=$('apply').onclick();$('project-json').value=JSON.stringify({...s,text:'Second',image:B});$('review-json').onclick();");
 await h.resolve(A);await h.run('applying');
 assert.equal(h.run('s.text'),defaults.text);assert.equal(h.run('pending.text'),'Second');
 h.run("var next=$('apply').onclick();");await h.resolve(B);await h.run('next');
 assert.equal(h.run('s.text'),'Second');assert.equal(h.run('s.image'),B);
 assert.deepEqual(h.result('window.quoteImageSize'),{w:1000,h:2000});
});
test('Undo supersedes an image restore that is still decoding',async()=>{
 const h=setup();h.run("past.push({...s,text:'Earlier'});pending=validate({...s,text:'Restore',image:A});var applying=$('apply').onclick();history(false);");
 await h.resolve(A);await h.run('applying');
 assert.equal(h.run('s.text'),'Earlier');assert.equal(h.run('s.image'),'');
});
test('later file selection wins even when the older file decodes last',async()=>{
 const h=setup();
 h.run("var first=$('image-file').onchange({target:{files:[{uri:A,size:20,type:'image/png'}]}});");
 await Promise.resolve();await Promise.resolve();
 h.run("var second=$('image-file').onchange({target:{files:[{uri:B,size:20,type:'image/png'}]}});");
 await Promise.resolve();await Promise.resolve();
 await h.resolve(B);await h.run('second');await h.resolve(A);await h.run('first');
 assert.equal(h.run('s.image'),B);assert.deepEqual(h.result('window.quoteImageSize'),{w:1000,h:2000});
});

function addLibraryApply(h){
 const panel=fs.readFileSync(__dirname+'/image-panel.js','utf8');
 const method=panel.slice(panel.indexOf('async function useImage('),panel.indexOf('function renderLibrary('));
 h.context.fetch=async()=>({ok:true,blob:async()=>({size:20,uri:A})});
 h.context.item={id:'test-image',url:'/images/test.png',origin:'generated',credit:'AI',source:'',license:'Original',prompt:'A calm background'};
 h.run("let applying=false;function message(text){$('image-status').textContent=text;}"+method);
}
async function drain(){for(let i=0;i<8;i++)await Promise.resolve();}
test('Undo cancels a library image that is still being prepared',async()=>{
 const h=setup();addLibraryApply(h);h.run('var choosing=useImage(item,{});');await drain();
 h.run("past.push({...s,text:'Earlier'});history(false);");
 await h.resolve(A);await h.run('choosing');
 assert.equal(h.run('s.image'),'');assert.equal(h.run('s.text'),'Earlier');
 assert.match(h.elements.get('image-status').textContent,/cancelled by a newer change/);
});
test('library image application commits its decoded geometry with retained text',async()=>{
 const h=setup();addLibraryApply(h);h.run('var choosing=useImage(item,{});');await drain();
 await h.resolve(A);await h.run('choosing');
 assert.equal(h.run('s.image'),A);assert.equal(h.run('s.text'),defaults.text);
 assert.deepEqual(h.result('window.quoteImageSize'),{w:2000,h:1000});
 assert.equal(h.result('imageRect()').w,2700);
 assert.equal(h.elements.get('png').disabled,false);
 assert.match(h.elements.get('art').innerHTML,/x="-810" y="0" width="2700"/);
});
