'use client'

import { useEffect, useState } from 'react'
import { getSupabase } from '@/utils/supabase/client'

export default function DebugAuthPage() {
    const [cookies, setCookies] = useState<string>('')
    const [localStorageData, setLocalStorageData] = useState<any>({})
    const [user, setUser] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const supabase = getSupabase()

        const check = async () => {
            setCookies(document.cookie)

            const ls: any = {}
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i)
                if (key && (key.includes('sb-') || key.includes('supabase'))) {
                    ls[key] = localStorage.getItem(key)
                }
            }
            setLocalStorageData(ls)

            const { data: { user } } = await supabase.auth.getUser()
            setUser(user)
            setLoading(false)
        }

        check()
    }, [])

    return (
        <div className="p-8 font-mono text-xs overflow-auto h-screen bg-gray-50">
            <h1 className="text-xl font-bold mb-4">Auth Debug Tool</h1>

            <section className="mb-8">
                <h2 className="font-bold border-b mb-2">User Status</h2>
                <pre className="bg-white p-4 border rounded">
                    {loading ? 'Checking...' : JSON.stringify(user, null, 2)}
                </pre>
            </section>

            <section className="mb-8">
                <h2 className="font-bold border-b mb-2">Cookies (document.cookie)</h2>
                <div className="bg-white p-4 border rounded break-all whitespace-pre-wrap">
                    {cookies.split('; ').map((c, i) => (
                        <div key={i} className="mb-1 border-b pb-1 last:border-0">
                            {c}
                        </div>
                    ))}
                    {cookies === '' && <span className="text-red-500">No cookies found!</span>}
                </div>
            </section>

            <section className="mb-8">
                <h2 className="font-bold border-b mb-2">LocalStorage (Supabase related)</h2>
                <pre className="bg-white p-4 border rounded">
                    {JSON.stringify(localStorageData, null, 2)}
                </pre>
            </section>

            <section>
                <h2 className="font-bold border-b mb-2">Environment (Client-side)</h2>
                <pre className="bg-white p-4 border rounded">
                    {JSON.stringify({
                        origin: typeof window !== 'undefined' ? window.location.origin : 'N/A',
                        proto: typeof window !== 'undefined' ? window.location.protocol : 'N/A',
                        NODE_ENV: process.env.NODE_ENV,
                        VERCEL_ENV: process.env.NEXT_PUBLIC_VERCEL_ENV
                    }, null, 2)}
                </pre>
            </section>
        </div>
    )
}
