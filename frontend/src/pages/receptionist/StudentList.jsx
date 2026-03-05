import { useState } from 'react'
import { useStudents } from '../../context/StudentContext'
import { Search, Plus, Eye, Filter, ArrowRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const statusLabels = {
    enquiry: 'Enquiry',
    demo_scheduled: 'Demo Completed',
    admitted: 'Admitted',
    active: 'Active',
}

const statusColors = {
    enquiry: 'bg-blue-50 text-blue-600',
    demo_scheduled: 'bg-amber-50 text-amber-600',
    admitted: 'bg-purple-50 text-purple-600',
    active: 'bg-emerald-50 text-emerald-600',
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
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                    <h1 className="text-xl font-bold text-gray-900">Students</h1>
                    <p className="text-sm text-gray-500 mt-0.5">{students.length} total students</p>
                </div>
                <button
                    onClick={() => navigate('/receptionist/students/add')}
                    className="flex items-center gap-2 px-4 py-2.5 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium cursor-pointer"
                >
                    <Plus size={16} />
                    Add Student
                </button>
            </div>

            {/* Filters Row */}
            <div className="flex flex-col sm:flex-row gap-3">
                {/* Search */}
                <div className="relative flex-1">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search by name, phone, or email..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    />
                </div>

                {/* Status Filter */}
                <div className="relative">
                    <Filter size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="pl-10 pr-8 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent appearance-none cursor-pointer"
                    >
                        <option value="all">All Status</option>
                        <option value="enquiry">Enquiry</option>
                        <option value="demo_scheduled">Demo Completed</option>
                        <option value="admitted">Admitted</option>
                        <option value="active">Active</option>
                    </select>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-200">
                                <th className="text-left px-5 py-3 font-semibold text-gray-600">Name</th>
                                <th className="text-left px-5 py-3 font-semibold text-gray-600">Phone</th>
                                <th className="text-left px-5 py-3 font-semibold text-gray-600">Class</th>
                                <th className="text-left px-5 py-3 font-semibold text-gray-600">Branch</th>
                                <th className="text-left px-5 py-3 font-semibold text-gray-600">Status</th>
                                <th className="text-left px-5 py-3 font-semibold text-gray-600">Action</th>
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
                                        <td className="px-5 py-3.5"><div className="h-3.5 bg-gray-100 rounded w-24" /></td>
                                        <td className="px-5 py-3.5"><div className="h-3.5 bg-gray-100 rounded w-10" /></td>
                                        <td className="px-5 py-3.5"><div className="h-3.5 bg-gray-100 rounded w-20" /></td>
                                        <td className="px-5 py-3.5"><div className="h-5 bg-gray-100 rounded-full w-16" /></td>
                                        <td className="px-5 py-3.5"><div className="h-7 w-7 bg-gray-100 rounded-lg" /></td>
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
                                    <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-5 py-3.5">
                                            <div>
                                                <p className="font-medium text-gray-900">{student.name}</p>
                                                <p className="text-xs text-gray-400">{student.email}</p>
                                            </div>
                                        </td>
                                        <td className="px-5 py-3.5 text-gray-600">{student.phone}</td>
                                        <td className="px-5 py-3.5 text-gray-600">{student.studentClass}</td>
                                        <td className="px-5 py-3.5 text-gray-600">{student.branch}</td>
                                        <td className="px-5 py-3.5">
                                            <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${statusColors[student.status]}`}>
                                                {statusLabels[student.status]}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3.5 flex items-center gap-2">
                                            <button
                                                onClick={() => navigate(`/receptionist/students/${student.id}`)}
                                                className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                                                title="View Details"
                                            >
                                                <Eye size={16} />
                                            </button>

                                            {student.status === 'demo_scheduled' && (
                                                <button
                                                    onClick={() => navigate('/receptionist/admissions')}
                                                    className="p-1.5 text-amber-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                                                    title="Process Admission"
                                                >
                                                    <ArrowRight size={16} />
                                                </button>
                                            )}
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
