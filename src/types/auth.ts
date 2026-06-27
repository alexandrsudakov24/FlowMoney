export type User = {
    id: string;
    name: string;
    email: string;
    language?: 'en' | 'ru' | 'he';
    photoURL?: string;
    isAnonymous?: boolean;
};
