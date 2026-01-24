'use client';

import { useState, useEffect } from 'react';
import { getSupabase } from '@/utils/supabase/client';
import {
    Search, Filter, MoreHorizontal, Shield,
    GraduationCap, Building2, BookOpen, Mail, Calendar
} from 'lucide-react';

type Profile = {
    id: string;
    email?: string; // Often joined or stored in profile depending on setup
    full_name: string | null;
    avatar_url: string | null;
    role?: string;
    created_at: string;
    academic_level?: string;
    research_field?: string;
    organization?: string;
    phone_number?: string;
};

export default function UsersTable() {
    const [users, setUsers] = useState<Profile[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');

    useEffect(() => {
        const fetchUsers = async () => {
            const supabase = getSupabase();

            // Fetch profiles
            // Note: 'email' might not be in profiles table if it's only in auth.users.
            // But usually we trigger a copy or we can't join easily from client.
            // Let's assume for now we only have what is in profiles. 
            // If email is missing, we might need a server component to fetch it from auth.users (admin only).
            // But 'email' was seen in Profile type in Header? 
            // In ProfileHeader.tsx: email?: string
            // Let's check if my 'add_profile_fields.sql' added email? No, it added others.
            // Existing schema likely had it or mixed it.
            // Let's try select('*') first.
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .order('created_at', { ascending: false });

            if (data) {
                setUsers(data);
            }
            setLoading(false);
        };

        fetchUsers();
    }, []);

    const filteredUsers = users.filter(user => {
        const matchesSearch = (user.full_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
            (user.email?.toLowerCase() || '').includes(searchTerm.toLowerCase());
        const matchesRole = roleFilter === 'all' || user.role === roleFilter;
        return matchesSearch && matchesRole;
    });

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            {/* Toolbar */}
            <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row gap-4 items-center justify-between bg-slate-50/50">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Tìm kiếm người dùng..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-sm"
                    />
                </div>

                <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-slate-500" />
                    <select
                        value={roleFilter}
                        onChange={(e) => setRoleFilter(e.target.value)}
                        className="px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none"
                    >
                        <option value="all">Tất cả vai trò</option>
                        <option value="admin">Admin</option>
                        <option value="user">User</option>
                    </select>
                </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
                        <tr>
                            <th className="px-6 py-4">Người dùng</th>
                            <th className="px-6 py-4">Thông tin học thuật</th>
                            <th className="px-6 py-4">Vai trò</th>
                            <th className="px-6 py-4">Ngày tham gia</th>
                            <th className="px-6 py-4 text-right">Thao tác</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {loading ? (
                            Array.from({ length: 5 }).map((_, i) => (
                                <tr key={i} className="animate-pulse">
                                    <td className="px-6 py-4"><div className="h-10 w-40 bg-slate-100 rounded"></div></td>
                                    <td className="px-6 py-4"><div className="h-4 w-24 bg-slate-100 rounded my-1"></div></td>
                                    <td className="px-6 py-4"><div className="h-6 w-16 bg-slate-100 rounded-full"></div></td>
                                    <td className="px-6 py-4"><div className="h-4 w-24 bg-slate-100 rounded"></div></td>
                                    <td className="px-6 py-4"></td>
                                </tr>
                            ))
                        ) : filteredUsers.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                                    Không tìm thấy người dùng nào.
                                </td>
                            </tr>
                        ) : (
                            filteredUsers.map((user) => (
                                <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            {user.avatar_url ? (
                                                <img src={user.avatar_url} alt="" className="w-10 h-10 rounded-full object-cover border border-slate-100" />
                                            ) : (
                                                <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-lg">
                                                    {user.full_name?.[0]?.toUpperCase() || 'U'}
                                                </div>
                                            )}
                                            <div>
                                                <div className="font-semibold text-slate-900">{user.full_name || 'Chưa đặt tên'}</div>
                                                <div className="text-xs text-slate-500 flex items-center gap-1">
                                                    <Mail className="w-3 h-3" />
                                                    {user.email || 'N/A'}
                                                </div>
                                                {user.phone_number && (
                                                    <div className="text-xs text-slate-400 mt-0.5">
                                                        {user.phone_number}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="space-y-1">
                                            {user.academic_level && (
                                                <div className="flex items-center gap-1.5 text-slate-700 font-medium text-xs">
                                                    <GraduationCap className="w-3.5 h-3.5 text-blue-500" />
                                                    {user.academic_level}
                                                </div>
                                            )}
                                            {user.organization && (
                                                <div className="flex items-center gap-1.5 text-slate-600 text-xs">
                                                    <Building2 className="w-3.5 h-3.5 text-slate-400" />
                                                    {user.organization}
                                                </div>
                                            )}
                                            {user.research_field && (
                                                <div className="flex items-center gap-1.5 text-emerald-600 text-xs">
                                                    <BookOpen className="w-3.5 h-3.5" />
                                                    {user.research_field}
                                                </div>
                                            )}
                                            {!user.academic_level && !user.organization && !user.research_field && (
                                                <span className="text-slate-400 text-xs italic">Chưa cập nhật</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold
                                            ${user.role === 'admin'
                                                ? 'bg-purple-100 text-purple-700 border border-purple-200'
                                                : 'bg-blue-50 text-blue-700 border border-blue-100'
                                            }
                                        `}>
                                            <Shield className="w-3 h-3" />
                                            {user.role === 'admin' ? 'Admin' : 'User'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-slate-500 text-xs">
                                        <div className="flex items-center gap-1.5">
                                            <Calendar className="w-3.5 h-3.5" />
                                            {new Date(user.created_at).toLocaleDateString('vi-VN')}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors">
                                            <MoreHorizontal className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <div className="p-4 border-t border-slate-200 bg-slate-50 text-xs text-slate-500 flex justify-between">
                <span>Hiển thị {filteredUsers.length} người dùng</span>
            </div>
        </div>
    );
}
