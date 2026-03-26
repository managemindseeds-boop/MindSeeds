import { useState, useEffect, useCallback } from 'react';
import { Phone, CheckCircle2, RotateCcw, Clock, PhoneOff, RefreshCw } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

const STATUS_TABS = [
    { label: 'Pending', value: 'pending' },
    { label: 'Done', value: 'done' },
    { label: 'All', value: 'all' },
];

function timeAgo(dateStr) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
}

function formatDate(dateStr) {
    return new Date(dateStr).toLocaleDateString('en-IN', {
        day: 'numeric', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
    });
}

function CallCard({ call, onDone, onReopen, loading }) {
    const isPending = call.status === 'pending';
    const phone = call.student_phone || '';
    const initials = (call.student_name || '?').slice(0, 2).toUpperCase();

    return (
        <div className={`bg-white rounded-xl border shadow-sm p-4 flex flex-col sm:flex-row sm:items-center gap-4 transition-all duration-200
            ${isPending ? 'border-amber-100' : 'border-gray-100 opacity-70'}`}>

            {/* Avatar */}
            <div className={`w-11 h-11 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0
                ${isPending ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-500'}`}>
                {initials}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-gray-900 text-sm truncate">{call.student_name}</p>
                    {call.branch && (
                        <span className="text-[10px] font-medium bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full">
                            {call.branch}
                        </span>
                    )}
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full
                        ${isPending ? 'bg-amber-50 text-amber-700' : 'bg-[#f0e6f6] text-emerald-700'}`}>
                        {isPending ? '⏳ Pending' : '✅ Done'}
                    </span>
                </div>

                <div className="flex items-center gap-3 mt-1 flex-wrap">
                    {phone ? (
                        <a
                            href={`tel:${phone}`}
                            className="flex items-center gap-1 text-sm text-[#5e3174] font-medium hover:text-emerald-700 transition-colors"
                        >
                            <Phone size={13} />
                            {phone}
                        </a>
                    ) : (
                        <span className="flex items-center gap-1 text-xs text-gray-400">
                            <PhoneOff size={12} /> No phone
                        </span>
                    )}
                    <span className="text-xs text-gray-400">
                        {call.created_at ? timeAgo(call.created_at) : ''}
                    </span>
                    {!isPending && call.done_at && (
                        <span className="text-xs text-gray-400">Done: {formatDate(call.done_at)}</span>
                    )}
                </div>
            </div>

            {/* Action Button */}
            <div className="flex gap-2 flex-shrink-0">
                {isPending ? (
                    <button
                        onClick={() => onDone(call._id)}
                        disabled={loading === call._id}
                        className="flex items-center gap-1.5 px-4 py-2 bg-[#5e3174] hover:bg-emerald-700 text-white text-sm font-medium rounded-lg transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                        <CheckCircle2 size={15} />
                        {loading === call._id ? 'Saving...' : 'Mark Done'}
                    </button>
                ) : (
                    <button
                        onClick={() => onReopen(call._id)}
                        disabled={loading === call._id}
                        className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm font-medium rounded-lg transition-colors cursor-pointer disabled:opacity-60"
                    >
                        <RotateCcw size={13} />
                        Reopen
                    </button>
                )}
            </div>
        </div>
    );
}

function CallList() {
    const [activeTab, setActiveTab] = useState('pending');
    const [calls, setCalls] = useState([]);
    const [loading, setLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState(null); // id of call being actioned

    const fetchCalls = useCallback(async () => {
        setLoading(true);
        try {
            const res = await axios.get(`/api/v1/calls?status=${activeTab}`);
            setCalls(res.data.data || []);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to fetch calls');
        } finally {
            setLoading(false);
        }
    }, [activeTab]);

    useEffect(() => {
        fetchCalls();
    }, [fetchCalls]);

    const handleDone = async (id) => {
        setActionLoading(id);
        try {
            await axios.patch(`/api/v1/calls/${id}/done`);
            toast.success('Call marked as done ✅');
            fetchCalls();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to update');
        } finally {
            setActionLoading(null);
        }
    };

    const handleReopen = async (id) => {
        setActionLoading(id);
        try {
            await axios.patch(`/api/v1/calls/${id}/reopen`);
            toast.success('Call reopened');
            fetchCalls();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to update');
        } finally {
            setActionLoading(null);
        }
    };

    const pendingCount = calls.filter(c => c.status === 'pending').length;

    return (
        <div className="space-y-5 max-w-4xl mx-auto">

            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">

                    {activeTab === 'pending' && pendingCount > 0 && (
                        <span className="text-sm font-semibold bg-amber-100 text-amber-700 px-2.5 py-0.5 rounded-full">
                            {pendingCount}
                        </span>
                    )}
                </div>
                <button
                    onClick={fetchCalls}
                    disabled={loading}
                    className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer disabled:opacity-60"
                >
                    <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                    Refresh
                </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit">
                {STATUS_TABS.map(tab => (
                    <button
                        key={tab.value}
                        onClick={() => setActiveTab(tab.value)}
                        className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all cursor-pointer
                            ${activeTab === tab.value
                                ? 'bg-white text-gray-900 shadow-sm'
                                : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* List */}
            {loading ? (
                <div className="space-y-3">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />
                    ))}
                </div>
            ) : calls.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-3">
                    <Clock size={40} className="opacity-30" />
                    <p className="text-sm">
                        {activeTab === 'pending' ? 'No pending calls 🎉' : 'No records found'}
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    {calls.map(call => (
                        <CallCard
                            key={call._id}
                            call={call}
                            onDone={handleDone}
                            onReopen={handleReopen}
                            loading={actionLoading}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

export default CallList;
