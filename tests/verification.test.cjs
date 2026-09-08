const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
function load(file, mocks) {
  const module = { exports: {} };
  const code = ts.transpileModule(fs.readFileSync(path.join(__dirname, '..', file), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 }
  }).outputText;
  new Function('require', 'module', 'exports', code)(name => {
    if (name in mocks) return mocks[name];
    throw new Error(`Unexpected import: ${name}`);
  }, module, module.exports);
  return module.exports;
}

const valid={designId:'11111111-1111-4111-8111-111111111111',suitorEmail:'test@example.invalid'};
function setup(results) {
 const calls=[];
 const db={from(table){calls.push(table);const q={};
 for(const m of ['select','eq','gte','limit','insert'])q[m]=()=>q;
 q.then=(resolve,reject)=>{assert.ok(results.length,'Unexpected database operation');const r=results.shift();return (r instanceof Error?Promise.reject(r):Promise.resolve(r)).then(resolve,reject)};return q;}};
 const handler=load('app/api/suitor/verify/route.ts',{
 'next/server':{NextResponse:{json:(b,i)=>Response.json(b,i)}},
 '@/lib/supabaseServer':{supabaseServer:()=>db},
 '@/lib/verify':{hashAnswer:v=>v,hashesMatch:(a,b)=>a===b,normalizeAnswer:v=>v.toLowerCase()},
 '@/lib/notify':{recordEvent:async()=>{}}
 });
 return {handler,calls};
}
function req(body=valid,ip){return new Request('https://preview.example/api',{method:'POST',body:JSON.stringify(body),headers:ip?{'x-nf-client-connection-ip':ip}:{}})}
test('invalid verification input never reaches database',async()=>{
 for(const b of [null,[],{...valid,school:12},{...valid,designId:'bad'},{...valid,suitorEmail:''}]){
 const {handler,calls}=setup([]);assert.equal((await handler.POST(req(b))).status,400);assert.equal(calls.length,0);
 }
});
test('missing, failed and thrown attempt counts keep verification unavailable',async()=>{
 for(const r of [{count:null},{error:{message:'offline'}},new Error('offline')]){
 const {handler,calls}=setup([r]);assert.equal((await handler.POST(req())).status,503);assert.deepEqual(calls,['verify_attempts']);
 }
});
test('either email or IP limit blocks verification before reading private answers',async()=>{
 for(const counts of [[5,0],[0,5]]){
 const {handler,calls}=setup(counts.map(count=>({count})));assert.equal((await handler.POST(req(valid,'192.0.2.1'))).status,429);assert.deepEqual(calls,['verify_attempts','verify_attempts']);
 }
});
test('failure to record a wrong answer is reported as unavailable',async()=>{
 const {handler,calls}=setup([{count:0},{data:[{verify_school_hash:'correct'}]},{error:{message:'offline'}}]);
 assert.equal((await handler.POST(req({...valid,school:'wrong'}))).status,503);assert.ok(!calls.includes('unlocks'));
});
test('correct answers below limit return a pending unlock token',async()=>{
 const {handler}=setup([{count:0},{data:[{verify_school_hash:'correct'}]},{data:[{access_token:'fixture'}]},{}]);
 const response=await handler.POST(req({...valid,school:'correct'}));assert.deepEqual(await response.json(),{verified:true,token:'fixture'});
});
