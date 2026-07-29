import { useState } from 'react';
import { Users, Search, Shield, MoreVertical, UserPlus, Filter, CheckCircle, XCircle } from 'lucide-react';

const mockUsers = [
    { id: 1, name: 'Dr. Priya Sharma', email: 'priya@gmail.com', role: 'alumni', department: 'CSE', status: 'active', joined: '2024-01-15' },
    { id: 2, name: 'Ravi Kumar', email: 'ravi@univ.edu', role: 'student', department: 'CSE', status: 'active', joined: '2024-08-01' },
    { id: 3, name: 'Meera Nair', email: 'meera@univ.edu', role: 'student', department: 'IT', status: 'active', joined: '2024-08-01' },
    { id: 4, name: 'Rahul Verma', email: 'rahul@microsoft.com', role: 'alumni', department: 'IT', status: 'active', joined: '2023-06-10' },
    { id: 5, name: 'Sneha Gupta', email: 'sneha@meta.com', role: 'alumni', department: 'IT', status: 'inactive', joined: '2023-03-20' },
    { id: 6, name: 'Prof. Anil Kumar', email: 'anil@univ.edu', role: 'faculty', department: 'CSE', status: 'active', joined: '2022-01-05' },
    { id: 7, name: 'Admin User', email: 'admin@univ.edu', role: 'admin', department: 'Admin', status: 'active', joined: '2022-01-01' },
    { id: 8, name: 'Arjun Das', email: 'arjun@univ.edu', role: 'student', department: 'CSE', status: 'active', joined: '2025-08-01' },
];

export default function UserManagement() {
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');

    const filtered = mockUsers.filter(u => {
        const matchSearch = u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
        const matchRole = roleFilter === 'all' || u.role === roleFilter;
        return matchSearch && matchRole;
    });

    const roleBadge = { student: 'badge-primary', alumni: 'badge-accent', admin: 'badge-warning', faculty: 'badge-success' };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-white flex items-center gap-2">
                        <Shield className="w-7 h-7 text-primary-400" /> User Management
                    </h1>
                    <p className="text-sm text-surface-400 mt-1">Manage all platform users with RBAC</p>
                </div>
                <div className="flex gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-500" />
                        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search users..." className="input-field pl-10 py-2 text-sm w-56" />
                    </div>
                    <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="input-field py-2 text-sm w-36">
                        <option value="all">All Roles</option>
                        <option value="student">Student</option>
                        <option value="alumni">Alumni</option>
                        <option value="faculty">Faculty</option>
                        <option value="admin">Admin</option>
                    </select>
                    <button className="btn-primary text-sm flex items-center gap-2"><UserPlus className="w-4 h-4" /> Add User</button>
                </div>
            </div>

            <div className="card overflow-hidden p-0">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-surface-800/50">
                                <th className="text-left text-xs font-semibold text-surface-400 uppercase px-6 py-4">User</th>
                                <th className="text-left text-xs font-semibold text-surface-400 uppercase px-6 py-4">Role</th>
                                <th className="text-left text-xs font-semibold text-surface-400 uppercase px-6 py-4">Department</th>
                                <th className="text-left text-xs font-semibold text-surface-400 uppercase px-6 py-4">Status</th>
                                <th className="text-left text-xs font-semibold text-surface-400 uppercase px-6 py-4">Joined</th>
                                <th className="text-right text-xs font-semibold text-surface-400 uppercase px-6 py-4">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map(user => (
                                <tr key={user.id} className="border-b border-surface-800/30 hover:bg-surface-800/20 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-full gradient-primary flex items-center justify-center text-white text-sm font-bold shrink-0">
                                                {user.name[0]}
                                            </div>
                                            <div>
                                                <p className="font-medium text-white text-sm">{user.name}</p>
                                                <p className="text-xs text-surface-500">{user.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`badge ${roleBadge[user.role]} capitalize`}>{user.role}</span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-surface-300">{user.department}</td>
                                    <td className="px-6 py-4">
                                        <span className={`flex items-center gap-1 text-xs ${user.status === 'active' ? 'text-green-400' : 'text-surface-500'}`}>
                                            {user.status === 'active' ? <CheckCircle className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                                            {user.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-surface-400">{user.joined}</td>
                                    <td className="px-6 py-4 text-right">
                                        <button className="p-2 rounded-lg hover:bg-surface-700 text-surface-400 hover:text-white transition-all">
                                            <MoreVertical className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
