import { useState, useEffect, useCallback } from 'react';
import { DataProfile } from '@/lib/data-profiler';
import { AnalysisStep } from '@/types/analysis';

const STORAGE_KEY = 'statviet_session';

export function useAnalysisSession() {
    const [isPrivateMode, setIsPrivateMode] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);

    // Core State
    const [step, setStep] = useState<AnalysisStep>('upload');
    const [data, setData] = useState<any[]>([]);
    const [filename, setFilename] = useState('');
    const [profile, setProfile] = useState<DataProfile | null>(null);

    // Analysis State
    const [analysisType, setAnalysisType] = useState<string>('');
    const [results, setResults] = useState<any>(null);
    const [multipleResults, setMultipleResults] = useState<any[]>([]);
    const [scaleName, setScaleName] = useState('');
    const [regressionVars, setRegressionVars] = useState<{ y: string; xs: string[] }>({ y: '', xs: [] });
    const [moderationVars, setModerationVars] = useState<{ y: string; x: string; w: string }>({ y: '', x: '', w: '' });
    const [twoWayAnovaVars, setTwoWayAnovaVars] = useState<{ y: string; factor1: string; factor2: string }>({ y: '', factor1: '', factor2: '' });
    const [clusterVars, setClusterVars] = useState<{ variables: string[]; k: number }>({ variables: [], k: 3 });
    const [mediationVars, setMediationVars] = useState<{ x: string; m: string; y: string }>({ x: '', m: '', y: '' });
    const [logisticVars, setLogisticVars] = useState<{ y: string; xs: string[] }>({ y: '', xs: [] });

    // Load session on mount
    useEffect(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                const session = JSON.parse(saved);
                // Validate minimal session structure
                if (session.step) setStep(session.step);
                if (session.data) setData(session.data);
                if (session.filename) setFilename(session.filename);
                if (session.profile) setProfile(session.profile);
                if (session.analysisType) setAnalysisType(session.analysisType);
                if (session.results) setResults(session.results);
                if (session.multipleResults) setMultipleResults(session.multipleResults);
                if (session.scaleName) setScaleName(session.scaleName);
                if (session.regressionVars) setRegressionVars(session.regressionVars);
            }
        } catch (e) {
            console.error('Failed to load session:', e);
        } finally {
            setIsLoaded(true);
        }
    }, []);

    // Save session on change
    useEffect(() => {
        if (!isLoaded) return;

        if (isPrivateMode) {
            localStorage.removeItem(STORAGE_KEY);
            return;
        }

        const session = {
            step,
            data,
            filename,
            profile,
            analysisType,
            results,
            multipleResults,
            scaleName,
            regressionVars,
            moderationVars,
            twoWayAnovaVars,
            clusterVars,
            mediationVars,
            logisticVars
        };

        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
        } catch (e) {
            console.error('Failed to save session (likely quota exceeded):', e);
            // Optionally notify user
        }
    }, [isLoaded, isPrivateMode, step, data, filename, profile, analysisType, results, multipleResults, scaleName, regressionVars, moderationVars, twoWayAnovaVars, clusterVars]);

    // Clear session helper
    const clearSession = useCallback(() => {
        localStorage.removeItem(STORAGE_KEY);
        setStep('upload');
        setData([]);
        setFilename('');
        setProfile(null);
        setResults(null);
        setMultipleResults([]);
        setAnalysisType('');
        setScaleName('');
        setRegressionVars({ y: '', xs: [] });
        setModerationVars({ y: '', x: '', w: '' });
        setTwoWayAnovaVars({ y: '', factor1: '', factor2: '' });
        setClusterVars({ variables: [], k: 3 });
        setMediationVars({ x: '', m: '', y: '' });
        setLogisticVars({ y: '', xs: [] });
    }, []);

    return {
        isPrivateMode,
        setIsPrivateMode,
        isLoaded,
        clearSession,
        // State
        step, setStep,
        data, setData,
        filename, setFilename,
        profile, setProfile,
        analysisType, setAnalysisType,
        results, setResults,
        multipleResults, setMultipleResults,
        scaleName, setScaleName,
        regressionVars, setRegressionVars,
        moderationVars, setModerationVars,
        twoWayAnovaVars, setTwoWayAnovaVars,
        clusterVars, setClusterVars,
        mediationVars, setMediationVars,
        logisticVars, setLogisticVars
    };
}
