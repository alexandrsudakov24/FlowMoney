// Maps Firebase Auth error codes to i18n translation keys
export function firebaseErrorKey(err: unknown): string {
    const code = (err as { code?: string })?.code ?? '';
    switch (code) {
        case 'auth/email-already-in-use':
        case 'email_already_in_use':
            return 'error_email_in_use';
        case 'auth/invalid-credential':
        case 'auth/wrong-password':
        case 'auth/user-not-found':
            return 'error_invalid_credential';
        case 'auth/invalid-email':
            return 'error_invalid_email';
        case 'auth/weak-password':
            return 'error_weak_password';
        case 'auth/too-many-requests':
            return 'error_too_many_requests';
        case 'auth/network-request-failed':
            return 'error_network';
        case 'auth/popup-closed-by-user':
        case 'auth/cancelled-popup-request':
            return 'error_popup_closed';
        default:
            return 'error_unknown';
    }
}
