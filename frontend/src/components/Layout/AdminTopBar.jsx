import { useAuth } from '../../context/AuthContext'
import { Bell, User, ArrowRightLeft } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAdminNotifications } from '../../context/AdminNotificationContext'

const pageTitles = {
    '/admin/dashboard': 'Admin Dashboard',
    '/admin/staff': 'Staff Management',
    '/admin/students': 'Global Students',
    '/admin/demos': 'Demo Overview',
}

function getPageTitle(pathname) {
    if (pageTitles[pathname]) return pageTitles[pathname]
    if (pathname.startsWith('/admin/students/')) return 'Student Details'
    return 'MindSeeds'
}

function AdminTopBar() {
    const { currentUser } = useAuth()
    const location = useLocation()
    const navigate = useNavigate()
    const { unreadCount, notifications, isOpen, setIsOpen } = useAdminNotifications()

    const pageTitle = getPageTitle(location.pathname)

    return (
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 sticky top-0 z-10 w-full transition-all">
            {/* Page Title */}
            <h2 className="text-lg font-semibold text-gray-800 hidden sm:block">{pageTitle}</h2>

            {/* Right Section */}
            <div className="flex items-center gap-4 ml-auto">
                {/* Mode Switcher */}
                <button
                    onClick={() => navigate('/receptionist/dashboard')}
                    className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-md border border-gray-200 text-gray-600 bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer"
                    title="Switch to Receptionist View"
                >
                    <ArrowRightLeft size={14} />
                    <span className="hidden md:inline">View as Receptionist</span>
                </button>

                {/* Admin Notification Bell */}
                <button
                    onClick={() => setIsOpen(prev => !prev)}
                    className={`relative p-2 rounded-lg transition-colors cursor-pointer ${isOpen
                            ? 'text-blue-800 bg-blue-100'
                            : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100'
                        }`}
                    aria-label={`Admin Notifications${notifications.length > 0 ? ` (${notifications.length})` : ''}`}
                    aria-expanded={isOpen}
                >
                    <Bell size={20} />
                    {notifications.length > 0 && (
                        <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none shadow-sm">
                            {unreadCount > 0 ? (unreadCount > 99 ? '99+' : unreadCount) : notifications.length > 99 ? '99+' : notifications.length}
                        </span>
                    )}
                </button>

                {/* User Info */}
                <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center bg-blue-100 text-blue-600">
                        <User size={16} />
                    </div>
                </div>
            </div>
        </header>
    )
}

export default AdminTopBar
