import { useState, useEffect } from 'react';
import { Loader2, CheckCircle, RefreshCw } from 'lucide-react';
import { getWebRStatus } from '@/lib/webr-wrapper';

export function WebRStatus() {
    const [status, setStatus] = useState({ isReady: false, isLoading: false, progress: '' });

    useEffect(() => {
        const checkStatus = () => setStatus(getWebRStatus());
        const interval = setInterval(checkStatus, 500);
        return () => clearInterval(interval);
    }, []);

    if (status.isReady) {
        return (
            <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 px-3 py-1 rounded-full whitespace-nowrap">
                <CheckCircle className="w-4 h-4 shrink-0" />
                <span className="hidden md:inline">R Engine Ready</span>
            </div>
        );
    }

    if (status.isLoading) {
        return (
            <div className="flex items-center gap-2 text-sm text-blue-600 bg-blue-50 px-3 py-1 rounded-full whitespace-nowrap max-w-[150px] md:max-w-none overflow-hidden">
                <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                <span className="truncate">{status.progress || 'Loading...'}</span>
            </div>
        );
    }

    return (
        <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                <RefreshCw className="w-4 h-4" />
                <span>R Engine chưa khởi tạo</span>
            </div>
            <button
                onClick={() => {
                    window.location.reload();
                }}
                className="text-xs text-blue-600 hover:underline"
            >
                (Tải lại trang)
            </button>
        </div>
    );
}
