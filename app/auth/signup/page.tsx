'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff } from 'lucide-react'

export default function SignUpPage() {
  const router = useRouter()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState(1)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const lastStepChangeTime = useRef<number>(0)

  const [formData, setFormData] = useState({
    name: '', email: '', password: '', confirmPassword: '',
    ownerName: '', contactNumber: '', businessName: '', businessType: '',
    address: '', barangay: '', municipality: '', province: '', zipCode: ''
  })

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  // Basic validation before going next
  function handleNext() {
    setError('')
    if (step === 1) {
      if (!formData.name || !formData.email || !formData.password || !formData.confirmPassword) {
        setError('Please fill in all account fields.')
        return
      }
      if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match.')
        return
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(formData.email)) {
        setError('Please provide a valid email format.')
        return
      }
      if (formData.password.length < 8) {
        setError('Password must be at least 8 characters.')
        return
      }
    } else if (step === 2) {
      if (!formData.ownerName || !formData.contactNumber || !formData.businessName || !formData.businessType) {
        setError('Please fill in all business details.')
        return
      }
    }
    setStep(prev => prev + 1)
    lastStepChangeTime.current = Date.now()
  }

  function handleBack() {
    setError('')
    setStep(prev => prev - 1)
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    
    // Prevent accidental form submissions if the user rapidly double-clicked the 'Next' button
    if (Date.now() - lastStepChangeTime.current < 500) {
       return
    }

    // If the user presses 'Enter' on Step 1 or 2, intercept it and treat it as 'Next' instead of final submit
    if (step < 3) {
      handleNext()
      return
    }

    setError('')
    
    // Final step validation
    if (!formData.address || !formData.barangay || !formData.municipality || !formData.province || !formData.zipCode) {
      setError('Please fill in all address fields.')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      const result = await res.json()
      if (!res.ok) { 
        setError(result.error || 'Registration failed.')
        setLoading(false)
        return 
      }
      router.push('/auth/signin?registered=true')
    } catch {
      setError('Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  const field = (name: keyof typeof formData, label: string, type = 'text', placeholder = '') => (
    <div>
      <label className="text-xs font-medium text-gray-500 block mb-1">
        {label} <span className="text-red-500">*</span>
      </label>
      <input
        name={name}
        type={type}
        placeholder={placeholder || label}
        value={formData[name]}
        onChange={handleChange}
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#1e4d2b] transition-colors"
      />
    </div>
  )

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-cover bg-center py-10 px-4"
      style={{
        backgroundImage:
          'linear-gradient(rgba(0,0,0,0.35), rgba(0,0,0,0.35)), url(https://images.unsplash.com/photo-1533900298318-6b8da08a523e?w=1600&q=80)',
      }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg px-8 py-8 overflow-hidden relative">
        <div className="flex flex-col items-center mb-6">
          <div className="flex items-center justify-center mb-1">
            <img src="/logo.png" alt="MarketHub Logo" className="h-16 w-auto object-contain" />
          </div>
          <p className="text-gray-500 text-sm mt-1">Create your vendor account</p>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center justify-center space-x-2 mb-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex items-center">
              <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${step >= i ? 'bg-[#1e4d2b] text-white' : 'bg-gray-200 text-gray-500'}`}>
                {i}
              </div>
              {i < 3 && (
                <div className={`w-8 h-1 transition-colors ${step > i ? 'bg-[#1e4d2b]' : 'bg-gray-200'}`} />
              )}
            </div>
          ))}
        </div>

        {error && (
          <div className="mb-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-center transition-opacity">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="relative w-full overflow-hidden" style={{ minHeight: '300px' }}>
            {/* Step 1: Account Info */}
            <div className={`space-y-4 absolute w-full transition-all duration-500 ease-in-out ${step === 1 ? 'translate-x-0 opacity-100 relative' : step > 1 ? '-translate-x-full opacity-0' : 'translate-x-full opacity-0'}`}>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Step 1: Account Info</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {field('name', 'Full Name', 'text', 'Juan dela Cruz')}
                {field('email', 'Email Address', 'email', 'juan@example.com')}
                
                {/* Custom Password Field */}
                <div>
                  <label className="text-xs font-medium text-gray-500 block mb-1">
                    Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative flex items-center border border-gray-200 rounded-lg px-3 py-2 focus-within:border-[#1e4d2b] transition-colors bg-white">
                    <input
                      name="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Min. 8 characters"
                      value={formData.password}
                      onChange={handleChange}
                      className="w-full text-sm focus:outline-none bg-transparent pr-8"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 text-gray-400 hover:text-gray-600 focus:outline-none"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Custom Confirm Password Field */}
                <div>
                  <label className="text-xs font-medium text-gray-500 block mb-1">
                    Confirm Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative flex items-center border border-gray-200 rounded-lg px-3 py-2 focus-within:border-[#1e4d2b] transition-colors bg-white">
                    <input
                      name="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Re-enter password"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className="w-full text-sm focus:outline-none bg-transparent pr-8"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 text-gray-400 hover:text-gray-600 focus:outline-none"
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 2: Business Info */}
            <div className={`space-y-4 absolute w-full transition-all duration-500 ease-in-out ${step === 2 ? 'translate-x-0 opacity-100 relative' : step > 2 ? '-translate-x-full opacity-0' : 'translate-x-full opacity-0'}`}>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Step 2: Business Info</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {field('ownerName', 'Owner Name', 'text', 'Juan dela Cruz')}
                {field('contactNumber', 'Contact Number', 'tel', '09XXXXXXXXX')}
                {field('businessName', 'Business Name', 'text', "Juan's Store")}
                <div>
                  <label className="text-xs font-medium text-gray-500 block mb-1">
                    Business Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="businessType"
                    value={formData.businessType}
                    onChange={handleChange}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#1e4d2b] bg-white transition-colors"
                  >
                    <option value="">Select type</option>
                    <option>Vegetables & Fruits</option>
                    <option>Meat & Seafood</option>
                    <option>Dry Goods</option>
                    <option>Cooked Food</option>
                    <option>Clothing & Apparel</option>
                    <option>Hardware & Tools</option>
                    <option>Others</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Step 3: Address Info */}
            <div className={`space-y-4 absolute w-full transition-all duration-500 ease-in-out ${step === 3 ? 'translate-x-0 opacity-100 relative' : step > 3 ? '-translate-x-full opacity-0' : 'translate-x-full opacity-0'}`}>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Step 3: Address</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {field('address', 'Street Address')}
                {field('barangay', 'Barangay')}
                {field('municipality', 'Municipality', 'text', 'Boac')}
                {field('province', 'Province', 'text', 'Marinduque')}
                {field('zipCode', 'Zip Code', 'text', '4900')}
              </div>
            </div>
          </div>

          <div className="flex gap-3 mt-8">
            {step > 1 && (
              <button
                type="button"
                onClick={handleBack}
                disabled={loading}
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2.5 rounded-lg transition-colors text-sm"
              >
                Back
              </button>
            )}
            
            {step < 3 ? (
              <button
                type="button"
                onClick={handleNext}
                className="w-full bg-[#1e4d2b] hover:bg-[#2d6a4f] text-white font-semibold py-2.5 rounded-lg transition-colors text-sm"
              >
                Next
              </button>
            ) : (
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#1e4d2b] hover:bg-[#2d6a4f] text-white font-semibold py-2.5 rounded-lg transition-colors disabled:opacity-60 text-sm"
              >
                {loading ? 'Creating account...' : 'Create Account'}
              </button>
            )}
          </div>
        </form>

        <p className="text-center text-sm text-gray-500 mt-5">
          Already have an account?{' '}
          <Link href="/auth/signin" className="text-[#1e4d2b] font-semibold hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}