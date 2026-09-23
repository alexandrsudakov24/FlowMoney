import { addDoc, collection, deleteDoc, doc, getDocs, limit, orderBy, query } from 'firebase/firestore';
import { db } from '../firebase';
import type { Feedback, User } from '../types';

export async function sendFeedback(user: User, message: string): Promise<void> {
    await addDoc(collection(db, 'feedback'), {
        userId: user.id,
        name: user.name || '',
        email: user.email || '',
        message: message.trim(),
        createdAt: Date.now(),
    });
}

// Newest first, capped so the admin panel doesn't pull the whole collection.
export async function fetchFeedback(max = 100): Promise<Feedback[]> {
    const snap = await getDocs(query(collection(db, 'feedback'), orderBy('createdAt', 'desc'), limit(max)));
    return snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<Feedback, 'id'>),
    }));
}

export async function deleteFeedback(id: string): Promise<void> {
    await deleteDoc(doc(db, 'feedback', id));
}
