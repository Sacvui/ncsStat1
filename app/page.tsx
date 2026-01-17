import Link from 'next/link';
import {
  BarChart3,
  Sparkles,
  Shield,
  Zap,
  Brain,
  TrendingUp,
  Layers,
  Activity,
  Network
} from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-[#0F172A] text-slate-100 font-sans selection:bg-pink-500 selection:text-white overflow-x-hidden">

      {/* Dynamic Background Elements */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-500/20 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-rose-500/10 rounded-full blur-[100px]"></div>
        <div className="absolute top-[40%] left-[60%] w-[300px] h-[300px] bg-blue-500/10 rounded-full blur-[80px]"></div>
      </div>

      <div className="relative z-10">
        {/* Navigation */}
        <nav className="container mx-auto px-6 py-6 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-tr from-rose-500 to-purple-600 p-2 rounded-lg shadow-lg shadow-rose-500/20">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
              ncsStat
            </span>
          </div>
          <Link
            href="/analyze"
            className="hidden md:block px-6 py-2 rounded-full border border-white/10 hover:bg-white/5 transition-colors text-sm font-medium"
          >
            Vào trang phân tích
          </Link>
        </nav>

        {/* Hero Section */}
        <div className="container mx-auto px-6 py-20 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm mb-8 animate-fade-in-up">
            <Sparkles className="w-4 h-4" />
            <span>Phiên bản v1.2.0: Đã hỗ trợ CFA & SEM</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8 leading-tight">
            Thống kê Nghiên cứu <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-rose-400 via-fuchsia-500 to-indigo-500">
              Không Gian Nan
            </span>
          </h1>

          <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Công cụ phân tích dữ liệu chuyên sâu cho NCS Việt Nam.
            <span className="text-slate-200"> Chạy trực tiếp trên trình duyệt</span>,
            tích hợp AI giải thích kết quả, và hoàn toàn miễn phí.
          </p>

          <div className="flex flex-col md:flex-row items-center justify-center gap-4">
            <Link
              href="/analyze"
              className="group relative px-8 py-4 bg-rose-600 hover:bg-rose-500 text-white font-bold text-lg rounded-2xl shadow-xl shadow-rose-600/20 transition-all hover:scale-105"
            >
              <span className="flex items-center gap-2">
                Bắt đầu ngay <Brain className="w-5 h-5 group-hover:rotate-12 transition-transform" />
              </span>
              <div className="absolute inset-0 rounded-2xl ring-2 ring-white/20 group-hover:ring-white/40 transition-all"></div>
            </Link>
            <a
              href="#methods"
              className="px-8 py-4 text-slate-300 hover:text-white font-medium transition-colors"
            >
              Xem tính năng ↓
            </a>
          </div>
        </div>

        {/* Key Features (Grid) */}
        <div className="container mx-auto px-6 py-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-8 rounded-3xl bg-white/5 border border-white/5 backdrop-blur-sm hover:bg-white/10 transition-colors">
              <Zap className="w-10 h-10 text-yellow-400 mb-4" />
              <h3 className="text-xl font-bold mb-2">Tốc độ ánh sáng</h3>
              <p className="text-slate-400">Không cần cài đặt SPSS/R. WebAssembly (WASM) xử lý dữ liệu ngay lập tức.</p>
            </div>
            <div className="p-8 rounded-3xl bg-white/5 border border-white/5 backdrop-blur-sm hover:bg-white/10 transition-colors">
              <Brain className="w-10 h-10 text-rose-400 mb-4" />
              <h3 className="text-xl font-bold mb-2">Trợ lý AI</h3>
              <p className="text-slate-400">Gemini giải thích ý nghĩa hệ số Cronbach, t-test bằng tiếng Việt dễ hiểu.</p>
            </div>
            <div className="p-8 rounded-3xl bg-white/5 border border-white/5 backdrop-blur-sm hover:bg-white/10 transition-colors">
              <Shield className="w-10 h-10 text-emerald-400 mb-4" />
              <h3 className="text-xl font-bold mb-2">Riêng tư tuyệt đối</h3>
              <p className="text-slate-400">Dữ liệu của bạn không bao giờ rời khỏi máy tính. 100% Client-side.</p>
            </div>
          </div>
        </div>

        {/* Methods Showcase */}
        <div id="methods" className="container mx-auto px-6 py-20">
          <h2 className="text-3xl font-bold text-center mb-12">
            <span className="border-b-2 border-rose-500 pb-2">Kho vũ khí</span> của bạn
          </h2>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { name: "Độ tin cậy", sub: "Cronbach's Alpha", icon: Shield, color: "text-emerald-400", bg: "group-hover:bg-emerald-500/20" },
              { name: "Khám phá EFA", sub: "Exploratory Factor", icon: Layers, color: "text-blue-400", bg: "group-hover:bg-blue-500/20" },
              { name: "Khẳng định CFA", sub: "Confirmatory Factor", icon: Network, color: "text-rose-400", bg: "group-hover:bg-rose-500/20" },
              { name: "Mô hình SEM", sub: "Structural Equation", icon: Activity, color: "text-fuchsia-400", bg: "group-hover:bg-fuchsia-500/20" },
              { name: "Hồi quy", sub: "Regression Analysis", icon: TrendingUp, color: "text-orange-400", bg: "group-hover:bg-orange-500/20" },
              { name: "So sánh nhóm", sub: "T-test & ANOVA", icon: BarChart3, color: "text-cyan-400", bg: "group-hover:bg-cyan-500/20" },
              { name: "Tương quan", sub: "Correlation", icon: Network, color: "text-violet-400", bg: "group-hover:bg-violet-500/20" },
              { name: "Phi tham số", sub: "Non-parametric", icon: Zap, color: "text-yellow-400", bg: "group-hover:bg-yellow-500/20" },
            ].map((item, idx) => (
              <div key={idx} className="group relative p-6 bg-white/5 border border-white/5 rounded-2xl hover:border-white/20 transition-all cursor-default overflow-hidden">
                <div className={`absolute inset-0 opacity-0 ${item.bg} transition-opacity duration-300`}></div>
                <div className="relative z-10 flex flex-col items-center text-center gap-3">
                  <item.icon className={`w-8 h-8 ${item.color}`} />
                  <div>
                    <h3 className="font-bold text-slate-200">{item.name}</h3>
                    <p className="text-xs text-slate-500 uppercase tracking-wider">{item.sub}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <footer className="border-t border-white/5 bg-[#0B1120] py-12 text-center">
          <p className="text-slate-500 mb-4">
            Phát triển bởi hệ sinh thái <a href="https://ncskit.org" target="_blank" className="text-rose-400 hover:text-rose-300 font-bold">NCSKit.org</a>
          </p>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-white/5 text-xs text-slate-600 font-mono">
            <span>v1.2.0</span>
            <span className="w-1 h-1 rounded-full bg-emerald-500"></span>
            <span>Stable</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
