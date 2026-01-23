import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface PDFExportOptions {
    title: string;
    analysisType: string;
    results: any;
    columns?: string[];
    filename?: string;
    chartImages?: string[]; // New: Array of base64 images
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
        if (!results) {
            throw new Error('Không có dữ liệu để xuất PDF');
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

        const addHeader = (doc: jsPDF, showTitle = false) => {
            const pageWidth = doc.internal.pageSize.width;
            const pageHeight = doc.internal.pageSize.height;

            // --- HEADER ---
            // Logo/Brand Name
            doc.setFontSize(24);
            doc.setTextColor(41, 128, 185); // Blue color
            doc.setFont('helvetica', 'bold');
            doc.text('NCS STAT', pageWidth - 15, 20, { align: 'right' });

            // Sub-branding info
            doc.setFontSize(9);
            doc.setTextColor(100);
            doc.setFont('helvetica', 'normal');
            doc.text('https://ncsstat.com', pageWidth - 15, 26, { align: 'right' });
            doc.text('Powered by NCS Stat Library', pageWidth - 15, 31, { align: 'right' });

            // Timestamp
            doc.setFontSize(8);
            doc.setTextColor(150);
            doc.text(`Exported: ${new Date().toLocaleString('vi-VN')}`, pageWidth - 15, 36, { align: 'right' });

            // Branding Line
            doc.setDrawColor(200);
            doc.line(15, 40, pageWidth - 15, 40);

            // Analysis Title (Only if requested, usually first page of section)
            if (showTitle) {
                doc.setFont('NotoSans', 'bold');
                doc.setFontSize(16);
                doc.setTextColor(40);
                doc.text(title, 15, 30, { maxWidth: pageWidth - 80 });
            }

            // --- FOOTER ---
            const pageCount = doc.getCurrentPageInfo().pageNumber;
            doc.setFontSize(8);
            doc.setTextColor(150);
            doc.text(`Page ${pageCount}`, pageWidth / 2, pageHeight - 10, { align: 'center' });

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

            let evalText = alpha >= 0.9 ? 'Xuất sắc' : alpha >= 0.7 ? 'Chấp nhận được' : 'Kém';
            doc.text(`Đánh giá: ${evalText}`, 15, yPos);
            yPos += 10;

            if (results.itemTotalStats && Array.isArray(results.itemTotalStats) && results.itemTotalStats.length > 0) {
                checkPageBreak(50);
                doc.text('Thống kê Item-Total:', 15, yPos);
                yPos += 5;

                const headers = [['Biến', 'Scale Mean if Deleted', 'Corrected Item-Total Cor.', 'Alpha if Deleted']];
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
                yPos = (doc as any).lastAutoTable.finalY + 15;
            }
        }
        else if (analysisType === 'ttest-indep' || analysisType === 'ttest') {
            doc.text('Independent Samples T-Test:', 15, yPos);
            yPos += 10;

            const headers1 = [['Nhóm', 'Mean', 'N (Sample)']];
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
                const varMsg = results.varTestP < 0.05 ? "Phương sai không đồng nhất" : "Phương sai đồng nhất";
                doc.text(`* Kiểm định Levene: p = ${results.varTestP.toFixed(3)} (${varMsg})`, 15, yPos);
                yPos += 15;
                doc.setFontSize(10);
            }
        }
        else if (analysisType === 'ttest-paired') {
            doc.text('Paired Samples T-Test:', 15, yPos);
            yPos += 10;

            const headers1 = [['Thời điểm', 'Mean']];
            const data1 = [
                [`Trước (${columns[0] || 'V1'})`, results.meanBefore.toFixed(2)],
                [`Sau (${columns[1] || 'V2'})`, results.meanAfter.toFixed(2)]
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
                doc.text('Trung bình các nhóm (Group Means):', 15, yPos);
                yPos += 5;
                const hMeans = [['Nhóm', 'Mean']];
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
            doc.text(`Phương trình: ${equation}`, 15, yPos, { maxWidth: 180 });
            yPos += 15;

            checkPageBreak();
            doc.text(`R Square: ${modelFit.rSquared.toFixed(3)} | Adj R Square: ${modelFit.adjRSquared.toFixed(3)}`, 15, yPos);
            yPos += 7;
            doc.text(`F: ${modelFit.fStatistic.toFixed(2)} | Sig: ${modelFit.pValue < 0.001 ? '< .001' : modelFit.pValue.toFixed(3)}`, 15, yPos);
            yPos += 10;

            const headers = [['Biến', 'B', 'Std. Error', 't', 'Sig.', 'VIF']];
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
                const headers = [['Biến', ...Array(results.loadings[0].length).fill(0).map((_, i) => `F${i + 1}`)]];
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
                doc.text('Chỉ số độ phù hợp mô hình (Model Fit):', 15, yPos);
                yPos += 5;

                const fitHeaders = [['Chỉ số', 'Giá trị']];
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
                doc.text('Ước lượng tham số (CFA/SEM Estimates):', 15, yPos);
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
            doc.text('Thống kê miêu tả (Descriptive Statistics):', 15, yPos);
            yPos += 10;

            const headers = [['Biến', 'Mean', 'SD', 'Min', 'Max', 'Skew', 'Kurtosis']];
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
            doc.text('Ma trận tương quan (Pearson Correlation):', 15, yPos);
            yPos += 10;
            const colHeaders = ['Biến', ...(columns.length > 0 ? columns : Array(results.correlationMatrix.length).fill(0).map((_, i) => `V${i + 1}`))];
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
                styles: { fontSize: 8, font: 'NotoSans' }
            });
            yPos = (doc as any).lastAutoTable.finalY + 15;
            doc.setFontSize(8);
            doc.text('* p < 0.05, ** p < 0.01', 15, yPos);
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
            doc.text('Biểu đồ trực quan (Charts)', 15, yPos);
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
        doc.setFont("times", "italic"); // Use standard font for citation if possible, or fallback
        doc.setTextColor(80);

        const citation1 = "Dữ liệu được phân tích bằng ngôn ngữ lập trình R (R Core Team, 2023) thông qua nền tảng ncsStat (Le, 2026). Các phân tích độ tin cậy và nhân tố được thực hiện bằng các package psych (Revelle, 2023) và lavaan (Rosseel, 2012).";
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
            addHeader(doc, i === 1);
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
