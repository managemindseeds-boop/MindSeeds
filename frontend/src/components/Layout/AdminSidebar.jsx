import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import {
    LayoutDashboard,
    Users,
    UsersRound,
    BookOpen,
    ClipboardCheck,
    LogOut,
    ChevronLeft,
    ChevronRight
} from 'lucide-react'
import { useState } from 'react'

const navItems = [
    { label: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
    { label: 'Students', path: '/admin/students', icon: Users },
    { label: 'Demos', path: '/admin/demos', icon: BookOpen },
    { label: 'Staff', path: '/admin/staff', icon: UsersRound },
    { label: 'Staff Attendance', path: '/admin/staff-attendance', icon: ClipboardCheck },
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
                h-screen sticky top-0 bg-[#5e3174] text-white flex-col transition-all duration-300 ease-in-out z-20 overflow-hidden`}
        >
            {/* Logo / Brand */}
            <div className={`flex items-center py-6 min-h-[73px] transition-all duration-300 ${collapsed ? 'justify-center px-0 gap-1' : 'justify-between px-5'}`}>
                <div className="flex items-center shrink-0">
                    <img src="/4.svg" alt="MindSeeds" className="h-9 w-9 object-contain" />
                    <div className={`flex flex-col pt-0.5 overflow-hidden whitespace-nowrap transition-all duration-300 ${collapsed ? 'w-0 opacity-0 ml-0' : 'w-[130px] opacity-100 ml-2.5'}`}>
                        <span className="font-extrabold text-[15px] tracking-wide leading-none">MINDSEEDS</span>
                        <div className="flex items-center gap-1.5 mt-1">
                            <span className="font-semibold text-[10px] tracking-[0.15em] text-[#d4b5e6] leading-none">TUTORIALS</span>
                            <span className="w-0.5 h-0.5 rounded-full bg-white/50"></span>
                            <span className="font-bold text-[8px] tracking-widest uppercase text-white opacity-90 leading-none">Admin</span>
                        </div>
                    </div>
                </div>
                <button
                    onClick={() => setCollapsed(!collapsed)}
                    className="flex shrink-0 items-center justify-center text-[#d4b5e6] hover:text-white hover:bg-white/10 p-1 rounded transition-colors cursor-pointer"
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
                            `flex items-center rounded-lg text-sm font-medium transition-colors overflow-hidden whitespace-nowrap
                            ${isActive
                                ? 'bg-white/15 text-white'
                                : 'text-[#d4b5e6] hover:bg-[#4a2860] hover:text-white'
                            }`
                        }
                    >
                        <div className="w-[56px] h-[48px] shrink-0 flex items-center justify-center">
                            <item.icon size={20} />
                        </div>
                        <span className={`transition-opacity duration-300 pr-4 ${collapsed ? 'opacity-0' : 'opacity-100'}`}>
                            {item.label}
                        </span>
                    </NavLink>
                ))}
            </nav>

            {/* Logout */}
            <div className="px-3 py-4 border-t border-[#4a2860]">
                <button
                    onClick={handleLogout}
                    className="flex items-center rounded-lg text-sm font-medium text-[#d4b5e6] hover:bg-red-500/10 hover:text-red-400 transition-colors w-full cursor-pointer overflow-hidden whitespace-nowrap"
                >
                    <div className="w-[56px] h-[48px] shrink-0 flex items-center justify-center">
                        <LogOut size={20} />
                    </div>
                    <span className={`transition-opacity duration-300 pr-4 ${collapsed ? 'opacity-0' : 'opacity-100'}`}>
                        Logout
                    </span>
                </button>
            </div>
        </aside>
    )
}

export default AdminSidebar
