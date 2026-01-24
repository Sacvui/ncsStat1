import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface PDFExportOptions {
    title: string;
    analysisType: string;
    results: any;
    columns?: string[];
    filename?: string;
    chartImages?: string[]; // Array of base64 images
    batchData?: Array<{ title: string; results: any; columns?: string[] }>; // For batch exports (e.g., Cronbach multi-scale)
}

/**
 * Export analysis results to PDF (Text & Table based)
 */
export async function exportToPDF(options: PDFExportOptions): Promise<void> {
    try {
        const {
            title,
            analysisType,
            results,
            columns = [],
            filename = `statviet_${analysisType}_${Date.now()}.pdf`,
            chartImages = []
        } = options;

        // Validate input data
        if (!results && (!options.batchData || options.batchData.length === 0)) {
            throw new Error('No data to export PDF');
        }

        // Helper to load font
        const loadVietnameseFont = async (doc: jsPDF) => {
            try {
                const response = await fetch('/webr/vfs/usr/share/fonts/NotoSans-Regular.ttf');
                if (!response.ok) throw new Error('Failed to load font');
                const buffer = await response.arrayBuffer();
                const binary = Array.from(new Uint8Array(buffer)).map(b => String.fromCharCode(b)).join("");

                doc.addFileToVFS('NotoSans-Regular.ttf', binary);
                doc.addFont('NotoSans-Regular.ttf', 'NotoSans', 'normal');
                doc.setFont('NotoSans');
            } catch (error) {
                console.warn('Could not load Vietnamese font, falling back to standard font:', error);
            }
        };

        const addHeader = (doc: jsPDF, showTitle = false, pageNum?: number, totalPages?: number) => {
            const pageWidth = doc.internal.pageSize.width;
            const pageHeight = doc.internal.pageSize.height;

            // --- PROFESSIONAL HEADER ---
            // Top border line
            doc.setDrawColor(59, 130, 246); // Blue
            doc.setLineWidth(0.5);
            doc.line(15, 12, pageWidth - 15, 12);

            // Report Type Badge
            doc.setFillColor(59, 130, 246);
            doc.roundedRect(15, 14, 45, 8, 1, 1, 'F');
            doc.setFontSize(7);
            doc.setTextColor(255);
            doc.setFont('helvetica', 'bold');
            doc.text('STATISTICAL REPORT', 17, 19);

            // Logo/Brand Name (right side)
            doc.setFontSize(18);
            doc.setTextColor(59, 130, 246);
            doc.setFont('helvetica', 'bold');
            doc.text('ncsStat', pageWidth - 15, 20, { align: 'right' });

            // Subtitle
            doc.setFontSize(7);
            doc.setTextColor(100);
            doc.setFont('helvetica', 'normal');
            doc.text('Statistical Analysis Platform for Vietnamese Researchers', pageWidth - 15, 25, { align: 'right' });

            // Date and timestamp
            const exportDate = new Date().toLocaleDateString('vi-VN', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
            doc.setFontSize(8);
            doc.setTextColor(120);
            doc.text(`Generated: ${exportDate}`, 15, 28);

            // Header separator
            doc.setDrawColor(200);
            doc.setLineWidth(0.3);
            doc.line(15, 32, pageWidth - 15, 32);

            // Analysis Title (On first page only)
            if (showTitle) {
                doc.setFont('NotoSans', 'normal');
                doc.setFontSize(14);
                doc.setTextColor(30);
                const titleLines = doc.splitTextToSize(title, pageWidth - 30);
                doc.text(titleLines, 15, 42);
            }

            // --- PROFESSIONAL FOOTER ---
            // Footer separator
            doc.setDrawColor(200);
            doc.setLineWidth(0.2);
            doc.line(15, pageHeight - 22, pageWidth - 15, pageHeight - 22);

            // Page number
            const currentPage = pageNum || doc.getCurrentPageInfo().pageNumber;
            const total = totalPages || currentPage;
            doc.setFontSize(9);
            doc.setTextColor(80);
            doc.setFont('helvetica', 'normal');
            doc.text(`Page ${currentPage} of ${total}`, pageWidth / 2, pageHeight - 16, { align: 'center' });

            // Footer branding
            doc.setFontSize(7);
            doc.setTextColor(120);
            doc.text('ncsStat - https://ncsstat.com', 15, pageHeight - 12);
            doc.text('© 2026 Le Phuc Hai', pageWidth - 15, pageHeight - 12, { align: 'right' });

            // Citation note (small)
            doc.setFontSize(6);
            doc.setTextColor(150);
            doc.text('For academic use. Cite: Le, P.H. (2026). ncsStat Statistical Platform.', pageWidth / 2, pageHeight - 8, { align: 'center' });

            // Reset font for content
            doc.setFont('NotoSans', 'normal');
            doc.setFontSize(10);
            doc.setTextColor(0);
        };

        const doc = new jsPDF();
        await loadVietnameseFont(doc);

        let yPos = 55; // Start content below header

        // Page break helper
        const checkPageBreak = (height: number = 20) => {
            if (yPos + height > 270) {
                doc.addPage();
                yPos = 50;
            }
        };

        const commonTableOptions = {
            styles: { font: 'NotoSans', fontSize: 10, cellPadding: 4 },
            headStyles: { fillColor: [44, 62, 80] as any, fontStyle: 'bold' as any },
            theme: 'striped' as const,
            margin: { top: 50 },
        };

        // --- CONTENT GENERATION ---

        if (analysisType === 'cronbach') {
            const alpha = results.alpha ?? results.rawAlpha ?? 0;
            doc.setFontSize(12);
            doc.text(`Cronbach's Alpha: ${alpha.toFixed(3)}`, 15, yPos);
            yPos += 7;

            let evalText = alpha >= 0.9 ? 'Excellent' : alpha >= 0.7 ? 'Acceptable' : 'Poor';
            doc.text(`Evaluation: ${evalText}`, 15, yPos);
            yPos += 10;

            if (results.itemTotalStats && Array.isArray(results.itemTotalStats) && results.itemTotalStats.length > 0) {
                checkPageBreak(50);
                doc.text('Item-Total Statistics:', 15, yPos);
                yPos += 5;

                const headers = [['Variable', 'Scale Mean if Deleted', 'Corrected Item-Total Cor.', 'Alpha if Deleted']];
                const data = results.itemTotalStats.map((item: any, idx: number) => [
                    columns[idx] || item.itemName || `Item ${idx + 1}`,
                    (item.scaleMeanIfDeleted ?? 0).toFixed(3),
                    (item.correctedItemTotalCorrelation ?? 0).toFixed(3),
                    (item.alphaIfItemDeleted ?? 0).toFixed(3)
                ]);

                autoTable(doc, {
                    ...commonTableOptions,
                    startY: yPos,
                    head: headers,
                    body: data,
                    headStyles: { fillColor: [41, 128, 185] as any, fontStyle: 'bold' as any }
                });
                yPos = (doc as any).lastAutoTable.finalY + 10;
            }

            // Interpretative Notes
            checkPageBreak(30);
            doc.setFontSize(8);
            doc.setTextColor(100);
            doc.text('Interpretation Guidelines:', 15, yPos);
            yPos += 5;
            doc.text('• α ≥ 0.9: Excellent | α ≥ 0.8: Good | α ≥ 0.7: Acceptable | α ≥ 0.6: Questionable | α < 0.6: Poor', 15, yPos);
            yPos += 4;
            doc.text('• Item-Total Correlation ≥ 0.3 indicates good item discrimination', 15, yPos);
            doc.setTextColor(0);
            doc.setFontSize(10);
            yPos += 10;
        }
        else if (analysisType === 'cronbach-batch') {
            // BATCH CRONBACH - All scales in one PDF
            const batchResults = results.batchResults || [];

            // Summary Table (Using English headers for PDF compatibility)
            doc.setFontSize(14);
            doc.text(`Summary of ${batchResults.length} Scales`, 15, yPos);
            yPos += 10;

            const summaryHeaders = [['Scale Name', 'Items', "Cronbach's Alpha", 'Evaluation']];
            const summaryData = batchResults.map((r: any) => {
                const alpha = r.alpha || r.rawAlpha || 0;
                const evalText = alpha >= 0.9 ? 'Excellent' : alpha >= 0.8 ? 'Good' : alpha >= 0.7 ? 'Acceptable' : alpha >= 0.6 ? 'Questionable' : 'Poor';
                return [r.scaleName, r.nItems || '-', alpha.toFixed(3), evalText];
            });

            autoTable(doc, {
                ...commonTableOptions,
                startY: yPos,
                head: summaryHeaders,
                body: summaryData,
                headStyles: { fillColor: [41, 128, 185] as any, fontStyle: 'bold' as any }
            });
            yPos = (doc as any).lastAutoTable.finalY + 15;

            // Detailed tables for each scale
            for (const r of batchResults) {
                checkPageBreak(80);
                doc.setFontSize(12);
                doc.setFont('NotoSans', 'bold');
                doc.text(`${r.scaleName}`, 15, yPos);
                doc.setFont('NotoSans', 'normal');
                yPos += 7;

                const alpha = r.alpha || r.rawAlpha || 0;
                doc.text(`Alpha: ${alpha.toFixed(3)}`, 15, yPos);
                yPos += 7;

                if (r.itemTotalStats && r.itemTotalStats.length > 0) {
                    const headers = [['Variable', 'Corrected Item-Total', 'Alpha if Deleted']];
                    const data = r.itemTotalStats.map((item: any, idx: number) => [
                        r.columns?.[idx] || item.itemName || `Item ${idx + 1}`,
                        (item.correctedItemTotalCorrelation ?? 0).toFixed(3),
                        (item.alphaIfItemDeleted ?? 0).toFixed(3)
                    ]);

                    autoTable(doc, {
                        ...commonTableOptions,
                        startY: yPos,
                        head: headers,
                        body: data,
                        headStyles: { fillColor: [52, 73, 94] as any, fontStyle: 'bold' as any },
                        styles: { fontSize: 9, font: 'NotoSans' }
                    });
                    yPos = (doc as any).lastAutoTable.finalY + 10;
                }
            }

            // Interpretation guide
            checkPageBreak(30);
            doc.setFontSize(8);
            doc.setTextColor(100);
            doc.text('• α ≥ 0.9: Excellent | α ≥ 0.8: Good | α ≥ 0.7: Acceptable | α ≥ 0.6: Questionable | α < 0.6: Poor', 15, yPos);
            doc.setTextColor(0);
            doc.setFontSize(10);
            yPos += 10;
        }
        else if (analysisType === 'ttest-indep' || analysisType === 'ttest') {
            doc.text('Independent Samples T-Test:', 15, yPos);
            yPos += 10;

            const headers1 = [['Group', 'Mean', 'N (Sample)']];
            const data1 = [
                ['Group 1', results.mean1.toFixed(2), '-'],
                ['Group 2', results.mean2.toFixed(2), '-']
            ];

            autoTable(doc, {
                ...commonTableOptions,
                startY: yPos,
                head: headers1,
                body: data1,
                theme: 'plain',
                tableWidth: 80
            });
            yPos = (doc as any).lastAutoTable.finalY + 10;

            const headers2 = [['t', 'df', 'Sig. (2-tailed)', 'Mean Diff', 'Cohen\'s d']];
            const data2 = [[
                results.t.toFixed(3),
                results.df.toFixed(3),
                results.pValue < 0.001 ? '< .001' : results.pValue.toFixed(3),
                results.meanDiff.toFixed(3),
                results.effectSize.toFixed(3)
            ]];

            autoTable(doc, {
                ...commonTableOptions,
                startY: yPos,
                head: headers2,
                body: data2,
                headStyles: { fillColor: [52, 152, 219] as any, fontStyle: 'bold' as any }
            });
            yPos = (doc as any).lastAutoTable.finalY + 15;

            if (results.varTestP !== undefined) {
                doc.setFontSize(9);
                const varMsg = results.varTestP < 0.05 ? "Violated (Welch t-test used)" : "Assumed Equal Variance";
                doc.text(`* Levene's Test: p = ${results.varTestP.toFixed(3)} (${varMsg})`, 15, yPos);
                yPos += 10;
                doc.setFontSize(10);
            }

            // Interpretative Notes for T-Test
            checkPageBreak(25);
            doc.setFontSize(8);
            doc.setTextColor(100);
            doc.text('Effect Size (Cohen\'s d): |d| < 0.2: Negligible | 0.2-0.5: Small | 0.5-0.8: Medium | > 0.8: Large', 15, yPos);
            doc.setTextColor(0);
            doc.setFontSize(10);
            yPos += 10;
        }
        else if (analysisType === 'ttest-paired') {
            doc.text('Paired Samples T-Test:', 15, yPos);
            yPos += 10;

            const headers1 = [['Time', 'Mean']];
            const data1 = [
                [`Before (${columns[0] || 'V1'})`, results.meanBefore.toFixed(2)],
                [`After (${columns[1] || 'V2'})`, results.meanAfter.toFixed(2)]
            ];
            autoTable(doc, {
                ...commonTableOptions, startY: yPos, head: headers1, body: data1, theme: 'plain', tableWidth: 80
            });
            yPos = (doc as any).lastAutoTable.finalY + 10;

            const headers2 = [['t', 'df', 'Sig. (2-tailed)', 'Mean Diff', 'Cohen\'s d']];
            const data2 = [[
                results.t.toFixed(3),
                results.df.toFixed(0),
                results.pValue < 0.001 ? '< .001' : results.pValue.toFixed(3),
                results.meanDiff.toFixed(3),
                results.effectSize.toFixed(3)
            ]];
            autoTable(doc, {
                ...commonTableOptions, startY: yPos, head: headers2, body: data2,
                headStyles: { fillColor: [52, 152, 219] as any, fontStyle: 'bold' as any }
            });
            yPos = (doc as any).lastAutoTable.finalY + 15;
        }
        else if (analysisType === 'anova') {
            doc.text('One-Way ANOVA:', 15, yPos);
            yPos += 10;

            const headers = [['F', 'df1 (Between)', 'df2 (Within)', 'Sig.', 'Eta Squared']];
            const data = [[
                results.F.toFixed(3),
                results.dfBetween,
                results.dfWithin,
                results.pValue < 0.001 ? '< .001' : results.pValue.toFixed(3),
                results.etaSquared.toFixed(3)
            ]];

            autoTable(doc, {
                ...commonTableOptions,
                startY: yPos,
                head: headers,
                body: data,
                headStyles: { fillColor: [155, 89, 182] as any, fontStyle: 'bold' as any }
            });
            yPos = (doc as any).lastAutoTable.finalY + 15;

            // Group Means
            if (results.groupMeans) {
                checkPageBreak(40);
                doc.text('Group Means:', 15, yPos);
                yPos += 5;
                const hMeans = [['Group', 'Mean']];
                const dMeans = columns.map((col, i) => [col, results.groupMeans[i]?.toFixed(3) || '-']);
                if (results.grandMean) dMeans.push(['Grand Mean', results.grandMean.toFixed(3)]);

                autoTable(doc, { ...commonTableOptions, startY: yPos, head: hMeans, body: dMeans });
                yPos = (doc as any).lastAutoTable.finalY + 15;
            }
        }
        else if (analysisType === 'chisquare') {
            doc.text('Chi-Square Test (Independence):', 15, yPos);
            yPos += 10;

            doc.text(`Chi-Square: ${results.chiSquare.toFixed(3)}`, 15, yPos);
            yPos += 7;
            doc.text(`df: ${results.df}`, 15, yPos);
            yPos += 7;
            doc.text(`p-value: ${results.pValue < 0.001 ? '< .001' : results.pValue.toFixed(3)}`, 15, yPos);
            yPos += 10;

            doc.text(`Cramer\'s V: ${results.cramersV.toFixed(3)}`, 15, yPos);
            yPos += 15;
        }
        else if (analysisType === 'mann-whitney') {
            doc.text('Mann-Whitney U Test:', 15, yPos);
            yPos += 10;

            doc.text(`U Statistic: ${results.uStatistic.toFixed(2)}`, 15, yPos);
            yPos += 7;
            doc.text(`p-value: ${results.pValue < 0.001 ? '< .001' : results.pValue.toFixed(3)}`, 15, yPos);
            yPos += 7;
            if (results.effectSize) {
                doc.text(`Effect Size (r): ${results.effectSize.toFixed(3)}`, 15, yPos);
                yPos += 15;
            }
        }
        else if (analysisType === 'regression') {
            const { modelFit, coefficients, equation } = results;

            doc.setFontSize(10);
            doc.text(`Equation: ${equation}`, 15, yPos, { maxWidth: 180 });
            yPos += 15;

            checkPageBreak();
            doc.text(`R Square: ${modelFit.rSquared.toFixed(3)} | Adj R Square: ${modelFit.adjRSquared.toFixed(3)}`, 15, yPos);
            yPos += 7;
            doc.text(`F: ${modelFit.fStatistic.toFixed(2)} | Sig: ${modelFit.pValue < 0.001 ? '< .001' : modelFit.pValue.toFixed(3)}`, 15, yPos);
            yPos += 10;

            const headers = [['Variable', 'B', 'Std. Error', 't', 'Sig.', 'VIF']];
            const data = coefficients.map((c: any) => [
                c.term,
                c.estimate.toFixed(3),
                c.stdError.toFixed(3),
                c.tValue.toFixed(3),
                c.pValue < 0.001 ? '< .001' : c.pValue.toFixed(3),
                c.vif ? c.vif.toFixed(3) : '-'
            ]);

            autoTable(doc, {
                ...commonTableOptions,
                startY: yPos,
                head: headers,
                body: data,
                headStyles: { fillColor: [50, 50, 50] as any, fontStyle: 'bold' as any }
            });
            yPos = (doc as any).lastAutoTable.finalY + 15;
        }
        else if (analysisType === 'efa') {
            doc.text(`KMO: ${results.kmo.toFixed(3)}`, 15, yPos);
            yPos += 7;
            doc.text(`Bartlett Sig: ${results.bartlettP < 0.001 ? '< .001' : results.bartlettP.toFixed(3)}`, 15, yPos);
            yPos += 10;

            if (results.eigenvalues) {
                const evInfo = results.eigenvalues.slice(0, 8).map((e: number, i: number) => `F${i + 1}: ${e.toFixed(2)}`).join(', ');
                doc.text(`Eigenvalues: ${evInfo}...`, 15, yPos);
                yPos += 10;
            }

            if (results.loadings) {
                const headers = [['Variable', ...Array(results.loadings[0].length).fill(0).map((_, i) => `Factor ${i + 1}`)]];
                const data = results.loadings.map((row: number[], i: number) => {
                    return [`Var ${i + 1} (${columns[i] || ''})`, ...row.map(v => v.toFixed(3))];
                });

                autoTable(doc, {
                    ...commonTableOptions,
                    startY: yPos,
                    head: headers,
                    body: data
                });
                yPos = (doc as any).lastAutoTable.finalY + 15;
            }
        }
        else if (analysisType === 'cfa' || analysisType === 'sem') {
            const { fitMeasures, estimates } = results;

            if (fitMeasures) {
                checkPageBreak();
                doc.text('Model Fit Indices:', 15, yPos);
                yPos += 5;

                const fitHeaders = [['Index', 'Value']];
                const fitOrder = ['chisq', 'df', 'pvalue', 'cfi', 'tli', 'rmsea', 'srmr'];
                const fitLabels: any = { chisq: 'Chi-square', df: 'df', pvalue: 'P-value', cfi: 'CFI', tli: 'TLI', rmsea: 'RMSEA', srmr: 'SRMR' };

                const fitData = fitOrder.map(key => [fitLabels[key], fitMeasures[key]?.toFixed(3) || '-']);

                autoTable(doc, {
                    ...commonTableOptions,
                    startY: yPos,
                    head: fitHeaders,
                    body: fitData,
                    theme: 'plain',
                    tableWidth: 80
                });
                yPos = (doc as any).lastAutoTable.finalY + 15;
            }

            if (estimates) {
                checkPageBreak();
                doc.text('Parameter Estimates:', 15, yPos);
                yPos += 5;

                const estHeaders = [['LHS', 'Op', 'RHS', 'Est', 'Std.Err', 'z', 'P(>|z|)', 'Std.All']];
                const estData = estimates.map((e: any) => [
                    e.lhs,
                    e.op,
                    e.rhs,
                    e.est.toFixed(3),
                    e.se.toFixed(3),
                    e.z.toFixed(3),
                    e.pvalue < 0.001 ? '< .001' : e.pvalue.toFixed(3),
                    e.std_all.toFixed(3)
                ]);

                autoTable(doc, {
                    ...commonTableOptions,
                    startY: yPos,
                    head: estHeaders,
                    body: estData,
                    headStyles: { fillColor: [100, 100, 100] as any, fontStyle: 'bold' as any },
                    styles: { fontSize: 8, font: 'NotoSans' }
                });
                yPos = (doc as any).lastAutoTable.finalY + 15;
            }
        }
        else if (analysisType === 'descriptive') {
            doc.setFontSize(14);
            doc.text('Descriptive Statistics:', 15, yPos);
            yPos += 10;

            const headers = [['Variable', 'Mean', 'SD', 'Min', 'Max', 'Skew', 'Kurtosis']];
            if (results.mean && results.mean.length > 0) {
                const data = results.mean.map((_: any, i: number) => [
                    columns[i] || `Var ${i + 1}`,
                    (results.mean[i] ?? 0).toFixed(2),
                    (results.sd[i] ?? 0).toFixed(2),
                    (results.min[i] ?? 0).toFixed(2),
                    (results.max[i] ?? 0).toFixed(2),
                    (results.skew[i] ?? 0).toFixed(2),
                    (results.kurtosis[i] ?? 0).toFixed(2)
                ]);

                autoTable(doc, {
                    ...commonTableOptions,
                    startY: yPos,
                    head: headers,
                    body: data,
                    headStyles: { fillColor: [44, 62, 80] as any, fontStyle: 'bold' as any }
                });
                yPos = (doc as any).lastAutoTable.finalY + 15;
            }
        }
        else if (analysisType === 'correlation') {
            doc.text('Correlation Matrix (Pearson):', 15, yPos);
            yPos += 10;
            const colHeaders = ['Variable', ...(columns.length > 0 ? columns : Array(results.correlationMatrix.length).fill(0).map((_, i) => `V${i + 1}`))];
            const data = results.correlationMatrix.map((row: number[], i: number) => [
                columns[i] || `V${i + 1}`,
                ...row.map((val: number, j: number) => {
                    const p = results.pValues[i][j];
                    const sig = p < 0.01 ? '**' : p < 0.05 ? '*' : '';
                    return val.toFixed(2) + sig;
                })
            ]);

            autoTable(doc, {
                ...commonTableOptions,
                startY: yPos,
                head: [colHeaders],
                body: data,
                headStyles: { fillColor: [44, 62, 80] as any, fontStyle: 'bold' as any },
                styles: { fontSize: 8, font: 'NotoSans' },
                // Heatmap coloring for correlation matrix
                didParseCell: (hookData: any) => {
                    if (hookData.section === 'body' && hookData.column.index > 0) {
                        const cellText = hookData.cell.text[0] || '';
                        const numericValue = parseFloat(cellText.replace(/\*+/g, ''));
                        if (!isNaN(numericValue)) {
                            const absVal = Math.abs(numericValue);
                            const opacity = Math.min(absVal * 0.8, 0.8); // Scale opacity
                            if (numericValue > 0) {
                                // Blue for positive correlations
                                hookData.cell.styles.fillColor = [66, 133, 244, opacity * 255];
                            } else if (numericValue < 0) {
                                // Red for negative correlations
                                hookData.cell.styles.fillColor = [234, 67, 53, opacity * 255];
                            }
                            // Diagonal (1.0) - light gray
                            if (absVal > 0.99) {
                                hookData.cell.styles.fillColor = [200, 200, 200];
                            }
                        }
                    }
                }
            });
            yPos = (doc as any).lastAutoTable.finalY + 10;
            doc.setFontSize(8);
            doc.text('* p < 0.05, ** p < 0.01 | Color: Blue = Positive, Red = Negative (intensity = strength)', 15, yPos);
            yPos += 10;
        }
        else if (results && typeof results === 'object') {
            const keys = Object.keys(results).filter(k => typeof results[k] === 'number' || typeof results[k] === 'string');
            const data = keys.map(k => [k, String(results[k])]);
            if (data.length > 0) {
                autoTable(doc, {
                    ...commonTableOptions,
                    startY: yPos,
                    head: [['Metric', 'Value']],
                    body: data
                });
            }
        }

        // --- CHARTS RENDER ---
        if (chartImages.length > 0) {
            checkPageBreak(100);
            doc.addPage();
            yPos = 50;

            doc.setFontSize(14);
            doc.setFont('NotoSans', 'bold');
            doc.text('Visual Charts', 15, yPos);
            yPos += 15;

            for (const imgData of chartImages) {
                const imgWidth = 180;
                const imgHeight = 90; // Approx 2:1 aspect ratio

                checkPageBreak(imgHeight + 20);

                try {
                    doc.addImage(imgData, 'PNG', 15, yPos, imgWidth, imgHeight);
                    yPos += imgHeight + 15;
                } catch (e) {
                    console.warn("Could not add image", e);
                }
            }
        }

        // --- CITATION FOOTER (Robust) ---
        checkPageBreak(50);
        yPos += 15;
        doc.setDrawColor(200);
        doc.line(15, yPos, 196, yPos);
        yPos += 10;

        doc.setFontSize(9);
        doc.setFont("times", "italic");
        doc.setTextColor(80);

        const citation1 = "Data analyzed using R (R Core Team, 2023) via ncsStat platform (Le, 2026). Reliability and factor analyses performed using psych (Revelle, 2023) and lavaan (Rosseel, 2012) packages.";
        const citation2 = "Le, P. H. (2026). ncsStat: A Web-Based Statistical Analysis Platform for Psychometric Analysis. Available at https://ncsstat.ncskit.org";

        // Split text to fit width
        const splitText1 = doc.splitTextToSize(citation1, 180);
        doc.text(splitText1, 15, yPos);
        yPos += doc.getTextDimensions(splitText1).h + 5;

        const splitText2 = doc.splitTextToSize(citation2, 180);
        doc.text(splitText2, 15, yPos);


        // --- FINAL POST-PROCESSING: APPLY HEADER TO ALL PAGES ---
        const totalPages = doc.getNumberOfPages();
        for (let i = 1; i <= totalPages; i++) {
            doc.setPage(i);
            addHeader(doc, i === 1, i, totalPages);
        }

        doc.save(filename);
    } catch (error) {
        console.error("PDF Export Error:", error);
    }
}

// Deprecated html2canvas method
export async function exportWithCharts(elementId: string, filename: string): Promise<void> {
    console.warn("Screenshot export is disabled due to compatibility issues. Please use Text Export.");
}
