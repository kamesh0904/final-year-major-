import AsyncStorage from '@react-native-async-storage/async-storage';

export type NeuroProfileResult = {
    primaryProfile: string | null;
    secondaryProfile: string | null;
    categoryScores: Record<string, number>;
    questionnaireCompleted: boolean;
    updatedAt: string | null;
};

const STORAGE_PREFIX = 'neuronest_neuro_profile';

const isScoreMap = (value: unknown): value is Record<string, number> => {
    return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
};

export const normalizeProfileName = (value?: string | null) => {
    if (!value) return null;
    if (value === 'ASD' || value === 'Autism Spectrum' || value.includes('Autism')) {
        return 'Autism';
    }
    return value;
};

const normalizeCategoryScores = (value?: unknown) => {
    if (!isScoreMap(value)) return {};

    return Object.entries(value).reduce<Record<string, number>>((acc, [key, rawScore]) => {
        const normalizedKey = normalizeProfileName(key);
        if (!normalizedKey || typeof rawScore !== 'number' || !Number.isFinite(rawScore)) {
            return acc;
        }

        acc[normalizedKey] = rawScore;
        return acc;
    }, {});
};

export const buildAssessmentScores = (
    primaryProfile?: string | null,
    secondaryProfile?: string | null,
    categoryScores?: unknown
) => {
    const normalizedScores = normalizeCategoryScores(categoryScores);
    if (Object.keys(normalizedScores).length > 0) {
        return normalizedScores;
    }

    const fallbackScores: Record<string, number> = {};
    const normalizedPrimary = normalizeProfileName(primaryProfile);
    const normalizedSecondary = normalizeProfileName(secondaryProfile);

    if (normalizedPrimary) {
        fallbackScores[normalizedPrimary] = 5;
    }

    if (normalizedSecondary && normalizedSecondary !== normalizedPrimary) {
        fallbackScores[normalizedSecondary] = 3;
    }

    return fallbackScores;
};

export const createNeuroProfileResult = (
    value?: Partial<NeuroProfileResult> | null
): NeuroProfileResult => {
    const primaryProfile = normalizeProfileName(value?.primaryProfile);
    const secondaryProfile = normalizeProfileName(value?.secondaryProfile);
    const questionnaireCompleted = Boolean(
        value?.questionnaireCompleted ?? primaryProfile
    );

    return {
        primaryProfile,
        secondaryProfile,
        categoryScores: buildAssessmentScores(
            primaryProfile,
            secondaryProfile,
            value?.categoryScores
        ),
        questionnaireCompleted,
        updatedAt: value?.updatedAt ?? null,
    };
};

const buildStorageKey = (userId: string) => `${STORAGE_PREFIX}_${userId}`;

export const saveNeuroProfileResult = async (
    userId?: string | null,
    value?: Partial<NeuroProfileResult> | null
) => {
    if (!userId || !value) return;
    await AsyncStorage.setItem(
        buildStorageKey(userId),
        JSON.stringify(createNeuroProfileResult(value))
    );
};

export const loadNeuroProfileResult = async (userId?: string | null) => {
    if (!userId) return null;

    try {
        const raw = await AsyncStorage.getItem(buildStorageKey(userId));
        if (!raw) return null;

        return createNeuroProfileResult(JSON.parse(raw) as Partial<NeuroProfileResult>);
    } catch (error) {
        console.error('Error reading stored neuro profile:', error);
        return null;
    }
};
