'use client';

import React, { useMemo, useRef } from 'react';

interface Factor {
    name: string;
    indicators: string[];
}

interface StructuralPath {
    from: string;
    to: string;
    beta: number;
    pvalue: number;
}

interface FactorLoading {
    factor: string;
    indicator: string;
    loading: number;
}

interface SEMPathDiagramProps {
    factors: Factor[];
    structuralPaths: StructuralPath[];
    factorLoadings: FactorLoading[];
    width?: number;
    height?: number;
}

// Position configuration
const FACTOR_WIDTH = 100;
const FACTOR_HEIGHT = 50;
const INDICATOR_WIDTH = 70;
const INDICATOR_HEIGHT = 30;
const VERTICAL_GAP = 80;
const HORIZONTAL_GAP = 180;

export default function SEMPathDiagram({
    factors,
    structuralPaths,
    factorLoadings,
    width = 800,
    height = 500
}: SEMPathDiagramProps) {
    const svgRef = useRef<SVGSVGElement>(null);

    // Calculate positions for factors and indicators
    const layout = useMemo(() => {
        const factorPositions: Record<string, { x: number; y: number }> = {};
        const indicatorPositions: Record<string, { x: number; y: number; factorName: string }> = {};

        // Layout factors horizontally
        const startX = 100;
        const factorY = height / 2 - 20;

        factors.forEach((factor, idx) => {
            const x = startX + idx * HORIZONTAL_GAP;
            factorPositions[factor.name] = { x, y: factorY };

            // Layout indicators below each factor
            const indicatorStartX = x - ((factor.indicators.length - 1) * (INDICATOR_WIDTH + 10)) / 2;
            factor.indicators.forEach((ind, indIdx) => {
                const indX = indicatorStartX + indIdx * (INDICATOR_WIDTH + 10);
                const indY = factorY + VERTICAL_GAP + 30;
                indicatorPositions[ind] = { x: indX, y: indY, factorName: factor.name };
            });
        });

        return { factorPositions, indicatorPositions };
    }, [factors, height]);

    // Get loading value for an indicator
    const getLoading = (indicator: string) => {
        const loading = factorLoadings.find(fl => fl.indicator === indicator);
        return loading?.loading.toFixed(2) || '—';
    };

    // Format p-value
    const formatPValue = (p: number) => {
        if (p < 0.001) return '***';
        if (p < 0.01) return '**';
        if (p < 0.05) return '*';
        return '';
    };

    // Download diagram as PNG
    const downloadAsPNG = () => {
        if (!svgRef.current) return;

        const svgData = new XMLSerializer().serializeToString(svgRef.current);
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();

        canvas.width = width * 2;
        canvas.height = height * 2;

        img.onload = () => {
            ctx?.scale(2, 2);
            ctx?.drawImage(img, 0, 0);
            const pngFile = canvas.toDataURL('image/png');
            const downloadLink = document.createElement('a');
            downloadLink.download = 'sem_path_diagram.png';
            downloadLink.href = pngFile;
            downloadLink.click();
        };

        img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
    };

    return (
        <div className="relative">
            {/* Download button */}
            <button
                onClick={downloadAsPNG}
                className="absolute top-2 right-2 px-3 py-1 text-sm bg-violet-600 text-white rounded hover:bg-violet-700 transition-colors z-10"
            >
                📥 Tải PNG
            </button>

            <svg
                ref={svgRef}
                viewBox={`0 0 ${width} ${height}`}
                className="w-full border rounded-lg bg-white"
                style={{ maxHeight: '500px' }}
            >
                {/* Definitions for arrow markers */}
                <defs>
                    <marker
                        id="arrowhead"
                        markerWidth="10"
                        markerHeight="7"
                        refX="9"
                        refY="3.5"
                        orient="auto"
                    >
                        <polygon points="0 0, 10 3.5, 0 7" fill="#6366f1" />
                    </marker>
                    <marker
                        id="arrowhead-gray"
                        markerWidth="8"
                        markerHeight="6"
                        refX="7"
                        refY="3"
                        orient="auto"
                    >
                        <polygon points="0 0, 8 3, 0 6" fill="#9ca3af" />
                    </marker>
                </defs>

                {/* Title */}
                <text x={width / 2} y="25" textAnchor="middle" className="text-lg font-bold fill-gray-800">
                    SEM Path Diagram
                </text>

                {/* Draw structural paths (factor to factor) */}
                {structuralPaths.map((path, idx) => {
                    const from = layout.factorPositions[path.from];
                    const to = layout.factorPositions[path.to];
                    if (!from || !to) return null;

                    const startX = from.x + FACTOR_WIDTH / 2 + 10;
                    const startY = from.y;
                    const endX = to.x - FACTOR_WIDTH / 2 - 10;
                    const endY = to.y;
                    const midX = (startX + endX) / 2;
                    const midY = (startY + endY) / 2 - 15;

                    return (
                        <g key={`path-${idx}`}>
                            <path
                                d={`M ${startX} ${startY} Q ${midX} ${midY - 20} ${endX} ${endY}`}
                                fill="none"
                                stroke="#6366f1"
                                strokeWidth="2.5"
                                markerEnd="url(#arrowhead)"
                            />
                            <rect
                                x={midX - 25}
                                y={midY - 25}
                                width="50"
                                height="20"
                                fill="white"
                                stroke="#6366f1"
                                strokeWidth="1"
                                rx="4"
                            />
                            <text
                                x={midX}
                                y={midY - 11}
                                textAnchor="middle"
                                className="text-sm font-bold fill-violet-700"
                            >
                                β={path.beta.toFixed(2)}{formatPValue(path.pvalue)}
                            </text>
                        </g>
                    );
                })}

                {/* Draw factor loadings (factor to indicators) */}
                {Object.entries(layout.indicatorPositions).map(([indName, pos]) => {
                    const factorPos = layout.factorPositions[pos.factorName];
                    if (!factorPos) return null;

                    return (
                        <g key={`loading-${indName}`}>
                            <line
                                x1={factorPos.x}
                                y1={factorPos.y + FACTOR_HEIGHT / 2}
                                x2={pos.x}
                                y2={pos.y - INDICATOR_HEIGHT / 2}
                                stroke="#9ca3af"
                                strokeWidth="1.5"
                                markerEnd="url(#arrowhead-gray)"
                            />
                            <text
                                x={(factorPos.x + pos.x) / 2 + 12}
                                y={(factorPos.y + FACTOR_HEIGHT / 2 + pos.y - INDICATOR_HEIGHT / 2) / 2}
                                className="text-xs fill-gray-500"
                            >
                                {getLoading(indName)}
                            </text>
                        </g>
                    );
                })}

                {/* Draw factors (ovals) */}
                {Object.entries(layout.factorPositions).map(([name, pos]) => (
                    <g key={`factor-${name}`}>
                        <ellipse
                            cx={pos.x}
                            cy={pos.y}
                            rx={FACTOR_WIDTH / 2}
                            ry={FACTOR_HEIGHT / 2}
                            fill="#ede9fe"
                            stroke="#7c3aed"
                            strokeWidth="2"
                        />
                        <text
                            x={pos.x}
                            y={pos.y + 5}
                            textAnchor="middle"
                            className="text-sm font-bold fill-violet-800"
                        >
                            {name}
                        </text>
                    </g>
                ))}

                {/* Draw indicators (rectangles) */}
                {Object.entries(layout.indicatorPositions).map(([name, pos]) => (
                    <g key={`indicator-${name}`}>
                        <rect
                            x={pos.x - INDICATOR_WIDTH / 2}
                            y={pos.y - INDICATOR_HEIGHT / 2}
                            width={INDICATOR_WIDTH}
                            height={INDICATOR_HEIGHT}
                            fill="#f3f4f6"
                            stroke="#6b7280"
                            strokeWidth="1.5"
                            rx="4"
                        />
                        <text
                            x={pos.x}
                            y={pos.y + 4}
                            textAnchor="middle"
                            className="text-xs fill-gray-700"
                        >
                            {name}
                        </text>
                    </g>
                ))}

                {/* Legend */}
                <g transform={`translate(20, ${height - 60})`}>
                    <text className="text-xs fill-gray-500">Legend:</text>
                    <ellipse cx="60" cy="15" rx="15" ry="10" fill="#ede9fe" stroke="#7c3aed" />
                    <text x="85" y="19" className="text-xs fill-gray-600">Latent Factor</text>
                    <rect x="150" y="5" width="30" height="20" fill="#f3f4f6" stroke="#6b7280" rx="2" />
                    <text x="190" y="19" className="text-xs fill-gray-600">Observed Variable</text>
                    <line x1="280" y1="15" x2="310" y2="15" stroke="#6366f1" strokeWidth="2" markerEnd="url(#arrowhead)" />
                    <text x="320" y="19" className="text-xs fill-gray-600">Structural Path</text>
                </g>

                {/* Significance note */}
                <text x="20" y={height - 15} className="text-xs fill-gray-400">
                    * p &lt; .05, ** p &lt; .01, *** p &lt; .001
                </text>
            </svg>
        </div>
    );
}
