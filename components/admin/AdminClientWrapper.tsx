'use client';

import React, { useState, useEffect } from 'react';
import { FeedbackService } from '@/lib/feedback-service';
import DashboardCharts from '@/components/admin/DashboardCharts';
import FeedbackTable from '@/components/admin/FeedbackTable';
import { Settings, LogOut, BarChart3, Users, FileText, Download, ExternalLink, Save } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface AdminWrapperProps {
    initialData: {
        demographics: any[];
        aiFeedback: any[];
        applicability: any[];
    }
}

export default function AdminClientWrapper({ initialData }: AdminWrapperProps) {
    const router = useRouter();
    const [configUrl, setConfigUrl] = useState('');
    const [isSaved, setIsSaved] = useState(false);
    const [activeTab, setActiveTab] = useState('overview');
    const [data, setData] = useState(initialData);

    // Stats are derived from data
    const stats = {
        demographics: data.demographics ? data.demographics.length : 0,
        aiFeedback: data.aiFeedback ? data.aiFeedback.length : 0,
        applicability: data.applicability ? data.applicability.length : 0
    };

    useEffect(() => {
        loadConfig();
        // Removed loadStats() as data is now passed via props from server
    }, []);

    const loadConfig = () => {
        setConfigUrl(FeedbackService.getGASUrl());
    };

    const handleSaveConfig = () => {
        FeedbackService.setGASUrl(configUrl);
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 2000);
    };

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Professional Admin Header */}
            <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
                <div className="container mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center text-white font-bold text-xl">A</div>
                        <span className="font-bold text-slate-900 text-lg tracking-tight">ncsStat Admin</span>
                    </div>

                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => router.push('/')}
                            className="text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors"
                        >
                            Quay về trang chủ
                        </button>
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-6 py-8 space-y-8">
                {/* Stats Overview */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
                        <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Tổng phản hồi</p>
                        <p className="text-3xl font-bold text-slate-900">{stats.demographics}</p>
                    </div>
                    <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
                        <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">AI Feedback</p>
                        <p className="text-3xl font-bold text-blue-600">{stats.aiFeedback}</p>
                    </div>
                </div>

                {/* Dashboard Content */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden min-h-[600px]">
                    {/* Tabs */}
                    <div className="border-b border-slate-200 flex overflow-x-auto">
                        <TabButton
                            active={activeTab === 'overview'}
                            onClick={() => setActiveTab('overview')}
                            label="Tổng quan"
                            icon={<BarChart3 className="w-4 h-4" />}
                        />
                        <TabButton
                            active={activeTab === 'demographics'}
                            onClick={() => setActiveTab('demographics')}
                            label={`Nhân khẩu học (${stats.demographics})`}
                            icon={<Users className="w-4 h-4" />}
                        />
                        <TabButton
                            active={activeTab === 'ai'}
                            onClick={() => setActiveTab('ai')}
                            label={`AI Reports (${stats.aiFeedback})`}
                            icon={<FileText className="w-4 h-4" />}
                        />
                        <TabButton
                            active={activeTab === 'applicability'}
                            onClick={() => setActiveTab('applicability')}
                            label={`Khảo sát (${stats.applicability})`}
                            icon={<FileText className="w-4 h-4" />}
                        />
                        <TabButton
                            active={activeTab === 'settings'}
                            onClick={() => setActiveTab('settings')}
                            label="Cấu hình"
                            icon={<Settings className="w-4 h-4" />}
                        />
                    </div>

                    <div className="p-6 bg-slate-50/50 min-h-[500px]">
                        {activeTab === 'overview' && (
                            <DashboardCharts
                                demographics={data.demographics}
                                aiFeedback={data.aiFeedback}
                                applicability={data.applicability}
                            />
                        )}

                        {activeTab === 'demographics' && (
                            <FeedbackTable data={data.demographics} type="demographics" />
                        )}

                        {activeTab === 'ai' && (
                            <FeedbackTable data={data.aiFeedback} type="aiFeedback" />
                        )}

                        {activeTab === 'applicability' && (
                            <FeedbackTable data={data.applicability} type="applicability" />
                        )}

                        {activeTab === 'settings' && (
                            <div className="max-w-2xl mx-auto bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
                                <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                                    <Settings className="w-5 h-5 text-slate-400" />
                                    Cấu hình Hệ thống
                                </h3>

                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-2">Google Apps Script Web App URL</label>
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                value={configUrl}
                                                onChange={(e) => setConfigUrl(e.target.value)}
                                                className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono text-sm text-slate-600"
                                                placeholder="https://script.google.com/macros/s/..."
                                            />
                                            <button
                                                onClick={handleSaveConfig}
                                                className="bg-slate-900 text-white px-5 py-2.5 rounded-xl hover:bg-slate-800 transition-colors font-medium flex items-center gap-2"
                                            >
                                                <Save className="w-4 h-4" />
                                                Lưu
                                            </button>
                                        </div>
                                        {isSaved && <p className="text-emerald-600 text-sm mt-2 font-medium flex items-center gap-1">✔ Đã lưu cấu hình</p>}
                                        <p className="text-xs text-slate-400 mt-2">URL này dùng để đồng bộ dữ liệu khảo sát về Google Sheets.</p>
                                    </div>

                                    <div className="pt-6 border-t border-slate-100">
                                        <h4 className="text-sm font-medium text-slate-900 mb-4">Export Dữ liệu</h4>
                                        <div className="flex gap-3">
                                            <button
                                                onClick={() => {
                                                    if (configUrl) window.open(configUrl.replace('/exec', ''), '_blank');
                                                    else alert('Chưa cấu hình URL');
                                                }}
                                                className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 text-sm font-medium flex items-center gap-2"
                                            >
                                                <ExternalLink className="w-4 h-4" />
                                                Mở Google Script
                                            </button>
                                            <button
                                                onClick={() => {
                                                    const data = FeedbackService.exportAllData();
                                                    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                                                    const url = URL.createObjectURL(blob);
                                                    const a = document.createElement('a');
                                                    a.href = url;
                                                    a.download = `ncsStat_export_${new Date().toISOString().slice(0, 10)}.json`;
                                                    a.click();
                                                }}
                                                className="px-4 py-2 bg-blue-50 border border-blue-100 text-blue-700 rounded-lg hover:bg-blue-100 text-sm font-medium flex items-center gap-2"
                                            >
                                                <Download className="w-4 h-4" />
                                                Tải về JSON
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}

function TabButton({ active, onClick, label, icon }: any) {
    return (
        <button
            onClick={onClick}
            className={`
                flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap
                ${active
                    ? 'border-blue-600 text-blue-600 bg-blue-50/50'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                }
            `}
        >
            {icon}
            {label}
        </button>
    )
}
