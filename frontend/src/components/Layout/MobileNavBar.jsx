import { NavLink } from 'react-router-dom'
import {
    LayoutDashboard,
    Users,
    CalendarCheck,
    UsersRound,
    BookOpen,
    Phone,
    ClipboardCheck,
} from 'lucide-react'

const receptionistNavItems = [
    { label: 'Dashboard',  path: '/receptionist/dashboard',  icon: LayoutDashboard },
    { label: 'Students',   path: '/receptionist/students',   icon: Users },
    { label: 'Demos',      path: '/receptionist/demos',      icon: CalendarCheck },
    { label: 'Attendance', path: '/receptionist/attendance', icon: ClipboardCheck },
    { label: 'Calls',      path: '/receptionist/calls',      icon: Phone },
]

const adminNavItems = [
    { label: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
    { label: 'Students', path: '/admin/students', icon: Users },
    { label: 'Demos', path: '/admin/demos', icon: BookOpen },
    { label: 'Staff', path: '/admin/staff', icon: UsersRound },
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
                                ? 'text-[#5e3174]'
                                : 'text-gray-500 hover:text-gray-900'
                            }`
                        }
                    >
                        {({ isActive }) => (
                            <>
                                <item.icon size={20} fill={isActive ? "currentColor" : "none"} />
                                <span className="text-[10px] font-medium tracking-wide">
                                    {item.label}
                                </span>
                            </>
                        )}
                    </NavLink>
                ))}
            </div>
        </nav>
    )
}

export default MobileNavBar
