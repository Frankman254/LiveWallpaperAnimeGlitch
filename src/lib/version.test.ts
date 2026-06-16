import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import {
	APP_VERSION,
	PROJECT_SCHEMA_VERSION,
	SETTINGS_SCHEMA_VERSION,
	STORE_PERSIST_VERSION
} from './version';

const pkg = JSON.parse(
	readFileSync(resolve(__dirname, '../../package.json'), 'utf-8')
) as { version: string };

describe('version consistency', () => {
	it('APP_VERSION matches package.json version', () => {
		expect(APP_VERSION).toBe(pkg.version);
	});

	it('APP_VERSION follows semver(-prerelease) shape', () => {
		expect(APP_VERSION).toMatch(/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/);
	});

	it('schema versions are positive integers', () => {
		for (const v of [PROJECT_SCHEMA_VERSION, SETTINGS_SCHEMA_VERSION]) {
			expect(Number.isInteger(v)).toBe(true);
			expect(v).toBeGreaterThan(0);
		}
	});

	it('STORE_PERSIST_VERSION is a positive integer', () => {
		expect(Number.isInteger(STORE_PERSIST_VERSION)).toBe(true);
		expect(STORE_PERSIST_VERSION).toBeGreaterThan(0);
	});
});
