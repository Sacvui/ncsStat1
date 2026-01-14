import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
    try {
        const { researchDescription, dataDescription } = await req.json();

        const prompt = `
Bạn là chuyên gia phương pháp nghiên cứu, hãy gợi ý phương pháp phân tích thống kê phù hợp.

Mô tả nghiên cứu: ${researchDescription}
Mô tả dữ liệu: ${dataDescription}

Hãy trả lời theo cấu trúc JSON sau:
{
  "suggestedMethod": "Tên phương pháp (VD: EFA, CFA, SEM, Regression, T-test, ANOVA)",
  "reasoning": "Giải thích tại sao nên dùng phương pháp này (2-3 câu)",
  "alternatives": ["Phương pháp thay thế 1", "Phương pháp thay thế 2"],
  "requirements": ["Yêu cầu 1", "Yêu cầu 2"],
  "steps": ["Bước 1", "Bước 2", "Bước 3"]
}

Chỉ trả về JSON, không thêm text khác.
`;

        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${process.env.GEMINI_API_KEY}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: {
                        temperature: 0.7,
                        topK: 40,
                        topP: 0.95,
                    }
                })
            }
        );

        if (!response.ok) {
            throw new Error(`Gemini API error: ${response.statusText}`);
        }

        const data = await response.json();
        const text = data.candidates[0].content.parts[0].text;

        // Extract JSON from response (remove markdown code blocks if present)
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error('Failed to parse AI response');
        }

        const suggestion = JSON.parse(jsonMatch[0]);

        return NextResponse.json(suggestion);

    } catch (error) {
        console.error('AI Suggest error:', error);
        return NextResponse.json(
            { error: 'Failed to generate suggestion' },
            { status: 500 }
        );
    }
}
