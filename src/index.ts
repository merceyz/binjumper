import { join } from 'path';
import { writeFile, writeFileSync, mkdir, mkdirSync } from 'fs';
import { promisify } from 'util';
import { getBinjumper } from './binjumper';

export { getBinjumper };

type JumperOptions = {
	/**
	 * The name of the jumper
	 * @example 'node'
	 */
	name: string;

	/**
	 * The location the jumper should be saved in
	 */
	dir: string;

	/**
	 * The path to the executable the jumper should launch
	 * @example 'C:/node/node.exe'
	 */
	target: string;

	/**
	 * Arguments the jumper should always launch the target with
	 */
	args?: string[];
};

export async function makeBinjumper(opts: JumperOptions) {
	const writeFilePromise = promisify(writeFile);
	const mkdirPromise = promisify(mkdir);

	await mkdirPromise(opts.dir, { recursive: true });

	if (process.platform === 'win32') {
		await Promise.all([
			writeFilePromise(join(opts.dir, `${opts.name}.exe`), getBinjumper()),
			writeFilePromise(join(opts.dir, `${opts.name}.exe.info`), [opts.target, ...(opts.args || [])].join('\n')),
		]);
	}

	await writeFilePromise(
		join(opts.dir, opts.name),
		`#!/bin/sh\nexec "${opts.target}" ${(opts.args || [])
			.map((arg) => `'${arg.replace(/'/g, `'"'"'`)}'`)
			.join(' ')} "$@"\n`,
		{ mode: 0o755 }
	);
}

export function makeBinjumperSync(opts: JumperOptions) {
	mkdirSync(opts.dir, { recursive: true });

	if (process.platform === 'win32') {
		writeFileSync(join(opts.dir, `${opts.name}.exe`), getBinjumper());
		writeFileSync(join(opts.dir, `${opts.name}.exe.info`), [opts.target, ...(opts.args || [])].join('\n'));
	}

	writeFileSync(
		join(opts.dir, opts.name),
		`#!/bin/sh\nexec "${opts.target}" ${(opts.args || [])
			.map((arg) => `'${arg.replace(/'/g, `'"'"'`)}'`)
			.join(' ')} "$@"\n`,
		{ mode: 0o755 }
	);
}
