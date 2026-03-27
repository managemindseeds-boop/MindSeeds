import { useState } from 'react'
import { useStudents } from '../../context/StudentContext'
import { Search, Plus, Eye, Filter, ArrowRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const statusLabels = {
    enquiry: 'Enquiry',
    demo_scheduled: 'Demo Scheduled',
    demo_completed: 'Demo Completed',
}

const statusColors = {
    enquiry: 'bg-blue-50 text-blue-600',
    demo_scheduled: 'bg-amber-50 text-amber-600',
    demo_completed: 'bg-purple-50 text-purple-600',
}

function StudentList() {
    const { students, loading, error } = useStudents()
    const navigate = useNavigate()
    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState('all')

    const filtered = students.filter((s) => {
        const matchesSearch =
            s.name.toLowerCase().includes(search.toLowerCase()) ||
            s.phone.includes(search) ||
            s.email.toLowerCase().includes(search.toLowerCase())
        const matchesStatus = statusFilter === 'all' || s.status === statusFilter
        return matchesSearch && matchesStatus
    })


    return (
        <div className="space-y-5">
            {/* Filters & Actions */}
            <div className="flex flex-col sm:flex-row gap-3 mb-5">
                <div className="relative flex-1">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search by name, phone, or email..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#5e3174] focus:border-transparent shadow-sm"
                    />
                </div>
                <div className="flex gap-2 sm:gap-3 shrink-0">
                    <div className="relative">
                        <div className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-600 shadow-sm hover:bg-gray-50 transition-colors h-full">
                            <Filter size={16} className={statusFilter !== 'all' ? "text-[#5e3174]" : "text-gray-400"} />
                            <span className="font-medium whitespace-nowrap">
                                {statusFilter === 'all' ? 'All Status' : statusLabels[statusFilter]}
                            </span>
                            {statusFilter !== 'all' && (
                                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white"></span>
                            )}
                        </div>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            title="Filter Status"
                        >
                            <option value="all">All Status</option>
                            <option value="enquiry">Enquiry</option>
                            <option value="demo_scheduled">Demo Scheduled</option>
                            <option value="demo_completed">Demo Completed</option>
                        </select>
                    </div>
                    <button
                        onClick={() => navigate('/receptionist/students/add')}
                        className="flex-none flex items-center justify-center gap-2 px-4 py-2 bg-[#5e3174] text-white rounded-lg hover:bg-[#4a2860] transition-colors text-sm font-medium cursor-pointer shadow-sm"
                    >
                        <Plus size={16} />
                        <span className="hidden sm:inline">Add Student</span>
                        <span className="sm:hidden">Add</span>
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-200">
                                <th className="text-left px-5 py-3 font-semibold text-gray-600">Name</th>
                                <th className="hidden sm:table-cell text-left px-5 py-3 font-semibold text-gray-600">Phone</th>
                                <th className="hidden sm:table-cell text-left px-5 py-3 font-semibold text-gray-600">Class</th>
                                <th className="hidden sm:table-cell text-left px-5 py-3 font-semibold text-gray-600">Branch</th>
                                <th className="hidden sm:table-cell text-left px-5 py-3 font-semibold text-gray-600">Status</th>
                                <th className="text-right sm:text-left px-5 py-3 font-semibold text-gray-600 align-middle">
                                    Action
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                // Loading skeleton rows
                                Array.from({ length: 4 }).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td className="px-5 py-3.5">
                                            <div className="h-3.5 bg-gray-100 rounded w-32 mb-1.5" />
                                            <div className="h-2.5 bg-gray-100 rounded w-24" />
                                        </td>
                                        <td className="hidden sm:table-cell px-5 py-3.5"><div className="h-3.5 bg-gray-100 rounded w-24" /></td>
                                        <td className="hidden sm:table-cell px-5 py-3.5"><div className="h-3.5 bg-gray-100 rounded w-10" /></td>
                                        <td className="hidden sm:table-cell px-5 py-3.5"><div className="h-3.5 bg-gray-100 rounded w-20" /></td>
                                        <td className="hidden sm:table-cell px-5 py-3.5"><div className="h-5 bg-gray-100 rounded-full w-16" /></td>
                                        <td className="px-5 py-3.5 flex justify-end sm:justify-start"><div className="h-7 w-7 bg-gray-100 rounded-lg" /></td>
                                    </tr>
                                ))
                            ) : error ? (
                                <tr>
                                    <td colSpan={6} className="px-5 py-10 text-center text-red-500">
                                        ⚠️ {error}
                                    </td>
                                </tr>
                            ) : filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-5 py-10 text-center text-gray-400">
                                        No students found
                                    </td>
                                </tr>
                            ) : (
                                filtered.map((student) => (
                                    <tr 
                                        key={student.id} 
                                        onClick={() => navigate(`/receptionist/students/${student.id}`)}
                                        className="hover:bg-gray-50 transition-colors cursor-pointer group"
                                    >
                                        <td className="px-5 py-3.5">
                                            <div>
                                                <p className="font-medium text-gray-900">{student.name}</p>
                                                <p className="text-xs text-gray-400">{student.email}</p>
                                            </div>
                                        </td>
                                        <td className="hidden sm:table-cell px-5 py-3.5 text-gray-600">{student.phone}</td>
                                        <td className="hidden sm:table-cell px-5 py-3.5 text-gray-600">{student.studentClass}</td>
                                        <td className="hidden sm:table-cell px-5 py-3.5 text-gray-600">{student.branch}</td>
                                        <td className="hidden sm:table-cell px-5 py-3.5">
                                            <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${statusColors[student.status]}`}>
                                                {statusLabels[student.status]}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3.5 flex items-center justify-end sm:justify-start gap-2">
                                            <div
                                                className="p-1.5 text-gray-400 group-hover:text-[#5e3174] group-hover:bg-[#f0e6f6] rounded-lg transition-colors"
                                                title="View Details"
                                            >
                                                <Eye size={16} />
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}

export default StudentList
