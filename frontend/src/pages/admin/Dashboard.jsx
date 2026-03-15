import { Users, BookOpen, UserCircle, TrendingUp, Calendar, ArrowUpRight, ArrowDownRight } from 'lucide-react'

function AdminDashboard() {
    // Mock Data for Admin KPI
    const kpiData = [
        {
            title: 'Total Students',
            value: '1,248',
            trend: '+12%',
            trendUp: true,
            icon: Users,
            color: 'bg-emerald-500',
            lightColor: 'bg-emerald-50 text-emerald-600'
        },
        {
            title: 'Active Demos',
            value: '45',
            trend: '+5%',
            trendUp: true,
            icon: BookOpen,
            color: 'bg-blue-500',
            lightColor: 'bg-blue-50 text-blue-600'
        },
        {
            title: 'Staff Members',
            value: '12',
            trend: 'Stable',
            trendUp: true,
            icon: UserCircle,
            color: 'bg-indigo-500',
            lightColor: 'bg-indigo-50 text-indigo-600'
        },
        {
            title: 'Avg. Conversions',
            value: '68%',
            trend: '-2%',
            trendUp: false,
            icon: TrendingUp,
            color: 'bg-purple-500',
            lightColor: 'bg-purple-50 text-purple-600'
        }
    ]

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900">System Overview</h1>
                <p className="text-sm text-gray-500 mt-1">Real-time metrics across all branches</p>
            </div>

            {/* KPI Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {kpiData.map((kpi, idx) => (
                    <div key={idx} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-sm font-medium text-gray-500">{kpi.title}</p>
                                <h3 className="text-3xl font-bold text-gray-900 mt-2">{kpi.value}</h3>
                            </div>
                            <div className={`p-3 rounded-lg ${kpi.lightColor}`}>
                                <kpi.icon size={24} />
                            </div>
                        </div>
                        
                        <div className="mt-4 flex items-center gap-2">
                            <span className={`flex items-center text-sm font-medium ${kpi.trendUp ? 'text-emerald-600' : 'text-red-600'}`}>
                                {kpi.trendUp ? <ArrowUpRight size={16} className="mr-1" /> : <ArrowDownRight size={16} className="mr-1" />}
                                {kpi.trend}
                            </span>
                            <span className="text-sm text-gray-400">vs last month</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Charts & Analytics Area */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Branch Performance Chart */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 lg:col-span-2">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-bold text-gray-900">Branch Performance</h2>
                        <select className="bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-lg focus:ring-emerald-500 focus:border-emerald-500 block p-2">
                            <option>This Year</option>
                            <option>Last 6 Months</option>
                            <option>This Month</option>
                        </select>
                    </div>
                    
                    {/* Placeholder for actual chart (e.g., Recharts) */}
                    <div className="h-72 w-full bg-gray-50 rounded-lg flex items-center justify-center border border-dashed border-gray-200">
                        <div className="text-center">
                            <Calendar className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                            <p className="text-sm text-gray-500">Interactive Bar Chart Placeholder</p>
                            <p className="text-xs text-gray-400 mt-1">Comparing total students per branch</p>
                        </div>
                    </div>
                </div>

                {/* Recent Activity / Quick Stats */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <h2 className="text-lg font-bold text-gray-900 mb-6">Demo Status Overview</h2>
                    
                    {/* Placeholder for Donut Chart */}
                    <div className="h-48 w-full bg-gray-50 rounded-full flex items-center justify-center border border-dashed border-gray-200 aspect-square max-w-[200px] mx-auto mb-6">
                        <p className="text-sm text-gray-500">Donut Chart</p>
                    </div>
                    
                    <div className="space-y-4">
                        <div className="flex justify-between items-center text-sm">
                            <div className="flex items-center gap-2">
                                <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                                <span className="text-gray-600">Completed</span>
                            </div>
                            <span className="font-semibold text-gray-900">65%</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <div className="flex items-center gap-2">
                                <span className="w-3 h-3 rounded-full bg-blue-500"></span>
                                <span className="text-gray-600">Scheduled</span>
                            </div>
                            <span className="font-semibold text-gray-900">25%</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <div className="flex items-center gap-2">
                                <span className="w-3 h-3 rounded-full bg-gray-300"></span>
                                <span className="text-gray-600">Pending</span>
                            </div>
                            <span className="font-semibold text-gray-900">10%</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default AdminDashboard
