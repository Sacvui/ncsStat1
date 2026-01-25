'use client';

import { useEffect, useState } from 'react';
import { Coins, Save, RefreshCw, Check, AlertCircle, Gift } from 'lucide-react';
import {
    getAnalysisCosts,
    getDefaultBalance,
    getReferralReward,
    updateAnalysisCosts,
    updateDefaultBalance,
    updateReferralReward,
    ANALYSIS_TYPES,
    clearCostCache
} from '@/lib/ncs-credits';

export function AdminCreditConfig() {
    const [defaultBalance, setDefaultBalance] = useState<number>(100000);
    const [referralReward, setReferralReward] = useState<number>(5000);
    const [costs, setCosts] = useState<Record<string, number>>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');

    useEffect(() => {
        loadConfig();
    }, []);

    async function loadConfig() {
        setLoading(true);
        try {
            const [balance, analysisCosts, refReward] = await Promise.all([
                getDefaultBalance(),
                getAnalysisCosts(),
                getReferralReward()
            ]);
            setDefaultBalance(balance);
            setCosts(analysisCosts);
            setReferralReward(refReward);
        } catch (error) {
            console.error('Error loading config:', error);
        }
        setLoading(false);
    }

    async function handleSave() {
        setSaving(true);
        setSaveStatus('idle');
        try {
            const [balanceSuccess, costsSuccess, referralSuccess] = await Promise.all([
                updateDefaultBalance(defaultBalance),
                updateAnalysisCosts(costs),
                updateReferralReward(referralReward)
            ]);

            if (balanceSuccess && costsSuccess && referralSuccess) {
                clearCostCache();
                setSaveStatus('success');
                setTimeout(() => setSaveStatus('idle'), 3000);
            } else {
                setSaveStatus('error');
            }
        } catch (error) {
            console.error('Error saving config:', error);
            setSaveStatus('error');
        }
        setSaving(false);
    }

    function handleCostChange(key: string, value: number) {
        setCosts(prev => ({
            ...prev,
            [key]: Math.max(0, value)
        }));
    }

    if (loading) {
        return (
            <div className="animate-pulse space-y-4">
                <div className="h-8 bg-gray-200 rounded w-1/3"></div>
                <div className="h-24 bg-gray-100 rounded"></div>
                <div className="h-64 bg-gray-100 rounded"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg">
                        <Coins className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-gray-900">NCS Credit Configuration</h3>
                        <p className="text-sm text-gray-500">Quản lý chi phí phân tích và số dư mặc định</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={loadConfig}
                        disabled={loading || saving}
                        className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                        title="Refresh"
                    >
                        <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className={`
                            flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all
                            ${saveStatus === 'success'
                                ? 'bg-green-600 text-white'
                                : saveStatus === 'error'
                                    ? 'bg-red-600 text-white'
                                    : 'bg-amber-600 hover:bg-amber-700 text-white'
                            }
                            disabled:opacity-50
                        `}
                    >
                        {saving ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : saveStatus === 'success' ? (
                            <Check className="w-4 h-4" />
                        ) : saveStatus === 'error' ? (
                            <AlertCircle className="w-4 h-4" />
                        ) : (
                            <Save className="w-4 h-4" />
                        )}
                        {saving ? 'Đang lưu...' : saveStatus === 'success' ? 'Đã lưu!' : saveStatus === 'error' ? 'Lỗi!' : 'Lưu thay đổi'}
                    </button>
                </div>
            </div>

            {/* Default Balance */}
            <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-xl border border-amber-200 p-5">
                <label className="block text-sm font-semibold text-amber-900 mb-2">
                    Số NCS mặc định cho User mới
                </label>
                <div className="flex items-center gap-3">
                    <input
                        type="number"
                        value={defaultBalance}
                        onChange={(e) => setDefaultBalance(Math.max(0, parseInt(e.target.value) || 0))}
                        className="w-48 px-4 py-2 text-lg font-bold border-2 border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                        min="0"
                        step="1000"
                    />
                    <span className="text-amber-700 font-medium">NCS Credits</span>
                </div>
                <p className="text-xs text-amber-600 mt-2">
                    Số credit này sẽ được cấp tự động khi user đăng ký tài khoản mới.
                </p>
            </div>

            {/* Referral Reward */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-200 p-5">
                <label className="block text-sm font-semibold text-green-900 mb-2 flex items-center gap-2">
                    <Gift className="w-4 h-4" />
                    Thưởng giới thiệu thành công
                </label>
                <div className="flex items-center gap-3">
                    <input
                        type="number"
                        value={referralReward}
                        onChange={(e) => setReferralReward(Math.max(0, parseInt(e.target.value) || 0))}
                        className="w-48 px-4 py-2 text-lg font-bold border-2 border-green-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        min="0"
                        step="1000"
                    />
                    <span className="text-green-700 font-medium">NCS / người</span>
                </div>
                <p className="text-xs text-green-600 mt-2">
                    Số NCS thưởng cho CẢ người giới thiệu và người được giới thiệu khi đăng ký thành công.
                </p>
            </div>


            {/* Analysis Costs Table */}
            <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
                <div className="px-5 py-4 bg-gray-50 border-b">
                    <h4 className="font-semibold text-gray-900">Chi phí theo loại phân tích (NCS/lần chạy)</h4>
                </div>
                <div className="divide-y">
                    {Object.entries(ANALYSIS_TYPES).map(([key, label]) => (
                        <div
                            key={key}
                            className="flex items-center justify-between px-5 py-3 hover:bg-gray-50 transition-colors"
                        >
                            <div>
                                <div className="font-medium text-gray-900">{label}</div>
                                <div className="text-xs text-gray-400 font-mono">{key}</div>
                            </div>
                            <div className="flex items-center gap-2">
                                <input
                                    type="number"
                                    value={costs[key] || 0}
                                    onChange={(e) => handleCostChange(key, parseInt(e.target.value) || 0)}
                                    className="w-28 px-3 py-1.5 text-right font-bold border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                                    min="0"
                                    step="100"
                                />
                                <span className="text-sm text-gray-500 w-10">NCS</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-700">
                <strong>💡 Lưu ý:</strong> Thay đổi sẽ áp dụng ngay lập tức cho tất cả user sau khi nhấn "Lưu thay đổi".
                User đang login cần refresh trang để thấy giá mới.
            </div>
        </div>
    );
}
