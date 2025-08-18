'use client';

import React, { useState, useEffect } from 'react';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';

// Types
type CategoriaType = 'Alimentação' | 'Transporte' | 'Moradia' | 'Saúde' | 'Educação' | 'Entretenimento' | 'Roupas' | 'Investimentos' | 'Outros';

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

interface CategoryData {
  categoria: CategoriaType;
  transacoes: Transaction[];
  totalEntradas: number;
  totalSaidas: number;
  saldo: number;
  entradasMes: number;
  saidasMes: number;
  saldoMes: number;
}

const CategoryAnalysis = () => {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [ano, setAno] = useState(new Date().getFullYear());
  const [mesSelecionado, setMesSelecionado] = useState(new Date().getMonth() + 1);
  const [transacoes, setTransacoes] = useState<TransactionsByYear>({});
  const [transacoesRecorrentes, setTransacoesRecorrentes] = useState<RecurringTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoriaExpandida, setCategoriaExpandida] = useState<string | null>(null);
  const [tipoVisualizacao, setTipoVisualizacao] = useState<'mensal' | 'anual'>('mensal');

  const categorias: CategoriaType[] = [
    'Alimentação', 'Transporte', 'Moradia', 'Saúde', 'Educação',
    'Entretenimento', 'Roupas', 'Investimentos', 'Outros'
  ];

  const meses = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const categoriasIcons: Record<CategoriaType, string> = {
    'Alimentação': '🍽️',
    'Transporte': '🚗',
    'Moradia': '🏠',
    'Saúde': '⚕️',
    'Educação': '📚',
    'Entretenimento': '🎮',
    'Roupas': '👕',
    'Investimentos': '💰',
    'Outros': '📦'
  };

  const categoriasColors: Record<CategoriaType, string> = {
    'Alimentação': 'from-orange-500 to-amber-600',
    'Transporte': 'from-blue-500 to-cyan-600',
    'Moradia': 'from-green-500 to-emerald-600',
    'Saúde': 'from-red-500 to-rose-600',
    'Educação': 'from-purple-500 to-violet-600',
    'Entretenimento': 'from-pink-500 to-rose-600',
    'Roupas': 'from-indigo-500 to-blue-600',
    'Investimentos': 'from-emerald-500 to-teal-600',
    'Outros': 'from-gray-500 to-slate-600'
  };

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

  // Função para calcular o valor real da transação (considerando parcelamento)
  const calcularValorReal = (transacao: Transaction) => {
    if (transacao.parcelado && transacao.totalParcelas && transacao.totalParcelas > 1) {
      return transacao.valor / transacao.totalParcelas;
    }
    return transacao.valor;
  };

  // Função para calcular recorrentes do mês
  const calcularRecorrentesDoMes = (mes: number, categoria?: string) => {
    const dataAtual = new Date();
    const mesAtual = dataAtual.getMonth() + 1;
    const anoAtual = dataAtual.getFullYear();
    
    let totalEntradas = 0;
    let totalSaidas = 0;

    if (ano >= anoAtual) {
      const recorrentesFiltradas = transacoesRecorrentes.filter(t => 
        t.ativa && (!categoria || t.categoria === categoria)
      );

      recorrentesFiltradas.forEach(recorrente => {
        let incluir = false;

        if (ano === anoAtual) {
          if (mes >= mesAtual) {
            incluir = true;
          }
        } else {
          incluir = true;
        }

        if (incluir) {
          if (recorrente.tipo === 'entrada') {
            totalEntradas += recorrente.valor;
          } else {
            totalSaidas += recorrente.valor;
          }
        }
      });
    }

    return { entradas: totalEntradas, saidas: totalSaidas };
  };

  // Gerar transações recorrentes virtuais
  const gerarTransacoesRecorrentesVirtuais = (mes: number, categoria?: string): Transaction[] => {
    const dataAtual = new Date();
    const mesAtual = dataAtual.getMonth() + 1;
    const anoAtual = dataAtual.getFullYear();
    
    const transacoesVirtuais: Transaction[] = [];

    if (ano >= anoAtual) {
      const recorrentesFiltradas = transacoesRecorrentes.filter(t => 
        t.ativa && (!categoria || t.categoria === categoria)
      );

      recorrentesFiltradas.forEach(recorrente => {
        let incluir = false;

        if (ano === anoAtual) {
          if (mes >= mesAtual) {
            incluir = true;
          }
        } else {
          incluir = true;
        }

        if (incluir) {
          const dataVencimento = new Date(ano, mes - 1, recorrente.diaVencimento);
          
          transacoesVirtuais.push({
            id: `recorrente-${recorrente.id}-${ano}-${mes}`,
            descricao: recorrente.descricao,
            valor: recorrente.valor,
            categoria: recorrente.categoria,
            data: dataVencimento.toISOString().split('T')[0],
            tipo: recorrente.tipo,
            recorrente: true,
            recorrenteId: recorrente.id
          });
        }
      });
    }

    return transacoesVirtuais;
  };

  // Função para obter dados de uma categoria específica
  const obterDadosCategoria = (categoria: CategoriaType): CategoryData => {
    const todasTransacoes: Transaction[] = [];

    // Coletar transações normais
    if (tipoVisualizacao === 'mensal') {
      // Apenas o mês selecionado
      const transacoesMes = transacoes[ano]?.[mesSelecionado];
      if (transacoesMes) {
        const transacoesCategoria = [
          ...transacoesMes.entradas.filter(t => t.categoria === categoria),
          ...transacoesMes.saidas.filter(t => t.categoria === categoria)
        ];
        todasTransacoes.push(...transacoesCategoria);

        // Adicionar recorrentes virtuais do mês
        const recorrentesVirtuais = gerarTransacoesRecorrentesVirtuais(mesSelecionado, categoria);
        todasTransacoes.push(...recorrentesVirtuais);
      }
    } else {
      // Todos os meses do ano
      for (let mes = 1; mes <= 12; mes++) {
        const transacoesMes = transacoes[ano]?.[mes];
        if (transacoesMes) {
          const transacoesCategoria = [
            ...transacoesMes.entradas.filter(t => t.categoria === categoria),
            ...transacoesMes.saidas.filter(t => t.categoria === categoria)
          ];
          todasTransacoes.push(...transacoesCategoria);
        }

        // Adicionar recorrentes virtuais de cada mês
        const recorrentesVirtuais = gerarTransacoesRecorrentesVirtuais(mes, categoria);
        todasTransacoes.push(...recorrentesVirtuais);
      }
    }

    // Calcular totais
    let totalEntradas = 0;
    let totalSaidas = 0;

    todasTransacoes.forEach(transacao => {
      const valor = calcularValorReal(transacao);
      if (transacao.tipo === 'entrada') {
        totalEntradas += valor;
      } else {
        totalSaidas += valor;
      }
    });

    return {
      categoria,
      transacoes: todasTransacoes.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime()),
      totalEntradas,
      totalSaidas,
      saldo: totalEntradas - totalSaidas,
      entradasMes: totalEntradas,
      saidasMes: totalSaidas,
      saldoMes: totalEntradas - totalSaidas
    };
  };

  // Função para formatar data
  const formatarData = (dataString: string) => {
    const data = new Date(dataString + 'T00:00:00');
    return data.toLocaleDateString('pt-BR');
  };

  // Obter dados de todas as categorias
  const dadosCategorias = categorias.map(cat => obterDadosCategoria(cat)).filter(dados => 
    dados.transacoes.length > 0 || dados.totalEntradas > 0 || dados.totalSaidas > 0
  );

  // Calcular resumo geral
  const resumoGeral = dadosCategorias.reduce((acc, cat) => ({
    totalEntradas: acc.totalEntradas + cat.totalEntradas,
    totalSaidas: acc.totalSaidas + cat.totalSaidas,
    saldo: acc.saldo + cat.saldo
  }), { totalEntradas: 0, totalSaidas: 0, saldo: 0 });

  // Função para obter top 5 maiores gastos
  const obterTop5MaioresGastos = () => {
    return dadosCategorias
      .filter(cat => cat.totalSaidas > 0)
      .sort((a, b) => b.totalSaidas - a.totalSaidas)
      .slice(0, 5);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mb-4 mx-auto animate-pulse">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <p className="text-slate-600">Carregando análise por categorias...</p>
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
              <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">Análise por Categorias</h1>
                <p className="text-sm text-slate-600">Bem-vindo, {user?.name}</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <select
                value={ano}
                onChange={(e) => setAno(parseInt(e.target.value))}
                className="px-4 py-3 rounded-xl border border-slate-300 bg-white/50 backdrop-blur-sm text-slate-900 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent hover:border-slate-400 appearance-none cursor-pointer"
              >
                {[2024, 2025, 2026, 2027].map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
              <button
                onClick={() => router.push("/dashboard")}
                className="text-sm px-4 py-3 rounded-xl bg-blue-500 text-white font-medium shadow-md hover:bg-blue-600 transition-all"
              >
                Análise Total
              </button>
              <button
                onClick={handleLogout}
                className="inline-flex items-center justify-center rounded-xl px-6 py-3 text-sm font-medium transition-all duration-200 bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 shadow-sm hover:shadow-md"
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

      {/* Controles */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div className="flex gap-2">
            <button
              onClick={() => setTipoVisualizacao('mensal')}
              className={`px-6 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${tipoVisualizacao === 'mensal' ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg' : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'}`}
            >
              Visão Mensal
            </button>
            <button
              onClick={() => setTipoVisualizacao('anual')}
              className={`px-6 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${tipoVisualizacao === 'anual' ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg' : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'}`}
            >
              Visão Anual
            </button>
          </div>

          {tipoVisualizacao === 'mensal' && (
            <select
              value={mesSelecionado}
              onChange={(e) => setMesSelecionado(parseInt(e.target.value))}
              className="px-4 py-2 rounded-xl border border-slate-300 bg-white/50 backdrop-blur-sm text-slate-900 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {meses.map((mes, index) => (
                <option key={index} value={index + 1}>{mes} {ano}</option>
              ))}
            </select>
          )}
        </div>

        {/* Resumo Geral */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6 bg-gradient-to-r from-green-500 to-emerald-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm font-medium">
                  {tipoVisualizacao === 'mensal' ? `Entradas de ${meses[mesSelecionado - 1]}` : `Total de Entradas ${ano}`}
                </p>
                <p className="text-2xl font-bold">R$ {resumoGeral.totalEntradas.toFixed(2)}</p>
              </div>
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6 bg-gradient-to-r from-red-500 to-pink-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-100 text-sm font-medium">
                  {tipoVisualizacao === 'mensal' ? `Saídas de ${meses[mesSelecionado - 1]}` : `Total de Saídas ${ano}`}
                </p>
                <p className="text-2xl font-bold">R$ {resumoGeral.totalSaidas.toFixed(2)}</p>
              </div>
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                </svg>
              </div>
            </div>
          </div>

          <div className={`bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6 ${resumoGeral.saldo >= 0 ? 'bg-gradient-to-r from-blue-500 to-blue-600' : 'bg-gradient-to-r from-orange-500 to-red-600'} text-white`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">
                  {tipoVisualizacao === 'mensal' ? `Saldo de ${meses[mesSelecionado - 1]}` : `Saldo do Ano ${ano}`}
                </p>
                <p className="text-2xl font-bold">R$ {resumoGeral.saldo.toFixed(2)}</p>
              </div>
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Top 5 Maiores Gastos */}
        {obterTop5MaioresGastos().length > 0 && (
          <div className="mb-8">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-r from-red-500 to-pink-600 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Top 5 Maiores Gastos por Categoria</h2>
                  <p className="text-sm text-slate-600">
                    {tipoVisualizacao === 'mensal' ? `${meses[mesSelecionado - 1]} ${ano}` : `Ano ${ano}`}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {obterTop5MaioresGastos().map((categoria, index) => {
                  const porcentagemDoTotal = resumoGeral.totalSaidas > 0 
                    ? (categoria.totalSaidas / resumoGeral.totalSaidas) * 100 
                    : 0;
                  
                  return (
                    <div key={categoria.categoria} className="flex items-center gap-4">
                      <div className="flex items-center justify-center w-8 h-8 bg-slate-100 rounded-lg font-bold text-slate-600">
                        {index + 1}º
                      </div>
                      
                      <div className="flex items-center gap-3 flex-1">
                        <span className="text-2xl">{categoriasIcons[categoria.categoria]}</span>
                        <div className="flex-1">
                          <h3 className="font-semibold text-slate-900">{categoria.categoria}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <div className="flex-1 bg-slate-200 rounded-full h-2">
                              <div 
                                className={`h-2 rounded-full bg-gradient-to-r ${categoriasColors[categoria.categoria]}`}
                                style={{ width: `${porcentagemDoTotal}%` }}
                              />
                            </div>
                            <span className="text-xs text-slate-500 font-medium">
                              {porcentagemDoTotal.toFixed(1)}%
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <p className="font-bold text-red-600 text-lg">
                          R$ {categoria.totalSaidas.toFixed(2)}
                        </p>
                        <p className="text-xs text-slate-500">
                          {categoria.transacoes.filter(t => t.tipo === 'saida').length} transações
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Cards das Categorias */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {dadosCategorias.map(dadosCategoria => (
            <div key={dadosCategoria.categoria} className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 transition-all duration-300 hover:shadow-xl">
              <div className={`bg-gradient-to-r ${categoriasColors[dadosCategoria.categoria]} text-white p-6 rounded-t-2xl`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{categoriasIcons[dadosCategoria.categoria]}</span>
                    <h3 className="text-xl font-bold">{dadosCategoria.categoria}</h3>
                  </div>
                  <button
                    onClick={() => setCategoriaExpandida(categoriaExpandida === dadosCategoria.categoria ? null : dadosCategoria.categoria)}
                    className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center hover:bg-white/30 transition-colors duration-200"
                  >
                    <svg 
                      className={`w-5 h-5 transform transition-transform duration-200 ${categoriaExpandida === dadosCategoria.categoria ? 'rotate-180' : ''}`} 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-white/80 text-xs font-medium">Entradas</p>
                    <p className="text-lg font-bold">R$ {dadosCategoria.totalEntradas.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-white/80 text-xs font-medium">Saídas</p>
                    <p className="text-lg font-bold">R$ {dadosCategoria.totalSaidas.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-white/80 text-xs font-medium">Saldo</p>
                    <p className="text-lg font-bold">R$ {dadosCategoria.saldo.toFixed(2)}</p>
                  </div>
                </div>
              </div>

              {categoriaExpandida === dadosCategoria.categoria && (
                <div className="p-6">
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {dadosCategoria.transacoes.length === 0 ? (
                      <div className="text-center py-8">
                        <p className="text-slate-500">Nenhuma transação encontrada</p>
                      </div>
                    ) : (
                      dadosCategoria.transacoes.map(transacao => {
                        const valorExibicao = calcularValorReal(transacao);
                        return (
                          <div key={transacao.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors duration-200">
                            <div className="flex items-center gap-3 flex-1">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${transacao.tipo === 'entrada' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                {transacao.tipo === 'entrada' ? '+' : '-'}
                              </div>
                              
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <p className="font-medium text-slate-900 text-sm">{transacao.descricao}</p>
                                  {transacao.parcelado && (
                                    <span className="px-2 py-1 bg-orange-100 text-orange-600 text-xs rounded-full">
                                      {transacao.parcelaAtual}/{transacao.totalParcelas}
                                    </span>
                                  )}
                                  {transacao.recorrente && (
                                    <span className="px-2 py-1 bg-purple-100 text-purple-600 text-xs rounded-full">
                                      Recorrente
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-slate-600">{formatarData(transacao.data)}</p>
                              </div>
                            </div>

                            <span className={`font-bold text-sm ${transacao.tipo === 'entrada' ? 'text-green-600' : 'text-red-600'}`}>
                              {transacao.tipo === 'entrada' ? '+' : '-'}R$ {valorExibicao.toFixed(2)}
                            </span>
                          </div>
                        );
                      })
                    )}
                  </div>

                  <div className="mt-4 pt-4 border-t border-slate-200">
                    <p className="text-sm text-slate-600 text-center">
                      {dadosCategoria.transacoes.length} transaç{dadosCategoria.transacoes.length !== 1 ? 'ões' : 'ão'} 
                      {tipoVisualizacao === 'mensal' ? ` em ${meses[mesSelecionado - 1]}` : ` no ano de ${ano}`}
                    </p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {dadosCategorias.length === 0 && (
          <div className="text-center py-20">
            <svg className="w-20 h-20 text-slate-300 mx-auto mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <h3 className="text-xl font-semibold text-slate-500 mb-2">Nenhuma transação encontrada</h3>
            <p className="text-slate-400">
              {tipoVisualizacao === 'mensal' 
                ? `Não há transações registradas para ${meses[mesSelecionado - 1]} de ${ano}`
                : `Não há transações registradas para o ano de ${ano}`
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CategoryAnalysis;