'use client'

import { useState, useEffect } from 'react'
import { getActivities, getActivityStats, ActivityType } from '@/lib/activity-logger'
import { Activity, Users, BarChart3, Download, Calendar, Filter, RefreshCw } from 'lucide-react'

interface ActivityLog {
    id: string
    user_id: string
    action_type: ActivityType
    action_details: Record<string, any>
    created_at: string
    profiles?: {
        email: string
        full_name: string
        role: string
        avatar_url: string
    }
}

export function AdminActivityLog() {
    const [activities, setActivities] = useState<ActivityLog[]>([])
    const [stats, setStats] = useState({ totalLogins: 0, uniqueUsers: 0, totalAnalyses: 0, totalExports: 0 })
    const [loading, setLoading] = useState(true)
    const [totalCount, setTotalCount] = useState(0)
    const [page, setPage] = useState(0)
    const pageSize = 20

    // Filters
    const [fromDate, setFromDate] = useState<string>('')
    const [toDate, setToDate] = useState<string>('')
    const [actionFilter, setActionFilter] = useState<ActivityType | ''>('')

    const loadData = async () => {
        setLoading(true)
        try {
            const from = fromDate ? new Date(fromDate) : undefined
            const to = toDate ? new Date(toDate + 'T23:59:59') : undefined

            const [activitiesResult, statsResult] = await Promise.all([
                getActivities({
                    fromDate: from,
                    toDate: to,
                    actionType: actionFilter || undefined,
                    limit: pageSize,
                    offset: page * pageSize
                }),
                getActivityStats(from, to)
            ])

            setActivities(activitiesResult.data)
            setTotalCount(activitiesResult.count)
            setStats(statsResult)
        } catch (err) {
            console.error('Failed to load activities:', err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadData()
    }, [page, fromDate, toDate, actionFilter])

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleString('vi-VN', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        })
    }

    const getActionBadge = (type: ActivityType) => {
        const badges: Record<ActivityType, { bg: string; text: string; label: string }> = {
            login: { bg: 'bg-green-100', text: 'text-green-700', label: 'Đăng nhập' },
            logout: { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Đăng xuất' },
            analysis: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Phân tích' },
            export: { bg: 'bg-purple-100', text: 'text-purple-700', label: 'Xuất file' },
            page_view: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Xem trang' }
        }
        const badge = badges[type] || { bg: 'bg-gray-100', text: 'text-gray-600', label: type }
        return (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}>
                {badge.label}
            </span>
        )
    }

    const totalPages = Math.ceil(totalCount / pageSize)

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <Activity className="w-6 h-6 text-blue-600" />
                    Activity Log
                </h2>
                <button
                    onClick={loadData}
                    className="flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors"
                >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    Làm mới
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl p-4 border shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-100 rounded-lg">
                            <Users className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900">{stats.totalLogins}</p>
                            <p className="text-xs text-gray-500">Lượt đăng nhập</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl p-4 border shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <Users className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900">{stats.uniqueUsers}</p>
                            <p className="text-xs text-gray-500">Users độc lập</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl p-4 border shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-100 rounded-lg">
                            <BarChart3 className="w-5 h-5 text-purple-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900">{stats.totalAnalyses}</p>
                            <p className="text-xs text-gray-500">Lượt phân tích</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl p-4 border shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-orange-100 rounded-lg">
                            <Download className="w-5 h-5 text-orange-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900">{stats.totalExports}</p>
                            <p className="text-xs text-gray-500">Lượt xuất file</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl p-4 border shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                    <Filter className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-700">Bộ lọc</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                        <label className="block text-xs text-gray-500 mb-1">Từ ngày</label>
                        <input
                            type="date"
                            value={fromDate}
                            onChange={(e) => { setFromDate(e.target.value); setPage(0); }}
                            className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                    <div>
                        <label className="block text-xs text-gray-500 mb-1">Đến ngày</label>
                        <input
                            type="date"
                            value={toDate}
                            onChange={(e) => { setToDate(e.target.value); setPage(0); }}
                            className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                    <div>
                        <label className="block text-xs text-gray-500 mb-1">Loại hành động</label>
                        <select
                            value={actionFilter}
                            onChange={(e) => { setActionFilter(e.target.value as ActivityType | ''); setPage(0); }}
                            className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="">Tất cả</option>
                            <option value="login">Đăng nhập</option>
                            <option value="logout">Đăng xuất</option>
                            <option value="analysis">Phân tích</option>
                            <option value="export">Xuất file</option>
                        </select>
                    </div>
                    <div className="flex items-end">
                        <button
                            onClick={() => { setFromDate(''); setToDate(''); setActionFilter(''); setPage(0); }}
                            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            Xóa bộ lọc
                        </button>
                    </div>
                </div>
            </div>

            {/* Activity Table */}
            <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center">
                        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                        <p className="text-sm text-gray-500">Đang tải...</p>
                    </div>
                ) : activities.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                        <Activity className="w-12 h-12 mx-auto mb-2 opacity-30" />
                        <p>Chưa có hoạt động nào</p>
                    </div>
                ) : (
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th className="py-3 px-4 text-left font-semibold text-gray-600">Thời gian</th>
                                <th className="py-3 px-4 text-left font-semibold text-gray-600">User</th>
                                <th className="py-3 px-4 text-left font-semibold text-gray-600">Hành động</th>
                                <th className="py-3 px-4 text-left font-semibold text-gray-600">Chi tiết</th>
                            </tr>
                        </thead>
                        <tbody>
                            {activities.map((activity) => (
                                <tr key={activity.id} className="border-b hover:bg-gray-50 transition-colors">
                                    <td className="py-3 px-4 text-gray-600 whitespace-nowrap">
                                        {formatDate(activity.created_at)}
                                    </td>
                                    <td className="py-3 px-4">
                                        <div className="flex items-center gap-2">
                                            {activity.profiles?.avatar_url ? (
                                                <img
                                                    src={activity.profiles.avatar_url}
                                                    alt=""
                                                    className="w-7 h-7 rounded-full"
                                                />
                                            ) : (
                                                <div className="w-7 h-7 bg-gray-200 rounded-full flex items-center justify-center text-xs font-medium text-gray-600">
                                                    {activity.profiles?.full_name?.[0] || '?'}
                                                </div>
                                            )}
                                            <div>
                                                <p className="font-medium text-gray-900 text-xs">
                                                    {activity.profiles?.full_name || 'Unknown'}
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    {activity.profiles?.email}
                                                </p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="py-3 px-4">
                                        {getActionBadge(activity.action_type)}
                                    </td>
                                    <td className="py-3 px-4 text-gray-600 text-xs">
                                        {activity.action_details?.analysis_type && (
                                            <span className="bg-gray-100 px-2 py-0.5 rounded">
                                                {activity.action_details.analysis_type}
                                            </span>
                                        )}
                                        {activity.action_details?.cost_ncs && (
                                            <span className="ml-2 text-orange-600">
                                                -{activity.action_details.cost_ncs} NCS
                                            </span>
                                        )}
                                        {activity.action_details?.duration_seconds && (
                                            <span className="text-gray-500">
                                                {Math.round(activity.action_details.duration_seconds / 60)} phút
                                            </span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="px-4 py-3 border-t flex items-center justify-between bg-gray-50">
                        <p className="text-sm text-gray-500">
                            Hiển thị {page * pageSize + 1} - {Math.min((page + 1) * pageSize, totalCount)} / {totalCount}
                        </p>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setPage(p => Math.max(0, p - 1))}
                                disabled={page === 0}
                                className="px-3 py-1 border rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white"
                            >
                                ← Trước
                            </button>
                            <button
                                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                                disabled={page >= totalPages - 1}
                                className="px-3 py-1 border rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white"
                            >
                                Sau →
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
