const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const path = require('node:path');
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
function database(results) {
  const calls = [];
  return { calls, from(table) {
    const q = {};
    for (const method of ['select','update','eq','neq','limit','single','order']) {
      q[method] = (...args) => { calls.push([table,method,...args]); return q; };
    }
    q.then = (resolve,reject) => {
      assert.ok(results.length, 'Unexpected database call');
      return Promise.resolve(results.shift()).then(resolve,reject);
    };
    return q;
  }};
}
function setup(file, results, event) {
  const db = database(results);
  const notifications = [];
  const handler = load(file, {
    'next/server': { NextResponse: { json: (body, init) => Response.json(body, init) } },
    '@/lib/supabaseServer': { supabaseServer: () => db },
    '@/lib/stripe': { stripe: () => ({
      webhooks: { constructEvent: () => event },
      checkout: { sessions: {
        retrieve: async () => ({ payment_status: 'paid', metadata: { unlock_id: 'u1' } }),
        list: async () => ({ data: [{ metadata: { unlock_id: 'u1' } }] })
      }}
    }) },
    '@/lib/notify': {
      sendUnlockDeliverable: async (...args) => notifications.push(args),
      recordEvent: async (...args) => notifications.push(args)
    }
  });
  return { handler, db, notifications };
}
const pending = { data: [{ id:'u1', design_id:'d1', status:'pending', stripe_session_id:'cs_test_fixture' }] };
const request = () => new Request('https://ringvault.example/api?token=fixture');
const webhookRequest = () => new Request('https://ringvault.example/api', { method:'POST', body:'fixture' });
const deliverable = 'app/api/suitor/deliverable/route.ts';
const webhook = 'app/api/stripe/webhook/route.ts';

test('failed payment persistence keeps private content sealed', async () => {
  const {handler,db,notifications} = setup(deliverable, [pending,{ data:null,error:{message:'database unavailable'} }]);
  const res = await handler.GET(request());
  assert.equal(res.status,402);
  assert.equal(notifications.length,0);
  assert.ok(!db.calls.some(c => c[0]==='designs'));
});
test('a concurrent refund winning the update keeps content sealed', async () => {
  const {handler,db} = setup(deliverable,[pending,{data:[]},{data:{status:'refunded'}}]);
  assert.equal((await handler.GET(request())).status,402);
  assert.ok(!db.calls.some(c => c[0]==='designs'));
});
test('a concurrent successful fulfillment can serve the paid brief', async () => {
  const {handler,notifications} = setup(deliverable,[pending,{data:[]},{data:{status:'paid'}},
    {data:[{full_name:'Test Person',selections:{Stone:'Diamond'},note:null,created_at:'2026-09-06'}]}, {data:[]}]);
  const res = await handler.GET(request());
  assert.equal(res.status,200);
  assert.equal((await res.json()).paid,true);
  assert.equal(notifications.length,0);
});
test('the old preview flag cannot bypass payment', async () => {
  const old = process.env.ALLOW_UNPAID_PREVIEW;
  process.env.ALLOW_UNPAID_PREVIEW='true';
  try {
    const {handler} = setup(deliverable,[{data:[{id:'u1',status:'pending',stripe_session_id:null}]}]);
    assert.equal((await handler.GET(request())).status,402);
  } finally {
    if(old===undefined) delete process.env.ALLOW_UNPAID_PREVIEW; else process.env.ALLOW_UNPAID_PREVIEW=old;
  }
});
for (const type of ['checkout.session.completed','charge.refunded']) {
  test(`${type} database failure asks Stripe to retry`, async () => {
    const old=process.env.STRIPE_WEBHOOK_SECRET;
    process.env.STRIPE_WEBHOOK_SECRET='whsec_fixture';
    try {
      const event={type,data:{object:type==='charge.refunded'
        ? {payment_intent:'pi_fixture'}
        : {id:'cs_test_fixture',payment_status:'paid',metadata:{unlock_id:'u1'}}}};
      const {handler}=setup(webhook,[{data:null,error:{message:'database unavailable'}}],event);
      assert.equal((await handler.POST(webhookRequest())).status,500);
    } finally {
      if(old===undefined) delete process.env.STRIPE_WEBHOOK_SECRET; else process.env.STRIPE_WEBHOOK_SECRET=old;
    }
  });
}
