import en from './en';
import ru from './ru';
import he from './he';

export type Language = 'en' | 'ru' | 'he';
export type { TranslationKeys } from './en';

export const translations = { en, ru, he } as const;
