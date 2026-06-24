import type { TranslationKeys } from '../i18n';

export function getCatLabel(cat: string, t: (key: TranslationKeys) => string): string {
    const key = `cat_${cat.toLowerCase()}` as TranslationKeys;
    const translated = t(key);
    // fall back to raw category name for user-created categories without a translation key
    return translated !== key ? translated : cat;
}
