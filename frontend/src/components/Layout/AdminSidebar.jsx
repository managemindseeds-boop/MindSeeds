import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import {
    LayoutDashboard,
    Users,
    UsersRound,
    LogOut,
    ChevronLeft,
    ChevronRight
} from 'lucide-react'
import { useState } from 'react'

const navItems = [
    { label: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
    { label: 'Staff Directory', path: '/admin/staff', icon: UsersRound },
    { label: 'All Students', path: '/admin/students', icon: Users },
]

function AdminSidebar() {
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
                h-screen sticky top-0 bg-blue-950 text-white flex-col transition-all duration-300 ease-in-out z-20`}
        >
            {/* Logo / Brand */}
            <div className="flex items-center justify-between px-5 py-6 border-b border-blue-900">
                {!collapsed && (
                    <div className="flex flex-col">
                        <h1 className="text-xl font-bold tracking-wide">
                            Mind<span className="text-blue-400">Seeds</span>
                        </h1>
                        <span className="text-xs text-blue-300 font-medium tracking-widest uppercase mt-1">Admin Portal</span>
                    </div>
                )}
                <button
                    onClick={() => setCollapsed(!collapsed)}
                    className="text-blue-300 hover:text-white transition-colors cursor-pointer"
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
                                ? 'bg-blue-500/20 text-blue-400'
                                : 'text-blue-200 hover:bg-blue-900 hover:text-white'
                            }`
                        }
                    >
                        <item.icon size={20} />
                        {!collapsed && <span>{item.label}</span>}
                    </NavLink>
                ))}
            </nav>

            {/* Admin Badge */}
            {!collapsed && (
                <div className="px-5 py-3 mb-2 mx-3 bg-blue-900/50 rounded-lg border border-blue-800/50">
                     <div className="flex items-center gap-3">
                         <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-sm">
                             A
                         </div>
                         <div className="flex flex-col">
                             <span className="text-sm font-medium text-white">Administrator</span>
                             <span className="text-xs text-blue-300">Super User</span>
                         </div>
                     </div>
                </div>
            )}

            {/* Logout */}
            <div className="px-3 py-4 border-t border-blue-900">
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium text-blue-300 hover:bg-red-500/10 hover:text-red-400 transition-all duration-200 w-full cursor-pointer"
                >
                    <LogOut size={20} />
                    {!collapsed && <span>Logout</span>}
                </button>
            </div>
        </aside>
    )
}

export default AdminSidebar
