export type TestResult = {
    analysisId: string;
    status: 'pending' | 'running' | 'success' | 'error';
    duration?: number;
    result?: any;
    error?: string;
};

export function generateCsv(results: TestResult[]): string {
    const header = ['analysisId', 'status', 'duration', 'result'];
    const rows = results.map(r => {
        const resultStr = typeof r.result === 'object' ? JSON.stringify(r.result) : String(r.result);
        return [r.analysisId, r.status, r.duration ?? '', resultStr];
    });
    const csvLines = [header.join(','), ...rows.map(row => row.join(','))];
    return csvLines.join('\n');
}

export function generateJson(results: TestResult[]): string {
    return JSON.stringify(results, null, 2);
}

export async function generatePdf(results: TestResult[]): Promise<Blob> {
    const { jsPDF } = await import('jspdf');
    const autoTable = (await import('jspdf-autotable')).default;

    const doc = new jsPDF();

    // Title
    doc.setFontSize(18);
    doc.text('ncsStat Auto-Test Report', 14, 22);

    // Timestamp
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 30);

    // Summary stats
    const passed = results.filter(r => r.status === 'success').length;
    const failed = results.filter(r => r.status === 'error').length;
    const total = results.length;
    doc.text(`Summary: ${passed}/${total} passed, ${failed} failed`, 14, 38);

    // Table data
    const tableData = results.map(r => [
        r.analysisId,
        r.status,
        r.duration ? `${r.duration}ms` : '-',
        r.error || (r.status === 'success' ? '✓' : '-')
    ]);

    autoTable(doc, {
        startY: 45,
        head: [['Analysis', 'Status', 'Duration', 'Notes']],
        body: tableData,
        styles: { fontSize: 9, cellPadding: 3 },
        headStyles: { fillColor: [59, 130, 246] },
        alternateRowStyles: { fillColor: [245, 245, 245] }
    });

    return doc.output('blob');
}
