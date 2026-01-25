'use client';

import { useState, useEffect, useMemo } from 'react';
import { Check, ChevronDown, Plus, X, Sparkles, Key, Edit2, Trash2, Layers } from 'lucide-react';

interface VariableGroup {
    name: string;
    columns: string[];
    selected: boolean;
}

interface SmartGroupSelectorProps {
    columns: string[];
    onAnalyzeGroup: (selectedColumns: string[], scaleName: string) => void;
    onAnalyzeAllGroups: (groups: { name: string; columns: string[] }[]) => void;
    isAnalyzing: boolean;
    analysisLabel?: string; // Custom label for the analysis (e.g., "Cronbach's Alpha" or "McDonald's Omega")
    minItemsPerGroup?: number; // Minimum items per group (default: 2, omega needs 3)
}

// Extract prefix from column name (first 2-3 letters before numbers)
function extractPrefix(colName: string): string {
    // Match letters at the start, ignore numbers at the end
    const match = colName.match(/^([A-Za-z]+)/);
    if (match) {
        return match[1].toUpperCase();
    }
    return colName.substring(0, 2).toUpperCase();
}

// Auto-group columns by prefix
function autoGroupColumns(columns: string[]): VariableGroup[] {
    const groupMap: Record<string, string[]> = {};

    columns.forEach(col => {
        const prefix = extractPrefix(col);
        if (!groupMap[prefix]) {
            groupMap[prefix] = [];
        }
        groupMap[prefix].push(col);
    });

    return Object.entries(groupMap)
        .filter(([_, cols]) => cols.length >= 2) // Only groups with 2+ items (filtered in component based on minItemsPerGroup)
        .map(([name, cols]) => ({
            name,
            columns: cols,
            selected: true
        }));
}

export function SmartGroupSelector({ columns, onAnalyzeGroup, onAnalyzeAllGroups, isAnalyzing, analysisLabel = "Cronbach's Alpha", minItemsPerGroup = 2 }: SmartGroupSelectorProps) {
    const [groups, setGroups] = useState<VariableGroup[]>([]);
    const [editingGroup, setEditingGroup] = useState<string | null>(null);
    const [editName, setEditName] = useState('');
    const [singleMode, setSingleMode] = useState(false);
    const [selectedSingleGroup, setSelectedSingleGroup] = useState<string | null>(null);

    // Auto-detect groups on mount
    useEffect(() => {
        const detectedGroups = autoGroupColumns(columns);
        setGroups(detectedGroups);
    }, [columns]);

    const toggleGroupSelection = (groupName: string) => {
        setGroups(prev => prev.map(g =>
            g.name === groupName ? { ...g, selected: !g.selected } : g
        ));
    };

    const removeColumnFromGroup = (groupName: string, col: string) => {
        setGroups(prev => prev.map(g =>
            g.name === groupName
                ? { ...g, columns: g.columns.filter(c => c !== col) }
                : g
        ).filter(g => g.columns.length >= 2));
    };

    const startEditingGroup = (group: VariableGroup) => {
        setEditingGroup(group.name);
        setEditName(group.name);
    };

    const saveGroupName = (oldName: string) => {
        if (editName.trim()) {
            setGroups(prev => prev.map(g =>
                g.name === oldName ? { ...g, name: editName.trim() } : g
            ));
        }
        setEditingGroup(null);
    };

    const handleAnalyzeAll = () => {
        const selectedGroups = groups.filter(g => g.selected && g.columns.length >= 2);
        if (selectedGroups.length === 0) {
            alert('Vui lòng chọn ít nhất 1 nhóm để phân tích');
            return;
        }
        onAnalyzeAllGroups(selectedGroups.map(g => ({ name: g.name, columns: g.columns })));
    };

    const handleAnalyzeSingle = () => {
        const group = groups.find(g => g.name === selectedSingleGroup);
        if (!group || group.columns.length < 2) {
            alert('Nhóm cần có ít nhất 2 biến');
            return;
        }
        onAnalyzeGroup(group.columns, group.name);
    };

    const selectedCount = groups.filter(g => g.selected).length;
    const ungroupedColumns = columns.filter(col =>
        !groups.some(g => g.columns.includes(col))
    );

    return (
        <div className="bg-white rounded-xl shadow-lg p-6 border">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                        <Layers className="w-5 h-5 text-blue-600" />
                        Gom nhóm biến thông minh
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                        Tự động phát hiện {groups.length} nhóm dựa trên tên biến
                    </p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setSingleMode(false)}
                        className={`px-3 py-1.5 text-sm rounded-lg ${!singleMode ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
                    >
                        Tất cả nhóm
                    </button>
                    <button
                        onClick={() => setSingleMode(true)}
                        className={`px-3 py-1.5 text-sm rounded-lg ${singleMode ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
                    >
                        Từng nhóm
                    </button>
                </div>
            </div>

            {/* Groups List */}
            <div className="space-y-3 mb-4 max-h-80 overflow-y-auto">
                {groups.map(group => (
                    <div
                        key={group.name}
                        className={`border rounded-lg p-3 transition-colors ${singleMode
                            ? selectedSingleGroup === group.name ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                            : group.selected ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                            }`}
                    >
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                                {!singleMode && (
                                    <button
                                        onClick={() => toggleGroupSelection(group.name)}
                                        className={`w-5 h-5 rounded border flex items-center justify-center ${group.selected ? 'bg-blue-600 border-blue-600 text-white' : 'border-gray-300'
                                            }`}
                                    >
                                        {group.selected && <Check className="w-4 h-4" />}
                                    </button>
                                )}
                                {singleMode && (
                                    <input
                                        type="radio"
                                        name="singleGroup"
                                        checked={selectedSingleGroup === group.name}
                                        onChange={() => setSelectedSingleGroup(group.name)}
                                        className="w-4 h-4 text-blue-600"
                                    />
                                )}

                                {editingGroup === group.name ? (
                                    <input
                                        type="text"
                                        value={editName}
                                        onChange={(e) => setEditName(e.target.value)}
                                        onBlur={() => saveGroupName(group.name)}
                                        onKeyDown={(e) => e.key === 'Enter' && saveGroupName(group.name)}
                                        className="px-2 py-1 border rounded text-sm font-bold"
                                        autoFocus
                                    />
                                ) : (
                                    <span className="font-bold text-gray-800">{group.name}</span>
                                )}
                                <span className="text-xs text-gray-500">({group.columns.length} biến)</span>
                            </div>

                            <button
                                onClick={() => startEditingGroup(group)}
                                className="text-gray-400 hover:text-blue-600"
                                title="Đổi tên nhóm"
                            >
                                <Edit2 className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="flex flex-wrap gap-1">
                            {group.columns.map(col => (
                                <span
                                    key={col}
                                    className="inline-flex items-center gap-1 px-2 py-0.5 bg-white border border-gray-200 rounded text-xs"
                                >
                                    {col}
                                    <X
                                        className="w-3 h-3 cursor-pointer hover:text-red-600"
                                        onClick={() => removeColumnFromGroup(group.name, col)}
                                    />
                                </span>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {/* Ungrouped columns warning */}
            {ungroupedColumns.length > 0 && (
                <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-800">
                        <strong>Biến chưa được gom nhóm:</strong> {ungroupedColumns.join(', ')}
                    </p>
                    <p className="text-xs text-yellow-600 mt-1">
                        (Các biến này không đủ 2 item cùng tiền tố hoặc có tên khác biệt)
                    </p>
                </div>
            )}

            {/* Analyze Buttons */}
            {singleMode ? (
                <button
                    onClick={handleAnalyzeSingle}
                    disabled={isAnalyzing || !selectedSingleGroup}
                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isAnalyzing ? 'Đang phân tích...' : `Tính ${analysisLabel} cho ${selectedSingleGroup || '...'}`}
                </button>
            ) : (
                <button
                    onClick={handleAnalyzeAll}
                    disabled={isAnalyzing || selectedCount === 0}
                    className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isAnalyzing ? 'Đang phân tích...' : `Tính ${analysisLabel} cho ${selectedCount} nhóm đã chọn`}
                </button>
            )}
        </div>
    );
}

// Keep the old VariableSelector for backward compatibility
export function VariableSelector({ columns, onAnalyze, isAnalyzing }: { columns: string[]; onAnalyze: (selectedColumns: string[], scaleName: string) => void; isAnalyzing: boolean }) {
    const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
    const [scaleName, setScaleName] = useState('');
    const [isOpen, setIsOpen] = useState(false);

    const toggleColumn = (col: string) => {
        setSelectedColumns(prev =>
            prev.includes(col)
                ? prev.filter(c => c !== col)
                : [...prev, col]
        );
    };

    const handleAnalyze = () => {
        if (selectedColumns.length < 2) {
            alert('Cần chọn ít nhất 2 biến để tính Cronbach\'s Alpha');
            return;
        }
        onAnalyze(selectedColumns, scaleName || 'Thang đo');
    };

    return (
        <div className="bg-white rounded-xl shadow-lg p-6 border">
            <h3 className="text-lg font-bold text-gray-800 mb-4">
                Chọn biến thủ công
            </h3>

            <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tên thang đo
                </label>
                <input
                    type="text"
                    value={scaleName}
                    onChange={(e) => setScaleName(e.target.value)}
                    placeholder="VD: Satisfaction, Loyalty..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
            </div>

            <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Chọn biến ({selectedColumns.length})
                </label>
                <div className="relative">
                    <button
                        type="button"
                        onClick={() => setIsOpen(!isOpen)}
                        className="w-full px-3 py-2 border rounded-lg text-left flex items-center justify-between"
                    >
                        <span>{selectedColumns.length === 0 ? 'Click để chọn...' : selectedColumns.join(', ')}</span>
                        <ChevronDown className={`w-5 h-5 ${isOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {isOpen && (
                        <div className="absolute z-10 mt-1 w-full bg-white border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                            {columns.map(col => (
                                <div key={col} onClick={() => toggleColumn(col)}
                                    className={`flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-blue-50 ${selectedColumns.includes(col) ? 'bg-blue-100' : ''}`}>
                                    <div className={`w-4 h-4 rounded border ${selectedColumns.includes(col) ? 'bg-blue-600 border-blue-600' : 'border-gray-300'}`}>
                                        {selectedColumns.includes(col) && <Check className="w-3 h-3 text-white" />}
                                    </div>
                                    {col}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <button
                onClick={handleAnalyze}
                disabled={isAnalyzing || selectedColumns.length < 2}
                className="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg disabled:opacity-50"
            >
                {isAnalyzing ? 'Đang phân tích...' : `Tính Alpha (${selectedColumns.length} biến)`}
            </button>
        </div>
    );
}

// Settings Panel for API Key
export function AISettings() {
    const [apiKey, setApiKey] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const [isSaved, setIsSaved] = useState(false);

    useEffect(() => {
        const savedKey = localStorage.getItem('gemini_api_key');
        if (savedKey) {
            setApiKey(savedKey);
        }
    }, []);

    const handleSave = () => {
        localStorage.setItem('gemini_api_key', apiKey);
        setIsSaved(true);
        window.dispatchEvent(new Event('gemini-key-updated'));
        setTimeout(() => setIsSaved(false), 2000);
    };

    const handleClear = () => {
        localStorage.removeItem('gemini_api_key');
        setApiKey('');
        window.dispatchEvent(new Event('gemini-key-updated'));
    };

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                title="Cài đặt API Key"
            >
                <Key className="w-5 h-5" />
                <span className="text-sm hidden md:inline">AI Settings</span>
                {apiKey && <span className="w-2 h-2 bg-green-500 rounded-full"></span>}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-2xl border p-4 z-50">
                    <h4 className="font-bold text-gray-800 mb-2 flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-purple-600" />
                        Gemini AI API Key
                    </h4>
                    <p className="text-xs text-gray-500 mb-3">
                        Nhập API Key Gemini của bạn để sử dụng tính năng AI giải thích.
                        Key được lưu trên máy bạn (localStorage), không gửi lên server.
                    </p>

                    <input
                        type="password"
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        placeholder="AIzaSy..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm mb-3 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    />

                    <div className="flex gap-2">
                        <button
                            onClick={handleSave}
                            className="flex-1 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg"
                        >
                            {isSaved ? '✓ Đã lưu!' : 'Lưu Key'}
                        </button>
                        {apiKey && (
                            <button
                                onClick={handleClear}
                                className="px-3 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 text-sm font-medium rounded-lg"
                            >
                                Xóa
                            </button>
                        )}
                    </div>

                    <a
                        href="https://aistudio.google.com/apikey"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block mt-3 text-xs text-blue-600 hover:underline"
                    >
                        → Lấy API Key miễn phí tại Google AI Studio
                    </a>
                </div>
            )}
        </div>
    );
}
