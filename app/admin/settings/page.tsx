'use client'

import { useState, useEffect } from 'react'
import { Save, User, Settings as SettingsIcon, Shield, Search, AlertCircle, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState<'profile' | 'config' | 'audit'>('profile')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [configParams, setConfigParams] = useState({
    gracePeriodDays: 5,
    lateFeePercentage: 2,
    baseRateVegetable: 1500,
  })

  const [ghostRecords, setGhostRecords] = useState<any[]>([])
  
  const [profileForm, setProfileForm] = useState({
     name: '', email: '', password: ''
  })

  // Load Everything on Mount
  useEffect(() => {
     fetch('/api/admin/settings/config').then(r => r.json()).then(setConfigParams).catch(() => {})
     fetch('/api/admin/settings/audit').then(r => r.json()).then(setGhostRecords).catch(() => {})
     // Assuming we want to prefill name based on session, but since we can't do it easily outside, leave it as empty strings. 
  }, [])

  const handleSaveProfile = async () => {
    setIsSubmitting(true)
    try {
      const res = await fetch('/api/admin/settings/profile', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(profileForm)
      })
      if (!res.ok) throw new Error()
      toast.success('Administrator profile updated successfully.')
      setProfileForm(p => ({ ...p, password: '' })) // Clear password field
    } catch {
      toast.error('Failed to update profile')
    }
    setIsSubmitting(false)
  }

  const handleSaveConfig = async () => {
    setIsSubmitting(true)
    try {
      const res = await fetch('/api/admin/settings/config', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(configParams)
      })
      if (!res.ok) throw new Error()
      toast.success('System configuration updated successfully.')
    } catch {
      toast.error('Failed to save configuration')
    }
    setIsSubmitting(false)
  }

  const scanAudit = async () => {
     toast.info('Scanning database...')
     const res = await fetch('/api/admin/settings/audit')
     if (res.ok) setGhostRecords(await res.json())
  }

  const handleFixGhost = async (record: any) => {
    const res = await fetch('/api/admin/settings/audit', {
       method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: record.type, targetId: record.targetId })
    })
    if (res.ok) {
       setGhostRecords(prev => prev.filter(r => r.id !== record.id))
       toast.success('Data record corrected.')
    } else {
       toast.error('Failed to auto-fix.')
    }
  }

  const inputClass = "w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e4d2b] transition-all bg-gray-50/50"
  const labelClass = "text-xs font-semibold text-gray-600 block mb-1.5 uppercase tracking-wider"

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Admin Settings</h1>
        <p className="text-gray-500 mt-1">Manage global system settings and data health.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        
        {/* Sidebar Tabs */}
        <div className="w-full md:w-64 shrink-0">
          <nav className="flex flex-col space-y-1">
            <button 
              onClick={() => setActiveTab('profile')}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${activeTab === 'profile' ? 'bg-[#1e4d2b] text-white' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              <User className="w-4 h-4" /> My Profile
            </button>
            <button 
              onClick={() => setActiveTab('config')}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${activeTab === 'config' ? 'bg-[#1e4d2b] text-white' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              <SettingsIcon className="w-4 h-4" /> Global Config
            </button>
            <button 
              onClick={() => setActiveTab('audit')}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${activeTab === 'audit' ? 'bg-[#1e4d2b] text-white' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              <Shield className="w-4 h-4" /> System Audit
            </button>
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          {activeTab === 'profile' && (
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 space-y-8">
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-gray-900">Administrator Profile</h3>
                <p className="text-sm text-gray-500 max-w-sm">
                  Update your admin display name and login credentials.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-4">
                  <div>
                    <label className={labelClass}>Name</label>
                    <input type="text" value={profileForm.name} onChange={e => setProfileForm({...profileForm, name: e.target.value})} placeholder="Admin User" className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Email Address</label>
                    <input type="email" value={profileForm.email} onChange={e => setProfileForm({...profileForm, email: e.target.value})} placeholder="admin@markethub.local" className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>New Password</label>
                    <input type="password" value={profileForm.password} onChange={e => setProfileForm({...profileForm, password: e.target.value})} placeholder="••••••••" className={inputClass} />
                  </div>
                </div>

                <div className="pt-4">
                  <button onClick={handleSaveProfile} disabled={isSubmitting} className="bg-[#1e4d2b] hover:bg-[#2d6a4f] disabled:opacity-60 text-white px-6 py-2.5 rounded-lg font-semibold transition-colors flex items-center gap-2">
                    <Save className="w-4 h-4" /> Save Profile
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'config' && (
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 space-y-8">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Payment & Operations Config</h3>
                <p className="text-sm text-gray-500 mt-1">Configure automated rules for billing and stall tracking.</p>
              </div>

              <div className="space-y-5 max-w-lg">
                <div>
                  <label className={labelClass}>Payment Grace Period (Days)</label>
                  <input 
                    type="number" 
                    value={configParams.gracePeriodDays} 
                    onChange={e => setConfigParams({...configParams, gracePeriodDays: parseInt(e.target.value)})}
                    className={inputClass} 
                  />
                  <p className="text-xs text-gray-500 mt-1">Number of days after due date before marking as OVERDUE.</p>
                </div>

                <div>
                   <label className={labelClass}>Late Fee Percentage (%)</label>
                  <input 
                    type="number" 
                    value={configParams.lateFeePercentage} 
                    onChange={e => setConfigParams({...configParams, lateFeePercentage: parseInt(e.target.value)})}
                    className={inputClass} 
                  />
                </div>
              </div>

              <div className="pt-4">
                <button 
                  onClick={handleSaveConfig} 
                  disabled={isSubmitting}
                  className="bg-[#1e4d2b] hover:bg-[#2d6a4f] text-white px-6 py-2.5 rounded-lg font-semibold transition-colors flex items-center gap-2 shadow-sm"
                >
                  <Save className="w-4 h-4" /> {isSubmitting ? 'Saving...' : 'Update Configuration'}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'audit' && (
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 space-y-6">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">System Audit & Maintenance</h3>
                  <p className="text-sm text-gray-500 mt-1 text-balance">
                    Identify inconsistencies in the database, such as "ghost" records or mismatched relations.
                  </p>
                </div>
                <button onClick={scanAudit} className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2">
                  <RefreshCw className="w-4 h-4" /> Run Scan
                </button>
              </div>

              <div className="space-y-4">
                {ghostRecords.length === 0 ? (
                  <div className="bg-green-50 border border-green-100 rounded-xl p-6 text-center text-green-700 font-medium flex flex-col items-center gap-2">
                    <Shield className="w-8 h-8 text-green-500" />
                    Database is healthy. No inconsistencies found.
                  </div>
                ) : (
                  ghostRecords.map(record => (
                    <div key={record.id} className="flex justify-between items-center bg-orange-50/50 border border-orange-100 rounded-xl p-4">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-bold text-gray-900">{record.issue}</p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            Related to: {record.stall ? `Stall ${record.stall}` : `Vendor ${record.vendor}`}
                          </p>
                        </div>
                      </div>
                      <button 
                        onClick={() => handleFixGhost(record)}
                        className="bg-white border border-gray-200 text-gray-700 text-xs font-bold px-3 py-1.5 rounded-md hover:bg-gray-50 hover:text-orange-600 transition-colors"
                      >
                        Auto-Fix
                      </button>
                    </div>
                  ))
                )}
              </div>

            </div>
          )}

        </div>
      </div>
    </div>
  )
}
