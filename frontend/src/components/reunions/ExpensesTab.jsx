import { useCallback, useEffect, useState } from 'react';
import {
    CheckCircle2, Clock3, DollarSign, Loader2, Minus, Plus, Receipt,
    TrendingDown, TrendingUp, Users, X,
} from 'lucide-react';
import api from '../../services/api';

export default function ExpensesTab({ reunion, user, isCoordinator, onReunionUpdate }) {
    const [expenses, setExpenses] = useState([]);
    const [balances, setBalances] = useState({});
    const [userBalance, setUserBalance] = useState(0);
    const [totals, setTotals] = useState({ totalRequested: 0, totalPaid: 0, totalPending: 0 });
    const [showForm, setShowForm] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [goingAttendees, setGoingAttendees] = useState([]);

    const [title, setTitle] = useState('');
    const [amount, setAmount] = useState('');
    const [paidByUserId, setPaidByUserId] = useState(user?.id || '');
    const [splitBetween, setSplitBetween] = useState([]);
    const [saving, setSaving] = useState(false);
    const [updatingShareId, setUpdatingShareId] = useState(null);

    const fetchExpenses = useCallback(async () => {
        try {
            const [calculationsResponse, candidatesResponse] = await Promise.all([
                api.get(`/api/reunions/${reunion.id}/expenses/calculations`),
                api.get(`/api/reunions/${reunion.id}/expenses/candidates`),
            ]);
            const candidates = candidatesResponse.data.candidates || [];
            setExpenses(calculationsResponse.data.expenses || []);
            setBalances(calculationsResponse.data.balances || {});
            setUserBalance(calculationsResponse.data.userBalance || 0);
            setTotals(calculationsResponse.data.totals || {
                totalRequested: 0,
                totalPaid: 0,
                totalPending: 0,
            });
            setGoingAttendees(candidates);
            setPaidByUserId((currentPayer) =>
                candidates.some(({ id }) => id === Number(currentPayer))
                    ? Number(currentPayer)
                    : candidates[0]?.id || ''
            );
            setSplitBetween((selected) =>
                selected.filter((userId) => candidates.some(({ id }) => id === userId))
            );
        } catch (requestError) {
            setError(requestError.response?.data?.detail || 'Unable to load expense details');
        }
        finally { setLoading(false); }
    }, [reunion.id]);

    useEffect(() => {
        fetchExpenses();
    }, [fetchExpenses]);

    const toggleForm = () => {
        setError('');
        setShowForm((visible) => {
            if (!visible) {
                setSplitBetween(goingAttendees.map(({ id }) => id));
                setPaidByUserId(
                    goingAttendees.some(({ id }) => id === user?.id)
                        ? user.id
                        : goingAttendees[0]?.id || ''
                );
            }
            return !visible;
        });
    };

    const handleAddExpense = async () => {
        if (!title.trim() || !amount || parseFloat(amount) <= 0 ||
            !paidByUserId || splitBetween.length === 0) return;
        setSaving(true);
        setError('');
        setSuccess('');
        try {
            const response = await api.post(`/api/reunions/${reunion.id}/expenses`, {
                title: title.trim(),
                amount: parseFloat(amount),
                paidByUserId,
                splitBetweenUserIds: splitBetween,
            });
            setTitle(''); setAmount(''); setSplitBetween([]); setShowForm(false);
            const notifiedCount = response.data.notifiedCount || 0;
            setSuccess(
                `Expense added${notifiedCount ? ` and request sent to ${notifiedCount} attendee${notifiedCount === 1 ? '' : 's'}` : ''}.`
            );
            await fetchExpenses();
            onReunionUpdate();
        } catch (requestError) {
            setError(requestError.response?.data?.detail || 'Unable to add the expense');
        }
        finally { setSaving(false); }
    };

    const toggleSplit = (userId) => {
        setSplitBetween(prev => prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]);
    };

    const updateShareStatus = async (expense, share) => {
        if (updatingShareId) return;
        const nextStatus = share.status === 'PAID' ? 'PENDING' : 'PAID';
        setUpdatingShareId(share.id);
        setError('');
        setSuccess('');
        try {
            await api.patch(
                `/api/reunions/${reunion.id}/expenses/${expense.id}/shares/${share.id}`,
                { status: nextStatus }
            );
            setSuccess(`${share.user.name}'s share marked ${nextStatus.toLowerCase()}.`);
            await fetchExpenses();
        } catch (requestError) {
            setError(requestError.response?.data?.detail || 'Unable to update the payment status');
        } finally {
            setUpdatingShareId(null);
        }
    };

    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    const perPersonPreview = splitBetween.length && Number(amount) > 0
        ? Number(amount) / splitBetween.length
        : 0;
    const paidProgress = totals.totalRequested
        ? Math.round((totals.totalPaid / totals.totalRequested) * 100)
        : 0;
    const participantNames = new Map(
        expenses.flatMap((expense) =>
            (expense.shares || []).map((share) => [share.userId, share.user?.name])
        )
    );

    // Build settlement summary from balances
    const settlements = Object.entries(balances).map(([userId, balance]) => {
        const attendee = goingAttendees.find(({ id }) => id === parseInt(userId));
        return {
            userId: parseInt(userId),
            name: attendee?.name || participantNames.get(parseInt(userId)) || `User ${userId}`,
            balance,
        };
    }).filter(s => Math.abs(s.balance) > 0.01);

    return (
        <div className="animate-fade-in">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
                        <DollarSign className="w-5 h-5 text-amber-400" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-white">Expense Splitting</h2>
                        <p className="text-sm text-surface-400">Track shared costs and settle up</p>
                    </div>
                </div>
                <button
                    onClick={toggleForm}
                    disabled={loading}
                    className="btn-primary text-sm flex items-center gap-2"
                    aria-label="Add new expense"
                >
                    <Plus className="w-4 h-4" />
                    Add Expense
                </button>
            </div>

            {success && (
                <p className="mb-6 rounded-xl border border-green-500/20 bg-green-500/10 p-3 text-sm text-green-300">
                    {success}
                </p>
            )}
            {error && !showForm && (
                <p className="mb-6 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-300">
                    {error}
                </p>
            )}

            {/* Summary Cards */}
            <div className="grid grid-cols-1 gap-3 mb-3 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 text-center">
                    <p className="text-2xl font-black text-amber-400">₹{totalExpenses.toLocaleString()}</p>
                    <p className="text-xs text-surface-400 mt-1">Total Expenses</p>
                </div>
                <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-center">
                    <p className="text-2xl font-black text-red-400">₹{totals.totalPending.toFixed(2)}</p>
                    <p className="text-xs text-surface-400 mt-1">Pending Collection</p>
                </div>
                <div className="rounded-xl border border-green-500/20 bg-green-500/5 p-4 text-center">
                    <p className="text-2xl font-black text-green-400">₹{totals.totalPaid.toFixed(2)}</p>
                    <p className="text-xs text-surface-400 mt-1">Paid Shares</p>
                </div>
                <div className={`rounded-xl border p-4 text-center ${userBalance > 0 ? 'border-green-500/20 bg-green-500/5' : userBalance < 0 ? 'border-red-500/20 bg-red-500/5' : 'border-surface-700/50 bg-surface-800/30'
                    }`}>
                    <div className="flex items-center justify-center gap-1.5">
                        {userBalance > 0 ? <TrendingUp className="w-4 h-4 text-green-400" /> : userBalance < 0 ? <TrendingDown className="w-4 h-4 text-red-400" /> : <Minus className="w-4 h-4 text-surface-400" />}
                        <p className={`text-2xl font-black ${userBalance > 0 ? 'text-green-400' : userBalance < 0 ? 'text-red-400' : 'text-surface-300'}`}>
                            ₹{Math.abs(userBalance).toLocaleString()}
                        </p>
                    </div>
                    <p className="text-xs text-surface-400 mt-1">
                        {userBalance > 0 ? "You're owed" : userBalance < 0 ? "You owe" : "Settled up"}
                    </p>
                </div>
            </div>
            <div className="mb-8 rounded-xl border border-surface-700/50 bg-surface-800/30 p-4">
                <div className="mb-2 flex items-center justify-between text-xs">
                    <span className="font-medium text-surface-300">Collection progress</span>
                    <span className="text-green-400">{paidProgress}% settled</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-surface-700">
                    <div
                        className="h-full rounded-full bg-gradient-to-r from-amber-500 to-green-500 transition-all"
                        style={{ width: `${paidProgress}%` }}
                    />
                </div>
            </div>

            {/* Add Expense Form */}
            {showForm && (
                <div className="card mb-8 border-amber-500/20">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-white">New Expense</h3>
                        <button onClick={toggleForm} className="text-surface-400 hover:text-white"><X className="w-4 h-4" /></button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="block text-sm font-medium text-surface-400 mb-2">Title *</label>
                            <input type="text" value={title} onChange={e => setTitle(e.target.value)}
                                placeholder="e.g., Venue booking deposit" className="input-field text-sm" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-surface-400 mb-2">Amount (₹) *</label>
                            <input type="number" value={amount} onChange={e => setAmount(e.target.value)}
                                placeholder="0.00" min="0" step="0.01" className="input-field text-sm" />
                        </div>
                    </div>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-surface-400 mb-2">Paid By</label>
                        <select value={paidByUserId} onChange={e => setPaidByUserId(parseInt(e.target.value))} className="input-field text-sm">
                            {goingAttendees.map((attendee) => (
                                <option key={attendee.id} value={attendee.id}>{attendee.name} {attendee.id === user?.id ? '(You)' : ''}</option>
                            ))}
                        </select>
                    </div>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-surface-400 mb-2">
                            Split Between ({splitBetween.length} of {goingAttendees.length} going selected)
                        </label>
                        <div className="mb-2 flex items-center gap-3 text-xs">
                            <button type="button" onClick={() => setSplitBetween(goingAttendees.map(({ id }) => id))} className="text-primary-400 hover:text-primary-300">
                                Select all going
                            </button>
                            <button type="button" onClick={() => setSplitBetween([])} className="text-surface-400 hover:text-white">
                                Clear
                            </button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {goingAttendees.map((attendee) => {
                                const selected = splitBetween.includes(attendee.id);
                                return (
                                    <button type="button" key={attendee.id} onClick={() => toggleSplit(attendee.id)}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${selected ? 'bg-amber-500/20 border-amber-500/40 text-amber-300' : 'border-surface-700 text-surface-400 hover:border-surface-500'
                                            }`}
                                    >
                                        {attendee.name} {attendee.id === user?.id ? '(You)' : ''}
                                    </button>
                                );
                            })}
                        </div>
                        {goingAttendees.length === 0 && (
                            <p className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 text-sm text-amber-300">
                                No one has confirmed they are going yet.
                            </p>
                        )}
                        {perPersonPreview > 0 && (
                            <div className="mt-3 flex items-center justify-between rounded-lg border border-primary-500/20 bg-primary-500/5 p-3 text-sm">
                                <span className="text-surface-300">Equal share per person</span>
                                <span className="font-bold text-primary-300">₹{perPersonPreview.toFixed(2)}</span>
                            </div>
                        )}
                    </div>
                    {error && <p className="mb-4 text-sm text-red-400">{error}</p>}
                    <button onClick={handleAddExpense} disabled={saving || !title.trim() || !amount || !paidByUserId || splitBetween.length === 0}
                        className="btn-primary text-sm flex items-center gap-2 disabled:opacity-50">
                        {saving ? 'Adding...' : 'Add Expense'}
                    </button>
                </div>
            )}

            {/* Expense List */}
            {expenses.length > 0 && (
                <div className="card mb-8">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <Receipt className="w-5 h-5 text-surface-400" /> All Expenses
                    </h3>
                    <div className="space-y-3">
                        {expenses.map((expense) => {
                            const paidShares = expense.shares?.filter((share) => share.status === 'PAID').length || 0;
                            const shareCount = expense.shares?.length || 0;
                            return (
                                <div key={expense.id} className="rounded-xl border border-surface-700/30 bg-surface-800/30 p-4">
                                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/20">
                                                <DollarSign className="h-4 w-4 text-amber-400" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-white">{expense.title}</p>
                                                <p className="text-xs text-surface-500">
                                                    Paid by {expense.paidBy?.name} • {paidShares} of {shareCount} shares paid
                                                </p>
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-right text-sm font-bold text-amber-400">₹{expense.amount.toLocaleString()}</p>
                                            <p className="text-right text-[10px] text-surface-500">{shareCount} equal shares</p>
                                        </div>
                                    </div>

                                    <div className="mt-4 space-y-2 border-t border-surface-700/40 pt-3">
                                        {expense.shares?.map((share) => {
                                            const isPayerOwnShare = share.userId === expense.paidByUserId;
                                            const canManage = !isPayerOwnShare && (isCoordinator ||
                                                expense.paidByUserId === user?.id ||
                                                share.userId === user?.id);
                                            return (
                                                <div key={share.id} className="flex flex-col gap-2 rounded-lg bg-surface-900/40 p-3 sm:flex-row sm:items-center sm:justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <span className="flex h-8 w-8 items-center justify-center rounded-full gradient-primary text-xs font-bold text-white">
                                                            {share.user?.name?.[0] || '?'}
                                                        </span>
                                                        <div>
                                                            <p className="text-sm font-medium text-white">
                                                                {share.user?.name} {share.userId === user?.id ? '(You)' : ''}
                                                            </p>
                                                            <p className="text-xs text-surface-500">₹{share.amount.toFixed(2)}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className={'flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold ' +
                                                            (share.status === 'PAID'
                                                                ? 'border-green-500/30 bg-green-500/10 text-green-300'
                                                                : 'border-amber-500/30 bg-amber-500/10 text-amber-300')}
                                                        >
                                                            {share.status === 'PAID'
                                                                ? <CheckCircle2 className="h-3.5 w-3.5" />
                                                                : <Clock3 className="h-3.5 w-3.5" />}
                                                            {share.status === 'PAID' ? 'Paid' : 'Pending'}
                                                        </span>
                                                        {canManage && (
                                                            <button
                                                                type="button"
                                                                onClick={() => updateShareStatus(expense, share)}
                                                                disabled={updatingShareId === share.id}
                                                                className="rounded-lg border border-surface-600 px-2.5 py-1 text-xs text-surface-300 hover:border-primary-500 hover:text-primary-300 disabled:opacity-50"
                                                            >
                                                                {updatingShareId === share.id
                                                                    ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                                    : share.status === 'PAID' ? 'Undo' : 'Mark paid'}
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Settlement Summary */}
            {settlements.length > 0 && (
                <div className="card">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <Users className="w-5 h-5 text-surface-400" /> Settlement Summary
                    </h3>
                    <div className="space-y-2">
                        {settlements.sort((a, b) => b.balance - a.balance).map((s, i) => (
                            <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-surface-800/30 border border-surface-700/30">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center text-white text-xs font-bold">
                                        {s.name[0]}
                                    </div>
                                    <span className="text-sm font-medium text-white">{s.name} {s.userId === user?.id ? '(You)' : ''}</span>
                                </div>
                                <span className={`text-sm font-bold ${s.balance > 0 ? 'text-green-400' : 'text-red-400'}`}>
                                    {s.balance > 0 ? `is owed ₹${s.balance.toFixed(2)}` : `owes ₹${Math.abs(s.balance).toFixed(2)}`}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Empty State */}
            {expenses.length === 0 && !loading && (
                <div className="text-center py-12">
                    <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto mb-4">
                        <DollarSign className="w-7 h-7 text-amber-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2">No Expenses Yet</h3>
                    <p className="text-surface-400 text-sm max-w-sm mx-auto">
                        Start logging expenses to keep track of shared costs and settle up easily.
                    </p>
                </div>
            )}
        </div>
    );
}
