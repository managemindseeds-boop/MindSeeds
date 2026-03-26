import { NavLink } from 'react-router-dom'
import {
    LayoutDashboard,
    Users,
    CalendarCheck,
    ChevronLeft,
    ChevronRight,
    Phone,
    ClipboardCheck,
} from 'lucide-react'
import { useState } from 'react'

const navItems = [
    { label: 'Dashboard',       path: '/receptionist/dashboard',  icon: LayoutDashboard },
    { label: 'Students',         path: '/receptionist/students',   icon: Users },
    { label: 'Demo Lectures',    path: '/receptionist/demos',      icon: CalendarCheck },
    { label: 'Daily Attendance', path: '/receptionist/attendance', icon: ClipboardCheck },
    { label: 'Call List',        path: '/receptionist/calls',      icon: Phone },
]

function Sidebar() {
    const [collapsed, setCollapsed] = useState(false)

    return (
        <aside
            className={`hidden md:flex ${collapsed ? 'w-20' : 'w-64'} 
                h-screen sticky top-0 bg-[#5f3473] text-white flex-col transition-all duration-300 ease-in-out z-20 overflow-hidden`}
        >
            {/* Logo / Brand */}
            <div className={`flex items-center ${collapsed ? 'justify-center px-0' : 'justify-between px-5'} py-6 min-h-[73px] transition-all duration-300`}>
                <div className={`overflow-hidden transition-all duration-300 ${collapsed ? 'w-0 opacity-0' : 'w-[160px] opacity-100'}`}>
                    <img src="/1.svg" alt="MindSeeds" className="h-11 w-auto max-w-[160px] object-contain object-left" />
                </div>
                <button
                    onClick={() => setCollapsed(!collapsed)}
                    className="text-[#d4b5e6] hover:text-white transition-colors cursor-pointer shrink-0"
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
                            `flex items-center ${collapsed ? 'justify-center px-0' : 'px-3'} py-3 rounded-lg text-sm font-medium transition-all duration-300
                            ${isActive
                                ? 'bg-white/15 text-white'
                                : 'text-[#d4b5e6] hover:bg-[#4a2860] hover:text-white'
                            }`
                        }
                    >
                        <item.icon size={20} className="shrink-0" />
                        <span className={`whitespace-nowrap overflow-hidden transition-all duration-300 ${collapsed ? 'max-w-0 opacity-0 ml-0' : 'max-w-[200px] opacity-100 ml-3'}`}>
                            {item.label}
                        </span>
                    </NavLink>
                ))}
            </nav>
        </aside>
    )
}

export default Sidebar
