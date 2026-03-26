import { useState, useEffect } from 'react'
import { useAdmin } from '../../context/AdminContext'
import { BRANCHES } from '../../constants/branches'
import { Plus, Search, Edit2, ShieldAlert, ShieldCheck, KeyRound, X, RefreshCw, AlertCircle } from 'lucide-react'

function AdminStaffList() {
    const { staff, staffLoading, fetchStaff, createStaffMember, updateStaffMember, resetStaffPassword } = useAdmin()

    const [search, setSearch] = useState('')
    const [isAddModalOpen, setIsAddModalOpen] = useState(false)
    const [isEditModalOpen, setIsEditModalOpen] = useState(false)
    const [isResetModalOpen, setIsResetModalOpen] = useState(false)
    const [selectedStaff, setSelectedStaff] = useState(null)
    const [formError, setFormError] = useState('')
    const [formSuccess, setFormSuccess] = useState('')

    // Add form
    const [addForm, setAddForm] = useState({ username: '', password: '', branches: [] })
    // Edit form
    const [editForm, setEditForm] = useState({ username: '', branches: [] })
    // Reset form
    const [newPassword, setNewPassword] = useState('')

    useEffect(() => {
        fetchStaff()
    }, [fetchStaff])

    // Auto-refresh every 30s for real-time accuracy
    useEffect(() => {
        const interval = setInterval(fetchStaff, 30000)
        return () => clearInterval(interval)
    }, [fetchStaff])

    const filtered = staff.filter(s =>
        s.username?.toLowerCase().includes(search.toLowerCase()) ||
        (s.branches || []).some(b => b.toLowerCase().includes(search.toLowerCase()))
    )

    // ── Add Staff ───────────────────────────────────────────────────────────
    const handleAddSubmit = async (e) => {
        e.preventDefault()
        setFormError('')
        try {
            await createStaffMember({
                username: addForm.username.trim(),
                password: addForm.password,
                branches: addForm.branches,
            })
            setIsAddModalOpen(false)
            setAddForm({ username: '', password: '', branches: [] })
            setFormSuccess('Staff account created successfully!')
            setTimeout(() => setFormSuccess(''), 3000)
        } catch (err) {
            setFormError(err.response?.data?.message || 'Failed to create staff')
        }
    }

    // ── Edit Staff ──────────────────────────────────────────────────────────
    const openEditModal = (member) => {
        setSelectedStaff(member)
        setEditForm({
            username: member.username,
            branches: member.branches || [],
        })
        setFormError('')
        setIsEditModalOpen(true)
    }

    const handleEditSubmit = async (e) => {
        e.preventDefault()
        setFormError('')
        try {
            await updateStaffMember(selectedStaff._id, {
                username: editForm.username.trim(),
                branches: editForm.branches,
            })
            setIsEditModalOpen(false)
            setFormSuccess('Staff updated successfully!')
            setTimeout(() => setFormSuccess(''), 3000)
        } catch (err) {
            setFormError(err.response?.data?.message || 'Failed to update')
        }
    }

    // ── Toggle Active ───────────────────────────────────────────────────────
    const handleToggleActive = async (member) => {
        try {
            await updateStaffMember(member._id, { isActive: !member.isActive })
        } catch (err) {
            console.error('Toggle error:', err)
        }
    }

    // ── Reset Password ──────────────────────────────────────────────────────
    const openResetModal = (member) => {
        setSelectedStaff(member)
        setNewPassword('')
        setFormError('')
        setIsResetModalOpen(true)
    }

    const handleResetSubmit = async (e) => {
        e.preventDefault()
        setFormError('')
        try {
            await resetStaffPassword(selectedStaff._id, newPassword)
            setIsResetModalOpen(false)
            setFormSuccess('Password reset successfully!')
            setTimeout(() => setFormSuccess(''), 3000)
        } catch (err) {
            setFormError(err.response?.data?.message || 'Failed to reset password')
        }
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <p className="text-sm text-gray-500">Manage receptionist accounts and access across all branches</p>
                <div className="flex items-center gap-2">
                    <button onClick={fetchStaff} className="p-2 bg-white border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer shadow-sm">
                        <RefreshCw size={16} className={staffLoading ? 'animate-spin' : ''} />
                    </button>
                    <button
                        onClick={() => { setIsAddModalOpen(true); setFormError(''); setAddForm({ username: '', password: '', branches: [] }) }}
                        className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium cursor-pointer shadow-sm"
                    >
                        <Plus size={16} />
                        Add New Staff
                    </button>
                </div>
            </div>

            {/* Success Toast */}
            {formSuccess && (
                <div className="bg-[#f0e6f6] border border-emerald-200 text-emerald-700 px-4 py-3 rounded-lg text-sm font-medium flex items-center gap-2">
                    <ShieldCheck size={16} />
                    {formSuccess}
                </div>
            )}

            {/* Search */}
            <div className="relative max-w-md">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                    type="text"
                    placeholder="Search by username or branch..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                />
            </div>

            {/* Staff Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-200">
                                <th className="text-left px-6 py-4 font-semibold text-gray-700">Username</th>
                                <th className="text-left px-6 py-4 font-semibold text-gray-700">Role</th>
                                <th className="text-left px-6 py-4 font-semibold text-gray-700">Branches</th>
                                <th className="text-left px-6 py-4 font-semibold text-gray-700">Status</th>
                                <th className="text-left px-6 py-4 font-semibold text-gray-700">Created</th>
                                <th className="text-center px-6 py-4 font-semibold text-gray-700">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filtered.length === 0 ? (
                                staffLoading ? (
                                    // Skeleton loading rows
                                    Array.from({ length: 4 }).map((_, i) => (
                                        <tr key={i} className="animate-pulse">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-gray-200" />
                                                    <div className="h-3.5 bg-gray-200 rounded w-24" />
                                                </div>
                                            </td>
                                            <td className="px-6 py-4"><div className="h-5 bg-gray-200 rounded-md w-20" /></td>
                                            <td className="px-6 py-4"><div className="flex gap-1"><div className="h-5 bg-gray-200 rounded-md w-16" /><div className="h-5 bg-gray-200 rounded-md w-16" /></div></td>
                                            <td className="px-6 py-4"><div className="h-5 bg-gray-200 rounded-full w-16" /></td>
                                            <td className="px-6 py-4"><div className="h-3.5 bg-gray-200 rounded w-20" /></td>
                                            <td className="px-6 py-4"><div className="flex justify-center gap-1"><div className="h-8 w-8 bg-gray-200 rounded-lg" /><div className="h-8 w-8 bg-gray-200 rounded-lg" /><div className="h-8 w-8 bg-gray-200 rounded-lg" /></div></td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-10 text-center text-gray-400">
                                            No staff members found.
                                        </td>
                                    </tr>
                                )
                            ) : (
                                filtered.map((member) => (
                                    <tr key={member._id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold uppercase">
                                                    {member.username?.charAt(0) || '?'}
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-gray-900">@{member.username}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-800 capitalize">
                                                {member.role}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-wrap gap-1">
                                                {(member.branches || []).length > 0
                                                    ? member.branches.map((b, i) => (
                                                        <span key={i} className="inline-block px-2 py-0.5 rounded-md text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                                                            {b}
                                                        </span>
                                                    ))
                                                    : <span className="text-gray-400 text-xs">No branches</span>
                                                }
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                                                member.isActive !== false
                                                    ? 'bg-[#f0e6f6] text-emerald-700 border border-emerald-200'
                                                    : 'bg-red-50 text-red-700 border border-red-200'
                                            }`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${member.isActive !== false ? 'bg-[#5f3473]' : 'bg-red-500'}`} />
                                                {member.isActive !== false ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-gray-500">
                                            {new Date(member.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-center gap-1">
                                                <button
                                                    onClick={() => openEditModal(member)}
                                                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                                                    title="Edit"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                <button
                                                    onClick={() => openResetModal(member)}
                                                    className="p-2 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                                                    title="Reset Password"
                                                >
                                                    <KeyRound size={16} />
                                                </button>
                                                {member.role !== 'admin' && (
                                                    <button
                                                        onClick={() => handleToggleActive(member)}
                                                        className={`p-2 rounded-lg transition-colors cursor-pointer ${
                                                            member.isActive !== false
                                                                ? 'text-gray-400 hover:text-red-600 hover:bg-red-50'
                                                                : 'text-gray-400 hover:text-[#5f3473] hover:bg-[#f0e6f6]'
                                                        }`}
                                                        title={member.isActive !== false ? 'Deactivate' : 'Activate'}
                                                    >
                                                        {member.isActive !== false ? <ShieldAlert size={16} /> : <ShieldCheck size={16} />}
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ── Add Staff Modal ──────────────────────────────────────────── */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#5f3473]/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="flex items-center justify-between p-6 border-b border-gray-100 shrink-0">
                            <div>
                                <h3 className="text-xl font-bold text-gray-900">Add New Staff</h3>
                                <p className="text-sm text-gray-500 mt-1">Create a new receptionist account</p>
                            </div>
                            <button onClick={() => setIsAddModalOpen(false)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors cursor-pointer">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto">
                            {formError && (
                                <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
                                    <AlertCircle size={16} /> {formError}
                                </div>
                            )}
                            <form id="add-staff-form" onSubmit={handleAddSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Username</label>
                                    <input type="text" required value={addForm.username}
                                        onChange={(e) => setAddForm({ ...addForm, username: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                        placeholder="e.g. rahul.s" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
                                    <input type="password" required value={addForm.password}
                                        onChange={(e) => setAddForm({ ...addForm, password: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                        placeholder="Min 6 characters" minLength={6} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Assign Branches</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {BRANCHES.map(b => (
                                            <label key={b} className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border cursor-pointer transition-all text-sm ${
                                                addForm.branches.includes(b)
                                                    ? 'bg-blue-50 border-blue-300 text-blue-700 font-medium'
                                                    : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                                            }`}>
                                                <input
                                                    type="checkbox"
                                                    checked={addForm.branches.includes(b)}
                                                    onChange={(e) => {
                                                        setAddForm(prev => ({
                                                            ...prev,
                                                            branches: e.target.checked
                                                                ? [...prev.branches, b]
                                                                : prev.branches.filter(x => x !== b)
                                                        }))
                                                    }}
                                                    className="accent-blue-600 w-4 h-4"
                                                />
                                                {b}
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            </form>
                        </div>
                        <div className="p-6 border-t border-gray-100 bg-gray-50 shrink-0 flex justify-end gap-3">
                            <button type="button" onClick={() => setIsAddModalOpen(false)}
                                className="px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-200 rounded-lg transition-colors cursor-pointer">
                                Cancel
                            </button>
                            <button type="submit" form="add-staff-form"
                                className="px-5 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors cursor-pointer">
                                Create Account
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Edit Staff Modal ─────────────────────────────────────────── */}
            {isEditModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#5f3473]/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="flex items-center justify-between p-6 border-b border-gray-100 shrink-0">
                            <h3 className="text-xl font-bold text-gray-900">Edit Staff</h3>
                            <button onClick={() => setIsEditModalOpen(false)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors cursor-pointer">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto">
                            {formError && (
                                <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
                                    <AlertCircle size={16} /> {formError}
                                </div>
                            )}
                            <form id="edit-staff-form" onSubmit={handleEditSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Username</label>
                                    <input type="text" required value={editForm.username}
                                        onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Branches</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {BRANCHES.map(b => (
                                            <label key={b} className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border cursor-pointer transition-all text-sm ${
                                                editForm.branches.includes(b)
                                                    ? 'bg-blue-50 border-blue-300 text-blue-700 font-medium'
                                                    : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                                            }`}>
                                                <input
                                                    type="checkbox"
                                                    checked={editForm.branches.includes(b)}
                                                    onChange={(e) => {
                                                        setEditForm(prev => ({
                                                            ...prev,
                                                            branches: e.target.checked
                                                                ? [...prev.branches, b]
                                                                : prev.branches.filter(x => x !== b)
                                                        }))
                                                    }}
                                                    className="accent-blue-600 w-4 h-4"
                                                />
                                                {b}
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            </form>
                        </div>
                        <div className="p-6 border-t border-gray-100 bg-gray-50 shrink-0 flex justify-end gap-3">
                            <button type="button" onClick={() => setIsEditModalOpen(false)} className="px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-200 rounded-lg cursor-pointer">Cancel</button>
                            <button type="submit" form="edit-staff-form" className="px-5 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm cursor-pointer">Save Changes</button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Reset Password Modal ─────────────────────────────────────── */}
            {isResetModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#5f3473]/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden flex flex-col">
                        <div className="flex items-center justify-between p-6 border-b border-gray-100 shrink-0">
                            <h3 className="text-xl font-bold text-gray-900">Reset Password</h3>
                            <button onClick={() => setIsResetModalOpen(false)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors cursor-pointer">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-6">
                            {formError && (
                                <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
                                    <AlertCircle size={16} /> {formError}
                                </div>
                            )}
                            <p className="text-sm text-gray-500 mb-4">Reset password for <strong>@{selectedStaff?.username}</strong></p>
                            <form id="reset-pwd-form" onSubmit={handleResetSubmit}>
                                <input type="password" required value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all"
                                    placeholder="New password (min 6 chars)" minLength={6} />
                            </form>
                        </div>
                        <div className="p-6 border-t border-gray-100 bg-gray-50 shrink-0 flex justify-end gap-3">
                            <button type="button" onClick={() => setIsResetModalOpen(false)} className="px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-200 rounded-lg cursor-pointer">Cancel</button>
                            <button type="submit" form="reset-pwd-form" className="px-5 py-2.5 text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow-sm cursor-pointer">Reset Password</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default AdminStaffList
