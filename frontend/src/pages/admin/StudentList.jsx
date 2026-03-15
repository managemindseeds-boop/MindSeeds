import { useState } from 'react'
import { Search, Filter, Eye, Download } from 'lucide-react'

const statusLabels = {
    enquiry: 'Enquiry',
    demo_scheduled: 'Demo Scheduled',
    demo_completed: 'Demo Completed',
}

const statusColors = {
    enquiry: 'bg-blue-50 text-blue-600 border-blue-200',
    demo_scheduled: 'bg-amber-50 text-amber-600 border-amber-200',
    demo_completed: 'bg-purple-50 text-purple-600 border-purple-200',
}

// Mock Global Student Data
const initialStudents = [
    { id: 101, name: 'Aarav Mehta', phone: '9876543210', email: 'aarav@example.com', studentClass: '10th Grade', branch: 'Andheri West', status: 'enquiry', addedDate: '2024-03-12' },
    { id: 102, name: 'Isha Patel', phone: '9876543211', email: 'isha@example.com', studentClass: '12th Science', branch: 'Bandra', status: 'demo_scheduled', addedDate: '2024-03-10' },
    { id: 103, name: 'Rohan Deshmukh', phone: '9876543212', email: 'rohan@example.com', studentClass: '8th Grade', branch: 'Borivali', status: 'demo_completed', addedDate: '2024-03-08' },
    { id: 104, name: 'Sneha Joshi', phone: '9876543213', email: 'sneha@example.com', studentClass: '11th Commerce', branch: 'Dadar', status: 'enquiry', addedDate: '2024-03-14' },
    { id: 105, name: 'Kabir Singh', phone: '9876543214', email: 'kabir@example.com', studentClass: '9th Grade', branch: 'Andheri West', status: 'demo_completed', addedDate: '2024-03-01' },
]

function AdminStudentList() {
    const [students] = useState(initialStudents)
    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState('all')
    const [branchFilter, setBranchFilter] = useState('all')

    const filtered = students.filter((s) => {
        const matchesSearch =
            s.name.toLowerCase().includes(search.toLowerCase()) ||
            s.phone.includes(search) ||
            s.email.toLowerCase().includes(search.toLowerCase())
        const matchesStatus = statusFilter === 'all' || s.status === statusFilter
        const matchesBranch = branchFilter === 'all' || s.branch === branchFilter
        return matchesSearch && matchesStatus && matchesBranch
    })

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Global Student Directory</h1>
                    <p className="text-sm text-gray-500 mt-1">View and manage all students across all branches</p>
                </div>
                <button
                    className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium cursor-pointer shadow-sm"
                >
                    <Download size={16} />
                    Export CSV
                </button>
            </div>

            {/* Filters Row */}
            <div className="flex flex-col sm:flex-row gap-3 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                {/* Search */}
                <div className="relative flex-1">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search by name, phone, or email..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all transition-shadow"
                    />
                </div>

                {/* Branch Filter */}
                <div className="relative sm:w-48">
                    <Filter size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <select
                        value={branchFilter}
                        onChange={(e) => setBranchFilter(e.target.value)}
                        className="w-full pl-10 pr-8 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none cursor-pointer transition-shadow"
                    >
                        <option value="all">All Branches</option>
                        <option value="Andheri West">Andheri West</option>
                        <option value="Bandra">Bandra</option>
                        <option value="Borivali">Borivali</option>
                        <option value="Dadar">Dadar</option>
                    </select>
                </div>

                {/* Status Filter */}
                <div className="relative sm:w-48">
                    <Filter size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="w-full pl-10 pr-8 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none cursor-pointer transition-shadow"
                    >
                        <option value="all">All Statuses</option>
                        <option value="enquiry">Enquiry</option>
                        <option value="demo_scheduled">Demo Scheduled</option>
                        <option value="demo_completed">Demo Completed</option>
                    </select>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-200">
                                <th className="text-left px-6 py-4 font-semibold text-gray-700">Student Info</th>
                                <th className="text-left px-6 py-4 font-semibold text-gray-700">Contact</th>
                                <th className="text-left px-6 py-4 font-semibold text-gray-700">Class & Branch</th>
                                <th className="text-left px-6 py-4 font-semibold text-gray-700">Added Date</th>
                                <th className="text-center px-6 py-4 font-semibold text-gray-700">Status</th>
                                <th className="text-center px-6 py-4 font-semibold text-gray-700">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-10 text-center text-gray-400">
                                        No students found matching your filters.
                                    </td>
                                </tr>
                            ) : (
                                filtered.map((student) => (
                                    <tr key={student.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div>
                                                <p className="font-semibold text-gray-900">{student.name}</p>
                                                <p className="text-xs text-gray-500">{student.email}</p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-gray-700">{student.phone}</td>
                                        <td className="px-6 py-4">
                                            <div>
                                                <p className="font-medium text-gray-900">{student.studentClass}</p>
                                                <p className="text-xs text-blue-600 font-medium">{student.branch}</p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-gray-500">{student.addedDate}</td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`inline-block px-3 py-1.5 rounded-full text-xs font-semibold border ${statusColors[student.status]}`}>
                                                {statusLabels[student.status]}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <button
                                                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer inline-flex"
                                                title="View Details"
                                            >
                                                <Eye size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                {/* Pagination Placeholder */}
                <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
                    <span className="text-sm text-gray-500">
                        Showing <span className="font-medium text-gray-900">{filtered.length}</span> of <span className="font-medium text-gray-900">{initialStudents.length}</span> students
                    </span>
                    <div className="flex items-center gap-2">
                        <button className="px-3 py-1 border border-gray-200 rounded text-sm text-gray-600 bg-white hover:bg-gray-50 cursor-not-allowed opacity-50">Prev</button>
                        <button className="px-3 py-1 border border-gray-200 rounded text-sm text-gray-600 bg-white hover:bg-gray-50 cursor-pointer">Next</button>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default AdminStudentList
