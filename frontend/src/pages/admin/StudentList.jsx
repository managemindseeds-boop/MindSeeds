import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAdmin } from '../../context/AdminContext'
import { Search, Filter, Eye, Download, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react'
import { BRANCHES } from '../../constants/branches'

const statusLabels = {
    enquiry: 'Enquiry',
    demo_scheduled: 'Demo Scheduled',
    demo_completed: 'Demo Completed',
    admitted: 'Admitted',
}

const statusColors = {
    enquiry: 'bg-blue-50 text-blue-600 border-blue-200',
    demo_scheduled: 'bg-amber-50 text-amber-600 border-amber-200',
    demo_completed: 'bg-purple-50 text-purple-600 border-purple-200',
    admitted: 'bg-[#f0e6f6] text-emerald-700 border-emerald-200',
}

function AdminStudentList() {
    const navigate = useNavigate()
    const { students, studentPagination, studentsLoading, fetchStudents } = useAdmin()

    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState('all')
    const [branchFilter, setBranchFilter] = useState('all')
    const [page, setPage] = useState(1)

    // Debounced search
    const [debouncedSearch, setDebouncedSearch] = useState('')
    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(search), 400)
        return () => clearTimeout(timer)
    }, [search])

    // Fetch whenever filters change
    const doFetch = useCallback(() => {
        fetchStudents({ search: debouncedSearch, status: statusFilter, branch: branchFilter, page })
    }, [fetchStudents, debouncedSearch, statusFilter, branchFilter, page])

    useEffect(() => {
        doFetch()
    }, [doFetch])

    // Auto-refresh every 30s for real-time accuracy
    useEffect(() => {
        const interval = setInterval(doFetch, 30000)
        return () => clearInterval(interval)
    }, [doFetch])

    // Use official branches for filter dropdown
    const officialBranches = BRANCHES

    // CSV export
    const handleExport = () => {
        if (!students.length) return
        const headers = ['Name', 'Phone', 'Email', 'Class', 'Branch', 'Status', 'Parent Name', 'Parent Phone', 'Registered']
        const rows = students.map(s => [
            s.fullName, s.phone, s.email || '', s.class, s.branch,
            statusLabels[s.status] || s.status, s.parentName, s.parentPhone,
            new Date(s.createdAt).toLocaleDateString('en-IN'),
        ])
        const csv = [headers.join(','), ...rows.map(r => r.map(v => `"${v}"`).join(','))].join('\n')
        const blob = new Blob([csv], { type: 'text/csv' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `students_${new Date().toISOString().split('T')[0]}.csv`
        a.click()
        URL.revokeObjectURL(url)
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <p className="text-sm text-gray-500">
                    All students across all branches
                    {studentsLoading && <span className="ml-2 text-blue-500 text-xs">(loading...)</span>}
                </p>
                <div className="flex items-center gap-2">
                    <button
                        onClick={doFetch}
                        className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors text-sm cursor-pointer shadow-sm"
                    >
                        <RefreshCw size={14} className={studentsLoading ? 'animate-spin' : ''} />
                    </button>
                    <button
                        onClick={handleExport}
                        className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium cursor-pointer shadow-sm"
                    >
                        <Download size={16} />
                        Export CSV
                    </button>
                </div>
            </div>

            {/* Filters Row */}
            <div className="flex flex-col sm:flex-row gap-3 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                <div className="relative flex-1">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search by name, phone, or email..."
                        value={search}
                        onChange={(e) => { setSearch(e.target.value); setPage(1) }}
                        className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                    />
                </div>

                <div className="relative sm:w-48">
                    <Filter size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <select
                        value={branchFilter}
                        onChange={(e) => { setBranchFilter(e.target.value); setPage(1) }}
                        className="w-full pl-10 pr-8 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none cursor-pointer transition-shadow"
                    >
                        <option value="all">All Branches</option>
                        {officialBranches.map(b => (
                            <option key={b} value={b}>{b}</option>
                        ))}
                    </select>
                </div>

                <div className="relative sm:w-48">
                    <Filter size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <select
                        value={statusFilter}
                        onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
                        className="w-full pl-10 pr-8 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none cursor-pointer transition-shadow"
                    >
                        <option value="all">All Statuses</option>
                        <option value="enquiry">Enquiry</option>
                        <option value="demo_scheduled">Demo Scheduled</option>
                        <option value="demo_completed">Demo Completed</option>
                        <option value="admitted">Admitted</option>
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
                                <th className="text-left px-6 py-4 font-semibold text-gray-700">Registered</th>
                                <th className="text-center px-6 py-4 font-semibold text-gray-700">Status</th>
                                <th className="text-center px-6 py-4 font-semibold text-gray-700">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {students.length === 0 ? (
                                studentsLoading ? (
                                    // Skeleton loading rows
                                    Array.from({ length: 5 }).map((_, i) => (
                                        <tr key={i} className="animate-pulse">
                                            <td className="px-6 py-4"><div className="space-y-1.5"><div className="h-3.5 bg-gray-200 rounded w-28" /><div className="h-2.5 bg-gray-200 rounded w-36" /></div></td>
                                            <td className="px-6 py-4"><div className="h-3.5 bg-gray-200 rounded w-24" /></td>
                                            <td className="px-6 py-4"><div className="space-y-1"><div className="h-3.5 bg-gray-200 rounded w-16" /><div className="h-2.5 bg-gray-200 rounded w-20" /></div></td>
                                            <td className="px-6 py-4"><div className="h-3.5 bg-gray-200 rounded w-20" /></td>
                                            <td className="px-6 py-4 text-center"><div className="h-6 bg-gray-200 rounded-full w-20 mx-auto" /></td>
                                            <td className="px-6 py-4 text-center"><div className="h-8 w-8 bg-gray-200 rounded-lg mx-auto" /></td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-10 text-center text-gray-400">
                                            No students found matching your filters.
                                        </td>
                                    </tr>
                                )
                            ) : (
                                students.map((student) => (
                                    <tr key={student._id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div>
                                                <p className="font-semibold text-gray-900">{student.fullName}</p>
                                                <p className="text-xs text-gray-500">{student.email || '—'}</p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-gray-700">{student.phone}</td>
                                        <td className="px-6 py-4">
                                            <div>
                                                <p className="font-medium text-gray-900">{student.class}</p>
                                                <p className="text-xs text-blue-600 font-medium">{student.branch}</p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-gray-500">
                                            {new Date(student.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`inline-block px-3 py-1.5 rounded-full text-xs font-semibold border ${statusColors[student.status] || 'bg-gray-100 text-gray-600'}`}>
                                                {statusLabels[student.status] || student.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <button
                                                onClick={() => navigate(`/admin/students/${student._id}`)}
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

                {/* Pagination */}
                <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
                    <span className="text-sm text-gray-500">
                        Showing <span className="font-medium text-gray-900">{students.length}</span> of{' '}
                        <span className="font-medium text-gray-900">{studentPagination.total}</span> students
                        {studentPagination.totalPages > 1 && (
                            <span> · Page {studentPagination.page} of {studentPagination.totalPages}</span>
                        )}
                    </span>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page <= 1}
                            className="p-2 border border-gray-200 rounded text-gray-600 bg-white hover:bg-gray-50 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            <ChevronLeft size={16} />
                        </button>
                        <button
                            onClick={() => setPage(p => Math.min(studentPagination.totalPages || 1, p + 1))}
                            disabled={page >= (studentPagination.totalPages || 1)}
                            className="p-2 border border-gray-200 rounded text-gray-600 bg-white hover:bg-gray-50 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default AdminStudentList
