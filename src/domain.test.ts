import { Domain } from './domain';

describe('Domain class', () => {
    test('domain property is initialized', () => {
        expect(new Domain('test').domain).toBe('test');
    });
})
