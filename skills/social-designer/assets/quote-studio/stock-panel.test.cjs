const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');

function setup(){
 const elements=new Map(),requests=[],applied=[];
 class Element{
  constructor(tag='div'){this.tagName=tag;this.children=[];this.value='';this.hidden=false;this.disabled=false;this.listeners={};this.attributes={};this.classList={add(){}};}
  setAttribute(key,value){this.attributes[key]=value;}
  addEventListener(key,callback){this.listeners[key]=callback;}
  append(...items){this.children.push(...items);}
  replaceChildren(...items){this.children=items;}
  focus(){}
 }
 function get(id){if(!elements.has(id))elements.set(id,new Element());return elements.get(id);}
 get('image-style').value='water';get('image-placement').value='center';get('image-status').textContent='';
 const context=vm.createContext({AbortController,scope:'test',imageChoiceVersion:0,
  window:{QUOTE_KEY:'key',quoteApplyLibraryImage:async(...args)=>{applied.push(args);return {applied:true};},quoteRefreshLibrary:async()=>{}},
  document:{getElementById:get,querySelectorAll:()=>[],createElement:tag=>new Element(tag)},
  fetch:(url,options)=>new Promise(resolve=>requests.push({url,options,resolve:data=>resolve({ok:true,json:async()=>data})}))});
 vm.runInContext(fs.readFileSync(__dirname+'/stock-panel.js','utf8'),context);
 const settle=async()=>{for(let i=0;i<10;i++)await Promise.resolve();};
 const result=(query,title)=>({query,page:1,hasMore:false,images:[{id:title,title,credit:'Photographer',thumbnail:'https://api.openverse.org/preview',source:'https://example.com',licenseUrl:'https://creativecommons.org/publicdomain/zero/1.0/',licenseLabel:'CC0',width:1200,height:1600}]});
 return {context,get,requests,applied,settle,result};
}

test('a late old search cannot replace the newer visible results',async()=>{
 const h=setup();h.context.window.quoteStockActivate();
 h.get('stock-query').value='forest';h.get('stock-search').onclick();
 h.requests[1].resolve(h.result('forest','New forest'));await h.settle();
 h.requests[0].resolve(h.result('lake','Old lake'));await h.settle();
 assert.equal(h.get('stock-results').children[0].children[1].textContent,'New forest');
 assert.equal(h.get('stock-search').disabled,false);
});

test('cancelled import cannot apply a late downloaded background',async()=>{
 const h=setup();h.context.window.quoteStockActivate();h.requests[0].resolve(h.result('lake','Lake'));await h.settle();
 const card=h.get('stock-results').children[0];const pending=card.children.at(-1).onclick();
 h.get('stock-cancel').onclick();
 h.requests[1].resolve({id:'saved',url:'/images/saved.jpg'});await pending;await h.settle();
 assert.equal(h.applied.length,0);
 assert.match(h.get('stock-status').textContent,/Selection cancelled/);
 assert.equal(h.get('stock-cancel').hidden,true);
});

test('switching modes during search permits a fresh search when returning',async()=>{
 const h=setup();h.context.window.quoteStockActivate();
 h.context.window.quoteStockMode('generate');assert.equal(h.get('stock-search').disabled,false);
 h.context.window.quoteStockMode('find');assert.equal(h.requests.length,2);
 h.requests[1].resolve(h.result('lake','Current lake'));await h.settle();
 h.requests[0].resolve(h.result('lake','Stale lake'));await h.settle();
 assert.equal(h.get('stock-results').children[0].children[1].textContent,'Current lake');
 assert.equal(h.get('stock-search').disabled,false);
});

// A direction chosen while preparing an AI brief must carry back into stock discovery.
test('returning from generation searches the newly selected direction',async()=>{
 const h=setup();h.context.window.quoteStockActivate();h.requests[0].resolve(h.result('misty lake','Lake'));await h.settle();
 h.context.window.quoteStockMode('generate');h.get('image-style').value='botanical';
 h.get('image-style').listeners.input();h.context.window.quoteStockMode('find');
 assert.equal(JSON.parse(h.requests[1].options.body).query,'fern leaf');
});

test('stock feedback follows the application result when another edit supersedes decoding',async()=>{
 const h=setup();h.context.window.quoteStockActivate();h.requests[0].resolve(h.result('lake','Lake'));await h.settle();
 const choose=h.get('stock-results').children[0].children.at(-1).onclick;
 let finish;
 h.context.window.quoteApplyLibraryImage=()=>new Promise(resolve=>finish=resolve);
 const pending=choose();h.requests[1].resolve({id:'saved',url:'/images/saved.jpg'});await h.settle();
 h.context.imageChoiceVersion++;
 finish({applied:false,feedback:'Image selection cancelled by a newer change.'});await pending;
 assert.match(h.get('stock-status').textContent,/cancelled by a newer change/);
 assert.equal(h.get('stock-cancel').hidden,true);
 // An already selected background can be successfully applied without changing the image version.
 h.context.window.quoteApplyLibraryImage=async()=>({applied:true});
 const retry=choose();h.requests[2].resolve({id:'saved',url:'/images/saved.jpg'});await retry;
 assert.match(h.get('stock-status').textContent,/Background applied/);
});
