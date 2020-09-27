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
	const jumperData = getBinjumper();
	const exeName = join(opts.dir, `${opts.name}.exe`);
	const infoName = join(opts.dir, `${opts.name}.exe.info`);

	const writeFilePromise = promisify(writeFile);
	const mkdirPromise = promisify(mkdir);

	await mkdirPromise(opts.dir, { recursive: true });
	await Promise.all([
		writeFilePromise(exeName, jumperData),
		writeFilePromise(infoName, [opts.target, ...(opts.args || [])].join('\n')),
	]);
}

export function makeBinjumperSync(opts: JumperOptions) {
	const jumperData = getBinjumper();
	const exeName = join(opts.dir, `${opts.name}.exe`);
	const infoName = join(opts.dir, `${opts.name}.exe.info`);

	mkdirSync(opts.dir, { recursive: true });
	writeFileSync(exeName, jumperData);
	writeFileSync(infoName, [opts.target, ...(opts.args || [])].join('\n'));
}
