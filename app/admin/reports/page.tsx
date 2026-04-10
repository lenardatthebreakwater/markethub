'use client'

import { useEffect, useState } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, BarChart, Bar } from 'recharts'
import { TrendingUp, CreditCard, AlertCircle, Clock } from 'lucide-react'

interface Summary {
  totalRevenue: number
  totalOverdue: number
  totalPending: number
  paymentTypeBreakdown: Record<string, number>
  totalTransactions: number
  startDate: string
  endDate: string
}

interface MonthlyPoint { month: string; revenue: number; count: number }

export default function AdminReportsPage() {
  const [type, setType] = useState('monthly')
  const [summary, setSummary] = useState<Summary | null>(null)
  const [monthly, setMonthly] = useState<MonthlyPoint[]>([])
  const [loading, setLoading] = useState(true)
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')

  async function fetchReport(t: string, start?: string, end?: string) {
    setLoading(true)
    let url = `/api/admin/reports?type=${t}`
    if (t === 'custom' && start && end) url += `&start=${start}&end=${end}`
    const res = await fetch(url)
    if (res.ok) {
      const data = await res.json()
      setSummary(data.summary)
      setMonthly(data.monthlyRevenue || [])
    }
    setLoading(false)
  }

  useEffect(() => { fetchReport(type) }, [type])

  function handleCustom() {
    if (customStart && customEnd) fetchReport('custom', customStart, customEnd)
  }

  const tabs = [
    { key: 'daily', label: 'Today' },
    { key: 'weekly', label: 'This Week' },
    { key: 'monthly', label: 'This Month' },
    { key: 'custom', label: 'Custom' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Financial Reports</h1>
        <p className="text-sm text-gray-500 mt-1">Revenue analytics and payment summaries</p>
      </div>

      {/* Period tabs */}
      <div className="flex gap-2 flex-wrap items-center">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setType(tab.key)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              type === tab.key
                ? 'bg-[#1e4d2b] text-white'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
        {type === 'custom' && (
          <div className="flex items-center gap-2 ml-2">
            <input
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-[#1e4d2b]"
            />
            <span className="text-gray-400 text-sm">to</span>
            <input
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-[#1e4d2b]"
            />
            <button
              onClick={handleCustom}
              className="bg-[#1e4d2b] text-white text-sm font-medium px-4 py-1.5 rounded-lg hover:bg-[#2d6a4f] transition-colors"
            >
              Apply
            </button>
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1e4d2b]" />
        </div>
      ) : (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl shadow-sm p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="bg-green-100 rounded-lg p-2">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                </div>
                <p className="text-xs font-medium text-gray-500">Total Revenue</p>
              </div>
              <p className="text-2xl font-bold text-gray-800">₱{(summary?.totalRevenue || 0).toLocaleString()}</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="bg-orange-100 rounded-lg p-2">
                  <Clock className="h-5 w-5 text-orange-500" />
                </div>
                <p className="text-xs font-medium text-gray-500">Pending</p>
              </div>
              <p className="text-2xl font-bold text-gray-800">₱{(summary?.totalPending || 0).toLocaleString()}</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="bg-red-100 rounded-lg p-2">
                  <AlertCircle className="h-5 w-5 text-red-500" />
                </div>
                <p className="text-xs font-medium text-gray-500">Overdue</p>
              </div>
              <p className="text-2xl font-bold text-gray-800">₱{(summary?.totalOverdue || 0).toLocaleString()}</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="bg-blue-100 rounded-lg p-2">
                  <CreditCard className="h-5 w-5 text-blue-500" />
                </div>
                <p className="text-xs font-medium text-gray-500">Transactions</p>
              </div>
              <p className="text-2xl font-bold text-gray-800">{summary?.totalTransactions || 0}</p>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-white rounded-xl shadow-sm p-5">
              <h2 className="font-semibold text-gray-800 mb-4">Monthly Revenue (Last 12 Months)</h2>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={monthly}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9ca3af' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} tickFormatter={(v) => `₱${v / 1000}k`} />
                  <Tooltip formatter={(v: number) => [`₱${v.toLocaleString()}`, 'Revenue']} />
                  <Line type="monotone" dataKey="revenue" stroke="#1e4d2b" strokeWidth={2} dot={{ fill: '#1e4d2b', r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-5">
              <h2 className="font-semibold text-gray-800 mb-4">Collections per Month</h2>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={monthly}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9ca3af' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} />
                  <Tooltip formatter={(v: number) => [v, 'Payments']} />
                  <Bar dataKey="count" fill="#86efac" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Payment type breakdown */}
          {summary?.paymentTypeBreakdown && Object.keys(summary.paymentTypeBreakdown).length > 0 && (
            <div className="bg-white rounded-xl shadow-sm p-5">
              <h2 className="font-semibold text-gray-800 mb-4">Revenue by Payment Type</h2>
              <div className="space-y-3">
                {Object.entries(summary.paymentTypeBreakdown).map(([type, amount]) => {
                  const pct = summary.totalRevenue > 0 ? (amount / summary.totalRevenue) * 100 : 0
                  return (
                    <div key={type}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600">{type}</span>
                        <span className="font-semibold text-gray-800">₱{amount.toLocaleString()} ({pct.toFixed(1)}%)</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full">
                        <div className="h-2 bg-[#1e4d2b] rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}