
'use client';

import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, AreaChart, Area } from 'recharts';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';

// Types
type CategoriaType = 'Alimentação' | 'Transporte' | 'Moradia' | 'Saúde' | 'Educação' | 'Entretenimento' | 'Roupas' | 'Investimentos' | 'Outros';

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

interface DadosMensais {
  mes: string;
  mesNumero: number;
  entradas: number;
  saidas: number;
  saldo: number;
  [categoria: string]: any;
}

const TemporalAnalysis = () => {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [anoSelecionado, setAnoSelecionado] = useState(new Date().getFullYear());
  const [categoriaSelecionada, setCategoriaSelecionada] = useState('Alimentação');
  const [tipoAnalise, setTipoAnalise] = useState('mes-a-mes');
  const [tipoVisualizacao, setTipoVisualizacao] = useState('entradas-saidas');
  const [loading, setLoading] = useState(true);
  const [transacoes, setTransacoes] = useState<TransactionsByYear>({});
  const [transacoesRecorrentes, setTransacoesRecorrentes] = useState<RecurringTransaction[]>([]);
  const [dadosMensaisAtual, setDadosMensaisAtual] = useState<DadosMensais[]>([]);
  const [dadosMensaisComparacao, setDadosMensaisComparacao] = useState<DadosMensais[]>([]);

  const categorias = [
    { key: 'Alimentação', label: 'Alimentação', icon: '🍽️', color: '#f97316' },
    { key: 'Transporte', label: 'Transporte', icon: '🚗', color: '#3b82f6' },
    { key: 'Moradia', label: 'Moradia', icon: '🏠', color: '#10b981' },
    { key: 'Saúde', label: 'Saúde', icon: '⚕️', color: '#ef4444' },
    { key: 'Educação', label: 'Educação', icon: '📚', color: '#8b5cf6' },
    { key: 'Entretenimento', label: 'Entretenimento', icon: '🎮', color: '#ec4899' },
    { key: 'Roupas', label: 'Roupas', icon: '👕', color: '#6366f1' },
    { key: 'Investimentos', label: 'Investimentos', icon: '💰', color: '#059669' },
    { key: 'Outros', label: 'Outros', icon: '📦', color: '#64748b' },
  ];

  const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (!token || !userData) {
      router.push('/login');
      return;
    }

    setUser(JSON.parse(userData));
    loadData();
  }, [anoSelecionado]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Carregar dados do ano selecionado
      const [transacoesRes, recorrentesRes] = await Promise.all([
        api.get(`/transactions?ano=${anoSelecionado}`),
        api.get('/recurring-transactions')
      ]);
      
      // Carregar dados do ano anterior para comparação
      const anoComparacao = anoSelecionado - 1;
      let transacoesComparacaoRes = null;
      try {
        transacoesComparacaoRes = await api.get(`/transactions?ano=${anoComparacao}`);
      } catch (error) {
        console.log('Dados do ano de comparação não encontrados');
      }
      
      setTransacoes(transacoesRes.data);
      setTransacoesRecorrentes(recorrentesRes.data);
      
      // Processar dados mensais
      const dadosAtual = processarDadosMensais(transacoesRes.data, recorrentesRes.data, anoSelecionado);
      const dadosComparacao = transacoesComparacaoRes ? 
        processarDadosMensais(transacoesComparacaoRes.data, recorrentesRes.data, anoComparacao) : 
        [];
      
      setDadosMensaisAtual(dadosAtual);
      setDadosMensaisComparacao(dadosComparacao);
      
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  // Função para calcular o valor real da transação (considerando parcelamento)
  const calcularValorReal = (transacao: Transaction) => {
    if (transacao.parcelado && transacao.totalParcelas && transacao.totalParcelas > 1) {
      return transacao.valor / transacao.totalParcelas;
    }
    return transacao.valor;
  };

  // Processar dados mensais
  const processarDadosMensais = (transacoesDados: TransactionsByYear, recorrentes: RecurringTransaction[], ano: number): DadosMensais[] => {
    const dadosMensais: DadosMensais[] = [];
    
    for (let mes = 1; mes <= 12; mes++) {
      const transacoesMes = transacoesDados[ano]?.[mes];
      
      let totalEntradas = 0;
      let totalSaidas = 0;
      const categoriasTotais: { [key: string]: number } = {};
      
      // Inicializar categorias
      categorias.forEach(cat => {
        categoriasTotais[cat.key] = 0;
      });
      
      // Processar transações normais
      if (transacoesMes) {
        [...transacoesMes.entradas, ...transacoesMes.saidas].forEach(transacao => {
          const valor = calcularValorReal(transacao);
          
          if (transacao.tipo === 'entrada') {
            totalEntradas += valor;
          } else {
            totalSaidas += valor;
            categoriasTotais[transacao.categoria] = (categoriasTotais[transacao.categoria] || 0) + valor;
          }
        });
      }
      
      // Processar transações recorrentes
      const dataAtual = new Date();
      const mesAtual = dataAtual.getMonth() + 1;
      const anoAtual = dataAtual.getFullYear();
      
      if (ano >= anoAtual) {
        recorrentes.filter(r => r.ativa).forEach(recorrente => {
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
              categoriasTotais[recorrente.categoria] = (categoriasTotais[recorrente.categoria] || 0) + recorrente.valor;
            }
          }
        });
      }
      
      dadosMensais.push({
        mes: meses[mes - 1],
        mesNumero: mes,
        entradas: totalEntradas,
        saidas: totalSaidas,
        saldo: totalEntradas - totalSaidas,
        ...categoriasTotais
      });
    }
    
    return dadosMensais;
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/');
  };

  // Calcular tendências
  const calcularTendencia = (dados: DadosMensais[], campo: string) => {
    if (dados.length < 2) return { tendencia: 'estavel', percentual: 0 };
    
    // Pegar primeiros e últimos 3 meses para suavizar
    const primeirosValores = dados.slice(0, 3).reduce((acc, item) => acc + item[campo], 0) / 3;
    const ultimosValores = dados.slice(-3).reduce((acc, item) => acc + item[campo], 0) / 3;
    
    const percentual = primeirosValores > 0 ? ((ultimosValores - primeirosValores) / primeirosValores) * 100 : 0;
    
    if (percentual > 5) return { tendencia: 'crescente', percentual };
    if (percentual < -5) return { tendencia: 'decrescente', percentual };
    return { tendencia: 'estavel', percentual };
  };

  // Identificar padrões sazonais
  const identificarSazonalidade = (dados: DadosMensais[], campo: string) => {
    const valores = dados.map(item => item[campo] || 0);
    const media = valores.reduce((acc, val) => acc + val, 0) / valores.length;
    
    const padroes = dados.map((item, index) => ({
      mes: item.mes,
      valor: item[campo] || 0,
      desvio: media > 0 ? (((item[campo] || 0) - media) / media) * 100 : 0
    }));

    const maioresGastos = padroes
      .sort((a, b) => b.desvio - a.desvio)
      .slice(0, 3)
      .map(p => p.mes);

    const menoresGastos = padroes
      .sort((a, b) => a.desvio - b.desvio)
      .slice(0, 3)
      .map(p => p.mes);

    return { maioresGastos, menoresGastos, padroes };
  };

  // Preparar dados para comparação ano a ano
  const dadosComparacaoAnual = dadosMensaisAtual.map((item, index) => {
    const itemComparacao = dadosMensaisComparacao[index] || {};
    return {
      ...item,
      [`entradas${anoSelecionado}`]: item.entradas,
      [`saidas${anoSelecionado}`]: item.saidas,
      [`${categoriaSelecionada}${anoSelecionado}`]: item[categoriaSelecionada] || 0,
      [`entradas${anoSelecionado - 1}`]: itemComparacao.entradas || 0,
      [`saidas${anoSelecionado - 1}`]: itemComparacao.saidas || 0,
      [`${categoriaSelecionada}${anoSelecionado - 1}`]: itemComparacao[categoriaSelecionada] || 0,
    };
  });

  const tendenciaEntradas = calcularTendencia(dadosMensaisAtual, 'entradas');
  const tendenciaSaidas = calcularTendencia(dadosMensaisAtual, 'saidas');
  const sazonalidadeCategoria = identificarSazonalidade(dadosMensaisAtual, categoriaSelecionada);

  const renderGraficoMesAMes = () => (
    <ResponsiveContainer width="100%" height={400}>
      <LineChart data={dadosMensaisAtual}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis 
          dataKey="mes" 
          stroke="#64748b"
          fontSize={12}
        />
        <YAxis 
          stroke="#64748b"
          fontSize={12}
          tickFormatter={(value) => `R$ ${typeof value === 'number' ? value.toFixed(0) : value}`}
        />
        <Tooltip 
          formatter={(value, name) => [`R$ ${typeof value === 'number' ? value.toFixed(2) : value}`, name]}
          labelStyle={{ color: '#1e293b' }}
          contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', border: 'none', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
        />
        <Legend />
        {tipoVisualizacao === 'entradas-saidas' && (
          <>
            <Line type="monotone" dataKey="entradas" stroke="#10b981" strokeWidth={3} dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }} name="Entradas" />
            <Line type="monotone" dataKey="saidas" stroke="#ef4444" strokeWidth={3} dot={{ fill: '#ef4444', strokeWidth: 2, r: 4 }} name="Saídas" />
          </>
        )}
        {tipoVisualizacao === 'categoria' && (
          <Line 
            type="monotone" 
            dataKey={categoriaSelecionada} 
            stroke={categorias.find(cat => cat.key === categoriaSelecionada)?.color || '#6366f1'} 
            strokeWidth={3} 
            dot={{ fill: categorias.find(cat => cat.key === categoriaSelecionada)?.color || '#6366f1', strokeWidth: 2, r: 4 }} 
            name={categorias.find(cat => cat.key === categoriaSelecionada)?.label || 'Categoria'}
          />
        )}
      </LineChart>
    </ResponsiveContainer>
  );

  const renderGraficoAnoAAno = () => (
    <ResponsiveContainer width="100%" height={400}>
      <BarChart data={dadosComparacaoAnual}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis 
          dataKey="mes" 
          stroke="#64748b"
          fontSize={12}
        />
        <YAxis 
          stroke="#64748b"
          fontSize={12}
          tickFormatter={(value) => `R$ ${typeof value === 'number' ? value.toFixed(0) : value}`}
        />
        <Tooltip 
          formatter={(value, name) => [`R$ ${typeof value === 'number' ? value.toFixed(2) : value}`, name]}
          labelStyle={{ color: '#1e293b' }}
          contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', border: 'none', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
        />
        <Legend />
        {tipoVisualizacao === 'entradas-saidas' && (
          <>
            <Bar dataKey={`entradas${anoSelecionado}`} fill="#10b981" name={`Entradas ${anoSelecionado}`} radius={[2, 2, 0, 0]} />
            <Bar dataKey={`entradas${anoSelecionado - 1}`} fill="#34d399" name={`Entradas ${anoSelecionado - 1}`} radius={[2, 2, 0, 0]} />
          </>
        )}
        {tipoVisualizacao === 'categoria' && (
          <>
            <Bar 
              dataKey={`${categoriaSelecionada}${anoSelecionado}`} 
              fill={categorias.find(cat => cat.key === categoriaSelecionada)?.color || '#6366f1'} 
              name={`${categorias.find(cat => cat.key === categoriaSelecionada)?.label} ${anoSelecionado}`}
              radius={[2, 2, 0, 0]}
            />
            <Bar 
              dataKey={`${categoriaSelecionada}${anoSelecionado - 1}`} 
              fill={`${categorias.find(cat => cat.key === categoriaSelecionada)?.color}80` || '#6366f180'} 
              name={`${categorias.find(cat => cat.key === categoriaSelecionada)?.label} ${anoSelecionado - 1}`}
              radius={[2, 2, 0, 0]}
            />
          </>
        )}
      </BarChart>
    </ResponsiveContainer>
  );

  const renderGraficoSazonalidade = () => (
    <ResponsiveContainer width="100%" height={400}>
      <AreaChart data={sazonalidadeCategoria.padroes}>
        <defs>
          <linearGradient id="colorDesvio" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
            <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.1}/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis 
          dataKey="mes" 
          stroke="#64748b"
          fontSize={12}
        />
        <YAxis 
          stroke="#64748b"
          fontSize={12}
          tickFormatter={(value) => `${typeof value === 'number' ? value.toFixed(0) : value}%`}
        />
        <Tooltip 
          formatter={(value) => [`${typeof value === 'number' ? value.toFixed(1) : value}%`, 'Desvio da Média']}
          labelStyle={{ color: '#1e293b' }}
          contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', border: 'none', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
        />
        <Area 
          type="monotone" 
          dataKey="desvio" 
          stroke="#8b5cf6" 
          strokeWidth={2}
          fillOpacity={1} 
          fill="url(#colorDesvio)" 
        />
      </AreaChart>
    </ResponsiveContainer>
  );

  const renderGrafico = () => {
    switch (tipoAnalise) {
      case 'mes-a-mes':
        return renderGraficoMesAMes();
      case 'ano-a-ano':
        return renderGraficoAnoAAno();
      case 'sazonalidade':
        return renderGraficoSazonalidade();
      default:
        return renderGraficoMesAMes();
    }
  };

  const getTendenciaIcon = (tendencia: string) => {
    switch (tendencia) {
      case 'crescente':
        return { icon: '📈', color: 'text-green-600', bg: 'bg-green-100' };
      case 'decrescente':
        return { icon: '📉', color: 'text-red-600', bg: 'bg-red-100' };
      default:
        return { icon: '➡️', color: 'text-blue-600', bg: 'bg-blue-100' };
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center mb-4 mx-auto animate-pulse">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
          <p className="text-slate-600">Carregando análise temporal...</p>
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
              <div className="w-10 h-10 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">Análise Temporal</h1>
                <p className="text-sm text-slate-600">Bem-vindo, {user?.name}</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push("/dashboard")}
                className="text-sm px-4 py-3 rounded-xl bg-blue-500 text-white font-medium shadow-md hover:bg-blue-600 transition-all"
              >
                Análise Total
              </button>
              <button
                onClick={() => router.push("/categorys")}
                className="text-sm px-4 py-3 rounded-xl bg-purple-500 text-white font-medium shadow-md hover:bg-purple-600 transition-all"
              >
                Categorias
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Controles */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Tipo de Análise */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Tipo de Análise</label>
              <select
                value={tipoAnalise}
                onChange={(e) => setTipoAnalise(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-white/50 backdrop-blur-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="mes-a-mes">Mês a Mês</option>
                <option value="ano-a-ano">Ano a Ano</option>
                <option value="sazonalidade">Sazonalidade</option>
              </select>
            </div>

            {/* Ano */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Ano</label>
              <select
                value={anoSelecionado}
                onChange={(e) => setAnoSelecionado(parseInt(e.target.value))}
                className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-white/50 backdrop-blur-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {[2024, 2025, 2026, 2027].map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>

            {/* Tipo de Visualização */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Visualizar</label>
              <select
                value={tipoVisualizacao}
                onChange={(e) => setTipoVisualizacao(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-white/50 backdrop-blur-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="entradas-saidas">Entradas & Saídas</option>
                <option value="categoria">Por Categoria</option>
              </select>
            </div>

            {/* Categoria (quando aplicável) */}
            {tipoVisualizacao === 'categoria' && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Categoria</label>
                <select
                  value={categoriaSelecionada}
                  onChange={(e) => setCategoriaSelecionada(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-white/50 backdrop-blur-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {categorias.map(categoria => (
                    <option key={categoria.key} value={categoria.key}>
                      {categoria.icon} {categoria.label}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Cards de Tendência */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900">Tendência de Entradas</h3>
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${getTendenciaIcon(tendenciaEntradas.tendencia).bg}`}>
                <span className="text-xl">{getTendenciaIcon(tendenciaEntradas.tendencia).icon}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-2xl font-bold ${getTendenciaIcon(tendenciaEntradas.tendencia).color}`}>
                {tendenciaEntradas.percentual > 0 ? '+' : ''}{tendenciaEntradas.percentual.toFixed(1)}%
              </span>
              <span className="text-slate-600">em {anoSelecionado}</span>
            </div>
            <p className="text-sm text-slate-500 mt-2">
              {tendenciaSaidas.tendencia === 'crescente' && 'Seus gastos estão aumentando'}
              {tendenciaSaidas.tendencia === 'decrescente' && 'Seus gastos estão diminuindo!'}
              {tendenciaSaidas.tendencia === 'estavel' && 'Seus gastos estão estáveis'}
            </p>
          </div>
        </div>

        {/* Gráfico Principal */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                {tipoAnalise === 'mes-a-mes' && `Evolução ${tipoVisualizacao === 'categoria' ? `- ${categorias.find(cat => cat.key === categoriaSelecionada)?.label}` : ''}`}
                {tipoAnalise === 'ano-a-ano' && `Comparação ${anoSelecionado} vs ${anoSelecionado - 1}`}
                {tipoAnalise === 'sazonalidade' && `Padrão Sazonal - ${categorias.find(cat => cat.key === categoriaSelecionada)?.label}`}
              </h2>
              <p className="text-sm text-slate-600">
                {tipoAnalise === 'mes-a-mes' && `Acompanhe a evolução ao longo de ${anoSelecionado}`}
                {tipoAnalise === 'ano-a-ano' && 'Compare o desempenho entre anos'}
                {tipoAnalise === 'sazonalidade' && 'Identifique padrões sazonais nos seus gastos'}
              </p>
            </div>
            
            {tipoAnalise === 'sazonalidade' && tipoVisualizacao === 'categoria' && (
              <div className="flex items-center gap-4">
                <span className={`text-2xl`}>
                  {categorias.find(cat => cat.key === categoriaSelecionada)?.icon}
                </span>
              </div>
            )}
          </div>

          {renderGrafico()}
        </div>

        {/* Insights de Sazonalidade */}
        {tipoAnalise === 'sazonalidade' && tipoVisualizacao === 'categoria' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                  <span className="text-xl">🔥</span>
                </div>
                <h3 className="text-lg font-semibold text-slate-900">Picos de Gastos</h3>
              </div>
              <div className="space-y-2">
                {sazonalidadeCategoria.maioresGastos.map(mes => (
                  <div key={mes} className="flex items-center justify-between p-3 bg-red-50 rounded-xl">
                    <span className="font-medium text-red-900">{mes}</span>
                    <span className="text-red-600 text-sm">Alto consumo</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                  <span className="text-xl">💰</span>
                </div>
                <h3 className="text-lg font-semibold text-slate-900">Meses Econômicos</h3>
              </div>
              <div className="space-y-2">
                {sazonalidadeCategoria.menoresGastos.map(mes => (
                  <div key={mes} className="flex items-center justify-between p-3 bg-green-50 rounded-xl">
                    <span className="font-medium text-green-900">{mes}</span>
                    <span className="text-green-600 text-sm">Baixo consumo</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Estado vazio */}
        {dadosMensaisAtual.length === 0 && (
          <div className="text-center py-20">
            <svg className="w-20 h-20 text-slate-300 mx-auto mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            <h3 className="text-xl font-semibold text-slate-500 mb-2">Nenhum dado encontrado</h3>
            <p className="text-slate-400">
              Não há transações registradas para o ano de {anoSelecionado}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TemporalAnalysis