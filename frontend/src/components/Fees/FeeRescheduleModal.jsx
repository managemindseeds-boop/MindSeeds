import { useState } from 'react'
import { X } from 'lucide-react'

function FeeRescheduleModal({ fee, onConfirm, onClose }) {
    const [newDate, setNewDate] = useState('')
    const [notes, setNotes] = useState(fee?.notes || '')

    const handleSubmit = (e) => {
        e.preventDefault()
        if (!newDate) return
        onConfirm(fee._id, newDate, notes)
        onClose()
    }

    const formatDate = (month, year) => {
        return new Date(year, month - 1).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/40" onClick={onClose} />

            {/* Modal */}
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-8 border border-gray-100">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h3 className="text-xl font-bold text-gray-900">Reschedule Payment</h3>
                        <p className="text-sm text-gray-500 mt-1">
                            {fee?.studentName} — {formatDate(fee?.month, fee?.year)}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all cursor-pointer"
                    >
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
                            New Due Date <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="date"
                            value={newDate}
                            onChange={(e) => setNewDate(e.target.value)}
                            min={new Date().toISOString().split('T')[0]}
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
                            Reason / Notes
                        </label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Why is the payment being delayed?"
                            rows={3}
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none transition-all"
                        />
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-50 transition-all cursor-pointer"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={!newDate}
                            className="flex-1 px-4 py-3 bg-black text-white rounded-xl text-sm font-bold hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer shadow-lg shadow-black/10"
                        >
                            Reschedule
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default FeeRescheduleModal
