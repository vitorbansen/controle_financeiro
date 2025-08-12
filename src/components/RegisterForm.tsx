'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

const RegisterForm: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await api.post('/auth/register', { name, email, password });
      
      setSuccess('Usuário registrado com sucesso! Redirecionando para login...');
      
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } catch (error: any) {
      setError(error.response?.data?.message || 'Algo deu errado');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl mb-4 shadow-lg">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-2">
            Crie sua conta
          </h1>
          <p className="text-slate-600">Comece a gerenciar suas finanças hoje</p>
        </div>

        {/* Card de Registro */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6 transition-all duration-300 hover:shadow-xl">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm animate-pulse">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {error}
              </div>
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm animate-pulse">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {success}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-700">
                Nome completo
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full px-4 py-3 pl-10 rounded-xl border border-slate-300 bg-white/50 backdrop-blur-sm text-slate-900 placeholder-slate-500 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent hover:border-slate-400"
                  placeholder="Seu nome completo"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-700">
                Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                  </svg>
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-3 pl-10 rounded-xl border border-slate-300 bg-white/50 backdrop-blur-sm text-slate-900 placeholder-slate-500 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent hover:border-slate-400"
                  placeholder="seu@email.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-700">
                Senha
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3 pl-10 rounded-xl border border-slate-300 bg-white/50 backdrop-blur-sm text-slate-900 placeholder-slate-500 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent hover:border-slate-400"
                  placeholder="••••••••"
                />
              </div>
              <p className="text-xs text-slate-500">
                Mínimo de 6 caracteres
              </p>
            </div>

            <div className="flex items-start">
              <div className="flex items-center h-5">
                <input
                  type="checkbox"
                  required
                  className="rounded border-slate-300 text-green-600 focus:ring-green-500"
                />
              </div>
              <div className="ml-3 text-sm">
                <label className="text-slate-600">
                  Eu concordo com os{' '}
                  <a href="#" className="text-green-600 hover:text-green-700 font-medium">
                    Termos de Serviço
                  </a>{' '}
                  e{' '}
                  <a href="#" className="text-green-600 hover:text-green-700 font-medium">
                    Política de Privacidade
                  </a>
                </label>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center justify-center rounded-xl px-6 py-3 text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-r from-green-600 to-green-700 text-white hover:from-green-700 hover:to-green-800 focus:ring-green-500 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 w-full relative overflow-hidden group"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Criando conta...
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                  Criar conta
                </div>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-slate-600">
              Já tem uma conta?{' '}
              <a href="/login" className="text-green-600 hover:text-green-700 font-semibold">
                Faça login
              </a>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-slate-500">
          <p>© 2024 Sistema Financeiro. Todos os direitos reservados.</p>
        </div>
      </div>
    </div>
  );
};

export default RegisterForm;

