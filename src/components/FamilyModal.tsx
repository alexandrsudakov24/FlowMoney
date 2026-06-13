import { useState } from 'react';
import { useFamily } from '../context/FamilyContext';
import { useLanguage } from '../context/LanguageContext';
import styles from '../styles/components/FamilyModal.module.css';

interface Props {
    isOpen: boolean;
    onClose: () => void;
}

export default function FamilyModal({ isOpen, onClose }: Props) {
    const { family, familyLoading, invitations, createFamily, inviteMember, acceptInvitation, declineInvitation, leaveFamily } = useFamily();
    const { t } = useLanguage();

    const [familyNameInput, setFamilyNameInput] = useState('');
    const [inviteEmailInput, setInviteEmailInput] = useState('');
    const [inviteMsg, setInviteMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [creating, setCreating] = useState(false);
    const [inviting, setInviting] = useState(false);
    const [leaving, setLeaving] = useState(false);

    if (!isOpen) return null;

    const handleCreate = async () => {
        if (!familyNameInput.trim()) return;
        setCreating(true);
        try {
            await createFamily(familyNameInput.trim());
            setFamilyNameInput('');
        } finally {
            setCreating(false);
        }
    };

    const handleInvite = async () => {
        if (!inviteEmailInput.trim()) return;
        setInviting(true);
        setInviteMsg(null);
        try {
            const result = await inviteMember(inviteEmailInput.trim());
            if (result.success) {
                setInviteMsg({ type: 'success', text: t('invite_success') });
                setInviteEmailInput('');
            } else {
                const errKey = result.error === 'already_member'
                    ? 'invite_error_already_member'
                    : result.error === 'already_invited'
                        ? 'invite_error_already_invited'
                        : 'invite_error_already_invited';
                setInviteMsg({ type: 'error', text: t(errKey) });
            }
        } finally {
            setInviting(false);
        }
    };

    const handleLeave = async () => {
        if (!confirm(t('leave_family_confirm'))) return;
        setLeaving(true);
        try {
            await leaveFamily();
            onClose();
        } finally {
            setLeaving(false);
        }
    };

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <div className={styles.header}>
                    <h2 className={styles.title}>{t('family_budget')}</h2>
                    <button className={styles.closeBtn} onClick={onClose}>✕</button>
                </div>

                {familyLoading ? (
                    <div className={styles.loading}>...</div>
                ) : family ? (
                    /* ─── IN FAMILY ─── */
                    <div>
                        <div className={styles.familyName}>{family.name}</div>

                        <div className={styles.section}>
                            <h3 className={styles.sectionTitle}>{t('members')}</h3>
                            <ul className={styles.memberList}>
                                {family.members.map((m) => (
                                    <li key={m.uid} className={styles.memberItem}>
                                        <div className={styles.memberAvatar}>
                                            {m.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div className={styles.memberInfo}>
                                            <span className={styles.memberName}>{m.name}</span>
                                            <span className={styles.memberEmail}>{m.email}</span>
                                        </div>
                                        {m.uid === family.ownerId && (
                                            <span className={styles.ownerBadge}>{t('owner')}</span>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className={styles.section}>
                            <h3 className={styles.sectionTitle}>{t('invite_member')}</h3>
                            <div className={styles.inviteRow}>
                                <input
                                    className={styles.input}
                                    type="email"
                                    placeholder={t('invite_email_placeholder')}
                                    value={inviteEmailInput}
                                    onChange={(e) => {
                                        setInviteEmailInput(e.target.value);
                                        setInviteMsg(null);
                                    }}
                                    onKeyDown={(e) => e.key === 'Enter' && handleInvite()}
                                />
                                <button
                                    className={styles.inviteBtn}
                                    onClick={handleInvite}
                                    disabled={inviting || !inviteEmailInput.trim()}
                                >
                                    {t('invite')}
                                </button>
                            </div>
                            {inviteMsg && (
                                <p className={inviteMsg.type === 'success' ? styles.msgSuccess : styles.msgError}>
                                    {inviteMsg.text}
                                </p>
                            )}
                        </div>

                        <button
                            className={styles.leaveBtn}
                            onClick={handleLeave}
                            disabled={leaving}
                        >
                            {t('leave_family')}
                        </button>
                    </div>
                ) : (
                    /* ─── NO FAMILY ─── */
                    <div>
                        <div className={styles.section}>
                            <h3 className={styles.sectionTitle}>{t('create_family')}</h3>
                            <div className={styles.inviteRow}>
                                <input
                                    className={styles.input}
                                    type="text"
                                    placeholder={t('family_name_placeholder')}
                                    value={familyNameInput}
                                    onChange={(e) => setFamilyNameInput(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                                />
                                <button
                                    className={styles.inviteBtn}
                                    onClick={handleCreate}
                                    disabled={creating || !familyNameInput.trim()}
                                >
                                    {t('create_family')}
                                </button>
                            </div>
                        </div>

                        {invitations.length > 0 && (
                            <div className={styles.section}>
                                <h3 className={styles.sectionTitle}>{t('pending_invitations')}</h3>
                                <ul className={styles.invitationList}>
                                    {invitations.map((inv) => (
                                        <li key={inv.id} className={styles.invitationItem}>
                                            <div className={styles.invitationInfo}>
                                                <strong>{inv.familyName}</strong>
                                                <span className={styles.invitedBy}>
                                                    {t('invited_by')}: {inv.invitedByName}
                                                </span>
                                            </div>
                                            <div className={styles.invitationActions}>
                                                <button
                                                    className={styles.acceptBtn}
                                                    onClick={() => acceptInvitation(inv.id)}
                                                >
                                                    {t('accept')}
                                                </button>
                                                <button
                                                    className={styles.declineBtn}
                                                    onClick={() => declineInvitation(inv.id)}
                                                >
                                                    {t('decline')}
                                                </button>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {invitations.length === 0 && (
                            <p className={styles.noInvitations}>{t('no_invitations')}</p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
