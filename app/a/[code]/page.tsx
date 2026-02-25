'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { AlertCircle, CheckCircle, Check } from 'lucide-react'

export default function AccountActivation() {
  const [activationCode, setActivationCode] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [step, setStep] = useState(1)
  const [errorState, setErrorState] = useState<'none' | 'not-exist' | 'used'>('none')
  const [showSuccess, setShowSuccess] = useState(false)

  const handleVerifyCode = () => {
    if (!activationCode) {
      setErrorState('none')
      return
    }
    
    if (activationCode === 'USED') {
      setErrorState('used')
      setShowSuccess(false)
    } else if (activationCode === 'NOT-EXIST') {
      setErrorState('not-exist')
      setShowSuccess(false)
    } else {
      setErrorState('none')
      setShowSuccess(true)
      setStep(2)
    }
  }

  const handleActivate = () => {
    if (phoneNumber && password && confirmPassword && password === confirmPassword) {
      alert('账户激活成功！')
    }
  }

  const handleBack = () => {
    setStep(1)
    setErrorState('none')
    setShowSuccess(false)
    setActivationCode('')
    setPhoneNumber('')
    setPassword('')
    setConfirmPassword('')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-100 via-slate-50 to-pink-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-lg p-8 md:p-12">
        {/* Header */}
        <div className="flex flex-col items-center mb-8">
          {/* YouTube Icon */}
          <div className="mb-4">
            <svg className="w-16 h-16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="2" y="4" width="20" height="16" rx="2" fill="#FF0000" />
              <polygon points="10,8 10,16 16,12" fill="white" />
            </svg>
          </div>
          
          <h1 className="text-4xl font-bold text-gray-800 mb-2 text-center">账号激活</h1>
          <p className="text-gray-600 text-center text-sm md:text-base">
            专为油管英语口语设计的学习网站
          </p>
        </div>

        {/* Stepper */}
        <div className="flex items-center justify-between mb-8">
          {/* Step 1 */}
          <div className="flex flex-col items-center flex-1">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-white ${
              step >= 1 ? 'bg-teal-500' : 'bg-gray-300'
            }`}>
              {step > 1 ? <Check size={24} /> : '1'}
            </div>
            <p className={`text-xs md:text-sm mt-2 text-center ${
              step >= 1 ? 'text-teal-600' : 'text-gray-500'
            }`}>
              验证激活码
            </p>
          </div>

          {/* Line */}
          <div className={`flex-1 h-1 mx-2 ${
            step > 1 ? 'bg-teal-500' : 'bg-gray-300'
          }`}></div>

          {/* Step 2 */}
          <div className="flex flex-col items-center flex-1">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-white ${
              step >= 2 ? 'bg-teal-500' : 'bg-gray-300'
            }`}>
              2
            </div>
            <p className={`text-xs md:text-sm mt-2 text-center ${
              step >= 2 ? 'text-teal-600' : 'text-gray-500'
            }`}>
              创建账户
            </p>
          </div>
        </div>

        {/* Step 1: Verification */}
        {step === 1 && (
          <div className="space-y-4">
            {/* Error Banner */}
            {errorState === 'used' && (
              <div className="bg-red-100 border border-red-200 rounded-lg p-3 flex items-start gap-3">
                <AlertCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
                <span className="text-red-600 text-sm">激活码已被使用</span>
              </div>
            )}

            {errorState === 'not-exist' && (
              <div className="bg-red-100 border border-red-200 rounded-lg p-3 flex items-start gap-3">
                <AlertCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
                <span className="text-red-600 text-sm">激活码不存在</span>
              </div>
            )}

            {/* Success Banner */}
            {showSuccess && (
              <div className="bg-green-100 border border-green-200 rounded-lg p-4 flex items-start gap-3">
                <CheckCircle size={20} className="text-green-700 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-green-700 text-sm font-semibold">✅ 激活码验证成功 8VRQRC</p>
                  <p className="text-green-700 text-xs mt-1">学习网站: www.aienglish.club</p>
                </div>
              </div>
            )}

            {/* Activation Code Input */}
            <div>
              <input
                type="text"
                placeholder="请输入激活码"
                value={activationCode}
                onChange={(e) => setActivationCode(e.target.value.toUpperCase())}
                className={`w-full px-4 py-3 rounded-lg border-2 bg-white transition-colors ${
                  errorState !== 'none' && activationCode
                    ? 'border-red-400 focus:outline-none'
                    : 'border-gray-300 focus:border-teal-500 focus:outline-none'
                }`}
              />
            </div>

            {/* Verify Button */}
            <button
              onClick={handleVerifyCode}
              className="w-full py-3 rounded-lg bg-gradient-to-r from-teal-200 to-pink-200 text-gray-700 font-semibold hover:shadow-md transition-shadow"
            >
              验证激活码
            </button>
          </div>
        )}

        {/* Step 2: Create Account */}
        {step === 2 && (
          <div className="space-y-4">
            {/* Success Banner */}
            <div className="bg-green-100 border border-green-200 rounded-lg p-4 flex items-start gap-3 mb-6">
              <CheckCircle size={20} className="text-green-700 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-green-700 text-sm font-semibold">✅ 激活码验证成功 8VRQRC</p>
                <p className="text-green-700 text-xs mt-1">学习网站: www.aienglish.club</p>
              </div>
            </div>

            {/* Phone Number */}
            <div>
              <label className="block text-sm text-gray-700 mb-2 font-medium">
                手机号 <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                placeholder="请输入11位手机号"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 focus:border-teal-500 focus:outline-none bg-white"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm text-gray-700 mb-2 font-medium">
                密码 <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                placeholder="至少6个字符"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 focus:border-teal-500 focus:outline-none bg-white"
              />
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm text-gray-700 mb-2 font-medium">
                确认密码 <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                placeholder="再次输入密码"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 focus:border-teal-500 focus:outline-none bg-white"
              />
            </div>

            {/* Activate Button */}
            <button
              onClick={handleActivate}
              className="w-full py-3 rounded-lg bg-gradient-to-r from-teal-200 to-pink-200 text-gray-700 font-semibold hover:shadow-md transition-shadow"
            >
              一键激活
            </button>

            {/* Back Button */}
            <button
              onClick={handleBack}
              className="w-full py-3 rounded-lg bg-slate-200 text-slate-500 font-semibold hover:bg-slate-300 transition-colors"
            >
              返回验证激活码
            </button>
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-gray-200 text-center space-y-3">
          <div className="flex items-center justify-center gap-2 text-sm">
            <span className="text-gray-700">已有账户？</span>
            <a href="#" className="text-blue-500 font-semibold hover:underline">
              立即登录
            </a>
          </div>
          <div className="text-sm text-gray-600">
            没有激活码，请联系微信号: <span className="font-semibold text-gray-800">Joe7161</span>
          </div>
        </div>
      </div>
    </div>
  )
}
