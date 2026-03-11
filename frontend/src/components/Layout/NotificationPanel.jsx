import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
    X, Bell, Calendar, AlertCircle, DollarSign,
    GraduationCap, Clock, ChevronRight, CheckCircle2
} from 'lucide-react'
import { useNotifications } from '../../context/NotificationContext'

/* ── icon + colour map by notification type ── */
const typeConfig = {
    demo: {
        icon: Calendar,
        bg: 'bg-blue-50',
        iconColor: 'text-blue-600',
        badge: 'bg-blue-100 text-blue-700',
        label: 'Demo',
    },
    absent: {
        icon: AlertCircle,
        bg: 'bg-red-50',
        iconColor: 'text-red-500',
        badge: 'bg-red-100 text-red-700',
        label: 'Absent',
    },
    upcoming: {
        icon: Clock,
        bg: 'bg-violet-50',
        iconColor: 'text-violet-600',
        badge: 'bg-violet-100 text-violet-700',
        label: 'Upcoming',
    },
    admission: {
        icon: GraduationCap,
        bg: 'bg-emerald-50',
        iconColor: 'text-emerald-600',
        badge: 'bg-emerald-100 text-emerald-700',
        label: 'Admission',
    },
}

const priorityLabel = { high: 'Urgent', medium: 'Important', low: 'Info' }
const priorityDot = { high: 'bg-red-500', medium: 'bg-amber-400', low: 'bg-emerald-400' }

function formatDate(dateStr) {
    if (!dateStr) return ''
    const d = new Date(dateStr)
    if (isNaN(d)) return dateStr
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

/* ── group notifications by section heading ── */
function groupNotifications(notifications) {
    const groups = {
        urgent: { label: '🔴 Urgent', items: [] },
        important: { label: '🟡 Important', items: [] },
        info: { label: '🟢 Info', items: [] },
    }
    notifications.forEach(n => {
        if (n.priority === 'high') groups.urgent.items.push(n)
        else if (n.priority === 'medium') groups.important.items.push(n)
        else groups.info.items.push(n)
    })
    return Object.values(groups).filter(g => g.items.length > 0)
}

export default function NotificationPanel() {
    const { notifications, isOpen, setIsOpen } = useNotifications()
    const navigate = useNavigate()
    const panelRef = useRef(null)

    /* close on outside click */
    useEffect(() => {
        function handleOutside(e) {
            if (isOpen && panelRef.current && !panelRef.current.contains(e.target)) {
                setIsOpen(false)
            }
        }
        document.addEventListener('mousedown', handleOutside)
        return () => document.removeEventListener('mousedown', handleOutside)
    }, [isOpen, setIsOpen])

    /* close on ESC */
    useEffect(() => {
        function handleKey(e) {
            if (e.key === 'Escape') setIsOpen(false)
        }
        document.addEventListener('keydown', handleKey)
        return () => document.removeEventListener('keydown', handleKey)
    }, [setIsOpen])

    /* prevent body scroll while open */
    useEffect(() => {
        document.body.style.overflow = isOpen ? 'hidden' : ''
        return () => { document.body.style.overflow = '' }
    }, [isOpen])

    const groups = groupNotifications(notifications)

    function handleItemClick(link) {
        setIsOpen(false)
        navigate(link)
    }

    return (
        <>
            {/* ── Backdrop overlay ── */}
            <div
                className={`fixed inset-0 z-40 transition-all duration-300 ${isOpen ? 'bg-black/30 backdrop-blur-[2px] pointer-events-auto' : 'bg-transparent pointer-events-none'}`}
                aria-hidden="true"
            />

            {/* ── Slide-out panel ── */}
            <div
                ref={panelRef}
                className={`fixed top-0 right-0 h-full z-50 flex flex-col transition-transform duration-300 ease-in-out shadow-2xl`}
                style={{
                    width: '40%',
                    minWidth: 360,
                    transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
                    background: 'linear-gradient(160deg, #f8fafc 0%, #f1f5f9 100%)',
                }}
                role="dialog"
                aria-modal="true"
                aria-label="Notifications panel"
            >
                {/* ── Header ── */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white/80 backdrop-blur-sm">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-slate-800 to-slate-600 flex items-center justify-center shadow-sm">
                            <Bell size={17} className="text-white" />
                        </div>
                        <div>
                            <h2 className="text-base font-bold text-gray-900 leading-tight">Notifications</h2>
                            <p className="text-xs text-gray-500">{notifications.length} total alerts</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setIsOpen(false)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition-colors"
                        aria-label="Close notifications"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* ── Body ── */}
                <div className="flex-1 overflow-y-auto">
                    {notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full gap-3 text-center px-8">
                            <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center">
                                <CheckCircle2 size={32} className="text-emerald-500" />
                            </div>
                            <p className="text-sm font-semibold text-gray-700">All caught up!</p>
                            <p className="text-xs text-gray-400">No pending notifications at the moment.</p>
                        </div>
                    ) : (
                        <div className="px-4 py-4 space-y-5">
                            {groups.map(group => (
                                <section key={group.label}>
                                    {/* Section heading */}
                                    <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-2 px-1">
                                        {group.label}
                                    </p>
                                    <div className="space-y-2">
                                        {group.items.map(notification => {
                                            const cfg = typeConfig[notification.type] || typeConfig.demo
                                            const Icon = cfg.icon
                                            return (
                                                <button
                                                    key={notification.id}
                                                    onClick={() => handleItemClick(notification.link)}
                                                    className="w-full text-left bg-white rounded-xl border border-gray-100 hover:border-gray-300 hover:shadow-md transition-all duration-150 group overflow-hidden"
                                                >
                                                    <div className="flex items-start gap-3 p-3.5">
                                                        {/* Icon */}
                                                        <div className={`flex-shrink-0 w-9 h-9 rounded-lg ${cfg.bg} flex items-center justify-center mt-0.5`}>
                                                            <Icon size={16} className={cfg.iconColor} />
                                                        </div>

                                                        {/* Content */}
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2 mb-0.5">
                                                                <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${cfg.badge}`}>
                                                                    {cfg.label}
                                                                </span>
                                                                <span className="flex items-center gap-1 text-[10px] text-gray-400">
                                                                    <span className={`w-1.5 h-1.5 rounded-full ${priorityDot[notification.priority]}`} />
                                                                    {priorityLabel[notification.priority]}
                                                                </span>
                                                            </div>
                                                            <p className="text-sm font-semibold text-gray-800 leading-tight truncate">
                                                                {notification.title}
                                                            </p>
                                                            <p className="text-xs text-gray-500 mt-0.5 truncate">
                                                                {notification.message}
                                                            </p>
                                                            {(notification.meta || notification.time) && (
                                                                <div className="flex items-center gap-2 mt-1.5">
                                                                    {notification.meta && (
                                                                        <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full font-medium">
                                                                            {notification.meta}
                                                                        </span>
                                                                    )}
                                                                    {notification.time && (
                                                                        <span className="text-[10px] text-gray-400">
                                                                            {formatDate(notification.time)}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* Arrow */}
                                                        <ChevronRight
                                                            size={14}
                                                            className="flex-shrink-0 text-gray-300 group-hover:text-gray-500 transition-colors mt-2"
                                                        />
                                                    </div>
                                                </button>
                                            )
                                        })}
                                    </div>
                                </section>
                            ))}
                        </div>
                    )}
                </div>

                {/* ── Footer ── */}
                <div className="px-6 py-3 border-t border-gray-200 bg-white/80 backdrop-blur-sm">
                    <p className="text-[11px] text-center text-gray-400">
                        Click any notification to navigate to the relevant section
                    </p>
                </div>
            </div>
        </>
    )
}
