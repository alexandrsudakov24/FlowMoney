import styles from '../../styles/components/Avatar.module.css';

interface AvatarProps {
    name: string;
    photoURL?: string;
    size?: 'small' | 'medium' | 'large';
}

export default function Avatar({ name, photoURL, size = 'medium' }: AvatarProps) {
    const getInitials = (fullName: string) => {
        return fullName
            .split(' ')
            .slice(0, 2)
            .map((word) => word[0]?.toUpperCase() || '')
            .join('');
    };

    const initials = getInitials(name);

    if (photoURL) {
        return (
            <img
                src={photoURL}
                alt={name}
                className={`${styles.avatar} ${styles[size]}`}
                title={name}
            />
        );
    }

    return (
        <div
            className={`${styles.avatar} ${styles.initials} ${styles[size]}`}
            title={name}
        >
            {initials}
        </div>
    );
}
