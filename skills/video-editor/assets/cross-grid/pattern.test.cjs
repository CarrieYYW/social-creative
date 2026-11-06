const {test}=require('node:test');
const assert=require('node:assert/strict');
const {cellsAt}=require('./cross-grid.cjs');
test('cross opens before corners and every cell remains on canvas',()=>{
 const cells=cellsAt({frame:30,fps:30,duration:12,gap:2,stagger:3});
 assert.equal(cells.length,9);assert.equal(cells[4].progress,1);
 assert.equal(cells[0].progress,0);
 for(const c of cells){assert.ok(c.x>=0&&c.y>=0&&c.x+c.width<=360.01&&c.y+c.height<=640.01);assert.ok(c.progress>=0&&c.progress<=1);}
});
test('full read hold stays fully open; reduced motion remains revealed',()=>{
 assert.ok(cellsAt({frame:150,fps:30,duration:12,gap:2,stagger:3}).every(c=>c.progress===1));
 assert.ok(cellsAt({frame:0,fps:30,duration:12,gap:2,stagger:3,reducedMotion:true}).every(c=>c.progress===1));
});
test('negative gaps and zero duration are rejected',()=>{
 assert.throws(()=>cellsAt({frame:0,fps:30,duration:12,gap:-1,stagger:3}));
 assert.throws(()=>cellsAt({frame:0,fps:30,duration:0,gap:2,stagger:3}));
});
