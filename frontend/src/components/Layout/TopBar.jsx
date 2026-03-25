import { useAuth } from '../../context/AuthContext'
import { Bell, User, ArrowRightLeft, LogOut, ChevronDown } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useNotifications } from '../../context/NotificationContext'
import { useState, useRef, useEffect } from 'react'

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
    const { currentUser, logout } = useAuth()
    const location = useLocation()
    const navigate = useNavigate()
    const { unreadCount, notifications, isOpen, setIsOpen } = useNotifications()
    const [profileOpen, setProfileOpen] = useState(false)
    const profileRef = useRef(null)

    const pageTitle = getPageTitle(location.pathname)
    const isAdminNav = location.pathname.startsWith('/admin')

    // Close dropdown on outside click
    useEffect(() => {
        function handleClickOutside(e) {
            if (profileRef.current && !profileRef.current.contains(e.target)) {
                setProfileOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const handleLogout = () => {
        logout()
        navigate('/login')
    }

    const initials = (currentUser?.name || currentUser?.username || 'R')
        .split(' ')
        .map(w => w[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)

    return (
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 md:px-6 sticky top-0 z-10 w-full transition-all">
            {/* Page Title */}
            <h2 className="text-lg font-semibold text-gray-800">{pageTitle}</h2>

            {/* Right Section */}
            <div className="flex items-center gap-2 md:gap-4 ml-auto">
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

                {/* User Profile Dropdown */}
                <div className="relative pl-2 md:pl-4 border-l border-gray-200" ref={profileRef}>
                    <button
                        onClick={() => setProfileOpen(prev => !prev)}
                        className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 rounded-lg px-2 py-1.5 transition-colors"
                    >
                        <div className="w-8 h-8 rounded-full flex items-center justify-center bg-emerald-100 text-emerald-600 font-semibold text-sm">
                            {initials}
                        </div>
                        <ChevronDown size={14} className={`text-gray-400 transition-transform duration-200 ${profileOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {profileOpen && (
                        <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50">
                            {/* Profile Info */}
                            <div className="px-4 py-3 border-b border-gray-100">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full flex items-center justify-center bg-emerald-100 text-emerald-600 font-bold text-sm">
                                        {initials}
                                    </div>
                                    <div className="flex flex-col min-w-0">
                                        <span className="text-sm font-semibold text-gray-900 truncate">
                                            {currentUser?.name || currentUser?.username || 'Receptionist'}
                                        </span>
                                        <span className="text-xs text-gray-500 capitalize">
                                            {currentUser?.role || 'Receptionist'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Logout */}
                            <div className="px-2 pt-2">
                                <button
                                    onClick={handleLogout}
                                    className="flex items-center gap-3 w-full px-3 py-2.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                                >
                                    <LogOut size={16} />
                                    <span>Logout</span>
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </header>
    )
}

export default TopBar
