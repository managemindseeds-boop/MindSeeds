import { useState } from 'react'
import { X } from 'lucide-react'

function RescheduleModal({ demo, onConfirm, onClose }) {
    const [newDate, setNewDate] = useState('')
    const [notes, setNotes] = useState(demo?.notes || '')

    const handleSubmit = (e) => {
        e.preventDefault()
        if (!newDate) return
        onConfirm(demo.id, newDate, notes)
        onClose()
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/40" onClick={onClose} />

            {/* Modal */}
            <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900">Reschedule Demo</h3>
                        <p className="text-sm text-gray-500">
                            {demo?.studentName} — Lecture {demo?.lectureNumber}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                    >
                        <X size={18} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                            New Date <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="date"
                            value={newDate}
                            onChange={(e) => setNewDate(e.target.value)}
                            min={new Date().toISOString().split('T')[0]}
                            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                            Reason / Notes
                        </label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Reason for absence..."
                            rows={3}
                            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-1">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={!newDate}
                            className="px-4 py-2 bg-black text-white rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                        >
                            Reschedule
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default RescheduleModal
