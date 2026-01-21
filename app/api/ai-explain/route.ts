import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit } from '@/utils/rate-limit';
import { sanitizeInput } from '@/utils/security';

export async function POST(req: NextRequest) {
    try {
        // 1. Rate Limiting Protection
        const ip = req.headers.get('x-forwarded-for') || 'unknown';
        if (!checkRateLimit(ip, 20, 60000)) { // 20 reqs/min per IP
            return NextResponse.json(
                { error: 'Quá nhiều yêu cầu. Vui lòng thử lại sau 1 phút.' },
                { status: 429 }
            );
        }

        const apiKey = req.headers.get('x-gemini-api-key');

        if (!apiKey) {
            return NextResponse.json(
                { error: 'Yêu cầu nhập API Key cá nhân trong phần Cài đặt AI (Sidebar).' },
                { status: 401 }
            );
        }

        const { analysisType, results, context } = await req.json();

        // 2. Input Sanitization
        const safeContext = sanitizeInput(context || '');

        const prompt = `
Bạn là chuyên gia thống kê, giải thích kết quả phân tích cho NCS Việt Nam.

Loại phân tích: ${analysisType}
Kết quả: ${JSON.stringify(results, null, 2)}
Bối cảnh: ${safeContext || 'Không có'}

Hãy giải thích theo cấu trúc sau:

## 1. Ý Nghĩa Kết Quả
Giải thích các chỉ số chính bằng ngôn ngữ đơn giản, dễ hiểu.

## 2. Kết Luận
Dựa trên kết quả, nên chấp nhận hay bác bỏ giả thuyết? Tại sao?

## 3. Hàm Ý Thực Tiễn
Kết quả này có ý nghĩa gì trong thực tế? Ứng dụng như thế nào?

## 4. Cách Viết Vào Paper (APA Format)
Cung cấp đoạn văn mẫu để viết vào phần Results của paper, theo chuẩn APA.

Viết bằng tiếng Việt, ngắn gọn, chính xác.
`;

        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }]
                })
            }
        );

        if (!response.ok) {
            throw new Error(`Gemini API error: ${response.statusText}`);
        }

        const data = await response.json();
        const explanation = data.candidates[0].content.parts[0].text;

        // Parse the structured response
        const sections = explanation.split('##').filter((s: string) => s.trim());

        return NextResponse.json({
            explanation,
            interpretation: sections[0] || '',
            conclusion: sections[1] || '',
            practicalImplications: sections[2] || '',
            academicWriting: sections[3] || ''
        });

    } catch (error) {
        console.error('AI Explain error:', error);
        return NextResponse.json(
            { error: 'Failed to generate explanation' },
            { status: 500 }
        );
    }
}
