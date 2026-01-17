import Link from 'next/link';
import { BarChart3, Sparkles, Shield, Zap } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-pink-500">
      <div className="container mx-auto px-6 py-16">
        {/* Hero Section */}
        <div className="text-center text-white mb-16">
          <div className="flex items-center justify-center gap-3 mb-6">
            {/* <BarChart3 className="w-16 h-16" /> */}
            <img src="/logo.png" alt="ncsStat Logo" className="w-20 h-20 rounded-xl" />
            <h1 className="text-6xl font-bold">ncsStat</h1>
          </div>
          <p className="text-2xl mb-4 text-blue-100">
            Phân tích thống kê cho NCS Việt Nam
          </p>
          <p className="text-lg text-blue-200 max-w-2xl mx-auto mb-8">
            Công cụ phân tích dữ liệu miễn phí, không cần cài đặt, có AI giải thích kết quả bằng tiếng Việt
          </p>
          <Link
            href="/analyze"
            className="inline-block px-8 py-4 bg-white text-blue-600 font-bold text-lg rounded-xl hover:bg-blue-50 transition-all shadow-2xl hover:scale-105"
          >
            Bắt đầu phân tích →
          </Link>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 text-white">
            <Zap className="w-12 h-12 mb-4" />
            <h3 className="text-xl font-bold mb-2">Không cần cài đặt</h3>
            <p className="text-blue-100">
              Chạy ngay trên trình duyệt, không cần SPSS hay R
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 text-white">
            <Sparkles className="w-12 h-12 mb-4" />
            <h3 className="text-xl font-bold mb-2">AI giải thích</h3>
            <p className="text-blue-100">
              Gemini AI giải thích kết quả bằng tiếng Việt, dễ hiểu
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 text-white">
            <Shield className="w-12 h-12 mb-4" />
            <h3 className="text-xl font-bold mb-2">Bảo mật tuyệt đối</h3>
            <p className="text-blue-100">
              Dữ liệu xử lý ngay trên máy bạn, không gửi lên server
            </p>
          </div>
        </div>

        {/* Supported Methods */}
        <div className="mt-16 max-w-4xl mx-auto bg-white/10 backdrop-blur-lg rounded-2xl p-8 text-white">
          <h2 className="text-3xl font-bold mb-6 text-center">Phương pháp hỗ trợ</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              'Cronbach\'s Alpha',
              'EFA',
              'CFA',
              'SEM',
              'Correlation',
              'T-test',
              'ANOVA',
              'Regression'
            ].map(method => (
              <div key={method} className="bg-white/20 rounded-lg px-4 py-2 text-center font-medium">
                {method}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-20 pt-8 border-t border-white/20 text-center text-blue-100 pb-8">
        <p>
          1 sản phẩm của hệ sinh thái hỗ trợ nghiên cứu khoa học từ{' '}
          <a
            href="https://ncskit.org"
            target="_blank"
            rel="noopener noreferrer"
            className="font-bold text-white hover:text-blue-200 transition-colors"
          >
            NCSKit.org
          </a>
        </p>
        <p className="mt-2 text-xs text-blue-200 opacity-70">
          v1.1.0 (Mobile Ready)
        </p>
      </footer>
    </div>
  );
}
