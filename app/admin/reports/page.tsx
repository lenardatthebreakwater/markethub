'use client'

import { useEffect, useState } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, BarChart, Bar } from 'recharts'
import { TrendingUp, CreditCard, AlertCircle, Clock, Download, FileSpreadsheet } from 'lucide-react'
import * as XLSX from 'xlsx'
import { toast } from 'sonner'

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
  const [exportingVendor, setExportingVendor] = useState(false)

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

  function handleExport() {
    if (!summary) return

    const wb = XLSX.utils.book_new()
    
    // Sheet 1: Summary
    const summaryData = [
      ['Metric', 'Value'],
      ['Total Revenue', summary.totalRevenue],
      ['Total Overdue', summary.totalOverdue],
      ['Total Pending', summary.totalPending],
      ['Total Transactions', summary.totalTransactions],
    ]
    if (summary.startDate) summaryData.push(['Period Start', summary.startDate])
    if (summary.endDate) summaryData.push(['Period End', summary.endDate])

    const wsSummary = XLSX.utils.aoa_to_sheet(summaryData)
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary')

    // Sheet 2: Monthly Breakdown
    if (monthly && monthly.length > 0) {
      const monthlyData = monthly.map(m => ({
        Month: m.month,
        Revenue: m.revenue,
        Transactions: m.count
      }))
      const wsMonthly = XLSX.utils.json_to_sheet(monthlyData)
      XLSX.utils.book_append_sheet(wb, wsMonthly, 'Monthly Breakdown')
    }

    // Sheet 3: Payment Types
    if (summary.paymentTypeBreakdown && Object.keys(summary.paymentTypeBreakdown).length > 0) {
      const typeData = Object.entries(summary.paymentTypeBreakdown).map(([k, v]) => ({
        Type: k,
        Amount: v
      }))
      const wsTypes = XLSX.utils.json_to_sheet(typeData)
      XLSX.utils.book_append_sheet(wb, wsTypes, 'Payment Types')
    }

    XLSX.writeFile(wb, `Financial_Report_${type}.xlsx`)
  }

  async function handleExportVendorHistory() {
    setExportingVendor(true)
    try {
      const res = await fetch('/api/admin/reports/vendor-history')
      if (!res.ok) throw new Error('Failed to fetch data')
      const vendors = await res.json()

      const wb = XLSX.utils.book_new()

      // 1. Vendors Sheet
      const vendorsData = vendors.map((v: any) => ({
        'Vendor ID': v.id,
        'Business Name': v.businessName,
        'Owner Name': v.user?.name || v.ownerName,
        'Email': v.user?.email || '',
        'Contact Number': v.contactNumber,
        'Business Type': v.businessType,
        'Status': v.status,
        'Registration Date': new Date(v.createdAt).toLocaleDateString()
      }))
      const wsVendors = XLSX.utils.json_to_sheet(vendorsData)
      XLSX.utils.book_append_sheet(wb, wsVendors, 'Vendors Master List')

      // 2. Stalls Sheet
      const stallsData: any[] = []
      vendors.forEach((v: any) => {
        v.applications.forEach((app: any) => {
          stallsData.push({
            'Business Name': v.businessName,
            'Stall Number': app.stall?.stallNumber || '',
            'Location': app.stall?.location || '',
            'Application Type': app.applicationType,
            'Status': app.status,
            'Contract Start': app.contractStart ? new Date(app.contractStart).toLocaleDateString() : '',
            'Contract End': app.contractEnd ? new Date(app.contractEnd).toLocaleDateString() : '',
            'Application Date': new Date(app.createdAt).toLocaleDateString()
          })
        })
      })
      const wsStalls = XLSX.utils.json_to_sheet(stallsData.length > 0 ? stallsData : [{ Message: 'No stalls found' }])
      XLSX.utils.book_append_sheet(wb, wsStalls, 'Stall History')

      // 3. Payments Sheet
      const paymentsData: any[] = []
      vendors.forEach((v: any) => {
        v.payments.forEach((p: any) => {
          paymentsData.push({
            'Business Name': v.businessName,
            'Stall Number': p.stall?.stallNumber || '',
            'Amount': p.amount,
            'Payment Type': p.paymentType,
            'Status': p.status,
            'Due Date': new Date(p.dueDate).toLocaleDateString(),
            'Date Paid': p.paidDate ? new Date(p.paidDate).toLocaleDateString() : '',
            'Month/Year': p.month && p.year ? `${p.month}/${p.year}` : '',
            'Verification Date': p.verificationDate ? new Date(p.verificationDate).toLocaleDateString() : ''
          })
        })
      })
      const wsPayments = XLSX.utils.json_to_sheet(paymentsData.length > 0 ? paymentsData : [{ Message: 'No payments found' }])
      XLSX.utils.book_append_sheet(wb, wsPayments, 'Transaction History')

      XLSX.writeFile(wb, 'Comprehensive_Vendor_History.xlsx')
      toast.success('Detailed Vendor History exported successfully')
    } catch (error) {
      console.error(error)
      toast.error('Failed to export vendor history')
    } finally {
      setExportingVendor(false)
    }
  }

  const tabs = [
    { key: 'daily', label: 'Today' },
    { key: 'weekly', label: 'This Week' },
    { key: 'monthly', label: 'This Month' },
    { key: 'custom', label: 'Custom' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Financial Reports</h1>
          <p className="text-sm text-gray-500 mt-1">Revenue analytics and payment summaries</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <button
            onClick={handleExportVendorHistory}
            disabled={exportingVendor}
            className="flex items-center justify-center gap-2 bg-white text-[#1e4d2b] border border-[#1e4d2b] hover:bg-[#1e4d2b]/5 text-sm font-semibold px-4 py-2 rounded-lg transition-colors shadow-sm disabled:opacity-70"
          >
            {exportingVendor ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#1e4d2b]" /> : <FileSpreadsheet className="w-4 h-4" />}
            Export Vendor History
          </button>
          <button
            onClick={handleExport}
            className="flex items-center justify-center gap-2 bg-[#1e4d2b] hover:bg-[#2d6a4f] text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors shadow-sm"
          >
            <Download className="w-4 h-4" />
            Export Revenue
          </button>
        </div>
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
          <div className="flex flex-wrap items-center gap-2 ml-2">
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