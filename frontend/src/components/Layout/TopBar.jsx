import { useAuth } from '../../context/AuthContext'
import { Bell, User, ArrowRightLeft } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useNotifications } from '../../context/NotificationContext'

const pageTitles = {
    // Receptionist Routes
    '/receptionist/dashboard': 'Dashboard',
    '/receptionist/students': 'Students',
    '/receptionist/students/add': 'Add Student',
    '/receptionist/demos': 'Demo Lectures',
    '/receptionist/attendance': 'Daily Attendance',
    
    // Admin Routes
    '/admin/dashboard': 'Admin Dashboard',
    '/admin/staff': 'Staff Management',
    '/admin/students': 'Global Students',
}

function getPageTitle(pathname) {
    if (pageTitles[pathname]) return pageTitles[pathname]
    if (pathname.startsWith('/receptionist/students/')) return 'Student Details'
    if (pathname.startsWith('/receptionist/demos/')) return 'Mark Attendance'
    return 'MindSeeds'
}

function TopBar() {
    const { currentUser } = useAuth()
    const location = useLocation()
    const navigate = useNavigate()
    const { unreadCount, notifications, isOpen, setIsOpen } = useNotifications()

    const pageTitle = getPageTitle(location.pathname)
    const isAdminNav = location.pathname.startsWith('/admin')

    return (
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 sticky top-0 z-10 w-full transition-all">
            {/* Page Title */}
            <h2 className="text-lg font-semibold text-gray-800 hidden sm:block">{pageTitle}</h2>

            {/* Right Section */}
            <div className="flex items-center gap-4 ml-auto">
                {/* Temporary Mode Switcher (For Demo/Dev Purposes) */}
                {currentUser?.role === 'admin' && (
                    <button
                        onClick={() => navigate(isAdminNav ? '/receptionist/dashboard' : '/admin/dashboard')}
                        className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-md border border-gray-200 text-gray-600 bg-gray-50 hover:bg-gray-100 transition-colors"
                        title={isAdminNav ? "Switch to Receptionist View" : "Switch to Admin View"}
                    >
                        <ArrowRightLeft size={14} />
                        <span className="hidden md:inline">{isAdminNav ? 'View as Receptionist' : 'View Admin Panel'}</span>
                    </button>
                )}

                {/* Notification Bell */}
                <button
                    onClick={() => setIsOpen(prev => !prev)}
                    className={`relative p-2 rounded-lg transition-colors cursor-pointer ${isOpen
                            ? 'text-slate-800 bg-slate-100'
                            : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100'
                        }`}
                    aria-label={`Notifications${notifications.length > 0 ? ` (${notifications.length})` : ''}`}
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
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        currentUser?.role === 'admin' ? 'bg-blue-100 text-blue-600' : 'bg-emerald-100 text-emerald-600'
                    }`}>
                        <User size={16} />
                    </div>
                </div>
            </div>
        </header>
    )
}

export default TopBar
