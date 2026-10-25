import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import openapiTS, { astToString } from 'openapi-typescript';
import { format } from 'prettier';

const schema = new URL(
  '../packages/domain-types/openapi/v1.json',
  import.meta.url,
);
const target = new URL(
  '../packages/domain-types/src/api.generated.ts',
  import.meta.url,
);
const hash = createHash('sha256')
  .update(await readFile(schema))
  .digest('hex');
const generated = await format(
  `// Generated from openapi/v1.json by openapi-typescript. Do not edit.\n// Schema SHA-256: ${hash}\n${astToString(await openapiTS(schema))}`,
  {
    parser: 'typescript',
    ...JSON.parse(
      await readFile(new URL('../.prettierrc.json', import.meta.url), 'utf8'),
    ),
  },
);
if (process.argv.includes('--check')) {
  assert.equal(
    await readFile(target, 'utf8'),
    generated,
    'API types drifted; run pnpm generate:api',
  );
  console.log('OpenAPI generation is current.');
} else {
  await writeFile(target, generated);
  console.log('Generated shared API types.');
}
