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

function setup(result={data:true}) {const calls=[];const handler=load('lib/progressRoute.ts',{
'next/server':{NextResponse:Response},'@/lib/supabaseServer':{supabaseServer:()=>({rpc:async(...args)=>{calls.push(args);return result;}})}});return {handler,calls};}
const valid={session:'11111111-1111-4111-8111-111111111111',step:'stoneType'};
const req=(body=valid,origin='https://preview.example')=>new Request('https://preview.example/api/progress',{method:'POST',headers:{origin},body:JSON.stringify(body)});
test('progress rejects private extra fields, invalid IDs and invalid steps',async()=>{
for(const body of [null,{...valid,email:'private@example.invalid'},{...valid,step:'secret'},{...valid,session:'bad'}]){const {handler,calls}=setup();assert.equal((await handler.POST(req(body))).status,400);assert.equal(calls.length,0);}});
test('progress rejects cross-origin and oversized requests before database access',async()=>{
const {handler,calls}=setup();assert.equal((await handler.POST(req(valid,'https://other.example'))).status,403);assert.equal((await handler.POST(req({text:'x'.repeat(600)}))).status,413);assert.equal(calls.length,0);});
test('progress reports storage limit and failure without returning records',async()=>{
for(const [result,status] of [[{data:true},204],[{data:false},429],[{error:{}},503]]){const {handler}=setup(result);const response=await handler.POST(req());assert.equal(response.status,status);assert.equal(await response.text(),'');}});
