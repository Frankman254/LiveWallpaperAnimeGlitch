import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
	classifyPersistenceFailure,
	clearPersistenceFailure,
	getPersistenceFailureSnapshot,
	reportPersistenceFailure,
	subscribePersistenceFailure
} from './persistenceStatus';

describe('persistenceStatus', () => {
	beforeEach(() => clearPersistenceFailure());

	it('classifies browser quota variants', () => {
		expect(classifyPersistenceFailure({ name: 'QuotaExceededError' })).toBe(
			'quota'
		);
		expect(classifyPersistenceFailure({ code: 1014 })).toBe('quota');
		expect(classifyPersistenceFailure(new Error('disabled'))).toBe(
			'unavailable'
		);
	});

	it('publishes one visible failure until it is dismissed', () => {
		const listener = vi.fn();
		const unsubscribe = subscribePersistenceFailure(listener);

		reportPersistenceFailure('lwag-state', { name: 'QuotaExceededError' });
		const failure = getPersistenceFailureSnapshot();
		expect(failure).toMatchObject({
			storageName: 'lwag-state',
			kind: 'quota'
		});
		reportPersistenceFailure('lwag-state', new Error('repeat'));
		expect(listener).toHaveBeenCalledTimes(1);

		clearPersistenceFailure(failure?.id);
		expect(getPersistenceFailureSnapshot()).toBeNull();
		expect(listener).toHaveBeenCalledTimes(2);
		unsubscribe();
	});
});
