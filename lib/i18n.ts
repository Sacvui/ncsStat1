// i18n translations for ncsStat
// Supports Vietnamese (vi) and English (en)

export type Locale = 'vi' | 'en';

export const translations = {
    vi: {
        // Header
        nav: {
            analyze: 'Phân tích Dữ liệu',
            profile: 'Hồ sơ Nghiên cứu',
            login: 'Đăng nhập',
            logout: 'Đăng xuất'
        },
        // Hero Section
        hero: {
            badge: 'V1.2.0: Stable Release',
            title: 'Giải pháp Thống kê',
            subtitle: 'Chuẩn khoa học cho Nghiên cứu sinh',
            description: 'Nền tảng phân tích dữ liệu chuyên sâu, tích hợp R-Engine mạnh mẽ và Trợ lý AI. Chính xác tuyệt đối, bảo mật tối đa, không cần cài đặt.',
            cta: 'Bắt đầu Nghiên cứu',
            learn: 'Quy trình hoạt động'
        },
        // Workflow (New)
        workflow: {
            title: 'Quy trình 4 Bước Chuẩn',
            step1: {
                title: 'Tải dữ liệu',
                desc: 'Hỗ trợ định dạng Excel/CSV. Hệ thống tự động kiểm tra cấu trúc.'
            },
            step2: {
                title: 'Kiểm tra & Làm sạch',
                desc: 'Tự động phát hiện giá trị lỗi, outlier và đánh giá chất lượng dữ liệu trước khi xử lý.'
            },
            step3: {
                title: 'Chọn kiểm định',
                desc: 'Menu phân tích trực quan, đầy đủ các phương pháp từ EFA, CFA đến mô hình SEM.'
            },
            step4: {
                title: 'Nhận báo cáo',
                desc: 'Kết quả chi tiết chuẩn APA, biểu đồ chuyên nghiệp và được AI giải thích ý nghĩa.'
            }
        },
        // Features
        features: {
            speed: {
                title: 'Hiệu suất Vượt trội',
                desc: 'Vận hành trực tiếp trên trình duyệt với công nghệ WebAssembly tiên tiến. Tốc độ xử lý nhanh chóng, ổn định.'
            },
            ai: {
                title: 'Trợ lý Nghiên cứu AI',
                desc: 'Tự động phân tích và diễn giải kết quả số liệu. Phát hiện vấn đề và đề xuất giải pháp tối ưu cho bài nghiên cứu.'
            },
            security: {
                title: 'Bảo mật Cấp cao',
                desc: 'Kiến trúc Zero-Knowledge. Dữ liệu được xử lý cục bộ 100% tại thiết bị người dùng (Client-side), đảm bảo sự riêng tư tuyệt đối.'
            }
        },
        // Methods
        methods: {
            title: 'Hệ thống Phương pháp Phân tích',
            subtitle: 'Bộ công cụ toàn diện hỗ trợ đầy đủ các kiểm định thống kê cho Luận văn và Luận án Tiến sĩ.',
            reliability: 'Độ tin cậy thang đo',
            efa: 'Phân tích nhân tố EFA',
            cfa: 'Mô hình đo lường CFA',
            sem: 'Mô hình cấu trúc SEM',
            regression: 'Phân tích Hồi quy',
            comparison: 'Kiểm định so sánh',
            correlation: 'Phân tích Tương quan',
            nonparam: 'Phi tham số'
        },
        // Footer
        footer: {
            terms: 'Điều khoản sử dụng',
            privacy: 'Chính sách bảo mật',
            docs: 'Tài liệu hướng dẫn',
            status: 'Trạng thái hệ thống',
            operational: 'Đang hoạt động tốt',
            aboutTitle: 'About Hai Rong Choi',
            aboutDesc: 'Hải Rong Chơi chào bạn! Ghé thăm "thánh địa" của những con số, nơi sự chính xác gặp gỡ tinh thần tự do. ncsStat đang trong giai đoạn Pilot - nhưng đầy nhiệt huyết. Có thể đâu đó vẫn còn chút lỗi nhỏ, rất mong nhận được những góp ý thẳng thắn từ bạn để chúng mình cùng nhau hoàn thiện. Con đường nghiên cứu tuy đơn độc, nhưng tại đây, bạn luôn có người đồng hành. Cùng khám phá những công cụ đắc lực cho luận án của bạn nhé!'
        },
        // Analyze Page
        analyze: {
            steps: {
                upload: 'Dữ liệu',
                profile: 'Kiểm tra',
                analyze: 'Phân tích',
                results: 'Kết quả'
            },
            upload: {
                title: 'Nhập dữ liệu nghiên cứu',
                desc: 'Hỗ trợ định dạng chuẩn .csv và .xlsx'
            },
            selectMethod: 'Lựa chọn phương pháp kiểm định',
            processing: 'Đang xử lý dữ liệu...',
            complete: 'Phân tích hoàn tất'
        }
    },
    en: {
        // Header
        nav: {
            analyze: 'Data Analysis',
            profile: 'Researcher Profile',
            login: 'Login',
            logout: 'Logout'
        },
        // Hero Section
        hero: {
            badge: 'V1.2.0: Stable Release',
            title: 'Advanced Statistics',
            subtitle: 'Scientific Standard for Researchers',
            description: 'Professional data analysis platform powered by R-Engine and AI Assistant. Absolute accuracy, maximum security, zero installation.',
            cta: 'Start Researching',
            learn: 'How it works'
        },
        // Workflow (New)
        workflow: {
            title: 'Standard 4-Step Process',
            step1: {
                title: 'Import Data',
                desc: 'Support Excel/CSV formats. Automatic data structure validation.'
            },
            step2: {
                title: 'Review & Clean',
                desc: 'Auto-detect missing values, outliers, and assess data quality before processing.'
            },
            step3: {
                title: 'Select Analysis',
                desc: 'Intuitive menu covering all methods from EFA, CFA to complex SEM models.'
            },
            step4: {
                title: 'Get Report',
                desc: 'Detailed APA-standard results, professional charts, and AI-powered interpretation.'
            }
        },
        // Features
        features: {
            speed: {
                title: 'High Performance',
                desc: 'Runs directly in-browser via advanced WebAssembly technology. Fast, stable, and efficient processing.'
            },
            ai: {
                title: 'AI Research Assistant',
                desc: 'Automated analysis and interpretation of statistical results. Identifies issues and proposes optimal solutions.'
            },
            security: {
                title: 'High-Level Security',
                desc: 'Zero-Knowledge architecture. Data is processed 100% locally on your device (Client-side), ensuring absolute privacy.'
            }
        },
        // Methods
        methods: {
            title: 'Analysis Methodology System',
            subtitle: 'Comprehensive toolkit supporting all statistical tests for Theses and Dissertations.',
            reliability: 'Scale Reliability',
            efa: 'Exploratory EFA',
            cfa: 'Confirmatory CFA',
            sem: 'Structural SEM',
            regression: 'Regression Analysis',
            comparison: 'Hypothesis Testing',
            correlation: 'Correlation Analysis',
            nonparam: 'Non-parametric Tests'
        },
        // Footer
        footer: {
            terms: 'Terms of Service',
            privacy: 'Privacy Policy',
            docs: 'Documentation',
            status: 'System Status',
            operational: 'Operational',
            aboutTitle: 'About Hai Rong Choi',
            aboutDesc: 'Hai Rong Choi greets you! Welcome to the sanctuary of numbers, where precision meets the spirit of freedom. ncsStat is in its Pilot phase - full of passion but perhaps still carrying a few small grains of sand. We warmly welcome your honest feedback so we can perfect it together. Research is a lonely path, but here, you never walk alone. Let’s explore the tools that will empower your thesis!'
        },
        // Analyze Page
        analyze: {
            steps: {
                upload: 'Data Import',
                profile: 'Review',
                analyze: 'Analysis',
                results: 'Reporting'
            },
            upload: {
                title: 'Import your dataset',
                desc: 'Supports standard .csv and .xlsx formats'
            },
            selectMethod: 'Select Analysis Method',
            processing: 'Processing data...',
            complete: 'Analysis Complete'
        }
    }
} as const;

// Helper to get translation
export function t(locale: Locale, key: string): string {
    const keys = key.split('.');
    let value: any = translations[locale];

    for (const k of keys) {
        value = value?.[k];
    }

    return value || key;
}

// Default locale
export const defaultLocale: Locale = 'vi';

// Get locale from localStorage or default
export function getStoredLocale(): Locale {
    if (typeof window === 'undefined') return defaultLocale;
    const stored = localStorage.getItem('ncsStat_locale');
    return (stored === 'en' || stored === 'vi') ? stored : defaultLocale;
}

// Save locale to localStorage
export function setStoredLocale(locale: Locale): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem('ncsStat_locale', locale);
}
