import assert from 'node:assert/strict';
import test from 'node:test';
import { runPasswordClipboard } from '../../scripts/hyperdrive-password.mjs';
import { developmentHost } from '../../scripts/catalog-setup.mjs';

const password = 'a1'.repeat(32);
const connection = `postgresql://polymatik_app:${password}@${developmentHost}/neondb?sslmode=require`;

function fixture(value = connection) {
  const writes = [];
  const messages = [];
  let reads = 0;
  return {
    writes,
    messages,
    get reads() {
      return reads;
    },
    io: {
      readConnection: async () => {
        reads++;
        return value;
      },
      writeClipboard: (value) => {
        writes.push(value);
      },
      report: (message) => {
        messages.push(message);
      },
    },
  };
}

test('copies only the development application password without reporting credentials', async () => {
  const f = fixture();
  assert.equal(await runPasswordClipboard(['copy'], f.io), 0);
  assert.deepEqual(f.writes, [password]);
  assert.equal(f.reads, 1);
  assert.ok(
    f.messages.every(
      (message) => !message.includes(password) && !message.includes(connection),
    ),
  );
});

test('refuses owner credentials, another database target and invalid actions before clipboard mutation', async () => {
  for (const value of [
    connection.replace('polymatik_app', 'neondb_owner'),
    connection.replace(developmentHost, 'production.example'),
    'malformed credential',
  ]) {
    const f = fixture(value);
    assert.equal(await runPasswordClipboard(['copy'], f.io), 1);
    assert.deepEqual(f.writes, []);
    assert.ok(!f.messages.join().includes(value));
  }
  for (const args of [[], ['copy', 'unexpected'], ['print']]) {
    const f = fixture();
    assert.equal(await runPasswordClipboard(args, f.io), 1);
    assert.equal(f.reads, 0);
    assert.deepEqual(f.writes, []);
  }
});

test('clipboard clearing never reads credentials; system failures do not disclose them', async () => {
  const f = fixture();
  assert.equal(await runPasswordClipboard(['clear'], f.io), 0);
  assert.equal(f.reads, 0);
  assert.deepEqual(f.writes, ['']);
  f.io.writeClipboard = () => {
    throw new Error(connection);
  };
  assert.equal(await runPasswordClipboard(['copy'], f.io), 1);
  assert.ok(!f.messages.join().includes(password));
});
