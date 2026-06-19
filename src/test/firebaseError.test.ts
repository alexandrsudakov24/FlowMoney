import { describe, it, expect } from 'vitest';
import { firebaseErrorKey } from '../utils/firebaseError';

describe('firebaseErrorKey', () => {
    it('maps auth/email-already-in-use', () => {
        expect(firebaseErrorKey({ code: 'auth/email-already-in-use' })).toBe('error_email_in_use');
    });

    it('maps auth/invalid-credential', () => {
        expect(firebaseErrorKey({ code: 'auth/invalid-credential' })).toBe('error_invalid_credential');
    });

    it('maps auth/wrong-password', () => {
        expect(firebaseErrorKey({ code: 'auth/wrong-password' })).toBe('error_invalid_credential');
    });

    it('maps auth/user-not-found', () => {
        expect(firebaseErrorKey({ code: 'auth/user-not-found' })).toBe('error_invalid_credential');
    });

    it('maps auth/invalid-email', () => {
        expect(firebaseErrorKey({ code: 'auth/invalid-email' })).toBe('error_invalid_email');
    });

    it('maps auth/weak-password', () => {
        expect(firebaseErrorKey({ code: 'auth/weak-password' })).toBe('error_weak_password');
    });

    it('maps auth/too-many-requests', () => {
        expect(firebaseErrorKey({ code: 'auth/too-many-requests' })).toBe('error_too_many_requests');
    });

    it('maps auth/network-request-failed', () => {
        expect(firebaseErrorKey({ code: 'auth/network-request-failed' })).toBe('error_network');
    });

    it('maps auth/popup-closed-by-user', () => {
        expect(firebaseErrorKey({ code: 'auth/popup-closed-by-user' })).toBe('error_popup_closed');
    });

    it('maps auth/cancelled-popup-request', () => {
        expect(firebaseErrorKey({ code: 'auth/cancelled-popup-request' })).toBe('error_popup_closed');
    });

    it('returns error_unknown for unrecognised code', () => {
        expect(firebaseErrorKey({ code: 'auth/some-other-error' })).toBe('error_unknown');
    });

    it('returns error_unknown when err has no code', () => {
        expect(firebaseErrorKey({})).toBe('error_unknown');
    });

    it('returns error_unknown for non-object error', () => {
        expect(firebaseErrorKey(null)).toBe('error_unknown');
        expect(firebaseErrorKey('string')).toBe('error_unknown');
    });
});
