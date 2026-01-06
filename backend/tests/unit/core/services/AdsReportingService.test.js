const AdsReportingService = require('../../../../src/core/services/marketing/AdsReportingService');
const crypto = require('crypto');
const axios = require('axios');

jest.mock('axios');

describe('AdsReportingService (CAPI)', () => {
    let reportingService;
    let mockSupabase;

    beforeEach(() => {
        jest.clearAllMocks();
        mockSupabase = {
            from: jest.fn().mockReturnThis(),
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({ data: { email: 'test@example.com' }, error: null })
        };

        // Temporarily set ENV to production-like to force real send attempt (mocked axios)
        process.env.NODE_ENV = 'production';
        process.env.META_CAPI_TOKEN = 'fake_token';
        process.env.META_PIXEL_ID = '123456';

        // Mock Axios Response to avoid crash on access
        axios.post.mockResolvedValue({ data: { fbtrace_id: 'test_trace_id' } });

        reportingService = new AdsReportingService(mockSupabase);
    });

    test('hashPII should return SHA-256 hash', () => {
        const input = 'test@example.com';
        const expected = crypto.createHash('sha256').update(input).digest('hex');
        const result = reportingService.hash(input);
        expect(result).toBe(expected);
    });

    test('reportConversion should send correct payload to Facebook', async () => {
        const leadId = 'lead_123';
        const eventName = 'Purchase';
        const value = 99.90;

        await reportingService.reportConversion(leadId, eventName, value);

        expect(axios.post).toHaveBeenCalledWith(
            expect.stringContaining('123456/events'), // Pixel ID in URL
            expect.objectContaining({
                data: expect.arrayContaining([
                    expect.objectContaining({
                        event_name: 'Purchase',
                        user_data: expect.objectContaining({
                            em: [expect.any(String)] // Hashed Email
                        }),
                        custom_data: expect.objectContaining({
                            value: 99.90,
                            currency: 'BRL'
                        })
                    })
                ])
            })
        );
    });

    test('reportConversion should NOT send if in development/test mode (without override)', async () => {
        process.env.NODE_ENV = 'development';
        // Ensure force_capi is not set
        delete process.env.FORCE_CAPI;

        await reportingService.reportConversion('lead_123', 'Lead');

        // In dev mode (default behavior of service), it should NOT call axios
        // unless FORCE_CAPI is true.
        // wait, I need to check the exact logic in code.
        // Code: if (process.env.NODE_ENV === 'development' && !process.env.FORCE_CAPI) return { status: 'mock_sent' }
        // So axios.post is skipped.

        expect(axios.post).not.toHaveBeenCalled();
    });
});
