import { Outlet } from 'react-router-dom';
import DashboardLayout from './DashboardLayout';

const DashboardRootLayout = () => {
    return (
        <DashboardLayout>
            <Outlet />
        </DashboardLayout>
    );
};

export default DashboardRootLayout;
