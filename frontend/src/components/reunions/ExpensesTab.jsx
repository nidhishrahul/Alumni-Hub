import { useState, useEffect } from 'react';
import { DollarSign, Plus, Users, TrendingUp, TrendingDown, Minus, Receipt, X } from 'lucide-react';

export default function ExpensesTab({ reunion, user, isCoordinator, onReunionUpdate }) {
    const [expenses, setExpenses] = useState([]);
    const [balances, setBalances] = useState({});
    const [userBalance, setUserBalance] = useState(0);
    const [showForm, setShowForm] = useState(false);
    const [loading, setLoading] = useState(true);

    const [title, setTitle] = useState('');
    const [amount, setAmount] = useState('');
    const [paidByUserId, setPaidByUserId] = useState(user?.id);
    const [splitBetween, setSplitBetween] = useState([]);
    const [saving, setSaving] = useState(false);

    const goingAttendees = reunion.attendance?.filter(a => a.status === 'GOING') || [];

    useEffect(() => {
        fetchExpenses();
    }, [reunion]);

    const fetchExpenses = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`http://localhost:3001/api/reunions/${reunion.id}/expenses/calculations`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setExpenses(data.expenses);
                setBalances(data.balances);
                setUserBalance(data.userBalance);
            }
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const handleAddExpense = async () => {
        if (!title.trim() || !amount || parseFloat(amount) <= 0) return;
        setSaving(true);
        try {
            const ids = splitBetween.length > 0 ? splitBetween : goingAttendees.map(a => a.user.id);
            const token = localStorage.getItem('token');
            const res = await fetch(`http://localhost:3001/api/reunions/${reunion.id}/expenses`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ title: title.trim(), amount: parseFloat(amount), paidByUserId, splitBetweenUserIds: ids })
            });
            if (res.ok) {
                setTitle(''); setAmount(''); setSplitBetween([]); setShowForm(false);
                await fetchExpenses();
                onReunionUpdate();
            }
        } catch (err) { console.error(err); }
        finally { setSaving(false); }
    };

    const toggleSplit = (userId) => {
        setSplitBetween(prev => prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]);
    };

    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

    // Build settlement summary from balances
    const settlements = Object.entries(balances).map(([userId, balance]) => {
        const attendee = reunion.attendance?.find(a => a.user?.id === parseInt(userId));
        return { userId: parseInt(userId), name: attendee?.user?.name || `User ${userId}`, balance };
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
                    onClick={() => setShowForm(!showForm)}
                    className="btn-primary text-sm flex items-center gap-2"
                    aria-label="Add new expense"
                >
                    <Plus className="w-4 h-4" />
                    Add Expense
                </button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-8">
                <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 text-center">
                    <p className="text-2xl font-black text-amber-400">₹{totalExpenses.toLocaleString()}</p>
                    <p className="text-xs text-surface-400 mt-1">Total Expenses</p>
                </div>
                <div className="rounded-xl border border-surface-700/50 bg-surface-800/30 p-4 text-center">
                    <p className="text-2xl font-black text-surface-300">{expenses.length}</p>
                    <p className="text-xs text-surface-400 mt-1">Items Logged</p>
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

            {/* Add Expense Form */}
            {showForm && (
                <div className="card mb-8 border-amber-500/20">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-white">New Expense</h3>
                        <button onClick={() => setShowForm(false)} className="text-surface-400 hover:text-white"><X className="w-4 h-4" /></button>
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
                            {goingAttendees.map(a => (
                                <option key={a.user.id} value={a.user.id}>{a.user.name} {a.user.id === user?.id ? '(You)' : ''}</option>
                            ))}
                        </select>
                    </div>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-surface-400 mb-2">
                            Split Between {splitBetween.length > 0 ? `(${splitBetween.length} selected)` : '(all Going by default)'}
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {goingAttendees.map(a => {
                                const selected = splitBetween.length === 0 || splitBetween.includes(a.user.id);
                                return (
                                    <button key={a.user.id} onClick={() => toggleSplit(a.user.id)}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${selected ? 'bg-amber-500/20 border-amber-500/40 text-amber-300' : 'border-surface-700 text-surface-400 hover:border-surface-500'
                                            }`}
                                    >
                                        {a.user.name} {a.user.id === user?.id ? '(You)' : ''}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                    <button onClick={handleAddExpense} disabled={saving || !title.trim() || !amount}
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
                        {expenses.map((exp, i) => (
                            <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-surface-800/30 border border-surface-700/30">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center">
                                        <DollarSign className="w-4 h-4 text-amber-400" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-white">{exp.title}</p>
                                        <p className="text-xs text-surface-500">Paid by {exp.paidBy?.name} • Split {JSON.parse(exp.splitBetweenUserIds).length} ways</p>
                                    </div>
                                </div>
                                <p className="text-sm font-bold text-amber-400">₹{exp.amount.toLocaleString()}</p>
                            </div>
                        ))}
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
                                    {s.balance > 0 ? `is owed ₹${s.balance.toFixed(0)}` : `owes ₹${Math.abs(s.balance).toFixed(0)}`}
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
