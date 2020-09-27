import { join } from 'path';
import { makeBinjumperSync } from 'binjumper';
import { spawnSync } from 'child_process';

makeBinjumperSync({
	dir: join(__dirname, 'tmp'),
	name: 'myscript',
	target: process.execPath,
	args: [join(__dirname, 'testscript.js'), 'foo', 'bar', 'baz'],
});

process.env.PATH = `${join(__dirname, 'tmp')};${process.env.PATH}`;

console.log(spawnSync('myscript', ['myarg1']).stdout.toString());
