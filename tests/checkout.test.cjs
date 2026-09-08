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
const pending = { id:'u1', design_id:'d1', status:'pending', stripe_session_id:null, amount_cents:4999 };
function setup(results, existing) {
  const created = [];
  const db = { from() {
    const q = {};
    for (const method of ['select','eq','limit','update']) q[method] = () => q;
    q.then = (resolve,reject) => {
      assert.ok(results.length, 'Unexpected database call');
      return Promise.resolve(results.shift()).then(resolve,reject);
    };
    return q;
  }};
  const handler = load('app/api/suitor/checkout/route.ts', {
    'next/server': { NextResponse: { json: (body, init) => Response.json(body, init) } },
    '@/lib/supabaseServer': { supabaseServer: () => db },
    '@/lib/stripe': {
      unlockPriceCents: () => 4999, formatPrice: n => `$${n / 100}`,
      siteOrigin: () => 'https://preview.example',
      stripe: () => ({checkout:{sessions:{
        retrieve: async () => { if (existing instanceof Error) throw existing; return existing; },
        create: async (params,options) => {
          created.push({params,options});
          return {id:'cs_fixture',url:'https://checkout.stripe.com/fixture'};
        }
      }}})
    }
  });
  return { handler, created };
}
const request = (body={token:'fixture'}) => new Request('https://preview.example/api', {
  method:'POST', body:JSON.stringify(body)
});
test('malformed token and null JSON are rejected without database access', async () => {
  for (const body of [null,{token:12},{token:{}},{token:''}]) {
    const {handler}=setup([]);
    assert.equal((await handler.POST(request(body))).status,400);
  }
});
test('database lookup failure is retryable, not a missing link', async () => {
  const {handler}=setup([{error:{message:'offline'}}]);
  assert.equal((await handler.POST(request())).status,503);
});
test('open stored checkout is reused without another payment session', async () => {
  const {handler,created}=setup([{data:[{...pending,stripe_session_id:'cs_fixture'}]}],
    {metadata:{unlock_id:'u1'},status:'open',url:'https://checkout.stripe.com/existing'});
  assert.equal((await (await handler.POST(request())).json()).url,'https://checkout.stripe.com/existing');
  assert.equal(created.length,0);
});
test('expired or unavailable checkout never creates a second session', async () => {
  for (const existing of [{metadata:{unlock_id:'u1'},status:'expired'},new Error('offline')]) {
    const {handler,created}=setup([{data:[{...pending,stripe_session_id:'cs_fixture'}]}],existing);
    assert.ok([409,503].includes((await handler.POST(request())).status));
    assert.equal(created.length,0);
  }
});
test('failed persistence never returns a payable URL', async () => {
  for (const save of [{error:{message:'offline'}},{data:[]}]) {
    const {handler}=setup([{data:[pending]},{data:[{full_name:'Test Person'}]},save]);
    const response=await handler.POST(request());
    assert.equal(response.status,503);
    assert.equal((await response.json()).url,undefined);
  }
});
test('retry uses the same Stripe idempotency key and preview destination', async () => {
  const keys=[];
  for (let i=0;i<2;i++) {
    const {handler,created}=setup([{data:[pending]},{data:[{full_name:'Test Person'}]},{data:[{id:'u1'}]}]);
    assert.equal((await handler.POST(request())).status,200);
    keys.push(created[0].options.idempotencyKey);
    assert.match(created[0].params.success_url,/^https:\/\/preview.example\/deliverable/);
  }
  assert.equal(keys[0],keys[1]);
});
test('paid and refunded unlocks do not create a checkout', async () => {
  for (const status of ['paid','refunded']) {
    const {handler,created}=setup([{data:[{...pending,status}]}]);
    const response=await handler.POST(request());
    assert.equal(response.status,status==='paid'?200:409);
    assert.equal(created.length,0);
  }
});
test('hosted preview origin wins over production and untrusted request origin', () => {
  const keys=['CONTEXT','DEPLOY_PRIME_URL','NEXT_PUBLIC_SITE_URL'];
  const old=Object.fromEntries(keys.map(k=>[k,process.env[k]]));
  try {
    process.env.CONTEXT='deploy-preview';
    process.env.DEPLOY_PRIME_URL='https://preview.example';
    process.env.NEXT_PUBLIC_SITE_URL='https://ringvault.co';
    const {siteOrigin}=load('lib/stripe.ts',{'stripe':class Stripe {}});
    assert.equal(siteOrigin('https://untrusted.example'),'https://preview.example');
    process.env.CONTEXT='production';
    assert.equal(siteOrigin('https://untrusted.example'),'https://ringvault.co');
  } finally {
    for (const k of keys) if(old[k]===undefined) delete process.env[k]; else process.env[k]=old[k];
  }
});
