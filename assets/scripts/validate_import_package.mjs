// Read-only package validator. Node 24, built-in modules only.
import { readFile, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve, dirname } from 'node:path';
import assert from 'node:assert/strict';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const fetchJSON = async (name) => JSON.parse(await readFile(resolve(root, name), 'utf8'));
const data = await fetchJSON('catalog_staging.json');
const assetFile = await fetchJSON('asset_manifest.json');
const aliases = await fetchJSON('id_aliases.json');
const items = data.items;
const assets = assetFile.assets;
const topics = new Set(['Physics','Mathematics','Computing','Biology','Psychology','Philosophy','Sociology']);
const kinds = new Set(['Chapter','Interactive','Article','Course','Video','Book']);
const expected = { Physics:11, Mathematics:10, Computing:14, Biology:7, Psychology:6, Philosophy:8, Sociology:4 };
assert.equal(items.length,60,'Expected exactly 60 consolidated staging items');
assert.equal(assets.length,60,'Expected one proposed cover per item');
const byId = new Map();const byUrl = new Set();const artById = new Map(assets.map(v=>[v.id,v]));
assert.equal(artById.size,60,'Cover IDs must be unique');
const counts = {};
for (const item of items) {
  assert.match(item.id,/^[a-z][a-z0-9-]{0,47}$/);
  assert.ok(!byId.has(item.id),'Duplicate ID '+item.id); byId.set(item.id,item);
  assert.ok(topics.has(item.topic),'Unknown subject for '+item.id); counts[item.topic]=(counts[item.topic]||0)+1;
  assert.ok(kinds.has(item.kind),'Unknown kind '+item.kind);
  assert.ok(item.url.startsWith('https://') && !byUrl.has(item.url),'Invalid/duplicate canonical URL for '+item.id);byUrl.add(item.url);
  for (const key of ['title','source','publisher','description','note']) assert.ok(typeof item[key]==='string' && item[key].trim().length>0,key+' missing for '+item.id);
  assert.ok(item.description.length<=1000 && item.title.length<=240 && item.note.length<=200,'Field limit for '+item.id);
  assert.ok(['existing_reviewed','pending_owner_publish_review'].includes(item.status),'Unrecognized approval state');
  assert.ok(Array.isArray(item.secondary_subjects) && item.secondary_subjects.length<=2,'Invalid secondary subject count');
  assert.ok(item.secondary_subjects.every(t=>topics.has(t)&&t!==item.topic),'Invalid secondary subject');
  const a=artById.get(item.id); assert.ok(a,'Missing art manifest '+item.id);
  assert.equal(item.cover.asset_path,a.relative_webp);
  assert.equal(item.cover.storage_key,a.storage_key);
  assert.equal(a.width,1200);assert.equal(a.height,800);
  assert.ok(a.alt && a.alt.length>=25 && a.alt.length<=300,'Missing meaningful alt '+item.id);
  assert.equal(a.asset_status,'pending_visual_and_scientific_review');
  const webp=resolve(root,a.relative_webp);
  assert.ok(webp.startsWith(root+'/assets/'),'Invalid asset path');
  assert.ok((await stat(webp)).size>1000,'Empty/fake cover '+item.id);
  const hdr=await readFile(webp);assert.equal(hdr.toString('latin1',0,4),'RIFF');assert.equal(hdr.toString('latin1',8,12),'WEBP');
  assert.ok((await stat(resolve(root,a.source_master))).size>1000,'Missing source master '+item.id);
}
assert.deepEqual(counts,expected);
assert.equal(items.filter(x=>x.status==='existing_reviewed').length,4);
assert.equal(items.filter(x=>x.status==='pending_owner_publish_review').length,56);
assert.equal(items.filter(x=>x.kind==='Video').length,1);
assert.equal(items.filter(x=>x.kind==='Book').length,1);
for (const a of aliases) {
  assert.ok(byId.has(a.canonical_id));assert.ok(!byId.has(a.old_run_id));
}
console.log('PASS: 60 unique staging records, seven approved primary subjects, six formats, 4 existing + 56 unpublished drafts, 60 distinct local WebP covers and source masters, valid metadata and alias map.');
console.log('NOTE: This does not verify content rights, factual accuracy, visual QA, CDN upload or production database compatibility.');
