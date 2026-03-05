'use client'

import { useState, useCallback, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation' // ✨ 核心变化 1：引入 usePathname
import { AlertCircle, Check, Loader2, X, CheckCircle2 } from 'lucide-react'
import { supabase } from '@/lib/supabase-client'

// ─── Toast 类型 ──────────────────────────────────────────────────────
interface ToastItem {
  id: number
  message: string
  type: 'success' | 'error'
}

// ─── Toast 组件 ──────────────────────────────────────────────────────
function ToastContainer({ toasts, onRemove }: { toasts: ToastItem[]; onRemove: (id: number) => void }) {
  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 w-full max-w-sm px-4 pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg pointer-events-auto transition-all duration-300 ${
            toast.type === 'success'
              ? 'bg-green-500 text-white'
              : 'bg-red-500 text-white'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 size={18} className="flex-shrink-0" />
          ) : (
            <AlertCircle size={18} className="flex-shrink-0" />
          )}
          <span className="text-sm font-medium flex-1">{toast.message}</span>
          <button onClick={() => onRemove(toast.id)} className="flex-shrink-0 opacity-80 hover:opacity-100">
            <X size={16} />
          </button>
        </div>
      ))}
    </div>
  )
}

// ─── 主页面 ──────────────────────────────────────────────────────────
export default function DynamicActivation() {
  const router = useRouter()
  // ✨ 核心变化 2：获取当前绝对路径（例如："/active/TEST-VIP"）
  const pathname = usePathname() 

  // 步骤状态
  const [step, setStep] = useState<1 | 2>(1)

  // 步骤1 状态 
  const [activationCode, setActivationCode] = useState('')
  const [verifyError, setVerifyError] = useState<string | null>(null)
  const [isVerifying, setIsVerifying] = useState(false)
  const [verifiedCode, setVerifiedCode] = useState('')

  // 步骤2 状态
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [phoneError, setPhoneError] = useState<string | null>(null)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [confirmPasswordError, setConfirmPasswordError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Toast 状态
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const [toastCounter, setToastCounter] = useState(0)

  const addToast = useCallback((message: string, type: 'success' | 'error') => {
    const id = toastCounter + 1
    setToastCounter((c) => c + 1)
    setToasts((prev) => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 3000)
  }, [toastCounter])

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const verifyActivationCode = useCallback(async (codeToVerify: string, isAutoVerify: boolean = false) => {
    if (!codeToVerify) return
    setIsVerifying(true)
    setVerifyError(null)

    try {
      const { data: isValid, error } = await supabase.rpc('check_activation_code', {
        input_code: codeToVerify
      })

      if (error) {
        setVerifyError('验证失败，请稍后重试')
        return
      }

      if (!isValid) {
        // 无效时：留在第一步，保留填充的码，并给出错误提示
        setVerifyError(isAutoVerify ? `专属链接 [${codeToVerify}] 已失效或不存在` : '激活码无效或已被使用')
        return
      }

      // 有效时：跳到第二步
      setVerifiedCode(codeToVerify)
      setVerifyError(null)
      setStep(2) 
    } catch (err) {
      setVerifyError('网络错误，请稍后重试')
    } finally {
      setIsVerifying(false)
    }
  }, [])

  // ✨ 核心变化 3：暴力破解法，直接拆解 URL 提取激活码
  useEffect(() => {
    if (!pathname) return

    // 将 "/active/TEST-VIP" 拆解为 ["active", "TEST-VIP"]
    const pathSegments = pathname.split('/').filter(Boolean)
    const lastSegment = pathSegments[pathSegments.length - 1]

    // 只要 URL 最后一段不是 'active' 自身，就说明这是附带了激活码的专属链接
    if (lastSegment && lastSegment.toLowerCase() !== 'active') {
      const finalCode = decodeURIComponent(lastSegment).trim().toUpperCase()
      
      // 第一时间塞进输入框
      setActivationCode(finalCode) 
      // 第二时间触发查库验证
      verifyActivationCode(finalCode, true) 
    }
  }, [pathname, verifyActivationCode])

  // ── 步骤1：手动点击验证按钮 ──────────────────────────────────────────────
  const handleVerifyClick = () => {
    const code = activationCode.trim().toUpperCase()
    if (!code) {
      setVerifyError('请输入激活码')
      return
    }
    verifyActivationCode(code)
  }

  // ── 步骤2：实时表单校验 ────────────────────────────────────────────
  const validatePhone = (value: string) => {
    if (!value) {
      setPhoneError('请输入有效的11位手机号')
      return false
    }
    if (!/^1[3-9]\d{9}$/.test(value)) {
      setPhoneError('请输入有效的11位手机号')
      return false
    }
    setPhoneError(null)
    return true
  }

  const validatePassword = (value: string) => {
    if (value.length < 6) {
      setPasswordError('密码至少需要6个字符')
      return false
    }
    setPasswordError(null)
    return true
  }

  const validateConfirmPassword = (value: string, pwd: string) => {
    if (value !== pwd) {
      setConfirmPasswordError('两次输入的密码不一致，请重新输入')
      return false
    }
    setConfirmPasswordError(null)
    return true
  }

  // ── 步骤2：提交创建账户 ────────────────────────────────────────────
  const handleActivate = async () => {
    const phoneValid = validatePhone(phone)
    const passwordValid = validatePassword(password)
    const confirmValid = validateConfirmPassword(confirmPassword, password)

    if (!phoneValid || !passwordValid || !confirmValid) return

    setIsSubmitting(true)

    try {
      const email = `${phone}@user.engvlog.com`
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password
      })

      if (signUpError) {
        if (signUpError.message.includes('already registered')) {
          addToast('该手机号已被注册，请直接登录', 'error')
        } else {
          addToast('注册失败，请稍后重试', 'error')
        }
        return
      }

      const { error: activateError } = await supabase.rpc('activate_user', {
        input_code: verifiedCode
      })

      if (activateError) {
        addToast('激活失败，请稍后重试', 'error')
        return
      }

      addToast('激活成功！即将进入学习...', 'success')
      
      setTimeout(() => {
        router.push('/')
      }, 1500)
    } catch (err) {
      addToast('网络错误，请稍后重试', 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  // ── 返回步骤1 ──────────────────────────────────────────────────────
  const handleBack = () => {
    setStep(1)
    setVerifyError(null)
    setPhone('')
    setPassword('')
    setConfirmPassword('')
    setPhoneError(null)
    setPasswordError(null)
    setConfirmPasswordError(null)
  }

  return (
    <>
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      <div className="min-h-screen bg-gradient-to-br from-blue-100 via-indigo-50 to-purple-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-xl px-8 py-10">

          {/* ── 头部 ─────────────────────────────────────────── */}
          <div className="flex flex-col items-center mb-7">
            <div className="mb-4">
              <svg className="w-14 h-14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="2" y="5" width="20" height="14" rx="3" fill="#FF0000" />
                <polygon points="10,8.5 10,15.5 16.5,12" fill="white" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-slate-800 mb-1.5 tracking-tight">账号激活</h1>
            <p className="text-slate-400 text-sm text-center">专为流利英语设计的学习网站</p>
          </div>

          {/* ── 步骤指示器 ───────────────────────────────────── */}
          <div className="flex items-center justify-center mb-7 px-4">
            <div className="flex flex-col items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                  step > 1
                    ? 'bg-indigo-500 text-white'
                    : 'border-2 border-indigo-500 text-indigo-500 bg-white'
                }`}
              >
                {step > 1 ? <Check size={18} strokeWidth={3} /> : '1'}
              </div>
              <p className={`text-xs mt-1.5 font-medium ${step >= 1 ? 'text-indigo-500' : 'text-slate-400'}`}>
                验证激活码
              </p>
            </div>

            <div className={`h-px w-16 mx-3 mb-4 transition-all ${step > 1 ? 'bg-indigo-400' : 'bg-slate-200'}`} />

            <div className="flex flex-col items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                  step === 2
                    ? 'border-2 border-indigo-500 text-indigo-500 bg-white'
                    : 'border-2 border-slate-300 text-slate-400 bg-white'
                }`}
              >
                2
              </div>
              <p className={`text-xs mt-1.5 font-medium ${step === 2 ? 'text-indigo-500' : 'text-slate-400'}`}>
                创建账户
              </p>
            </div>
          </div>

          {/* ── 步骤1：验证激活码 ─────────────────────────────── */}
          {step === 1 && (
            <div className="space-y-6">
              {verifyError && (
                <div className="flex items-center gap-2.5 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                  <X size={16} className="text-red-500 flex-shrink-0" />
                  <span className="text-red-600 text-sm">{verifyError}</span>
                </div>
              )}

              <input
                type="text"
                placeholder="请输入激活码"
                value={activationCode}
                onChange={(e) => {
                  setActivationCode(e.target.value.toUpperCase())
                  if (verifyError) setVerifyError(null)
                }}
                onKeyDown={(e) => e.key === 'Enter' && handleVerifyClick()}
                className={`w-full px-4 py-3.5 rounded-xl border-2 bg-slate-50 text-slate-800 placeholder:text-slate-300 text-sm focus:outline-none transition-colors ${
                  verifyError
                    ? 'border-red-400 focus:border-red-400'
                    : 'border-slate-200 focus:border-indigo-400'
                }`}
              />

              <button
                className="w-full mt-6 py-3.5 rounded-xl bg-gradient-to-r from-blue-400 to-purple-400 text-white font-semibold text-sm hover:from-blue-500 hover:to-purple-500 disabled:opacity-70 disabled:cursor-not-allowed transition-all shadow-sm flex items-center justify-center gap-2"
                onClick={handleVerifyClick}
                disabled={isVerifying}
              >
                {isVerifying && <Loader2 size={16} className="animate-spin" />}
                {isVerifying ? '验证中...' : '验证激活码'}
              </button>
            </div>
          )}

          {/* ── 步骤2：创建账户 ───────────────────────────────── */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3.5">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-sm">✅</span>
                  <span className="text-green-700 text-sm font-semibold">激活码验证成功</span>
                  <span className="ml-auto text-green-700 font-bold text-sm tracking-widest">{verifiedCode}</span>
                </div>
                <p className="text-green-600 text-xs">学习网站：www.engvlog.com</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  手机号 <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  placeholder="请输入11位手机号"
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value)
                    if (phoneError) validatePhone(e.target.value)
                  }}
                  onBlur={() => validatePhone(phone)}
                  maxLength={11}
                  className={`w-full px-4 py-3.5 rounded-xl border-2 bg-slate-50 text-slate-800 placeholder:text-slate-300 text-sm focus:outline-none transition-colors ${
                    phoneError
                      ? 'border-red-400 focus:border-red-400'
                      : 'border-slate-200 focus:border-indigo-400'
                  }`}
                />
                {phoneError && (
                  <p className="mt-1.5 text-red-500 text-xs">{phoneError}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  密码 <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  placeholder="至少6个字符"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    if (passwordError) validatePassword(e.target.value)
                    if (confirmPasswordError && confirmPassword) validateConfirmPassword(confirmPassword, e.target.value)
                  }}
                  onBlur={() => validatePassword(password)}
                  className={`w-full px-4 py-3.5 rounded-xl border-2 bg-slate-50 text-slate-800 placeholder:text-slate-300 text-sm focus:outline-none transition-colors ${
                    passwordError
                      ? 'border-red-400 focus:border-red-400'
                      : 'border-slate-200 focus:border-indigo-400'
                  }`}
                />
                {passwordError && (
                  <p className="mt-1.5 text-red-500 text-xs">{passwordError}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  确认密码 <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  placeholder="再次输入密码"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value)
                    if (confirmPasswordError) validateConfirmPassword(e.target.value, password)
                  }}
                  onBlur={() => validateConfirmPassword(confirmPassword, password)}
                  className={`w-full px-4 py-3.5 rounded-xl border-2 bg-slate-50 text-slate-800 placeholder:text-slate-300 text-sm focus:outline-none transition-colors ${
                    confirmPasswordError
                      ? 'border-red-400 focus:border-red-400'
                      : 'border-slate-200 focus:border-indigo-400'
                  }`}
                />
                {confirmPasswordError && (
                  <p className="mt-1.5 text-red-500 text-xs">{confirmPasswordError}</p>
                )}
              </div>

              <button
                className="w-full mt-8 py-3.5 rounded-xl bg-gradient-to-r from-blue-400 to-purple-400 text-white font-semibold text-sm hover:from-blue-500 hover:to-purple-500 disabled:opacity-70 disabled:cursor-not-allowed transition-all shadow-sm flex items-center justify-center gap-2"
                onClick={handleActivate}
                disabled={isSubmitting}
              >
                {isSubmitting && <Loader2 size={16} className="animate-spin" />}
                {isSubmitting ? '激活中...' : '一键激活'}
              </button>

              <button
                onClick={handleBack}
                disabled={isSubmitting}
                className="w-full py-3.5 rounded-xl bg-slate-100 text-slate-500 font-medium text-sm hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                返回验证激活码
              </button>
            </div>
          )}

          {/* ── 页脚 ──────────────────────────────────────────── */}
          <div className="mt-7 pt-5 border-t border-slate-100 flex flex-col items-center gap-2">
            <p className="text-sm text-slate-500">
              已有账户？{' '}
              <a href="/login" className="text-indigo-500 font-semibold hover:text-indigo-600 hover:underline transition-colors">
                立即登录
              </a>
            </p>
            <p className="text-xs text-slate-400">
              没有激活码，请联系微信号:{' '}
              <span className="text-indigo-500 font-semibold">toSeeBrightFuture</span>
            </p>
          </div>

        </div>
      </div>
    </>
  )
}