import { useState } from 'react'
import { Plus, Search, Edit2, ShieldAlert, ShieldCheck, X } from 'lucide-react'

// Mock Data
const initialStaff = [
    { id: 1, name: 'Rahul Sharma', username: 'rahul.s', role: 'receptionist', branch: 'Andheri West', status: 'active', lastLogin: '2 hours ago' },
    { id: 2, name: 'Priya Patel', username: 'priya.p', role: 'receptionist', branch: 'Bandra', status: 'active', lastLogin: '1 day ago' },
    { id: 3, name: 'Amit Kumar', username: 'amit.k', role: 'receptionist', branch: 'Borivali', status: 'inactive', lastLogin: '1 week ago' },
    { id: 4, name: 'Neha Gupta', username: 'neha.g', role: 'receptionist', branch: 'Dadar', status: 'active', lastLogin: '5 mins ago' },
]

function AdminStaffList() {
    const [staff, setStaff] = useState(initialStaff)
    const [search, setSearch] = useState('')
    const [isAddModalOpen, setIsAddModalOpen] = useState(false)

    // Form State for Add Staff
    const [formData, setFormData] = useState({ name: '', username: '', password: '', branch: '' })

    const filtered = staff.filter(s => 
        s.name.toLowerCase().includes(search.toLowerCase()) || 
        s.username.toLowerCase().includes(search.toLowerCase()) ||
        s.branch.toLowerCase().includes(search.toLowerCase())
    )

    const handleAddSubmit = (e) => {
        e.preventDefault()
        // Mock add
        const newStaff = {
            id: Date.now(),
            ...formData,
            role: 'receptionist',
            status: 'active',
            lastLogin: 'Never'
        }
        setStaff([newStaff, ...staff])
        setIsAddModalOpen(false)
        setFormData({ name: '', username: '', password: '', branch: '' })
    }

    const toggleStatus = (id) => {
        setStaff(staff.map(s => {
            if (s.id === id) {
                return { ...s, status: s.status === 'active' ? 'inactive' : 'active' }
            }
            return s
        }))
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Staff Management</h1>
                    <p className="text-sm text-gray-500 mt-1">Manage receptionist accounts and access across all branches</p>
                </div>
                <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium cursor-pointer shadow-sm"
                >
                    <Plus size={16} />
                    Add New Staff
                </button>
            </div>

            {/* Filters Row */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1 max-w-md">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search by name, username, or branch..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
                    />
                </div>
            </div>

            {/* Staff Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-200">
                                <th className="text-left px-6 py-4 font-semibold text-gray-700">Name & Username</th>
                                <th className="text-left px-6 py-4 font-semibold text-gray-700">Role</th>
                                <th className="text-left px-6 py-4 font-semibold text-gray-700">Branch Assigned</th>
                                <th className="text-left px-6 py-4 font-semibold text-gray-700">Status</th>
                                <th className="text-left px-6 py-4 font-semibold text-gray-700">Last Login</th>
                                <th className="text-center px-6 py-4 font-semibold text-gray-700">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-10 text-center text-gray-400">
                                        No staff members found matching "{search}"
                                    </td>
                                </tr>
                            ) : (
                                filtered.map((member) => (
                                    <tr key={member.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold uppercase">
                                                    {member.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-gray-900">{member.name}</p>
                                                    <p className="text-xs text-gray-500">@{member.username}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-800 capitalize">
                                                {member.role}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 font-medium text-gray-700">
                                            {member.branch}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                                                member.status === 'active' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'
                                            }`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${member.status === 'active' ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                                                {member.status === 'active' ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-gray-500 text-sm">
                                            {member.lastLogin}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-center gap-2">
                                                <button 
                                                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                                                    title="Edit User"
                                                >
                                                    <Edit2 size={18} />
                                                </button>
                                                <button 
                                                    onClick={() => toggleStatus(member.id)}
                                                    className={`p-2 rounded-lg transition-colors cursor-pointer ${
                                                        member.status === 'active' ? 'text-gray-400 hover:text-red-600 hover:bg-red-50' : 'text-gray-400 hover:text-emerald-600 hover:bg-emerald-50'
                                                    }`}
                                                    title={member.status === 'active' ? "Deactivate User" : "Activate User"}
                                                >
                                                    {member.status === 'active' ? <ShieldAlert size={18} /> : <ShieldCheck size={18} />}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add Staff Modal */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    {/* Reusing modal curve fix trick from previous conversations (overflow-y-auto inside container) */}
                    <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between p-6 border-b border-gray-100 shrink-0">
                            <div>
                                <h3 className="text-xl font-bold text-gray-900">Add New Staff</h3>
                                <p className="text-sm text-gray-500 mt-1">Create a new receptionist account.</p>
                            </div>
                            <button
                                onClick={() => setIsAddModalOpen(false)}
                                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 overflow-y-auto">
                            <form id="add-staff-form" onSubmit={handleAddSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.name}
                                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                        placeholder="e.g. Rahul Sharma"
                                    />
                                </div>
                                
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Username</label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.username}
                                            onChange={(e) => setFormData({...formData, username: e.target.value})}
                                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                            placeholder="e.g. rahul.s"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
                                        <input
                                            type="password"
                                            required
                                            value={formData.password}
                                            onChange={(e) => setFormData({...formData, password: e.target.value})}
                                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                            placeholder="••••••••"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Assign Branch</label>
                                    <select
                                        required
                                        value={formData.branch}
                                        onChange={(e) => setFormData({...formData, branch: e.target.value})}
                                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all appearance-none cursor-pointer"
                                    >
                                        <option value="" disabled>Select a branch</option>
                                        <option value="Andheri West">Andheri West</option>
                                        <option value="Bandra">Bandra</option>
                                        <option value="Borivali">Borivali</option>
                                        <option value="Dadar">Dadar</option>
                                    </select>
                                </div>
                            </form>
                        </div>

                        {/* Modal Footer */}
                        <div className="p-6 border-t border-gray-100 bg-gray-50 shrink-0 flex justify-end gap-3 rounded-b-2xl">
                            <button
                                type="button"
                                onClick={() => setIsAddModalOpen(false)}
                                className="px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-200 rounded-lg transition-colors cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                form="add-staff-form"
                                className="px-5 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors cursor-pointer"
                            >
                                Create Account
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default AdminStaffList
