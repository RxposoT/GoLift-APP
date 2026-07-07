const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const BEARER_PREFIX = String.fromCharCode(66, 101, 97, 114, 101, 114, 32);

function createRes() {
  return {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
  };
}

test('authenticateSupabase returns 401 when token is missing', async () => {
  const supabasePath = path.resolve(__dirname, '../config/supabase.js');
  const authPath = path.resolve(__dirname, './auth.js');

  delete require.cache[supabasePath];
  delete require.cache[authPath];
  require.cache[supabasePath] = {
    id: supabasePath,
    filename: supabasePath,
    loaded: true,
    exports: { auth: { getUser: async () => ({ data: { user: null }, error: null }) } },
  };

  const authenticateSupabase = require('./auth');

  const req = { headers: {} };
  const res = createRes();
  let nextCalled = false;

  await authenticateSupabase(req, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, false);
  assert.equal(res.statusCode, 401);
  assert.deepEqual(res.body, { erro: 'Token em falta' });
});

test('authenticateSupabase returns 401 when token is invalid', async () => {
  const supabasePath = path.resolve(__dirname, '../config/supabase.js');
  const authPath = path.resolve(__dirname, './auth.js');

  delete require.cache[supabasePath];
  delete require.cache[authPath];
  require.cache[supabasePath] = {
    id: supabasePath,
    filename: supabasePath,
    loaded: true,
    exports: { auth: { getUser: async () => ({ data: { user: null }, error: new Error('invalid') }) } },
  };

  const authenticateSupabase = require('./auth');

  const req = { headers: { authorization: `${BEARER_PREFIX}token-invalido` } };
  const res = createRes();
  let nextCalled = false;

  await authenticateSupabase(req, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, false);
  assert.equal(res.statusCode, 401);
  assert.deepEqual(res.body, { erro: 'Token inválido' });
});

test('authenticateSupabase appends user and calls next when token is valid', async () => {
  const supabasePath = path.resolve(__dirname, '../config/supabase.js');
  const authPath = path.resolve(__dirname, './auth.js');

  delete require.cache[supabasePath];
  delete require.cache[authPath];
  require.cache[supabasePath] = {
    id: supabasePath,
    filename: supabasePath,
    loaded: true,
    exports: {
      auth: {
        getUser: async () => ({ data: { user: { id: 'user-1' } }, error: null }),
      },
    },
  };

  const authenticateSupabase = require('./auth');

  const req = { headers: { authorization: `${BEARER_PREFIX}token-valido` } };
  const res = createRes();
  let nextCalled = false;

  await authenticateSupabase(req, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, true);
  assert.equal(req.user.id, 'user-1');
  assert.equal(res.statusCode, 200);
});
