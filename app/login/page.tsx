'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase-client';

type MessageType = 'success' | 'error' | 'warning';

interface Message {
  type: MessageType;
  text: string;
}

export default function LoginPage() {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState<Message | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (!phone || !password) {
      setMessage({ type: 'error', text: '请填写手机号和密码' });
      return;
    }

    setIsLoading(true);

    try {
      // 构造用户邮箱
      const email = `${phone}@user.engvlog.com`;

      // 调用 Supabase 登录
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        // 处理登录错误
        if (error.message === 'Invalid login credentials') {
          setMessage({ type: 'error', text: '手机号未注册或密码错误' });
        } else {
          setMessage({ type: 'error', text: error.message });
        }
        return;
      }

      if (data.user) {
        // 登录成功
        setMessage({ type: 'success', text: '登录成功！正在跳转...' });
        router.push('/');
      }
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : '服务器异常，请稍后重试';
      setMessage({ type: 'error', text: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  const bannerStyles: Record<MessageType, string> = {
    success: 'bg-green-50 border border-green-200 text-green-700',
    error: 'bg-red-50 border border-red-200 text-red-600',
    warning: 'bg-amber-50 border border-amber-200 text-amber-700',
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-100 via-violet-50 to-purple-100 flex items-center justify-center p-8 sm:p-4">
      <div className="w-full sm:max-w-md bg-white rounded-3xl shadow-xl shadow-violet-100/60 p-6 sm:p-8">   
        {/* YouTube Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-16 h-12 bg-red-600 rounded-xl flex items-center justify-center shadow-md shadow-red-200">
            <svg className="w-7 h-7 fill-white" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M9.5 7.5l7 4.5-7 4.5V7.5z" />
            </svg>
          </div>
        </div>

        {/* Title */}
        <h1 className="text-center text-2xl font-bold text-slate-900 mb-2 text-balance">
          {"Let's speak fluntly!"}
        </h1>

        {/* Subtitle */}
        <p className="text-center text-sm text-slate-400 mb-6">
          欢迎来到流利英语学习星球
        </p>

        {/* Message Banner */}
        {message && (
          <div
            role="alert"
            className={`${bannerStyles[message.type]} rounded-xl px-4 py-3 mb-5 text-sm font-medium`}
          >
            {message.text}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Phone Number */}
          <div>
            <label htmlFor="phone" className="block text-sm font-semibold text-slate-700 mb-2">
              手机号
            </label>
            <input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              onFocus={() => setFocusedField('phone')}
              onBlur={() => setFocusedField(null)}
              placeholder="请输入11位手机号"
              className={`w-full px-4 py-3 border-2 rounded-xl bg-slate-50 transition-all duration-200 text-slate-800 placeholder-slate-400 ${
                focusedField === 'phone'
                  ? 'border-violet-400 bg-white shadow-sm shadow-violet-100 outline-none'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            />
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className="block text-sm font-semibold text-slate-700 mb-2">
              密码
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onFocus={() => setFocusedField('password')}
              onBlur={() => setFocusedField(null)}
              placeholder="请输入密码"
              className={`w-full px-4 py-3 border-2 rounded-xl bg-slate-50 transition-all duration-200 text-slate-800 placeholder-slate-400 ${
                focusedField === 'password'
                  ? 'border-violet-400 bg-white shadow-sm shadow-violet-100 outline-none'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-blue-400 to-violet-400 text-white font-semibold py-3 px-4 rounded-xl mt-1 hover:from-blue-500 hover:to-violet-500 hover:shadow-md hover:shadow-violet-200 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isLoading ? '登录中...' : '登录'}
          </button>
        </form>

        {/* Footer */}
        <div className="text-center mt-6 pt-5 border-t border-slate-100">
          <span className="text-sm text-slate-500">还没有账户？</span>
          <a
            href="/active"
            className="text-sm text-blue-500 hover:text-violet-600 ml-1 font-medium transition-colors duration-150"
          >
            立即注册
          </a>
        </div>
        
        <div className="text-center mt-3">
          <span className="text-xs text-slate-400">
            忘记密码？请联系微信客服：toSeeBrightFuture
          </span>
        </div>

      </div>
    </main>
  );
}

