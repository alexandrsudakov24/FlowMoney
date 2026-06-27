import {
    addDoc,
    arrayRemove,
    arrayUnion,
    collection,
    deleteDoc,
    deleteField,
    doc,
    getDoc,
    getDocs,
    query,
    updateDoc,
    where,
    writeBatch,
    type UpdateData,
} from 'firebase/firestore';
import { db } from '../firebase';
import type { Family, FamilyMember } from '../types';
import type { User } from '../types';

export async function createFamily(user: User, name: string): Promise<Family> {
    const member: FamilyMember = { uid: user.id, email: user.email, name: user.name };
    const docRef = await addDoc(collection(db, 'families'), {
        name: name.trim(),
        ownerId: user.id,
        members: [member],
    });
    await updateDoc(doc(db, 'users', user.id), { familyId: docRef.id });
    return { id: docRef.id, name: name.trim(), ownerId: user.id, members: [member] };
}

export async function inviteMember(
    user: User,
    family: Family,
    email: string,
): Promise<{ success: boolean; error?: string }> {
    const trimmedEmail = email.trim().toLowerCase();

    if (family.members.some((m) => m.email.toLowerCase() === trimmedEmail)) {
        return { success: false, error: 'already_member' };
    }

    // Single-field query to avoid composite index; filter client-side
    const existingQ = query(
        collection(db, 'invitations'),
        where('invitedEmail', '==', trimmedEmail),
    );
    const existing = await getDocs(existingQ);
    if (existing.docs.some((d) => d.data().familyId === family.id && d.data().status === 'pending')) {
        return { success: false, error: 'already_invited' };
    }

    await addDoc(collection(db, 'invitations'), {
        familyId: family.id,
        familyName: family.name,
        invitedEmail: trimmedEmail,
        invitedByUid: user.id,
        invitedByName: user.name,
        status: 'pending',
        createdAt: Date.now(),
    });

    return { success: true };
}

export async function acceptInvitation(user: User, invitationId: string): Promise<Family | null> {
    const invRef = doc(db, 'invitations', invitationId);
    const invSnap = await getDoc(invRef);
    if (!invSnap.exists()) return null;
    const inv = invSnap.data();

    const member: FamilyMember = { uid: user.id, email: user.email, name: user.name };
    const batch = writeBatch(db);
    batch.update(doc(db, 'families', inv.familyId), { members: arrayUnion(member) });
    batch.update(doc(db, 'users', user.id), { familyId: inv.familyId });
    batch.update(invRef, { status: 'accepted' });
    await batch.commit();

    const familySnap = await getDoc(doc(db, 'families', inv.familyId));
    if (!familySnap.exists()) return null;
    return { id: familySnap.id, ...(familySnap.data() as Omit<Family, 'id'>) };
}

export async function declineInvitation(invitationId: string): Promise<void> {
    await updateDoc(doc(db, 'invitations', invitationId), { status: 'declined' });
}

export async function leaveFamily(user: User, family: Family): Promise<void> {
    const member = family.members.find((m) => m.uid === user.id);
    if (!member) return;

    const remainingMembers = family.members.filter((m) => m.uid !== user.id);
    const batch = writeBatch(db);

    if (remainingMembers.length > 0) {
        const updateData: UpdateData<Family> = { members: arrayRemove(member) };
        if (family.ownerId === user.id) {
            updateData.ownerId = remainingMembers[0].uid;
        }
        batch.update(doc(db, 'families', family.id), updateData);
    }

    batch.update(doc(db, 'users', user.id), { familyId: deleteField() });
    await batch.commit();

    if (remainingMembers.length === 0) {
        await deleteDoc(doc(db, 'families', family.id));
    }
}
