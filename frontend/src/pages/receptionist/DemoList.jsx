import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDemos } from '../../context/DemoContext'
import {
    CalendarCheck,
    Clock,
    Phone,
    ChevronRight,
    AlertCircle,
    CheckCircle2,
} from 'lucide-react'

function DemoList() {
    const navigate = useNavigate()
    const { todayDemos, upcomingDemos, absentDemos, loading, error, refreshDemos } = useDemos()

    useEffect(() => {
        refreshDemos()
    }, [refreshDemos])

    const formatDate = (dateStr) => {
        if (!dateStr) return ''
        return new Date(dateStr).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        })
    }

    const today = new Date().toLocaleDateString('en-IN', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    })

    if (loading && todayDemos.length === 0) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                Error: {error}
            </div>
        )
    }

    return (
        <div className="space-y-6 max-w-3xl mx-auto">

            {/* Header */}
            <div>
                <h1 className="text-xl font-bold text-gray-900">Demo Lectures</h1>
                <p className="text-sm text-gray-500 mt-0.5">Manage demo schedules and attendance</p>
            </div>

            {/* ── Action Required (Absent) ── */}
            {absentDemos.length > 0 && (
                <section>
                    <div className="flex items-center gap-2 mb-3">
                        <span className="w-3 h-3 rounded-full bg-red-500 shrink-0" />
                        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Action Required</h2>
                    </div>
                    <div className="space-y-3">
                        {absentDemos.map((demo) => (
                            <div
                                key={demo.id}
                                className="bg-red-50 border border-red-200 rounded-xl p-4"
                            >
                                <div className="flex items-start gap-3">
                                    <AlertCircle size={20} className="text-red-500 mt-0.5 shrink-0" />
                                    <div className="flex-1">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="text-sm font-semibold text-gray-900">{demo.studentName} was absent</p>
                                                <p className="text-xs text-gray-500 mt-0.5">
                                                    Lecture {demo.lectureNumber} •{' '}
                                                    {formatDate(demo.scheduledDate)}
                                                    {demo.notes && ` • ${demo.notes}`}
                                                </p>
                                            </div>
                                            <span className="text-[10px] font-medium text-red-600 bg-red-100 px-2 py-0.5 rounded-full">
                                                ABSENT
                                            </span>
                                        </div>
                                        <div className="flex gap-2 mt-3">
                                            <button
                                                onClick={() => navigate(`/receptionist/demos/${demo.studentId}`)}
                                                className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500 text-white rounded-lg text-xs font-medium hover:bg-red-600 transition-colors cursor-pointer"
                                            >
                                                <Phone size={12} />
                                                Action / Reschedule
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* ── Today's Demos ── */}
            <section>
                <div className="flex items-center gap-2 mb-3">
                    <span className="w-3 h-3 rounded-full bg-emerald-500 shrink-0" />
                    <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Today's Demos</h2>
                    <span className="ml-1 px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-full text-xs font-medium">
                        {todayDemos.length}
                    </span>
                    <span className="ml-auto text-xs text-gray-400 flex items-center gap-1">
                        <CalendarCheck size={13} className="text-emerald-400" />
                        {today}
                    </span>
                </div>

                {todayDemos.length === 0 ? (
                    <div className="flex items-center gap-3 p-4 bg-white rounded-xl border border-gray-200 text-sm text-gray-400">
                        <CheckCircle2 size={18} className="text-gray-300" />
                        No demos scheduled for today — you're all clear!
                    </div>
                ) : (
                    <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100 overflow-hidden">
                        {todayDemos.map((demo) => (
                            <div
                                key={demo.id}
                                onClick={() => navigate(`/receptionist/demos/${demo.studentId}`)}
                                className="flex items-center gap-4 px-4 py-3 hover:bg-gray-50 transition-colors cursor-pointer group"
                            >
                                {/* Date Badge */}
                                <div className="flex flex-col items-center justify-center w-12 h-12 rounded-lg bg-emerald-50 shrink-0">
                                    <span className="text-base font-bold text-emerald-600 leading-none">
                                        {new Date(demo.scheduledDate).getDate()}
                                    </span>
                                    <span className="text-[10px] text-emerald-400 uppercase tracking-wide mt-0.5">
                                        {new Date(demo.scheduledDate).toLocaleDateString('en-IN', { month: 'short' })}
                                    </span>
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-gray-900 truncate">{demo.studentName}</p>
                                    <p className="text-xs text-gray-500 mt-0.5">
                                        Class {demo.studentClass}&nbsp;•&nbsp;Lecture {demo.lectureNumber}/4
                                    </p>
                                </div>

                                {demo.attended === true && (
                                    <span className="text-[10px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0">
                                        <CheckCircle2 size={9} /> Present
                                    </span>
                                )}
                                {demo.attended !== true && (
                                    <span className="text-[10px] font-medium text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0">
                                        <Clock size={9} /> Pending
                                    </span>
                                )}

                                <ChevronRight size={16} className="text-gray-300 group-hover:text-gray-500 transition-colors shrink-0" />
                            </div>
                        ))}
                    </div>
                )}
            </section>

            {/* ── Upcoming Demos ── */}
            <section>
                <div className="flex items-center gap-2 mb-3">
                    <span className="w-3 h-3 rounded-full bg-blue-500 shrink-0" />
                    <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Upcoming</h2>
                    <span className="ml-1 px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full text-xs font-medium">
                        {upcomingDemos.length}
                    </span>
                </div>

                {upcomingDemos.length === 0 ? (
                    <div className="p-4 bg-white rounded-xl border border-gray-200 text-sm text-gray-400">
                        No upcoming demos scheduled
                    </div>
                ) : (
                    <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100 overflow-hidden">
                        {upcomingDemos.map((demo) => (
                            <div
                                key={demo.id}
                                onClick={() => navigate(`/receptionist/demos/${demo.studentId}`)}
                                className="flex items-center gap-4 px-4 py-3 hover:bg-gray-50 transition-colors cursor-pointer group"
                            >
                                {/* Date Badge */}
                                <div className="flex flex-col items-center justify-center w-12 h-12 rounded-lg bg-blue-50 shrink-0">
                                    <span className="text-base font-bold text-blue-600 leading-none">
                                        {new Date(demo.scheduledDate).getDate()}
                                    </span>
                                    <span className="text-[10px] text-blue-400 uppercase tracking-wide mt-0.5">
                                        {new Date(demo.scheduledDate).toLocaleDateString('en-IN', { month: 'short' })}
                                    </span>
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-gray-900 truncate">{demo.studentName}</p>
                                    <p className="text-xs text-gray-500 mt-0.5">
                                        Class {demo.studentClass}&nbsp;•&nbsp;Lecture {demo.lectureNumber}/4
                                    </p>
                                </div>

                                <ChevronRight size={16} className="text-gray-300 group-hover:text-gray-500 transition-colors shrink-0" />
                            </div>
                        ))}
                    </div>
                )}
            </section>

        </div>
    )
}

export default DemoList
