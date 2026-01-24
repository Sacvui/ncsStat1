import Link from 'next/link';
import { Shield, ArrowLeft, Server, Lock, Eye, Database } from 'lucide-react';
import Header from '@/components/layout/Header';
import { createClient } from '@/utils/supabase/server';

export const metadata = {
    title: 'Chính sách bảo mật - ncsStat',
    description: 'Chính sách bảo mật và xử lý dữ liệu của ncsStat'
};

export default async function PrivacyPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50">
            <Header user={user} />

            <div className="container mx-auto px-6 py-12 max-w-4xl">
                <Link href="/" className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-800 mb-8">
                    <ArrowLeft className="w-4 h-4" />
                    Quay lại trang chủ
                </Link>

                <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12 border border-slate-100">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                            <Shield className="w-6 h-6 text-emerald-600" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-slate-800">Chính sách bảo mật</h1>
                            <p className="text-slate-500">Privacy Policy</p>
                        </div>
                    </div>

                    <div className="prose prose-slate max-w-none">
                        {/* Highlight Box */}
                        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6 mb-8">
                            <div className="flex items-start gap-3">
                                <Lock className="w-6 h-6 text-emerald-600 mt-1" />
                                <div>
                                    <p className="font-bold text-emerald-800 mb-2">Cam kết bảo mật 100%</p>
                                    <p className="text-emerald-700">
                                        Dữ liệu nghiên cứu của bạn <strong>KHÔNG BAO GIỜ</strong> được gửi lên máy chủ.
                                        Tất cả phân tích được thực hiện hoàn toàn trên trình duyệt của bạn (client-side processing).
                                    </p>
                                </div>
                            </div>
                        </div>

                        <h2 className="text-xl font-bold text-slate-800 mt-8 mb-4 flex items-center gap-2">
                            <Server className="w-5 h-5 text-indigo-600" />
                            1. Xử lý dữ liệu Client-side
                        </h2>
                        <p className="text-slate-600 leading-relaxed">
                            ncsStat sử dụng công nghệ <strong>WebAssembly (WASM)</strong> để chạy R engine trực tiếp trên trình duyệt web của bạn.
                            Điều này có nghĩa là:
                        </p>
                        <ul className="text-slate-600 space-y-2 ml-6 list-disc">
                            <li>File CSV/Excel của bạn được đọc và xử lý ngay trên máy tính</li>
                            <li>Dữ liệu không bao giờ được upload lên server</li>
                            <li>Kết quả phân tích không được lưu trữ ở bất kỳ đâu ngoài trình duyệt</li>
                            <li>Khi bạn đóng tab, tất cả dữ liệu biến mất</li>
                        </ul>

                        <h2 className="text-xl font-bold text-slate-800 mt-8 mb-4 flex items-center gap-2">
                            <Database className="w-5 h-5 text-indigo-600" />
                            2. Dữ liệu chúng tôi thu thập
                        </h2>
                        <p className="text-slate-600 leading-relaxed mb-4">
                            Chúng tôi chỉ thu thập thông tin tối thiểu cần thiết cho việc xác thực và cải thiện dịch vụ:
                        </p>
                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                                <p className="font-semibold text-slate-700 mb-2">✅ Thu thập:</p>
                                <ul className="text-slate-600 text-sm space-y-1">
                                    <li>• Email đăng nhập (Google/LinkedIn/ORCID)</li>
                                    <li>• Tên hiển thị</li>
                                    <li>• Số lần sử dụng (thống kê ẩn danh)</li>
                                </ul>
                            </div>
                            <div className="bg-red-50 rounded-xl p-4 border border-red-200">
                                <p className="font-semibold text-red-700 mb-2">❌ KHÔNG thu thập:</p>
                                <ul className="text-red-600 text-sm space-y-1">
                                    <li>• Dữ liệu nghiên cứu của bạn</li>
                                    <li>• Kết quả phân tích</li>
                                    <li>• File CSV/Excel đã upload</li>
                                </ul>
                            </div>
                        </div>

                        <h2 className="text-xl font-bold text-slate-800 mt-8 mb-4 flex items-center gap-2">
                            <Eye className="w-5 h-5 text-indigo-600" />
                            3. Chế độ Private Mode
                        </h2>
                        <p className="text-slate-600 leading-relaxed">
                            Bạn có thể bật <strong>Private Mode</strong> trong trang phân tích để ẩn thông tin nhạy cảm khỏi màn hình.
                            Tính năng này hữu ích khi bạn chia sẻ màn hình hoặc quay video hướng dẫn.
                        </p>

                        <h2 className="text-xl font-bold text-slate-800 mt-8 mb-4">4. Cookies</h2>
                        <p className="text-slate-600 leading-relaxed">
                            Chúng tôi sử dụng cookies thiết yếu để:
                        </p>
                        <ul className="text-slate-600 space-y-2 ml-6 list-disc">
                            <li>Duy trì phiên đăng nhập</li>
                            <li>Lưu tùy chọn ngôn ngữ</li>
                            <li>Ghi nhớ cài đặt giao diện</li>
                        </ul>

                        <h2 className="text-xl font-bold text-slate-800 mt-8 mb-4">5. Liên hệ</h2>
                        <p className="text-slate-600 leading-relaxed">
                            Nếu bạn có bất kỳ câu hỏi nào về chính sách bảo mật, vui lòng liên hệ:
                            <a href="mailto:privacy@ncskit.org" className="text-indigo-600 hover:underline ml-1">privacy@ncskit.org</a>
                        </p>

                        <div className="mt-12 pt-8 border-t border-slate-200 text-center text-sm text-slate-500">
                            <p>Cập nhật lần cuối: Tháng 01/2026</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
