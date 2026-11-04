// Exercise feedback state handlers without a browser or external packages.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const {test} = require('node:test');

const template = fs.readFileSync(path.join(__dirname, '../skills/video-editor/assets/review.html'), 'utf8');
const context = {schema:'social-creative-review/v1', version:'v01', media_sha256:'fixture-hash', time_basis:'elapsed_seconds_in_this_review_mp4'};
const saved = {...context, notes:[{id:'note-1', start_seconds:1, end_seconds:2, text:'Saved note'}]};

function harness(confirmResult = false) {
  const elements = new Map();
  const element = () => ({value:'', textContent:'', children:[], hidden:false,
    append(...items) {this.children.push(...items);}, replaceChildren() {this.children=[];},
    setAttribute() {}, addEventListener() {}, focus() {}});
  const get = id => {if(!elements.has(id)) elements.set(id, element()); return elements.get(id);};
  get('video').duration = 10;
  let confirmations = 0;
  const scope = vm.createContext({document:{getElementById:get, createElement:element},
    window:{addEventListener() {}}, confirm:()=>{confirmations++; return confirmResult;}});
  const script = template.split('<script>')[1].split('</script>')[0].replace('__REVIEW_CONTEXT__', JSON.stringify(context));
  vm.runInContext(script, scope);
  return {get, confirmations:()=>confirmations, import: async data => {
    const target = {files:[{size:100, text:async()=>JSON.stringify(data)}], value:'selected.json'};
    await get('import').onchange({target});
    return target;
  }};
}

test('canceling import preserves a typed draft and resets the file picker', async()=>{
  const h = harness(); h.get('note').value='Unfinished feedback';
  const picker = await h.import(saved);
  assert.equal(h.confirmations(),1);
  assert.equal(h.get('note').value,'Unfinished feedback');
  assert.equal(h.get('count').textContent,'Notes (0)');
  assert.equal(picker.value,'');
});

test('confirmed import replaces the draft with saved notes', async()=>{
  const h = harness(true); h.get('note').value='Unfinished feedback';
  await h.import(saved);
  assert.equal(h.confirmations(),1);
  assert.equal(h.get('note').value,'');
  assert.equal(h.get('count').textContent,'Notes (1)');
  assert.equal(h.get('status').textContent,'Saved feedback loaded for this draft.');
});

test('different media or versions cannot replace current feedback', async()=>{
  for (const mismatch of [{version:'v02'}, {media_sha256:'other-media'}]) {
    const h=harness(true); h.get('note').value='Keep this draft';
    await h.import({...saved,...mismatch});
    assert.equal(h.get('note').value,'Keep this draft');
    assert.match(h.get('status').textContent,/different draft/);
    assert.equal(h.confirmations(),0);
  }
});

test('invalid note ranges and null files give a controlled error', async()=>{
  for (const invalid of [null, {...saved,notes:[{...saved.notes[0],end_seconds:11}]}]) {
    const h=harness(); await h.import(invalid);
    assert.equal(h.get('count').textContent,'Notes (0)');
    assert.match(h.get('status').textContent,/different draft|Invalid note/);
  }
});
