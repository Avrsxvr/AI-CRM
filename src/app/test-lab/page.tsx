'use client'

import React, { useState, useEffect } from 'react'
import { Beaker, Play, RotateCcw, Send, CheckCircle, AlertCircle } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'

export default function TestLabPage() {
  const [logs, setLogs] = useState<{ id: number, time: string, message: string, type: 'info' | 'success' | 'error' }[]>([])
  const [isAuthorized, setIsAuthorized] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function checkAccess() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      
      const { data } = await supabase.from('users').select('role').eq('id', user.id).single()
      if (data?.role !== 'superadmin') {
        router.push('/leads')
      } else {
        setIsAuthorized(true)
      }
    }
    checkAccess()
  }, [router, supabase])

  if (!isAuthorized) {
    return <div className="min-h-screen flex items-center justify-center text-slate-500">Checking access...</div>
  }

  const addLog = (message: string, type: 'info' | 'success' | 'error' = 'info') => {
    setLogs(prev => [{
      id: Date.now(),
      time: new Date().toLocaleTimeString(),
      message,
      type
    }, ...prev])
  }

  const triggerCron = async () => {
    addLog('Triggering manual CRON job for process-followups...', 'info')
    try {
      const res = await fetch('/api/cron/process-followups')
      const data = await res.json()
      if (res.ok) {
        addLog(`CRON Success: Processed ${data.data?.processed} | Successes: ${data.data?.successes} | Failures: ${data.data?.failures}`, 'success')
      } else {
        addLog(`CRON Failed: ${data.error?.message}`, 'error')
      }
    } catch (e: any) {
      addLog(`CRON Error: ${e.message}`, 'error')
    }
  }

  const triggerWebhook = async () => {
    addLog('Triggering fake webhook (not implemented yet)...', 'info')
    // Placeholder for webhook testing logic
    setTimeout(() => {
      addLog('Webhook trigger complete.', 'success')
    }, 1000)
  }

  return (
    <div className="min-h-screen relative flex flex-col pt-16 md:pt-4 md:pl-24 px-4 md:px-8 pb-20">
      <div className="max-w-4xl w-full mx-auto space-y-8 z-10">
        
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
            <Beaker className="w-7 h-7 text-fuchsia-500" />
            Admin Test Lab
          </h1>
          <p className="text-sm text-slate-500 mt-2">Internal tooling to test cron jobs, sync logic, and automated emails visually.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Controls */}
          <div className="space-y-4">
            <div className="bg-white/90 border border-slate-200 rounded-2xl p-5 backdrop-blur-xl">
              <h2 className="text-lg font-bold text-slate-900 mb-4">Background Jobs</h2>
              
              <div className="space-y-3">
                <button 
                  onClick={triggerCron}
                  className="w-full flex items-center justify-between bg-white/5 hover:bg-white/10 border border-slate-200 rounded-xl px-4 py-3 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                      <Play className="w-4 h-4" />
                    </div>
                    <div className="text-left">
                      <div className="text-sm font-bold text-slate-900">Process Follow-ups</div>
                      <div className="text-xs text-slate-400">Run the email sequence cron manually</div>
                    </div>
                  </div>
                </button>

                <button 
                  onClick={triggerWebhook}
                  className="w-full flex items-center justify-between bg-white/5 hover:bg-white/10 border border-slate-200 rounded-xl px-4 py-3 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center">
                      <Send className="w-4 h-4" />
                    </div>
                    <div className="text-left">
                      <div className="text-sm font-bold text-slate-900">Fire Test Webhook</div>
                      <div className="text-xs text-slate-400">Simulate Zoho or Resend incoming ping</div>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* Console Output */}
          <div className="bg-white border border-slate-200 rounded-2xl flex flex-col h-[500px]">
            <div className="border-b border-slate-200 px-4 py-3 flex items-center justify-between bg-slate-50/50 rounded-t-2xl">
              <span className="text-xs font-mono text-slate-500 uppercase tracking-widest">Test Logs</span>
              <button onClick={() => setLogs([])} className="text-xs text-slate-400 hover:text-slate-900 transition-colors">Clear</button>
            </div>
            <div className="flex-1 p-4 overflow-y-auto space-y-2 font-mono text-xs">
              {logs.length === 0 ? (
                <div className="text-zinc-600 text-center mt-10">No logs yet. Click a button to test.</div>
              ) : (
                logs.map(log => (
                  <div key={log.id} className="flex gap-3 items-start">
                    <span className="text-zinc-600 shrink-0">[{log.time}]</span>
                    <span className={`
                      ${log.type === 'info' ? 'text-blue-400' : ''}
                      ${log.type === 'success' ? 'text-emerald-400' : ''}
                      ${log.type === 'error' ? 'text-red-400' : ''}
                    `}>
                      {log.message}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
