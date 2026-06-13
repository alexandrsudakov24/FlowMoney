export interface Expense {
    id: string;
    amount: number;
    category: string;
    date: string; // YYYY-MM-DD
    note?: string;
    type: 'expense' | 'income';
    addedBy?: { uid: string; name: string };
}

export interface FamilyMember {
    uid: string;
    email: string;
    name: string;
}

export interface Family {
    id: string;
    name: string;
    ownerId: string;
    members: FamilyMember[];
}

export interface Invitation {
    id: string;
    familyId: string;
    familyName: string;
    invitedEmail: string;
    invitedByName: string;
    status: 'pending' | 'accepted' | 'declined';
    createdAt: number;
}
