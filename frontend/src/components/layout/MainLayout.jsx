import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';

const MainLayout = () => {
    return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            <Navbar />
            <div style={{ flex: 1, paddingTop: '80px' }}>
                <Outlet />
            </div>
        </div>
    );
};

export default MainLayout;
