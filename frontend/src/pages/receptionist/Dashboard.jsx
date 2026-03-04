import { Users, CalendarCheck, ClipboardCheck, IndianRupee, UserPlus, CalendarPlus } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const kpiCards = [
    { label: 'Total Enquiries', value: 48, icon: Users, color: 'bg-blue-50 text-blue-600', iconBg: 'bg-blue-100' },
    { label: 'Demos Today', value: 5, icon: CalendarCheck, color: 'bg-emerald-50 text-emerald-600', iconBg: 'bg-emerald-100' },
    { label: 'Pending Admissions', value: 12, icon: ClipboardCheck, color: 'bg-amber-50 text-amber-600', iconBg: 'bg-amber-100' },
    { label: 'Overdue Fees', value: 3, icon: IndianRupee, color: 'bg-red-50 text-red-600', iconBg: 'bg-red-100' },
]

const recentActivity = [
    { id: 1, text: 'New student Aarav Sharma registered', time: '10 min ago', type: 'registration' },
    { id: 2, text: 'Demo attendance marked for Priya Patel', time: '25 min ago', type: 'attendance' },
    { id: 3, text: 'Admission confirmed for Rahul Verma', time: '1 hour ago', type: 'admission' },
    { id: 4, text: 'Fee payment received from Sneha Gupta — ₹5,000', time: '2 hours ago', type: 'payment' },
    { id: 5, text: 'Demo rescheduled for Arjun Kumar', time: '3 hours ago', type: 'reschedule' },
]

const activityColors = {
    registration: 'bg-blue-400',
    attendance: 'bg-emerald-400',
    admission: 'bg-purple-400',
    payment: 'bg-green-400',
    reschedule: 'bg-amber-400',
}

function Dashboard() {
    const navigate = useNavigate()

    return (
        <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {kpiCards.map((card) => (
                    <div
                        key={card.label}
                        className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow duration-200"
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500 font-medium">{card.label}</p>
                                <p className="text-3xl font-bold text-gray-900 mt-1">{card.value}</p>
                            </div>
                            <div className={`w-12 h-12 rounded-xl ${card.iconBg} flex items-center justify-center`}>
                                <card.icon size={22} className={card.color.split(' ')[1]} />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Bottom Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Recent Activity */}
                <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-6">
                    <h3 className="text-base font-semibold text-gray-800 mb-4">Recent Activity</h3>
                    <div className="space-y-4">
                        {recentActivity.map((item) => (
                            <div key={item.id} className="flex items-start gap-3">
                                <div className={`w-2 h-2 rounded-full mt-2 ${activityColors[item.type]}`}></div>
                                <div className="flex-1">
                                    <p className="text-sm text-gray-700">{item.text}</p>
                                    <p className="text-xs text-gray-400 mt-0.5">{item.time}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h3 className="text-base font-semibold text-gray-800 mb-4">Quick Actions</h3>
                    <div className="space-y-3">
                        <button
                            onClick={() => navigate('/receptionist/students/add')}
                            className="w-full flex items-center gap-3 px-4 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium cursor-pointer"
                        >
                            <UserPlus size={18} />
                            Add New Student
                        </button>
                        <button
                            onClick={() => navigate('/receptionist/demos')}
                            className="w-full flex items-center gap-3 px-4 py-3 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors text-sm font-medium cursor-pointer"
                        >
                            <CalendarPlus size={18} />
                            Schedule Demo
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Dashboard
