'use client'

import { Download } from 'lucide-react'

export default function ExportButton({ feedbacks }: { feedbacks: any[] }) {
    const handleExport = () => {
        if (!feedbacks || feedbacks.length === 0) return

        // Create CSV content
        const headers = ['User Email', 'Full Name', 'Type', 'Rating', 'Content', 'Details (JSON)', 'Created At']
        const csvContent = [
            headers.join(','),
            ...feedbacks.map(item => {
                const row = [
                    item.profiles?.email || '',
                    `"${item.profiles?.full_name || ''}"`,
                    item.type || 'general',
                    item.rating || '',
                    `"${item.content?.replace(/"/g, '""') || ''}"`,
                    `"${JSON.stringify(item.details || {}).replace(/"/g, '""')}"`,
                    new Date(item.created_at).toISOString()
                ]
                return row.join(',')
            })
        ].join('\n')

        // Create Blob and download
        const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' }) // Add BOM for Excel
        const link = document.createElement('a')
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob)
            link.setAttribute('href', url)
            link.setAttribute('download', `feedback_export_${new Date().toISOString().split('T')[0]}.csv`)
            link.style.visibility = 'hidden'
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
        }
    }

    return (
        <button
            onClick={handleExport}
            disabled={!feedbacks || feedbacks.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors text-sm font-medium shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
            <Download className="w-4 h-4" />
            Xuất Excel/CSV
        </button>
    )
}
