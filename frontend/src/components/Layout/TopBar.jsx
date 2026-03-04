import { useAuth } from '../../context/AuthContext'
import { Bell, User } from 'lucide-react'
import { useLocation } from 'react-router-dom'

const pageTitles = {
    '/receptionist/dashboard': 'Dashboard',
    '/receptionist/students': 'Students',
    '/receptionist/demos': 'Demo Lectures',
    '/receptionist/admissions': 'Admissions',
    '/receptionist/fees': 'Fees',
}

function TopBar() {
    const { currentUser } = useAuth()
    const location = useLocation()

    const pageTitle = pageTitles[location.pathname] || 'MindSeeds'

    return (
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
            {/* Page Title */}
            <h2 className="text-lg font-semibold text-gray-800">{pageTitle}</h2>

            {/* Right Section */}
            <div className="flex items-center gap-4">
                {/* Notification Bell */}
                <button className="relative p-2 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer">
                    <Bell size={20} />
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
                </button>

                {/* User Info */}
                <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
                    <div className="w-8 h-8 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center">
                        <User size={16} />
                    </div>
                    <div className="hidden sm:block">
                        <p className="text-sm font-medium text-gray-800">{currentUser?.name}</p>
                        <p className="text-xs text-gray-500 capitalize">{currentUser?.role}</p>
                    </div>
                </div>
            </div>
        </header>
    )
}

export default TopBar
