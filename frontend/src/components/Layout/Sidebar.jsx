import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import {
    LayoutDashboard,
    Users,
    CalendarCheck,
    IndianRupee,
    LogOut,
    ChevronLeft,
    ChevronRight
} from 'lucide-react'
import { useState } from 'react'

const navItems = [
    { label: 'Dashboard', path: '/receptionist/dashboard', icon: LayoutDashboard },
    { label: 'Students', path: '/receptionist/students', icon: Users },
    { label: 'Demo Lectures', path: '/receptionist/demos', icon: CalendarCheck },
]

function Sidebar() {
    const { logout } = useAuth()
    const navigate = useNavigate()
    const [collapsed, setCollapsed] = useState(false)

    const handleLogout = () => {
        logout()
        navigate('/login')
    }

    return (
        <aside
            className={`hidden md:flex ${collapsed ? 'w-20' : 'w-64'} 
                h-screen sticky top-0 bg-black text-white flex-col transition-all duration-300 ease-in-out z-20`}
        >
            {/* Logo / Brand */}
            <div className="flex items-center justify-between px-5 py-6 border-b border-gray-800">
                {!collapsed && (
                    <h1 className="text-xl font-bold tracking-wide">
                        Mind<span className="text-emerald-400">Seeds</span>
                    </h1>
                )}
                <button
                    onClick={() => setCollapsed(!collapsed)}
                    className="text-gray-400 hover:text-white transition-colors cursor-pointer"
                >
                    {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
                </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-3 py-4 space-y-1">
                {navItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) =>
                            `flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-all duration-200
                            ${isActive
                                ? 'bg-emerald-500/20 text-emerald-400'
                                : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                            }`
                        }
                    >
                        <item.icon size={20} />
                        {!collapsed && <span>{item.label}</span>}
                    </NavLink>
                ))}
            </nav>

            {/* Logout */}
            <div className="px-3 py-4 border-t border-gray-800">
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium text-gray-400 hover:bg-red-500/10 hover:text-red-400 transition-all duration-200 w-full cursor-pointer"
                >
                    <LogOut size={20} />
                    {!collapsed && <span>Logout</span>}
                </button>
            </div>
        </aside>
    )
}

export default Sidebar
