// A user document as seen from the admin panel.
export interface AdminUserRecord {
    id: string;
    name: string;
    email: string;
    language?: string;
    familyId?: string;
    createdAt?: number;
}
