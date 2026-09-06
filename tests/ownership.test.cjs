const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

// Exercise the actual route code with isolated database and notification fakes.
// No production accounts, records, email, or payment services are touched.
function load(file, mocks = {}) {
  const source = fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
  const code = ts.transpileModule(source, { compilerOptions: {
    module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022
  }}).outputText;
  const module = { exports: {} };
  new Function('require', 'module', 'exports', code)(
    (name) => { if (name in mocks) return mocks[name]; throw new Error(`Unexpected import: ${name}`); },
    module, module.exports
  );
  return module.exports;
}

const auth = load('lib/requestUser.ts');
function database({ user = { id: 'owner', email: 'owner@example.com' }, authError = null, owned = true, writeError = null } = {}) {
  const calls = [];
  const row = { id: 'design', full_name: 'Test Person', verify_dob_hash: 'one', verify_middle_hash: 'two' };
  const db = {
    calls,
    auth: { getUser: async (token) => { calls.push(['verifyToken', token]); return { data: { user }, error: authError }; } },
    from: (table) => {
      let writing = false;
      const query = {};
      for (const method of ['select', 'eq', 'limit', 'insert', 'update']) {
        query[method] = (...args) => { calls.push([table, method, ...args]); if (['insert', 'update'].includes(method)) writing = true; return query; };
      }
      query.then = (resolve, reject) => Promise.resolve({ data: owned ? [row] : [], error: writing ? writeError : null }).then(resolve, reject);
      return query;
    }
  };
  return db;
}
function route(file, db) {
  return load(file, {
    'next/server': { NextResponse: { json: (body, init) => Response.json(body, init) } },
    '@/lib/supabaseServer': { supabaseServer: () => db },
    '@/lib/requestUser': auth,
    '@/lib/verify': { hashAnswer: (s) => `hash:${s}`, nameKey: (s) => s.toLowerCase() },
    '@/lib/notify': { sendDepositConfirmation: async () => {} }
  });
}
function request(body, token) {
  return new Request('https://ringvault.example/api', { method: 'POST', headers: {
    'Content-Type': 'application/json', ...(token ? { Authorization: token } : {})
  }, body: JSON.stringify(body) });
}
const settings = 'app/api/discoverability/route.ts';
const save = 'app/api/save-design/route.ts';

test('a forged body user ID cannot authorize a privacy change', async () => {
  const db = database();
  const response = await route(settings, db).POST(request({ designId: 'design', userId: 'owner' }));
  assert.equal(response.status, 401);
  assert.equal(db.calls.length, 0);
});
test('invalid bearer credentials fail before any database mutation', async () => {
  const db = database({ user: null, authError: { message: 'expired' } });
  const response = await route(settings, db).POST(request({ designId: 'design' }, 'Bearer expired'));
  assert.equal(response.status, 401);
  assert.deepEqual(db.calls, [['verifyToken', 'expired']]);
});
test('valid token does not grant access to another owner’s design', async () => {
  const db = database({ owned: false });
  const response = await route(settings, db).POST(request({ designId: 'other', userId: 'victim' }, 'Bearer real'));
  assert.equal(response.status, 403);
  assert.ok(db.calls.some(c => c[1] === 'eq' && c[2] === 'user_id' && c[3] === 'owner'));
  assert.ok(!db.calls.some(c => c[1] === 'update'));
});
test('owner can change privacy without overwriting omitted answers', async () => {
  const db = database();
  const response = await route(settings, db).POST(request({ designId: 'design', discoverable: true }, 'Bearer real'));
  assert.equal(response.status, 200);
  assert.deepEqual(db.calls.find(c => c[1] === 'update')[2], { discoverable: true });
});
test('findability cannot be enabled with fewer than two answers', async () => {
  const db = database();
  const response = await route(settings, db).POST(request({ designId: 'design', discoverable: true, dob: '' }, 'Bearer real'));
  assert.equal(response.status, 400);
  assert.ok(!db.calls.some(c => c[1] === 'update'));
});
test('database write failures do not report successful privacy saves', async () => {
  const db = database({ writeError: { message: 'test write failure' } });
  const response = await route(settings, db).POST(request({ designId: 'design', discoverable: false }, 'Bearer real'));
  assert.equal(response.status, 500);
});
test('anonymous save ignores a forged ownership ID', async () => {
  const db = database();
  const response = await route(save, db).POST(request({ email: 'owner@example.com', userId: 'victim', selections: {} }));
  assert.equal(response.status, 200);
  assert.equal(db.calls.find(c => c[1] === 'insert')[2].user_id, undefined);
});
test('signed-in save uses verified ownership and rejects a different email', async () => {
  const db = database();
  const handler = route(save, db);
  const response = await handler.POST(request({ email: 'owner@example.com', userId: 'victim', selections: {} }, 'Bearer real'));
  assert.equal(response.status, 200);
  assert.equal(db.calls.find(c => c[1] === 'insert')[2].user_id, 'owner');
  const mismatch = await handler.POST(request({ email: 'victim@example.com', selections: {} }, 'Bearer real'));
  assert.equal(mismatch.status, 400);
});
