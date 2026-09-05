import { IconSprout } from './icons';

function Footer() {
    return (
        <footer className="footer">
            <div className="container footer-container">
                <div>
                    <h3 style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                        <IconSprout size={22} /> DalatAgri
                    </h3>
                    <p>
                        Hệ thống quản lý nhật ký canh tác nông nghiệp
                    </p>
                </div>

                <div>
                    <p>© 2026 DalatAgri</p>
                    <p>Đại học Đà Lạt</p>
                </div>
            </div>
        </footer>
    );
}

export default Footer;