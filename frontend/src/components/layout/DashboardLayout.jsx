import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

export default function DashboardLayout() {
    return (
        <div className="flex min-h-screen bg-surface-950">
            <Sidebar />
            <div className="flex-1 ml-64 transition-all duration-300">
                <Navbar />
                <main className="p-6">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
