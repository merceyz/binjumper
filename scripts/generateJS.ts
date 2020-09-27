import fs from 'fs';
import path from 'path';
import { gzipSync } from 'zlib';

const rawData = fs.readFileSync(path.join(__dirname, '../output/binjumper.exe'));

fs.writeFileSync(
	path.join(__dirname, '../src/binjumper.ts'),
	`import { gunzipSync } from 'zlib';

let decompressedJumper: Buffer | null = null;
export function getBinjumper() {
  if (!decompressedJumper) {
    decompressedJumper = gunzipSync(
      Buffer.from(
        '${gzipSync(rawData).toString('base64')}',
        'base64'
      )
    );
  }

  return decompressedJumper;
}
`
);
