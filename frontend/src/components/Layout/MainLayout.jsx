import { useRef } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import TopBar from './TopBar'
import NotificationPanel from './NotificationPanel'
import MobileNavBar from './MobileNavBar'
import ScrollToTop from '../ScrollToTop'

function MainLayout() {
    const mainRef = useRef(null)

    return (
        <div className="flex min-h-screen bg-gray-50">
            <ScrollToTop scrollRef={mainRef} />
            <Sidebar />
            <div className="flex-1 flex flex-col min-w-0">
                <TopBar />
                <main ref={mainRef} className="flex-1 p-4 md:p-6 overflow-auto pb-20 md:pb-6">
                    <Outlet />
                </main>
            </div>
            {/* Global notification slide-out panel */}
            <NotificationPanel />
            {/* Mobile Navigation Bar */}
            <MobileNavBar />
        </div>
    )
}

export default MainLayout
