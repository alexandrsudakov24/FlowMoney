import { addDoc, collection } from 'firebase/firestore';
import { db } from '../firebase';
import type { User } from '../types';

export async function sendFeedback(user: User, message: string): Promise<void> {
    await addDoc(collection(db, 'feedback'), {
        userId: user.id,
        name: user.name || '',
        email: user.email || '',
        message: message.trim(),
        createdAt: Date.now(),
    });
}
