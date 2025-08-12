'use client';

import React, { useState, useEffect } from 'react';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';

// Interfaces
interface Transaction {
  id: string;
  descricao: string;
  valor: number;
  categoria: string;
  data: string;
  tipo: 'entrada' | 'saida';
  parcelado?: boolean;
  parcelaAtual?: number;
  totalParcelas?: number;
  grupoId?: string;
  recorrente?: boolean;
  recorrenteId?: string;
}

interface RecurringTransaction {
  id: string;
  tipo: 'entrada' | 'saida';
  descricao: string;
  valor: number;
  categoria: string;
  diaVencimento: number;
  ativa: boolean;
}

interface TransactionsByYear {
  [year: string]: {
    [month: number]: {
      entradas: Transaction[];
      saidas: Transaction[];
    };
  };
}

const FinancialDashboard = () => {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [ano, setAno] = useState(new Date().getFullYear());
  const [transacoes, setTransacoes] = useState<TransactionsByYear>({});
  const [transacoesRecorrentes, setTransacoesRecorrentes] = useState<RecurringTransaction[]>([]);
  const [abaSelecionada, setAbaSelecionada] = useState('principal');
  const [loading, setLoading] = useState(true);
  
  const [novaTransacao, setNovaTransacao] = useState({
    tipo: 'saida' as 'entrada' | 'saida',
    descricao: '',
    valor: '',
    categoria: '',
    data: new Date().toISOString().split('T')[0],
    parcelado: false,
    totalParcelas: 1
  });

  const [novaRecorrente, setNovaRecorrente] = useState({
    tipo: 'saida' as 'entrada' | 'saida',
    descricao: '',
    valor: '',
    categoria: '',
    diaVencimento: 1
  });

  const categorias = [
    'Alimentação', 'Transporte', 'Moradia', 'Saúde', 'Educação',
    'Entretenimento', 'Roupas', 'Investimentos', 'Outros'
  ];

  const meses = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (!token || !userData) {
      router.push('/login');
      return;
    }

    setUser(JSON.parse(userData));
    loadData();
  }, [ano]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [transacoesRes, recorrentesRes] = await Promise.all([
        api.get(`/transactions?ano=${ano}`),
        api.get('/recurring-transactions')
      ]);
      
      setTransacoes(transacoesRes.data);
      setTransacoesRecorrentes(recorrentesRes.data);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/');
  };

  const adicionarTransacao = async () => {
    try {
      await api.post('/transactions', {
        ...novaTransacao,
        valor: parseFloat(novaTransacao.valor)
      });
      
      setNovaTransacao({
        tipo: 'saida',
        descricao: '',
        valor: '',
        categoria: '',
        data: new Date().toISOString().split('T')[0],
        parcelado: false,
        totalParcelas: 1
      });
      
      loadData();
    } catch (error) {
      console.error('Erro ao adicionar transação:', error);
    }
  };

  const adicionarRecorrente = async () => {
    try {
      await api.post('/recurring-transactions', {
        ...novaRecorrente,
        valor: parseFloat(novaRecorrente.valor)
      });
      
      setNovaRecorrente({
        tipo: 'saida',
        descricao: '',
        valor: '',
        categoria: '',
        diaVencimento: 1
      });
      
      loadData();
    } catch (error) {
      console.error('Erro ao adicionar recorrente:', error);
    }
  };

  const removerTransacao = async (id: string) => {
    try {
      await api.delete(`/transactions/${id}`);
      loadData();
    } catch (error) {
      console.error('Erro ao remover transação:', error);
    }
  };

  const calcularResumoMes = (mes: number) => {
    const transacoesMes = transacoes[ano]?.[mes];
    if (!transacoesMes) return { entradas: 0, saidas: 0, saldo: 0 };

    const entradas = transacoesMes.entradas.reduce((sum, t) => sum + t.valor, 0);
    const saidas = transacoesMes.saidas.reduce((sum, t) => sum + t.valor, 0);
    
    return { entradas, saidas, saldo: entradas - saidas };
  };

  const calcularResumoAno = () => {
    let totalEntradas = 0;
    let totalSaidas = 0;

    Object.values(transacoes[ano] || {}).forEach(mes => {
      totalEntradas += mes.entradas.reduce((sum, t) => sum + t.valor, 0);
      totalSaidas += mes.saidas.reduce((sum, t) => sum + t.valor, 0);
    });

    return {
      entradas: totalEntradas,
      saidas: totalSaidas,
      saldo: totalEntradas - totalSaidas
    };
  };

  const renderPrincipal = () => {
    const resumoAno = calcularResumoAno();
    
    return (
      <div className="space-y-8">
        {/* Header com resumo anual */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6 transition-all duration-300 hover:shadow-xl bg-gradient-to-r from-green-500 to-emerald-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm font-medium">Total de Entradas</p>
                <p className="text-2xl font-bold">R$ {resumoAno.entradas.toFixed(2)}</p>
              </div>
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6 transition-all duration-300 hover:shadow-xl bg-gradient-to-r from-red-500 to-pink-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-100 text-sm font-medium">Total de Saídas</p>
                <p className="text-2xl font-bold">R$ {resumoAno.saidas.toFixed(2)}</p>
              </div>
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                </svg>
              </div>
            </div>
          </div>

          <div className={`bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6 transition-all duration-300 hover:shadow-xl ${resumoAno.saldo >= 0 ? 'bg-gradient-to-r from-blue-500 to-blue-600' : 'bg-gradient-to-r from-orange-500 to-red-600'} text-white`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">Saldo do Ano</p>
                <p className="text-2xl font-bold">R$ {resumoAno.saldo.toFixed(2)}</p>
              </div>
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Formulário de nova transação */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6 transition-all duration-300 hover:shadow-xl">
          <div className="border-b border-slate-200 pb-4 mb-6">
            <h3 className="text-xl font-semibold text-slate-900 flex items-center gap-3">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Nova Transação
            </h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Tipo</label>
              <select
                value={novaTransacao.tipo}
                onChange={(e) => setNovaTransacao({...novaTransacao, tipo: e.target.value as 'entrada' | 'saida'})}
                className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-white/50 backdrop-blur-sm text-slate-900 placeholder-slate-500 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent hover:border-slate-400 appearance-none cursor-pointer"
              >
                <option value="saida">Saída</option>
                <option value="entrada">Entrada</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Descrição</label>
              <input
                type="text"
                value={novaTransacao.descricao}
                onChange={(e) => setNovaTransacao({...novaTransacao, descricao: e.target.value})}
                className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-white/50 backdrop-blur-sm text-slate-900 placeholder-slate-500 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent hover:border-slate-400"
                placeholder="Descrição da transação"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Valor</label>
              <input
                type="number"
                step="0.01"
                value={novaTransacao.valor}
                onChange={(e) => setNovaTransacao({...novaTransacao, valor: e.target.value})}
                className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-white/50 backdrop-blur-sm text-slate-900 placeholder-slate-500 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent hover:border-slate-400"
                placeholder="0,00"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Categoria</label>
              <select
                value={novaTransacao.categoria}
                onChange={(e) => setNovaTransacao({...novaTransacao, categoria: e.target.value})}
                className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-white/50 backdrop-blur-sm text-slate-900 placeholder-slate-500 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent hover:border-slate-400 appearance-none cursor-pointer"
              >
                <option value="">Selecione uma categoria</option>
                {categorias.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Data</label>
              <input
                type="date"
                value={novaTransacao.data}
                onChange={(e) => setNovaTransacao({...novaTransacao, data: e.target.value})}
                className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-white/50 backdrop-blur-sm text-slate-900 placeholder-slate-500 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent hover:border-slate-400"
              />
            </div>

            <div className="flex items-end">
              <button
                onClick={adicionarTransacao}
                disabled={!novaTransacao.descricao || !novaTransacao.valor || !novaTransacao.categoria}
                className="inline-flex items-center justify-center rounded-xl px-6 py-3 text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 focus:ring-blue-500 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 w-full"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Adicionar
              </button>
            </div>
          </div>
        </div>

        {/* Resumo mensal */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6 transition-all duration-300 hover:shadow-xl">
          <div className="border-b border-slate-200 pb-4 mb-6">
            <h3 className="text-xl font-semibold text-slate-900 flex items-center gap-3">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Resumo Mensal - {ano}
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {meses.map((mes, index) => {
              const resumo = calcularResumoMes(index + 1);
              return (
                <div key={mes} className="bg-slate-50 rounded-xl p-4 hover:bg-slate-100 transition-colors duration-200">
                  <h4 className="font-semibold text-slate-900 mb-3">{mes}</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Entradas:</span>
                      <span className="font-medium text-green-600">R$ {resumo.entradas.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Saídas:</span>
                      <span className="font-medium text-red-600">R$ {resumo.saidas.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between border-t border-slate-200 pt-2">
                      <span className="font-semibold text-slate-700">Saldo:</span>
                      <span className={`font-bold ${resumo.saldo >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        R$ {resumo.saldo.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const renderRecorrentes = () => (
    <div className="space-y-8">
      {/* Formulário de nova transação recorrente */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6 transition-all duration-300 hover:shadow-xl">
        <div className="border-b border-slate-200 pb-4 mb-6">
          <h3 className="text-xl font-semibold text-slate-900 flex items-center gap-3">
            <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Nova Transação Recorrente
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Tipo</label>
            <select
              value={novaRecorrente.tipo}
              onChange={(e) => setNovaRecorrente({...novaRecorrente, tipo: e.target.value as 'entrada' | 'saida'})}
              className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-white/50 backdrop-blur-sm text-slate-900 placeholder-slate-500 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent hover:border-slate-400 appearance-none cursor-pointer"
            >
              <option value="saida">Saída</option>
              <option value="entrada">Entrada</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Descrição</label>
            <input
              type="text"
              value={novaRecorrente.descricao}
              onChange={(e) => setNovaRecorrente({...novaRecorrente, descricao: e.target.value})}
              className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-white/50 backdrop-blur-sm text-slate-900 placeholder-slate-500 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent hover:border-slate-400"
              placeholder="Descrição da transação"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Valor</label>
            <input
              type="number"
              step="0.01"
              value={novaRecorrente.valor}
              onChange={(e) => setNovaRecorrente({...novaRecorrente, valor: e.target.value})}
              className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-white/50 backdrop-blur-sm text-slate-900 placeholder-slate-500 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent hover:border-slate-400"
              placeholder="0,00"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Categoria</label>
            <select
              value={novaRecorrente.categoria}
              onChange={(e) => setNovaRecorrente({...novaRecorrente, categoria: e.target.value})}
              className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-white/50 backdrop-blur-sm text-slate-900 placeholder-slate-500 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent hover:border-slate-400 appearance-none cursor-pointer"
            >
              <option value="">Selecione uma categoria</option>
              {categorias.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Dia do Vencimento</label>
            <input
              type="number"
              min="1"
              max="31"
              value={novaRecorrente.diaVencimento}
              onChange={(e) => setNovaRecorrente({...novaRecorrente, diaVencimento: parseInt(e.target.value)})}
              className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-white/50 backdrop-blur-sm text-slate-900 placeholder-slate-500 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent hover:border-slate-400"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={adicionarRecorrente}
              disabled={!novaRecorrente.descricao || !novaRecorrente.valor || !novaRecorrente.categoria}
              className="inline-flex items-center justify-center rounded-xl px-6 py-3 text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 focus:ring-blue-500 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 w-full"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Adicionar
            </button>
          </div>
        </div>
      </div>

      {/* Lista de transações recorrentes */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6 transition-all duration-300 hover:shadow-xl">
        <div className="border-b border-slate-200 pb-4 mb-6">
          <h3 className="text-xl font-semibold text-slate-900 flex items-center gap-3">
            <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
            Transações Recorrentes Ativas
          </h3>
        </div>

        <div className="space-y-3">
          {transacoesRecorrentes.filter(t => t.ativa).map(transacao => (
            <div key={transacao.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors duration-200">
              <div className="flex items-center gap-4">
                <div className={`w-3 h-3 rounded-full ${transacao.tipo === 'entrada' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <div>
                  <p className="font-semibold text-slate-900">{transacao.descricao}</p>
                  <p className="text-sm text-slate-600">{transacao.categoria} • Dia {transacao.diaVencimento}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className={`font-bold ${transacao.tipo === 'entrada' ? 'text-green-600' : 'text-red-600'}`}>
                  {transacao.tipo === 'entrada' ? '+' : '-'}R$ {transacao.valor.toFixed(2)}
                </span>
                <button
                  onClick={() => removerTransacao(transacao.id)}
                  className="text-red-500 hover:text-red-700 p-2 rounded-lg hover:bg-red-50 transition-colors duration-200"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mb-4 mx-auto animate-pulse">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
            </svg>
          </div>
          <p className="text-slate-600">Carregando dados financeiros...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-white/20 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">Dashboard Financeiro</h1>
                <p className="text-sm text-slate-600">Bem-vindo, {user?.name}</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <select
                value={ano}
                onChange={(e) => setAno(parseInt(e.target.value))}
                className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-white/50 backdrop-blur-sm text-slate-900 placeholder-slate-500 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent hover:border-slate-400 appearance-none cursor-pointer"
              >
                {[2023, 2024, 2025].map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
              
              <button
                onClick={handleLogout}
                className="inline-flex items-center justify-center rounded-xl px-6 py-3 text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 focus:ring-slate-500 shadow-sm hover:shadow-md"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Sair
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex gap-2">
          <button
            onClick={() => setAbaSelecionada('principal')}
            className={`px-6 py-3 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer ${abaSelecionada === 'principal' ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg' : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'}`}
          >
            <svg className="w-5 h-5 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
            </svg>
            Dashboard Principal
          </button>
          
          <button
            onClick={() => setAbaSelecionada('recorrentes')}
            className={`px-6 py-3 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer ${abaSelecionada === 'recorrentes' ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg' : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'}`}
          >
            <svg className="w-5 h-5 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Transações Recorrentes
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        {abaSelecionada === 'principal' && renderPrincipal()}
        {abaSelecionada === 'recorrentes' && renderRecorrentes()}
      </main>
    </div>
  );
};

export default FinancialDashboard;

