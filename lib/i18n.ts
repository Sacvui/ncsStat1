// i18n translations for ncsStat
// Supports Vietnamese (vi) and English (en)

export type Locale = 'vi' | 'en';

export const translations = {
    vi: {
        // Header
        nav: {
            analyze: 'Phân tích',
            profile: 'Hồ sơ',
            login: 'Đăng nhập',
            logout: 'Đăng xuất'
        },
        // Hero Section
        hero: {
            badge: 'V1.2.0: Phiên bản ổn định',
            title: 'Phân tích dữ liệu',
            subtitle: 'Dành cho nhà nghiên cứu',
            description: 'Công cụ thống kê trực tuyến mạnh mẽ, thay thế SPSS/R. Miễn phí, không cài đặt, bảo mật tuyệt đối.',
            cta: 'Bắt đầu phân tích ngay',
            learn: 'Tìm hiểu tính năng'
        },
        // Features
        features: {
            speed: {
                title: 'Tốc độ & Tiện lợi',
                desc: 'Chạy trực tiếp trên trình duyệt web với công nghệ WebAssembly. Không cần cài đặt phần mềm nặng nề.'
            },
            ai: {
                title: 'Trợ lý Thông minh',
                desc: 'Tích hợp AI giải thích kết quả bằng tiếng Việt, giúp bạn hiểu rõ ý nghĩa số liệu.'
            },
            security: {
                title: 'Bảo mật Dữ liệu',
                desc: 'Cơ chế Client-side 100%. Dữ liệu của bạn nằm yên trên máy tính, không bao giờ được gửi lên máy chủ.'
            }
        },
        // Methods
        methods: {
            title: 'Phương pháp Phân tích',
            subtitle: 'Hỗ trợ đầy đủ các kiểm định từ cơ bản đến nâng cao cho luận văn/luận án của bạn.',
            reliability: 'Độ tin cậy',
            efa: 'Khám phá EFA',
            cfa: 'Khẳng định CFA',
            sem: 'Mô hình SEM',
            regression: 'Hồi quy',
            comparison: 'So sánh nhóm',
            correlation: 'Tương quan',
            nonparam: 'Phi tham số'
        },
        // Footer
        footer: {
            terms: 'Điều khoản',
            privacy: 'Bảo mật',
            docs: 'Hướng dẫn',
            status: 'Trạng thái',
            operational: 'Hoạt động'
        },
        // Analyze Page
        analyze: {
            steps: {
                upload: 'Tải dữ liệu',
                profile: 'Kiểm tra',
                analyze: 'Phân tích',
                results: 'Kết quả'
            },
            upload: {
                title: 'Tải lên dữ liệu của bạn',
                desc: 'Hỗ trợ file CSV và Excel (.xlsx, .xls)'
            },
            selectMethod: 'Chọn phương pháp phân tích',
            processing: 'Đang phân tích...',
            complete: 'Phân tích hoàn thành!'
        }
    },
    en: {
        // Header
        nav: {
            analyze: 'Analyze',
            profile: 'Profile',
            login: 'Login',
            logout: 'Logout'
        },
        // Hero Section
        hero: {
            badge: 'V1.2.0: Stable Release',
            title: 'Data Analysis',
            subtitle: 'For Researchers',
            description: 'Powerful online statistical tool, replacing SPSS/R. Free, no installation, absolutely secure.',
            cta: 'Start Analyzing Now',
            learn: 'Explore Features'
        },
        // Features
        features: {
            speed: {
                title: 'Speed & Convenience',
                desc: 'Runs directly in your browser with WebAssembly technology. No heavy software installation needed.'
            },
            ai: {
                title: 'Smart Assistant',
                desc: 'AI-powered output interpretation in Vietnamese, helping you understand statistical results.'
            },
            security: {
                title: 'Data Security',
                desc: '100% client-side processing. Your data stays on your computer, never uploaded to our servers.'
            }
        },
        // Methods
        methods: {
            title: 'Analysis Methods',
            subtitle: 'Full support for basic to advanced statistical tests for your thesis/dissertation.',
            reliability: 'Reliability',
            efa: 'Exploratory EFA',
            cfa: 'Confirmatory CFA',
            sem: 'SEM Model',
            regression: 'Regression',
            comparison: 'Group Comparison',
            correlation: 'Correlation',
            nonparam: 'Non-parametric'
        },
        // Footer
        footer: {
            terms: 'Terms',
            privacy: 'Privacy',
            docs: 'Docs',
            status: 'Status',
            operational: 'Operational'
        },
        // Analyze Page
        analyze: {
            steps: {
                upload: 'Upload Data',
                profile: 'Review',
                analyze: 'Analyze',
                results: 'Results'
            },
            upload: {
                title: 'Upload your data',
                desc: 'Supports CSV and Excel files (.xlsx, .xls)'
            },
            selectMethod: 'Select analysis method',
            processing: 'Analyzing...',
            complete: 'Analysis complete!'
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
