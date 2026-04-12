/**
 * NeuroNest Mobile Theme
 * Exact colors extracted from frontend/src/index.css
 * Keep this file as the single source of truth for all colors.
 */

// ─── Background Gradients ─────────────────────────────────────────────────────
export const BG_GRADIENT = ['#0a0514', '#1a0b2e', '#0f0619'] as const;

// ─── Accent Gradients (from index.css) ────────────────────────────────────────
export const GRADIENT_CALM = ['#667eea', '#764ba2'] as const; // .bg-gradient-calm
export const GRADIENT_WARM = ['#f093fb', '#f5576c'] as const; // .bg-gradient-warm
export const GRADIENT_NATURE = ['#4facfe', '#00f2fe'] as const; // .bg-gradient-nature
export const GRADIENT_PRIMARY = ['#6366F1', '#8B5CF6'] as const; // indigo→purple (btn-calm)
export const GRADIENT_PINK = ['#EC4899', '#8B5CF6'] as const; // pink→purple accent
export const PROGRESS_GRADIENT = ['#6366F1', '#A855F7', '#EC4899'] as const;

// ─── Solid Accent Colors ──────────────────────────────────────────────────────
export const COLOR = {
    // Primary purple family
    purple400: '#C084FC',
    purple500: '#A855F7',
    purple600: '#9333EA',

    // Indigo family (btn-calm)
    indigo400: '#818CF8',
    indigo500: '#6366F1',

    // Pink family
    pink400: '#F472B6',
    pink500: '#EC4899',

    // Emerald (online / safe)
    emerald400: '#34D399',
    emerald500: '#10B981',

    // Amber / gold
    amber400: '#FBBF24',
    amber500: '#F59E0B',

    // Text
    white: '#FFFFFF',
    textPrimary: '#e9e7ff',  // body color from index.css
    textMuted: '#D1D5DB',
    textFaint: '#9CA3AF',

    // Glow / shadow
    glowPurple: 'rgba(139, 92, 246, 0.4)',
    glowIndigo: 'rgba(99, 102, 241, 0.3)',
};

// ─── Glass Morphism (from .glass in index.css) ────────────────────────────────
export const GLASS = {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderColor: 'rgba(255, 255, 255, 0.10)',
    borderWidth: 1,
    borderRadius: 24,
};

export const GLASS_DARK = {
    backgroundColor: 'rgba(0, 0, 0, 0.20)',
    borderColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
};

// ─── Floating Orb Colors (subtle blobs behind UI) ─────────────────────────────
export const ORB = {
    purple: 'rgba(139, 92, 246, 0.08)',
    indigo: 'rgba(99, 102, 241, 0.08)',
    pink: 'rgba(236, 72, 153, 0.08)',
};
