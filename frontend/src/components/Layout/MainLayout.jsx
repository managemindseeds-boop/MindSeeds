import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import TopBar from './TopBar'
import NotificationPanel from './NotificationPanel'

function MainLayout() {
    return (
        <div className="flex min-h-screen bg-gray-50">
            <Sidebar />
            <div className="flex-1 flex flex-col">
                <TopBar />
                <main className="flex-1 p-6 overflow-auto">
                    <Outlet />
                </main>
            </div>
            {/* Global notification slide-out panel */}
            <NotificationPanel />
        </div>
    )
}

export default MainLayout
