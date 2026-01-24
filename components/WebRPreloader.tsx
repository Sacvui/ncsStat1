'use client';

import { useEffect, useState } from 'react';
import { initWebR, getWebRStatus, setProgressCallback } from '@/lib/webr-wrapper';

/**
 * WebR Preloader - Silently preload R libraries in background
 * Place this component on the homepage to start loading WebR before user navigates to /analyze
 */
export function WebRPreloader() {
    const [status, setStatus] = useState<string>('');

    useEffect(() => {
        const webRStatus = getWebRStatus();

        // Only start preloading if not already ready or loading
        if (!webRStatus.isReady && !webRStatus.isLoading) {
            console.log('[WebR Preloader] Starting background initialization...');

            // Set progress callback for logging
            setProgressCallback((msg) => {
                console.log('[WebR Preloader]', msg);
                setStatus(msg);
            });

            // Start preloading silently - don't block UI
            initWebR().then(() => {
                console.log('[WebR Preloader] ✅ R Engine ready!');
                setStatus('Sẵn sàng');
            }).catch((err) => {
                console.warn('[WebR Preloader] Failed to preload:', err);
                // Silently fail - user will see loading on analyze page
            });
        } else if (webRStatus.isReady) {
            console.log('[WebR Preloader] R Engine already loaded');
            setStatus('Sẵn sàng');
        }
    }, []);

    // This component renders nothing visible
    // But we can optionally show a tiny status indicator
    return null;
}

export default WebRPreloader;
