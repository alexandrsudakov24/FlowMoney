export default function ProfilePage() {
    return (
        <div className="page">
            <h2>Profile</h2>
            <div className="card" style={{ maxWidth: '500px' }}>
                <h3 style={{ marginBottom: '16px' }}>About FlowMoney</h3>
                <p style={{ margin: '0 0 12px 0', color: '#718096' }}>
                    FlowMoney is a modern, lightweight expense tracker designed to help you manage your finances efficiently.
                </p>
                <h3 style={{ marginBottom: '16px', marginTop: '20px' }}>Key Features</h3>
                <ul style={{ margin: '0 0 12px 0', color: '#718096', paddingLeft: '20px' }}>
                    <li>Completely offline - your data stays on your device</li>
                    <li>Local storage - no cloud required</li>
                    <li>Visual analytics with charts and graphs</li>
                    <li>Organize expenses by category</li>
                    <li>Modern, clean interface</li>
                </ul>
                <h3 style={{ marginBottom: '16px', marginTop: '20px' }}>Privacy</h3>
                <p style={{ margin: '0', color: '#718096' }}>
                    All your expense data is stored locally in your browser. We never collect, store, or transmit any personal information to external servers.
                </p>
            </div>
        </div>
    );
}
