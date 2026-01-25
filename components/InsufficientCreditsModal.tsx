'use client';

import { AlertTriangle, Coins, X } from 'lucide-react';

interface InsufficientCreditsModalProps {
    isOpen: boolean;
    onClose: () => void;
    required: number;
    available: number;
    analysisType?: string;
}

export function InsufficientCreditsModal({
    isOpen,
    onClose,
    required,
    available,
    analysisType
}: InsufficientCreditsModalProps) {
    if (!isOpen) return null;

    const shortage = required - available;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                            <AlertTriangle className="w-6 h-6 text-red-600" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-gray-900">Không đủ NCS</h2>
                            <p className="text-sm text-gray-500">Số dư không đủ để thực hiện</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5 text-gray-400" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-5 space-y-4">
                    {analysisType && (
                        <div className="text-center text-sm text-gray-600 mb-4">
                            Phân tích: <span className="font-medium">{analysisType}</span>
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-red-50 rounded-xl p-4 text-center">
                            <div className="text-sm text-red-600 mb-1">Cần</div>
                            <div className="text-2xl font-bold text-red-700 flex items-center justify-center gap-1">
                                <Coins className="w-5 h-5" />
                                {required.toLocaleString()}
                            </div>
                        </div>
                        <div className="bg-amber-50 rounded-xl p-4 text-center">
                            <div className="text-sm text-amber-600 mb-1">Hiện có</div>
                            <div className="text-2xl font-bold text-amber-700 flex items-center justify-center gap-1">
                                <Coins className="w-5 h-5" />
                                {available.toLocaleString()}
                            </div>
                        </div>
                    </div>

                    <div className="bg-gray-50 rounded-xl p-4 text-center">
                        <div className="text-sm text-gray-500 mb-1">Thiếu</div>
                        <div className="text-xl font-bold text-gray-700">
                            {shortage.toLocaleString()} NCS
                        </div>
                    </div>

                    <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
                        <p className="text-sm text-blue-700">
                            <strong>💡 Gợi ý:</strong> Liên hệ Admin để được cấp thêm NCS credits,
                            hoặc mời bạn bè sử dụng ncsStat để nhận thưởng.
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-5 border-t bg-gray-50 rounded-b-2xl">
                    <button
                        onClick={onClose}
                        className="w-full py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold rounded-lg transition-colors"
                    >
                        Đã hiểu
                    </button>
                </div>
            </div>
        </div>
    );
}
