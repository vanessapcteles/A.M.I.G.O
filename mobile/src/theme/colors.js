import { useColorScheme } from 'react-native';

const lightColors = {
    // Brand
    primary: '#38bdf8', // Sky 400
    primaryDark: '#0284c7', // Sky 600
    secondary: '#6366f1', // Indigo 500
    accent: '#f472b6', // Pink 400

    // Dashboard Cards
    cardBlue: '#3E3B6D',
    cardPink: '#B93988',

    // UI
    background: '#FFFFFF', // White
    surface: '#F8FAFC',    // Slate 50
    surfaceLight: '#E2E8F0', // Slate 200

    // Text
    text: '#1E293B',       // Slate 800
    textLight: '#64748B',  // Slate 500
    textInverted: '#FFFFFF', // White text for colored cards

    // Borders
    border: '#E2E8F0',

    // Status
    error: '#ef4444',      // Red 500
    success: '#22c55e',    // Green 500
    warning: '#eab308',    // Yellow 500

    // Semantic Icon Backgrounds
    iconBgPrimary: '#e0f2fe',
    iconBgSecondary: '#e0e7ff',
    iconBgSuccess: '#dcfce7',
    iconBgWarning: '#fef9c3',
    iconBgError: '#fee2e2',
};

const darkColors = {
    // Brand
    primary: '#38bdf8', // Sky 400
    primaryDark: '#0284c7', // Sky 600
    secondary: '#6366f1', // Indigo 500
    accent: '#f472b6', // Pink 400

    // Dashboard Cards - Maintain vibrancy or slightly darken if needed, but these are brand colors
    cardBlue: '#3E3B6D',
    cardPink: '#B93988',

    // UI
    background: '#020617', // Deep Dark Blue (Main BG)
    surface: '#1e293b',    // Slate 800 (Cards)
    surfaceLight: '#334155', // Slate 700 (Inputs)

    // Text
    text: '#f8fafc',       // Slate 50
    textLight: '#94a3b8',  // Slate 400
    textInverted: '#FFFFFF',

    // Borders
    border: 'rgba(255,255,255,0.1)',

    // Status (Lighter for dark mode visibility)
    error: '#f87171',      // Red 400
    success: '#4ade80',    // Green 400
    warning: '#fbbf24',    // Amber 400

    // Semantic Icon Backgrounds - adjusted opacity for dark mode
    iconBgPrimary: 'rgba(56, 189, 248, 0.15)',
    iconBgSecondary: 'rgba(99, 102, 241, 0.15)',
    iconBgSuccess: 'rgba(74, 222, 128, 0.15)',
    iconBgWarning: 'rgba(251, 191, 36, 0.15)',
    iconBgError: 'rgba(248, 113, 113, 0.15)',
};

export const colors = lightColors; // Default export for compatibility if needed, though usage should switch to hook

export const useThemeColors = () => {
    const scheme = useColorScheme();
    return scheme === 'dark' ? darkColors : lightColors;
};

export const layout = {
    padding: 20,
    borderRadius: 12,
};
