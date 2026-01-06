const LeadTransformerService = require('../../../../../src/core/services/extraction/LeadTransformerService');

describe('LeadTransformerService', () => {
    let service;
    const campaignId = 'test-campaign-id';

    beforeEach(() => {
        service = new LeadTransformerService();
    });

    describe('LinkedIn Normalization (HarvestAPI)', () => {
        it('should correctly normalize LinkedIn profile data', () => {
            const rawData = [
                {
                    fullName: 'John Doe',
                    jobTitle: 'CMO',
                    companyName: 'TechCorp',
                    linkedinUrl: 'https://linkedin.com/in/johndoe',
                    phoneNumber: '11999991234',
                    email: 'john@techcorp.com',
                    location: 'São Paulo'
                }
            ];

            const result = service.normalizeFromLinkedIn(rawData, campaignId);

            expect(result[0]).toMatchObject({
                source: 'linkedin',
                name: 'John Doe',
                company: 'TechCorp',
                title: 'CMO',
                phone: '+5511999991234',
                email: 'john@techcorp.com',
                linkedin_url: 'https://linkedin.com/in/johndoe'
            });
        });

        it('should capitalize names correctly', () => {
            const rawData = [
                {
                    fullName: 'MARIO SILVA',
                    jobTitle: 'Dev',
                    linkedinUrl: 'https://linkedin.com/in/mariosilva'
                }
            ];
            const result = service.normalizeFromLinkedIn(rawData, campaignId);
            expect(result[0].name).toBe('Mario Silva');
        });
    });

    describe('Maps Normalization (Lukáš Křivka)', () => {
        it('should correctly normalize Google Maps business data', () => {
            const rawData = [
                {
                    title: 'Padaria Central',
                    category: 'Bakery',
                    phone: '11 4444-5555',
                    website: 'https://padariacentral.com',
                    emails: ['contato@padariacentral.com'],
                    address: 'Rua Direita, 123'
                }
            ];

            const result = service.normalizeFromMaps(rawData, campaignId);

            expect(result[0]).toMatchObject({
                source: 'maps',
                name: 'Padaria Central',
                company: 'Padaria Central',
                title: 'Bakery',
                phone: '+551144445555',
                email: 'contato@padariacentral.com',
                website: 'https://padariacentral.com'
            });
        });
    });

    describe('Deduplication', () => {
        it('should identify and remove duplicate leads by phone', () => {
            const leads = [
                { phone: '+5511999991111', website: 'site1.com', name: 'Lead 1' },
                { phone: '+5511999991111', website: 'site3.com', name: 'Lead 3' }
            ];

            const result = service.deduplicate(leads);

            expect(result.unique.length).toBe(1);
            expect(result.duplicates.length).toBe(1);
        });

        it('should identify and remove duplicate leads by website', () => {
            const leads = [
                { phone: '+5511999991111', website: 'site1.com', name: 'Lead 1' },
                { phone: '+5511999992222', website: 'site1.com', name: 'Lead 2' }
            ];

            const result = service.deduplicate(leads);

            expect(result.unique.length).toBe(1);
        });

        it('should filter against existing set', () => {
            const leads = [
                { phone: '+5511999991111', name: 'Lead 1' }
            ];
            const existing = new Set(['+5511999991111']);
            const result = service.deduplicate(leads, existing);

            expect(result.unique.length).toBe(0);
            expect(result.duplicates.length).toBe(1);
        });
    });

    describe('Utility Methods', () => {
        it('should normalize different phone formats to E.164', () => {
            expect(service.normalizePhone('11999998888')).toBe('+5511999998888');
            expect(service.normalizePhone('+55 (11) 99999-7777')).toBe('+5511999997777');
            expect(service.normalizePhone('011999996666')).toBe('+5511999996666');
        });

        it('should returning empty string for invalid phones', () => {
            expect(service.normalizePhone('123')).toBe('');
            expect(service.normalizePhone(null)).toBe('');
        });
    });
});
