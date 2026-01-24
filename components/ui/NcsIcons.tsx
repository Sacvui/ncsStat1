import React from 'react';

interface IconProps {
    className?: string;
    size?: number;
    strokeWidth?: number;
}

const BaseIcon: React.FC<IconProps & { children: React.ReactNode, viewBox?: string }> = ({
    className = "",
    size = 24,
    strokeWidth = 2,
    viewBox = "0 0 24 24",
    children
}) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox={viewBox}
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
    >
        {children}
    </svg>
);

export const NcsIconSpeed: React.FC<IconProps> = (props) => (
    <BaseIcon {...props}>
        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" className="text-blue-600" fill="currentColor" fillOpacity="0.1" stroke="currentColor" />
        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" strokeLinecap="round" strokeLinejoin="round" />
    </BaseIcon>
);

export const NcsIconAI: React.FC<IconProps> = (props) => (
    <BaseIcon {...props}>
        <path d="M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" fill="currentColor" fillOpacity="0.1" />
        <path d="M12 8V4" />
        <path d="M12 20v-4" />
        <path d="M20 12h-4" />
        <path d="M8 12H4" />
        <path d="M18.364 5.636l-2.828 2.828" />
        <path d="M8.464 15.536l-2.828 2.828" />
        <path d="M5.636 5.636l2.828 2.828" />
        <path d="M15.536 15.536l2.828 2.828" />
    </BaseIcon>
);

export const NcsIconSecurity: React.FC<IconProps> = (props) => (
    <BaseIcon {...props}>
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" fill="currentColor" fillOpacity="0.1" />
        <path d="M9 12l2 2 4-4" />
    </BaseIcon>
);

export const NcsIconReliability: React.FC<IconProps> = (props) => (
    <BaseIcon {...props}>
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
        <path d="M22 4L12 14.01l-3-3" />
        <circle cx="12" cy="12" r="6" fill="currentColor" fillOpacity="0.1" stroke="none" />
    </BaseIcon>
);

export const NcsIconEFA: React.FC<IconProps> = (props) => (
    <BaseIcon {...props}>
        <circle cx="5" cy="5" r="2" />
        <circle cx="19" cy="5" r="2" />
        <circle cx="5" cy="19" r="2" />
        <circle cx="19" cy="19" r="2" />
        <path d="M5 17v-2" strokeDasharray="2 2" />
        <path d="M17 5h2" strokeDasharray="2 2" />
        <path d="M7 5h10" />
        <path d="M5 7v10" />
        <path d="M7 19h10" />
        <path d="M19 7v10" />
        <rect x="8" y="8" width="8" height="8" rx="2" fill="currentColor" fillOpacity="0.1" stroke="none" />
    </BaseIcon>
);

export const NcsIconCFA: React.FC<IconProps> = (props) => (
    <BaseIcon {...props}>
        <circle cx="12" cy="5" r="3" />
        <rect x="4" y="14" width="4" height="4" rx="1" />
        <rect x="10" y="14" width="4" height="4" rx="1" />
        <rect x="16" y="14" width="4" height="4" rx="1" />
        <path d="M12 8v6" />
        <path d="M9.5 7.5L6 14" />
        <path d="M14.5 7.5L18 14" />
    </BaseIcon>
);

export const NcsIconSEM: React.FC<IconProps> = (props) => (
    <BaseIcon {...props}>
        <circle cx="6" cy="6" r="3" />
        <circle cx="18" cy="18" r="3" />
        <path d="M9 9l6 6" />
        <path d="M15 9l-6 6" strokeDasharray="2 2" />
        <circle cx="18" cy="6" r="2" fill="currentColor" fillOpacity="0.1" />
        <circle cx="6" cy="18" r="2" fill="currentColor" fillOpacity="0.1" />
    </BaseIcon>
);

export const NcsIconRegression: React.FC<IconProps> = (props) => (
    <BaseIcon {...props}>
        <path d="M3 21h18" />
        <path d="M3 21l16-16" />
        <circle cx="10" cy="10" r="2" fill="currentColor" fillOpacity="0.2" stroke="none" />
        <path d="M8 15h.01" strokeWidth="3" />
        <path d="M12 8h.01" strokeWidth="3" />
        <path d="M16 6h.01" strokeWidth="3" />
        <path d="M6 18h.01" strokeWidth="3" />
    </BaseIcon>
);

export const NcsIconComparison: React.FC<IconProps> = (props) => (
    <BaseIcon {...props}>
        <path d="M18 20V10" />
        <path d="M12 20V4" />
        <path d="M6 20v-6" />
        <path d="M3 20h18" />
        <circle cx="12" cy="4" r="2" fill="currentColor" fillOpacity="0.1" />
    </BaseIcon>
);

export const NcsIconCorrelation: React.FC<IconProps> = (props) => (
    <BaseIcon {...props}>
        <circle cx="8" cy="8" r="3" />
        <circle cx="16" cy="16" r="3" />
        <path d="M10.5 10.5l3 3" />
        <path d="M8 16a8 8 0 0 1 8-8" strokeDasharray="3 3" />
    </BaseIcon>
);

export const NcsIconNonParam: React.FC<IconProps> = (props) => (
    <BaseIcon {...props}>
        <path d="M3 12a9 9 0 1 0 18 0" strokeOpacity="0.2" />
        <path d="M3 12c0 5 4 9 9 9s9-4 9-9" />
        <path d="M12 3v18" strokeDasharray="2 2" />
        <circle cx="12" cy="12" r="4" fill="currentColor" fillOpacity="0.1" stroke="none" />
    </BaseIcon>
);
