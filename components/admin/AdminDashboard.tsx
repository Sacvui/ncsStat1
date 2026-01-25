'use client';

import { useEffect, useState } from 'react';
import {
    Users,
    Activity,
    Coins,
    TrendingUp,
    Calendar,
    UserPlus,
    BarChart3,
    Settings,
    Search,
    ChevronLeft,
    ChevronRight,
    Edit,
    Eye,
    FlaskConical
} from 'lucide-react';
import {
    getAdminDashboardStats,
    getAllUsers,
    getUserDetails,
    adjustUserTokens,
    updateUserRole,
    getActivityBreakdown,
    getInvitationStats,
    getTopInviters
} from '@/lib/admin-actions';
import { AdminAutoTest } from './AdminAutoTest';
import { AdminCreditConfig } from './AdminCreditConfig';
import { AdminActivityLog } from './AdminActivityLog';

type Tab = 'dashboard' | 'users' | 'activity' | 'invitations' | 'autotest' | 'settings';

interface DashboardStats {
    totalUsers: number;
    activeToday: number;
    activeWeek: number;
    loginsToday: number;
    totalAnalyses: number;
    tokenStats: { sum: number };
}

interface User {
    id: string;
    email: string;
    full_name: string | null;
    role: string;
    tokens: number;
    total_earned: number;
    total_spent: number;
    last_active: string | null;
    created_at: string;
    referral_code: string | null;
}

export default function AdminDashboard() {
    const [activeTab, setActiveTab] = useState<Tab>('dashboard');
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [users, setUsers] = useState<User[]>([]);
    const [userTotal, setUserTotal] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [invitationStats, setInvitationStats] = useState<any>(null);
    const [topInviters, setTopInviters] = useState<any[]>([]);
    const [activityBreakdown, setActivityBreakdown] = useState<any[]>([]);

    // Token adjustment modal
    const [showTokenModal, setShowTokenModal] = useState(false);
    const [tokenAmount, setTokenAmount] = useState(0);
    const [tokenReason, setTokenReason] = useState('');

    useEffect(() => {
        loadData();
    }, [activeTab, currentPage, searchQuery]);

    async function loadData() {
        setLoading(true);

        if (activeTab === 'dashboard') {
            const dashboardStats = await getAdminDashboardStats();
            setStats(dashboardStats);
            const breakdown = await getActivityBreakdown(30);
            setActivityBreakdown(breakdown);
        }

        if (activeTab === 'users') {
            const { users: userData, total } = await getAllUsers(currentPage, 20, searchQuery || undefined);
            setUsers(userData);
            setUserTotal(total);
        }

        if (activeTab === 'invitations') {
            const invStats = await getInvitationStats();
            setInvitationStats(invStats);
            const topInv = await getTopInviters(10);
            setTopInviters(topInv);
        }

        setLoading(false);
    }

    async function handleViewUser(userId: string) {
        const details = await getUserDetails(userId);
        setSelectedUser(details);
    }

    async function handleAdjustTokens() {
        if (!selectedUser || !tokenAmount || !tokenReason) {
            alert('Please fill all fields');
            return;
        }

        const result = await adjustUserTokens(selectedUser.profile.id, tokenAmount, tokenReason);

        if (result?.error) {
            alert(`Error: ${result.error}`);
            return;
        }

        setShowTokenModal(false);
        setTokenAmount(0);
        setTokenReason('');
        handleViewUser(selectedUser.profile.id);
        alert('Tokens adjusted successfully');
    }

    async function handleRoleChange(userId: string, newRole: 'user' | 'researcher' | 'admin') {
        await updateUserRole(userId, newRole);
        loadData();
    }

    const tabs: { id: Tab; label: string; icon: any }[] = [
        { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
        { id: 'users', label: 'Users', icon: Users },
        { id: 'activity', label: 'Activity', icon: Activity },
        { id: 'invitations', label: 'Invitations', icon: UserPlus },
        { id: 'autotest', label: 'Auto Test', icon: FlaskConical },
        { id: 'settings', label: 'Settings', icon: Settings },
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
            {/* Header with branding */}
            <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 text-white px-6 py-4">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
                        <p className="text-white/70 text-sm">ncsStat Management Console</p>
                    </div>
                    <div className="flex items-center gap-2 bg-white/20 rounded-full px-3 py-1">
                        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                        <span className="text-sm">Live</span>
                    </div>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="bg-white/80 backdrop-blur-sm border-b sticky top-0 z-10 shadow-sm">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="flex gap-1 overflow-x-auto">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 px-5 py-4 border-b-2 transition-all whitespace-nowrap ${activeTab === tab.id
                                    ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                                    }`}
                            >
                                <tab.icon className="w-4 h-4" />
                                <span className="text-sm font-medium">{tab.label}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 py-6">
                {/* Skeleton Loading */}
                {loading && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className="bg-white rounded-xl p-6 animate-pulse">
                                    <div className="h-4 bg-gray-200 rounded w-2/3 mb-3"></div>
                                    <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                                </div>
                            ))}
                        </div>
                        <div className="bg-white rounded-xl p-6 animate-pulse">
                            <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
                            <div className="h-40 bg-gray-100 rounded"></div>
                        </div>
                    </div>
                )}

                {/* Dashboard Tab */}
                {!loading && activeTab === 'dashboard' && stats && (
                    <div className="space-y-6">
                        {/* Stats Cards */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <StatCard
                                icon={Users}
                                label="Total Users"
                                value={stats.totalUsers}
                                color="blue"
                            />
                            <StatCard
                                icon={Activity}
                                label="Active Today"
                                value={stats.activeToday}
                                color="green"
                            />
                            <StatCard
                                icon={Calendar}
                                label="Active This Week"
                                value={stats.activeWeek}
                                color="purple"
                            />
                            <StatCard
                                icon={TrendingUp}
                                label="Total Analyses"
                                value={stats.totalAnalyses}
                                color="amber"
                            />
                        </div>

                        {/* Activity Breakdown */}
                        <div className="bg-white rounded-xl border p-6">
                            <h3 className="text-lg font-semibold mb-4">Activity Breakdown (30 days)</h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {activityBreakdown.map(item => (
                                    <div key={item.type} className="bg-gray-50 rounded-lg p-3">
                                        <div className="text-2xl font-bold text-gray-900">{item.count}</div>
                                        <div className="text-sm text-gray-500 capitalize">{item.type.replace('_', ' ')}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Users Tab */}
                {!loading && activeTab === 'users' && (
                    <div className="space-y-4">
                        {/* Search */}
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search users by email or name..."
                                value={searchQuery}
                                onChange={(e) => {
                                    setSearchQuery(e.target.value);
                                    setCurrentPage(1);
                                }}
                                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>

                        {/* Users Table */}
                        <div className="bg-white rounded-xl border overflow-hidden">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b">
                                    <tr>
                                        <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">User</th>
                                        <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Role</th>
                                        <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Tokens</th>
                                        <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Last Active</th>
                                        <th className="px-4 py-3"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {users.map(user => (
                                        <tr key={user.id} className="hover:bg-gray-50">
                                            <td className="px-4 py-3">
                                                <div>
                                                    <div className="font-medium text-gray-900">{user.full_name || 'No name'}</div>
                                                    <div className="text-sm text-gray-500">{user.email}</div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <select
                                                    value={user.role}
                                                    onChange={(e) => handleRoleChange(user.id, e.target.value as any)}
                                                    className={`text-xs px-2 py-1 rounded-full border ${user.role === 'admin'
                                                        ? 'bg-red-50 border-red-200 text-red-700'
                                                        : user.role === 'researcher'
                                                            ? 'bg-blue-50 border-blue-200 text-blue-700'
                                                            : 'bg-gray-50 border-gray-200 text-gray-700'
                                                        }`}
                                                >
                                                    <option value="user">User</option>
                                                    <option value="researcher">Researcher</option>
                                                    <option value="admin">Admin</option>
                                                </select>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-1">
                                                    <Coins className="w-4 h-4 text-amber-500" />
                                                    <span className="font-medium">{user.tokens}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-500">
                                                {user.last_active
                                                    ? new Date(user.last_active).toLocaleDateString()
                                                    : 'Never'}
                                            </td>
                                            <td className="px-4 py-3">
                                                <button
                                                    onClick={() => handleViewUser(user.id)}
                                                    className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            {/* Pagination */}
                            <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50">
                                <div className="text-sm text-gray-500">
                                    Showing {(currentPage - 1) * 20 + 1} - {Math.min(currentPage * 20, userTotal)} of {userTotal}
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                        disabled={currentPage === 1}
                                        className="p-2 rounded border bg-white disabled:opacity-50"
                                    >
                                        <ChevronLeft className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => setCurrentPage(p => p + 1)}
                                        disabled={currentPage * 20 >= userTotal}
                                        className="p-2 rounded border bg-white disabled:opacity-50"
                                    >
                                        <ChevronRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Activity Tab */}
                {!loading && activeTab === 'activity' && (
                    <div className="space-y-6">
                        <AdminActivityLog />
                    </div>
                )}

                {/* Settings Tab */}
                {!loading && activeTab === 'settings' && (
                    <div className="space-y-6">
                        <div className="bg-white rounded-xl border shadow-sm p-6">
                            <AdminCreditConfig />
                        </div>

                        {/* API Settings */}
                        <div className="bg-white rounded-xl border shadow-sm p-6">
                            <div className="flex items-center gap-2 mb-4">
                                <Settings className="w-5 h-5 text-blue-600" />
                                <h4 className="font-semibold text-blue-900">API Configuration</h4>
                            </div>
                            <div className="text-sm text-blue-700 space-y-1">
                                <p>✓ WebR Engine: Active</p>
                                <p>✓ Supabase Connection: Connected</p>
                                <p>✓ Template Interpretation: Enabled</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Invitations Tab */}
                {!loading && activeTab === 'invitations' && invitationStats && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <StatCard icon={UserPlus} label="Total Invites" value={invitationStats.total} color="blue" />
                            <StatCard icon={Activity} label="Pending" value={invitationStats.pending} color="amber" />
                            <StatCard icon={Users} label="Accepted" value={invitationStats.accepted} color="green" />
                            <StatCard icon={TrendingUp} label="Conversion" value={`${invitationStats.conversionRate}%`} color="purple" />
                        </div>

                        <div className="bg-white rounded-xl border shadow-sm p-6">
                            <h3 className="text-lg font-semibold mb-4">Top Inviters</h3>
                            <div className="space-y-3">
                                {topInviters.map((inviter, idx) => (
                                    <div key={inviter.id} className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-white rounded-lg border border-gray-100">
                                        <div className="flex items-center gap-3">
                                            <span className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 text-white flex items-center justify-center text-sm font-bold shadow-md">
                                                {idx + 1}
                                            </span>
                                            <div>
                                                <div className="font-medium">{inviter.full_name || inviter.email}</div>
                                                <div className="text-sm text-gray-500">{inviter.email}</div>
                                            </div>
                                        </div>
                                        <div className="text-lg font-bold text-green-600">{inviter.inviteCount} invites</div>
                                    </div>
                                ))}
                                {topInviters.length === 0 && (
                                    <div className="text-center text-gray-500 py-8">No invitations yet</div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Auto Test Tab */}
                {!loading && activeTab === 'autotest' && (
                    <div className="bg-white rounded-xl border shadow-sm p-6">
                        <AdminAutoTest />
                    </div>
                )}

                {/* User Detail Modal */}
                {selectedUser && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                            <div className="p-6 border-b flex items-center justify-between sticky top-0 bg-white">
                                <h2 className="text-xl font-bold">User Details</h2>
                                <button
                                    onClick={() => setSelectedUser(null)}
                                    className="p-2 hover:bg-gray-100 rounded-lg"
                                >
                                    ✕
                                </button>
                            </div>

                            <div className="p-6 space-y-6">
                                {/* Profile Info */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <div className="text-sm text-gray-500">Email</div>
                                        <div className="font-medium">{selectedUser.profile.email}</div>
                                    </div>
                                    <div>
                                        <div className="text-sm text-gray-500">Name</div>
                                        <div className="font-medium">{selectedUser.profile.full_name || 'Not set'}</div>
                                    </div>
                                    <div>
                                        <div className="text-sm text-gray-500">Role</div>
                                        <div className="font-medium capitalize">{selectedUser.profile.role}</div>
                                    </div>
                                    <div>
                                        <div className="text-sm text-gray-500">Referral Code</div>
                                        <div className="font-medium font-mono">{selectedUser.profile.referral_code || 'N/A'}</div>
                                    </div>
                                </div>

                                {/* Token Balance */}
                                <div className="bg-amber-50 rounded-lg p-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <h3 className="font-semibold text-amber-800">Token Balance</h3>
                                        <button
                                            onClick={() => setShowTokenModal(true)}
                                            className="text-sm px-3 py-1 bg-amber-600 text-white rounded-lg hover:bg-amber-700"
                                        >
                                            <Edit className="w-3 h-3 inline mr-1" />
                                            Adjust
                                        </button>
                                    </div>
                                    <div className="grid grid-cols-3 gap-4">
                                        <div>
                                            <div className="text-2xl font-bold text-amber-600">{selectedUser.profile.tokens}</div>
                                            <div className="text-sm text-amber-700">Current</div>
                                        </div>
                                        <div>
                                            <div className="text-2xl font-bold text-green-600">+{selectedUser.profile.total_earned}</div>
                                            <div className="text-sm text-green-700">Earned</div>
                                        </div>
                                        <div>
                                            <div className="text-2xl font-bold text-red-500">-{selectedUser.profile.total_spent}</div>
                                            <div className="text-sm text-red-600">Spent</div>
                                        </div>
                                    </div>
                                </div>

                                {/* Recent Activity */}
                                <div>
                                    <h3 className="font-semibold mb-3">Recent Activity</h3>
                                    <div className="space-y-2 max-h-48 overflow-y-auto">
                                        {selectedUser.activities.map((activity: any) => (
                                            <div key={activity.id} className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm">
                                                <span className="capitalize">{activity.action_type.replace('_', ' ')}</span>
                                                <span className="text-gray-500">{new Date(activity.created_at).toLocaleString()}</span>
                                            </div>
                                        ))}
                                        {selectedUser.activities.length === 0 && (
                                            <div className="text-gray-500 text-center py-4">No activity yet</div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Token Adjustment Modal */}
                {showTokenModal && selectedUser && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-xl max-w-md w-full p-6">
                            <h3 className="text-lg font-bold mb-4">Adjust Tokens</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Amount (+ or -)</label>
                                    <input
                                        type="number"
                                        value={tokenAmount}
                                        onChange={(e) => setTokenAmount(parseInt(e.target.value) || 0)}
                                        className="w-full px-3 py-2 border rounded-lg"
                                        placeholder="e.g. 50 or -20"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Reason</label>
                                    <input
                                        type="text"
                                        value={tokenReason}
                                        onChange={(e) => setTokenReason(e.target.value)}
                                        className="w-full px-3 py-2 border rounded-lg"
                                        placeholder="Reason for adjustment"
                                    />
                                </div>
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setShowTokenModal(false)}
                                        className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleAdjustTokens}
                                        className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                    >
                                        Apply
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

function StatCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: number | string; color: string }) {
    const gradients = {
        blue: 'from-blue-500 to-indigo-600',
        green: 'from-emerald-500 to-teal-600',
        purple: 'from-purple-500 to-pink-600',
        amber: 'from-amber-500 to-orange-600',
    };

    const bgColors = {
        blue: 'bg-blue-50',
        green: 'bg-emerald-50',
        purple: 'bg-purple-50',
        amber: 'bg-amber-50',
    };

    return (
        <div className={`rounded-xl p-5 ${bgColors[color as keyof typeof bgColors]} border border-white/50 shadow-sm hover:shadow-md transition-shadow`}>
            <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${gradients[color as keyof typeof gradients]} flex items-center justify-center shadow-lg`}>
                    <Icon className="w-5 h-5 text-white" />
                </div>
                <div className="text-xs px-2 py-0.5 rounded-full bg-white/60 text-gray-600 font-medium">
                    Live
                </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">{value}</div>
            <div className="text-sm text-gray-600 font-medium">{label}</div>
        </div>
    );
}
