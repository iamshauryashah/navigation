// Test the exact placement implementation embedded in the deployed launcher.
// This intentionally avoids maintaining a second copy of the algorithm.
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const source = fs.readFileSync("public/launcher.js", "utf8");
const block = source.split("// BEGIN PLACEMENT CORE (tested independently in tests/placement.test.cjs)")[1]?.split("// END PLACEMENT CORE")[0];
assert.ok(block, "placement implementation must be present");
const choose = vm.runInNewContext(block + "\nchoosePlacement", {});
const pos = (id, x, y, preference) => ({id,left:x,top:y,right:x+46,bottom:y+46,preference});
const candidates = [pos("top-right",930,18,0),pos("top-left",24,18,9),pos("bottom-right",930,700,24),pos("bottom-left",24,700,28)];
const obstacle = (x,y,w=46,h=46,weight=160)=>({left:x,top:y,right:x+w,bottom:y+h,weight});

test("defaults to the familiar top-right position when clear",()=>{
  assert.equal(choose(candidates,[],null).id,"top-right");
});
test("moves to top-left when top-right overlaps an important button",()=>{
  assert.equal(choose(candidates,[obstacle(930,18)],null).id,"top-left");
});
test("prefers a free bottom edge when top controls cover both top corners",()=>{
  assert.equal(choose(candidates,[obstacle(930,18),obstacle(24,18)],null).id,"bottom-right");
});
test("avoids feedback widget when bottom-right is otherwise attractive",()=>{
  assert.equal(choose(candidates,[obstacle(930,18),obstacle(24,18),obstacle(930,700,60,46,230)],null).id,"bottom-left");
});
test("keeps the previous candidate when alternatives are similarly safe",()=>{
  assert.equal(choose(candidates,[], "top-right").id,"top-right");
});
test("ignores obstacles that do not intersect any candidate",()=>{
  assert.equal(choose(candidates,[obstacle(300,300,100,100)],null).id,"top-right");
});
test("uses overlap fraction rather than treating a tiny intersection as full",()=>{
  const partial=[obstacle(971,59,46,46,160)];
  assert.equal(choose(candidates,partial,null).id,"top-right");
});
test("does not mutate caller candidates",()=>{
  const copy=JSON.stringify(candidates);
  choose(candidates,[obstacle(930,18)],null);
  assert.equal(JSON.stringify(candidates),copy);
});
