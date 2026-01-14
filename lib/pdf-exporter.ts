import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export interface PDFExportOptions {
    title: string;
    analysisType: string;
    results: any;
    columns?: string[];
    filename?: string;
}

/**
 * Export analysis results to PDF
 */
export async function exportToPDF(options: PDFExportOptions): Promise<void> {
    const {
        title,
        analysisType,
        results,
        columns = [],
        filename = `statviet_${analysisType}_${Date.now()}.pdf`
    } = options;

    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    let yPosition = 20;

    // Header
    pdf.setFontSize(20);
    pdf.setFont('helvetica', 'bold');
    pdf.text('StatViet - Báo Cáo Phân Tích', pageWidth / 2, yPosition, { align: 'center' });

    yPosition += 10;
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    pdf.text(new Date().toLocaleDateString('vi-VN'), pageWidth / 2, yPosition, { align: 'center' });

    yPosition += 15;

    // Title
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text(title, 20, yPosition);
    yPosition += 10;

    // Analysis Type
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    const analysisTypeMap: Record<string, string> = {
        'cronbach': "Cronbach's Alpha",
        'correlation': 'Ma Trận Tương Quan',
        'descriptive': 'Thống Kê Mô Tả',
    };
    pdf.text(`Phương pháp: ${analysisTypeMap[analysisType] || analysisType}`, 20, yPosition);
    yPosition += 15;

    // Results based on analysis type
    if (analysisType === 'cronbach') {
        const alpha = results.alpha || results.rawAlpha || 0;

        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Kết Quả:', 20, yPosition);
        yPosition += 8;

        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'normal');
        pdf.text(`Cronbach's Alpha: ${alpha.toFixed(3)}`, 30, yPosition);
        yPosition += 8;

        // Interpretation
        let interpretation = '';
        if (alpha >= 0.9) interpretation = 'Xuất sắc - Độ tin cậy rất cao';
        else if (alpha >= 0.8) interpretation = 'Tốt - Độ tin cậy cao';
        else if (alpha >= 0.7) interpretation = 'Chấp nhận được';
        else if (alpha >= 0.6) interpretation = 'Khá - Cần cải thiện';
        else interpretation = 'Kém - Không chấp nhận được';

        pdf.text(`Đánh giá: ${interpretation}`, 30, yPosition);
        yPosition += 15;

        // Recommendation
        pdf.setFont('helvetica', 'bold');
        pdf.text('Khuyến nghị:', 20, yPosition);
        yPosition += 8;

        pdf.setFont('helvetica', 'normal');
        const recommendation = alpha >= 0.7
            ? 'Thang đo có độ tin cậy tốt, có thể sử dụng cho nghiên cứu.'
            : 'Nên xem xét loại bỏ một số item hoặc điều chỉnh thang đo để cải thiện độ tin cậy.';

        const splitRecommendation = pdf.splitTextToSize(recommendation, pageWidth - 40);
        pdf.text(splitRecommendation, 30, yPosition);

    } else if (analysisType === 'descriptive') {
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Thống Kê Mô Tả:', 20, yPosition);
        yPosition += 10;

        // Table
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Biến', 20, yPosition);
        pdf.text('Mean', 70, yPosition);
        pdf.text('SD', 100, yPosition);
        pdf.text('Min', 125, yPosition);
        pdf.text('Max', 150, yPosition);
        pdf.text('Median', 175, yPosition);
        yPosition += 5;

        pdf.setFont('helvetica', 'normal');
        columns.forEach((col, idx) => {
            if (yPosition > pageHeight - 20) {
                pdf.addPage();
                yPosition = 20;
            }

            pdf.text(col.substring(0, 20), 20, yPosition);
            pdf.text(results.mean[idx].toFixed(2), 70, yPosition);
            pdf.text(results.sd[idx].toFixed(2), 100, yPosition);
            pdf.text(results.min[idx].toFixed(2), 125, yPosition);
            pdf.text(results.max[idx].toFixed(2), 150, yPosition);
            pdf.text(results.median[idx].toFixed(2), 175, yPosition);
            yPosition += 6;
        });

    } else if (analysisType === 'correlation') {
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Ma Trận Tương Quan:', 20, yPosition);
        yPosition += 10;

        pdf.setFontSize(8);
        pdf.text('(Xem chi tiết trong giao diện web)', 20, yPosition);
    }

    // Footer
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'italic');
    pdf.text('Tạo bởi StatViet - Phân tích thống kê cho NCS Việt Nam', pageWidth / 2, pageHeight - 10, { align: 'center' });

    // Save PDF
    pdf.save(filename);
}

/**
 * Export results with charts (captures HTML element)
 */
export async function exportWithCharts(elementId: string, filename: string): Promise<void> {
    const element = document.getElementById(elementId);
    if (!element) {
        throw new Error('Element not found');
    }

    const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    const imgWidth = pageWidth - 20;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    // Add image to PDF
    pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight);

    // Footer
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'italic');
    pdf.text('Tạo bởi StatViet', pageWidth / 2, pageHeight - 10, { align: 'center' });

    pdf.save(filename);
}
