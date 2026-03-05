import { useState } from 'react'
import { useFees } from '../../context/FeeContext'
import {
    IndianRupee,
    Calendar,
    Search,
    CheckCircle2,
    Clock,
    RotateCcw,
    Check
} from 'lucide-react'
import FeeRescheduleModal from '../../components/Fees/FeeRescheduleModal'

function Fees() {
    const { todayFees, monthFees, markFeePaid, rescheduleFee, loading, error } = useFees()
    const [activeTab, setActiveTab] = useState('today') // 'today' or 'month'
    const [searchTerm, setSearchTerm] = useState('')
    const [rescheduleTarget, setRescheduleTarget] = useState(null)

    const filteredFees = (activeTab === 'today' ? todayFees : monthFees).filter(fee =>
        fee.studentName.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const handleMarkPaid = async (feeId) => {
        if (window.confirm('Are you sure you want to mark this fee as paid?')) {
            try {
                await markFeePaid(feeId)
            } catch (err) {
                alert(err.message)
            }
        }
    }

    const handleReschedule = async (id, date, notes) => {
        try {
            await rescheduleFee(id, date, notes)
            setRescheduleTarget(null)
        } catch (err) {
            alert(err.message)
        }
    }

    const formatDate = (dateStr) => {
        return new Date(dateStr).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        })
    }

    if (error) {
        return (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-600">
                Error: {error}
            </div>
        )
    }

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        <IndianRupee className="text-emerald-500" />
                        Fee Management
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">Track and manage student installments</p>
                </div>
                <div className="flex bg-gray-100 p-1 rounded-xl">
                    <button
                        onClick={() => setActiveTab('today')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'today' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        Today's Due
                    </button>
                    <button
                        onClick={() => setActiveTab('month')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'month' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        This Month
                    </button>
                </div>
            </div>

            {/* Search and Filters */}
            <div className="relative max-w-md">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                    type="text"
                    placeholder="Search by student name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                />
            </div>

            {/* Fee List */}
            {loading && filteredFees.length === 0 ? (
                <div className="flex justify-center py-20">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
                </div>
            ) : filteredFees.length === 0 ? (
                <div className="bg-white rounded-3xl border border-dashed border-gray-200 py-20 flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                        <IndianRupee className="text-gray-300" size={32} />
                    </div>
                    <h3 className="text-gray-900 font-semibold">No fee records found</h3>
                    <p className="text-gray-400 text-sm mt-1">
                        {searchTerm ? 'Try a different search term' : `No records for ${activeTab === 'today' ? "today's due" : 'this month'}.`}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredFees.map((fee) => (
                        <div key={fee._id} className="bg-white rounded-2xl border border-gray-200 p-5 hover:border-emerald-300 hover:shadow-xl hover:shadow-emerald-500/5 transition-all duration-300 group">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="font-bold text-gray-900 group-hover:text-emerald-600 transition-colors text-lg">
                                        {fee.studentName}
                                    </h3>
                                    <p className="text-xs text-gray-500 mt-1">Branch: {fee.branch}</p>
                                </div>
                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${fee.status === 'paid' ? 'bg-emerald-50 text-emerald-600' :
                                    fee.status === 'pending' || fee.status === 'rescheduled' ? 'bg-amber-50 text-amber-600' :
                                        'bg-gray-50 text-gray-600'
                                    }`}>
                                    {fee.status}
                                </span>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <div className="p-3 bg-gray-50 rounded-xl">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Due Date</p>
                                    <div className="flex items-center gap-2 text-sm text-gray-700 font-medium">
                                        <Calendar size={14} className="text-emerald-500" />
                                        {formatDate(fee.dueDate)}
                                    </div>
                                </div>
                                <div className="p-3 bg-gray-50 rounded-xl">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Period</p>
                                    <div className="flex items-center gap-2 text-sm text-gray-700 font-medium">
                                        <Clock size={14} className="text-blue-500" />
                                        {new Date(fee.year, fee.month - 1).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
                                    </div>
                                </div>
                            </div>

                            {(fee.status === 'pending' || fee.status === 'rescheduled') && (
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => handleMarkPaid(fee._id)}
                                        className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-black text-white rounded-xl text-sm font-bold hover:bg-gray-800 transition-all cursor-pointer group/btn shadow-lg shadow-black/5"
                                    >
                                        <Check size={18} />
                                        Pay
                                    </button>
                                    <button
                                        onClick={() => setRescheduleTarget(fee)}
                                        className="px-4 py-3.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-bold hover:bg-gray-50 transition-all cursor-pointer flex items-center gap-2"
                                    >
                                        <RotateCcw size={16} />
                                        Reschedule
                                    </button>
                                </div>
                            )}

                            {fee.status === 'paid' && fee.paidAt && (
                                <div className="flex items-center justify-center gap-2 py-3 bg-emerald-50 text-emerald-600 rounded-xl text-sm font-bold">
                                    <CheckCircle2 size={18} />
                                    Paid on {formatDate(fee.paidAt)}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
            {/* Reschedule Modal */}
            {rescheduleTarget && (
                <FeeRescheduleModal
                    fee={rescheduleTarget}
                    onConfirm={(id, date, notes) => handleReschedule(id, date, notes)}
                    onClose={() => setRescheduleTarget(null)}
                />
            )}
        </div>
    )
}

export default Fees
