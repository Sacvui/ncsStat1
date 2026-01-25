import { test, expect } from '@jest/globals';
import { generateCsv, generateJson } from '@/components/admin/exportUtils';

test('generateCsv produces correct CSV format', () => {
    const results = [
        { analysisId: 'descriptive', status: 'success', duration: 1234, result: { mean: 5 } },
        { analysisId: 'cronbach', status: 'error', duration: 567, error: 'Failed' },
    ];
    const csv = generateCsv(results as any);
    // Header line
    expect(csv.split('\n')[0]).toBe('analysisId,status,duration,result');
    // First data line should contain JSON string for result object
    const firstLine = csv.split('\n')[1];
    expect(firstLine).toContain('descriptive');
    expect(firstLine).toContain('success');
    expect(firstLine).toContain('1234');
    expect(firstLine).toContain('{"mean":5}');
});

test('generateJson produces pretty JSON', () => {
    const results = [{ analysisId: 'test', status: 'success' }];
    const json = generateJson(results as any);
    expect(json).toBe(JSON.stringify(results, null, 2));
});
