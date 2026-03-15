import { NavLink } from 'react-router-dom'
import {
    LayoutDashboard,
    Users,
    CalendarCheck,
    UsersRound
} from 'lucide-react'

const receptionistNavItems = [
    { label: 'Dashboard', path: '/receptionist/dashboard', icon: LayoutDashboard },
    { label: 'Students', path: '/receptionist/students', icon: Users },
    { label: 'Demos', path: '/receptionist/demos', icon: CalendarCheck },
    { label: 'Attendance', path: '/receptionist/attendance', icon: CalendarCheck },
]

const adminNavItems = [
    { label: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
    { label: 'Staff', path: '/admin/staff', icon: UsersRound },
    { label: 'Students', path: '/admin/students', icon: Users },
]

function MobileNavBar({ isAdmin = false }) {
    const navItems = isAdmin ? adminNavItems : receptionistNavItems;

    return (
        <nav className="md:hidden fixed bottom-0 w-full bg-white border-t border-gray-200 z-50 pb-safe">
            <div className="flex items-center justify-around h-16">
                {navItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) =>
                            `flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${isActive
                                ? 'text-emerald-500'
                                : 'text-gray-500 hover:text-gray-900'
                            }`
                        }
                    >
                        <item.icon size={20} />
                        <span className="text-[10px] font-medium tracking-wide">
                            {item.label}
                        </span>
                    </NavLink>
                ))}
            </div>
        </nav>
    )
}

export default MobileNavBar
