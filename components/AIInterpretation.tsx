import { useState, useEffect } from 'react';
import { Sparkles, Bot, AlertCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import CryptoJS from 'crypto-js';
import { AIInterpretationFeedback } from './feedback/AIInterpretationFeedback';

// Encryption helpers
const ENCRYPTION_KEY = 'ncsStat-secure-key-2026'; // In production, use env variable

function encryptData(data: string): string {
    return CryptoJS.AES.encrypt(data, ENCRYPTION_KEY).toString();
}

function decryptData(encryptedData: string): string {
    try {
        const bytes = CryptoJS.AES.decrypt(encryptedData, ENCRYPTION_KEY);
        return bytes.toString(CryptoJS.enc.Utf8);
    } catch {
        return '';
    }
}

interface AIInterpretationProps {
    analysisType: string;
    results: any;
}

export function AIInterpretation({ analysisType, results }: AIInterpretationProps) {
    const [apiKey, setApiKey] = useState<string>('');
    const [explanation, setExplanation] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [cache, setCache] = useState<Map<string, string>>(new Map());
    const [lastCallTime, setLastCallTime] = useState(0);

    // Load API key from sessionStorage (encrypted)
    useEffect(() => {
        const storedKey = sessionStorage.getItem('gemini_api_key_enc');
        if (storedKey) {
            const decrypted = decryptData(storedKey);
            if (decrypted) setApiKey(decrypted);
        }
    }, []);

    // Save to sessionStorage (encrypted)
    useEffect(() => {
        if (apiKey) {
            const encrypted = encryptData(apiKey);
            sessionStorage.setItem('gemini_api_key_enc', encrypted);
        }
    }, [apiKey]);

    const generateExplanation = async () => {
        if (!apiKey) {
            setError('Vui lòng nhập Gemini API Key trong phần Cài đặt AI (trên thanh menu)');
            return;
        }

        // Rate limiting: 10s cooldown
        const now = Date.now();
        if (now - lastCallTime < 10000) {
            setError('Vui lòng đợi 10 giây trước khi gọi AI lại (tránh spam).');
            return;
        }

        // Check cache first
        const cacheKey = JSON.stringify({ analysisType, results: results?.data || results });
        if (cache.has(cacheKey)) {
            setExplanation(cache.get(cacheKey)!);
            setError(null);
            return;
        }

        setLoading(true);
        setError(null);
        setLastCallTime(now);

        try {
            // Construct Prompt based on analysis type
            let prompt = `Bạn là một chuyên gia thống kê và phân tích dữ liệu. Hãy giải thích kết quả phân tích ${analysisType} dưới đây một cách ngắn gọn, dễ hiểu cho người làm nghiên cứu (NCS). Tập trung vào ý nghĩa các chỉ số chính và kết luận (có ý nghĩa thống kê không?). \n\n`;

            try {
                const dataStr = JSON.stringify(results, (key, value) => {
                    // Filter out large arrays to keep prompt size manageable
                    if (Array.isArray(value) && value.length > 20) return `[Array(${value.length})]`;
                    if (key === 'chartData' || key === 'fitted_values' || key === 'residuals') return undefined;
                    return value;
                }, 2);
                prompt += `Dữ liệu kết quả:\n\`\`\`json\n${dataStr}\n\`\`\``;
            } catch (e) {
                prompt += `Dữ liệu kết quả: (Không thể serialize)`;
            }

            // Call Gemini API (Using gemini-3-flash - Latest Gemini 3.0, Dec 2025)
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash:generateContent?key=${apiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }]
                })
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error?.message || 'Lỗi kết nối API');
            }

            const data = await response.json();
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Không nhận được phản hồi từ AI.';

            setExplanation(text);

            // Cache the response
            const newCache = new Map(cache);
            newCache.set(cacheKey, text);
            setCache(newCache);
        } catch (err: any) {
            setError(err.message || 'Có lỗi xảy ra khi gọi AI.');
        } finally {
            setLoading(false);
        }
    };

    if (!apiKey) return null; // Hide if no key (or show prompt?)

    return (
        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-indigo-100 rounded-xl p-6 mt-8 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-indigo-600 rounded-lg shadow-md shadow-indigo-200">
                    <Sparkles className="w-5 h-5 text-white animate-pulse" />
                </div>
                <h3 className="text-lg font-bold text-indigo-900">Trợ lý AI Phân tích</h3>
            </div>

            {!explanation && !loading && (
                <div className="text-center py-6">
                    <p className="text-indigo-600 mb-4 text-sm">
                        AI sẽ tự động đọc kết quả và viết báo cáo phân tích gợi ý cho bạn.
                    </p>
                    <button
                        onClick={generateExplanation}
                        className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-full shadow-lg shadow-indigo-200 transition-all hover:scale-105 flex items-center gap-2 mx-auto"
                    >
                        <Bot className="w-5 h-5" />
                        Giải thích kết quả ngay
                    </button>
                </div>
            )}

            {loading && (
                <div className="flex flex-col items-center justify-center py-8">
                    <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-3"></div>
                    <p className="text-indigo-600 animate-pulse font-medium">Đang suy nghĩ và viết báo cáo...</p>
                </div>
            )}

            {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-lg flex items-start gap-2 text-sm">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <p>{error}</p>
                </div>
            )}

            {explanation && (
                <div className="prose prose-indigo prose-sm max-w-none bg-white/50 p-6 rounded-xl border border-indigo-100/50">
                    <ReactMarkdown>{explanation}</ReactMarkdown>
                    <div className="mt-4 pt-4 border-t border-indigo-100 flex justify-end">
                        <button
                            onClick={generateExplanation}
                            className="text-xs text-indigo-500 hover:text-indigo-700 font-medium underline"
                        >
                            Tạo lại phân tích khác
                        </button>
                    </div>

                    {/* Feedback Part 2 */}
                    <AIInterpretationFeedback analysisType={analysisType} />
                </div>
            )}
        </div>
    );
}
