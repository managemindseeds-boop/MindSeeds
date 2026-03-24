import { Outlet } from 'react-router-dom'
import AdminSidebar from './AdminSidebar'
import AdminTopBar from './AdminTopBar'
import AdminNotificationPanel from './AdminNotificationPanel'
import MobileNavBar from './MobileNavBar'

function AdminLayout() {
    return (
        <div className="flex min-h-screen bg-gray-50">
            <AdminSidebar />
            <div className="flex-1 flex flex-col min-w-0">
                <AdminTopBar />
                <main className="flex-1 p-4 md:p-6 overflow-auto pb-20 md:pb-6">
                    <Outlet />
                </main>
            </div>
            {/* Admin-specific notification panel */}
            <AdminNotificationPanel />
            {/* Mobile Navigation Bar */}
            <MobileNavBar isAdmin={true} />
        </div>
    )
}

export default AdminLayout
