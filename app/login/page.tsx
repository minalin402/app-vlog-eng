'use client';

import { useState } from 'react';

export default function LoginPage() {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(true);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted:', { phone, password });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-100 via-slate-50 to-pink-100 flex items-center justify-center p-4">
      <div className="w-full sm:max-w-md bg-white rounded-3xl shadow-lg p-8">
        {/* YouTube Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-red-600 rounded-lg flex items-center justify-center">
            <svg
              className="w-8 h-8 text-white fill-current"
              viewBox="0 0 24 24"
            >
              <path d="M9 6l10.38 5.56c.43.25.43.75 0 1L9 18v-12z" />
            </svg>
          </div>
        </div>

        {/* Title */}
        <h1 className="text-center text-2xl font-bold text-slate-900 mb-2">
          Let's speak now!
        </h1>

        {/* Subtitle */}
        <p className="text-center text-sm text-slate-500 mb-6">
          专为油管英语口语设计的学习网站
        </p>

        {/* Error Banner */}
        {error && (
          <div className="bg-red-100 border border-red-200 text-red-600 rounded-lg p-3 mb-6 text-sm">
            用户名或密码错误
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Phone Number Field */}
          <div>
            <label className="block text-sm font-medium text-slate-800 mb-2">
              手机号
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              onFocus={() => setFocusedField('phone')}
              onBlur={() => setFocusedField(null)}
              placeholder="15160767640"
              className={`w-full px-4 py-3 border-2 rounded-lg bg-white transition-colors ${
                focusedField === 'phone'
                  ? 'border-yellow-500 outline-none'
                  : 'border-slate-200 hover:border-slate-300'
              } text-slate-900 placeholder-slate-400`}
            />
          </div>

          {/* Password Field */}
          <div>
            <label className="block text-sm font-medium text-slate-800 mb-2">
              密码
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onFocus={() => setFocusedField('password')}
              onBlur={() => setFocusedField(null)}
              placeholder="请输入密码"
              className={`w-full px-4 py-3 border-2 rounded-lg bg-white transition-colors ${
                focusedField === 'password'
                  ? 'border-yellow-500 outline-none'
                  : 'border-slate-200 hover:border-slate-300'
              } text-slate-900 placeholder-slate-400`}
            />
          </div>

          {/* Login Button */}
          <button
            type="submit"
            className="w-full bg-gradient-to-r from-teal-200 to-pink-200 text-slate-900 font-semibold py-3 px-4 rounded-lg hover:shadow-md transition-shadow mt-6"
          >
            登录
          </button>
        </form>

        {/* Footer */}
        <div className="text-center mt-6 pt-4 border-t border-slate-200">
          <span className="text-sm text-slate-600">还没有账户？</span>
          <a
            href="#"
            className="text-sm text-blue-500 hover:text-blue-600 ml-1 font-medium"
          >
            立即注册
          </a>
        </div>
      </div>
    </div>
  );
}
