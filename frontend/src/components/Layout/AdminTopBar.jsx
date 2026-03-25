import { useAuth } from '../../context/AuthContext'
import { Bell, User, LogOut, ChevronDown } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAdminNotifications } from '../../context/AdminNotificationContext'
import { useState, useRef, useEffect } from 'react'

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
    const { currentUser, logout } = useAuth()
    const location = useLocation()
    const navigate = useNavigate()
    const { unreadCount, notifications, isOpen, setIsOpen } = useAdminNotifications()
    const [profileOpen, setProfileOpen] = useState(false)
    const profileRef = useRef(null)

    const pageTitle = getPageTitle(location.pathname)

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

    const initials = (currentUser?.name || currentUser?.username || 'A')
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

                {/* User Profile Dropdown */}
                <div className="relative pl-2 md:pl-4 border-l border-gray-200" ref={profileRef}>
                    <button
                        onClick={() => setProfileOpen(prev => !prev)}
                        className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 rounded-lg px-2 py-1.5 transition-colors"
                    >
                        <div className="w-8 h-8 rounded-full flex items-center justify-center bg-blue-100 text-blue-600 font-semibold text-sm">
                            {initials}
                        </div>
                        <ChevronDown size={14} className={`text-gray-400 transition-transform duration-200 ${profileOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {profileOpen && (
                        <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50 animate-in fade-in slide-in-from-top-1">
                            {/* Profile Info */}
                            <div className="px-4 py-3 border-b border-gray-100">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full flex items-center justify-center bg-blue-100 text-blue-600 font-bold text-sm">
                                        {initials}
                                    </div>
                                    <div className="flex flex-col min-w-0">
                                        <span className="text-sm font-semibold text-gray-900 truncate">
                                            {currentUser?.name || currentUser?.username || 'Admin'}
                                        </span>
                                        <span className="text-xs text-gray-500 capitalize">
                                            {currentUser?.role || 'Administrator'}
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

export default AdminTopBar
