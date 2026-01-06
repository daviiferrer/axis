const CacheService = require('../../../../src/core/services/system/CacheService');

describe('CacheService', () => {
    let cacheService;

    beforeEach(() => {
        cacheService = new CacheService();
    });

    test('lidMapping should store and retrieve data', () => {
        cacheService.setLidMapping('lid_1', 'jid_1');
        expect(cacheService.getLidMapping('lid_1')).toBe('jid_1');
    });

    test('clearLidCache should clear all mappings', () => {
        cacheService.setLidMapping('lid_2', 'jid_2');
        cacheService.clearLidCache();
        expect(cacheService.getLidMapping('lid_2')).toBeUndefined();
    });
});
