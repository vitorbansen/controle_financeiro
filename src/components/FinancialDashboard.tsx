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
  const [mesSelecionado, setMesSelecionado] = useState(new Date().getMonth() + 1);
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

  // CORREÇÃO 1: Função específica para remover transações recorrentes
  const removerTransacaoRecorrente = async (id: string) => {
    try {
      await api.delete(`/recurring-transactions/${id}`);
      loadData();
    } catch (error) {
      console.error('Erro ao remover transação recorrente:', error);
    }
  };

  // CORREÇÃO 2: Função para calcular o valor real da transação (considerando parcelamento)
  const calcularValorReal = (transacao: Transaction) => {
    if (transacao.parcelado && transacao.totalParcelas && transacao.totalParcelas > 1) {
      return transacao.valor / transacao.totalParcelas;
    }
    return transacao.valor;
  };

  // NOVA FUNÇÃO: Calcular valores das transações recorrentes para um mês específico
  const calcularRecorrentesDoMes = (mes: number) => {
    const dataAtual = new Date();
    const mesAtual = dataAtual.getMonth() + 1;
    const anoAtual = dataAtual.getFullYear();
    
    let totalEntradas = 0;
    let totalSaidas = 0;

    // Só incluir recorrentes se o mês for atual ou futuro
    if (ano > anoAtual || (ano === anoAtual && mes >= mesAtual)) {
      transacoesRecorrentes.filter(t => t.ativa).forEach(recorrente => {
        // Se for o mês atual, só incluir se o dia ainda não passou
        if (ano === anoAtual && mes === mesAtual) {
          const diaAtual = dataAtual.getDate();
          if (recorrente.diaVencimento >= diaAtual) {
            if (recorrente.tipo === 'entrada') {
              totalEntradas += recorrente.valor;
            } else {
              totalSaidas += recorrente.valor;
            }
          }
        } else {
          // Para meses futuros, incluir todas as recorrentes
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

  const calcularResumoMes = (mes: number) => {
    const transacoesMes = transacoes[ano]?.[mes];
    let entradas = 0;
    let saidas = 0;

    if (transacoesMes) {
      entradas = transacoesMes.entradas.reduce((sum, t) => {
        return sum + calcularValorReal(t);
      }, 0);
      
      saidas = transacoesMes.saidas.reduce((sum, t) => {
        return sum + calcularValorReal(t);
      }, 0);
    }

    // Incluir transações recorrentes
    const recorrentes = calcularRecorrentesDoMes(mes);
    entradas += recorrentes.entradas;
    saidas += recorrentes.saidas;
    
    return { entradas, saidas, saldo: entradas - saidas };
  };

  const calcularResumoAno = () => {
    let totalEntradas = 0;
    let totalSaidas = 0;

    // Calcular transações normais
    Object.values(transacoes[ano] || {}).forEach(mes => {
      totalEntradas += mes.entradas.reduce((sum, t) => {
        return sum + calcularValorReal(t);
      }, 0);
      
      totalSaidas += mes.saidas.reduce((sum, t) => {
        return sum + calcularValorReal(t);
      }, 0);
    });

    // Incluir transações recorrentes para todos os meses
    for (let mes = 1; mes <= 12; mes++) {
      const recorrentes = calcularRecorrentesDoMes(mes);
      totalEntradas += recorrentes.entradas;
      totalSaidas += recorrentes.saidas;
    }

    return {
      entradas: totalEntradas,
      saidas: totalSaidas,
      saldo: totalEntradas - totalSaidas
    };
  };

  // CORREÇÃO: Função para formatar data corrigindo o problema do UTC
  const formatarData = (dataString: string) => {
    const data = new Date(dataString + 'T00:00:00'); // Força horário local
    return data.toLocaleDateString('pt-BR');
  };

  const renderFormularioTransacao = (contexto: 'principal' | 'mensal') => (
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

      {/* Seção de Parcelamento */}
      <div className="border-t border-slate-200 pt-6">
        <div className="flex items-center gap-3 mb-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={novaTransacao.parcelado}
              onChange={(e) => setNovaTransacao({
                ...novaTransacao, 
                parcelado: e.target.checked,
                totalParcelas: e.target.checked ? novaTransacao.totalParcelas : 1
              })}
              className="w-5 h-5 text-blue-600 bg-white border-2 border-slate-300 rounded focus:ring-blue-500 focus:ring-2 transition-all duration-200"
            />
            <span className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              Transação Parcelada
            </span>
          </label>
        </div>

        {novaTransacao.parcelado && (
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Número de Parcelas
                </label>
                <input
                  type="number"
                  min="2"
                  max="48"
                  value={novaTransacao.totalParcelas}
                  onChange={(e) => setNovaTransacao({
                    ...novaTransacao, 
                    totalParcelas: parseInt(e.target.value) || 1
                  })}
                  className="w-full px-4 py-3 rounded-xl border border-orange-300 bg-white text-slate-900 placeholder-slate-500 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Ex: 12"
                />
              </div>
              
              <div className="flex items-center">
                <div className="bg-white rounded-xl p-3 border border-orange-200">
                  <p className="text-sm text-slate-600 mb-1">Valor por parcela:</p>
                  <p className="text-lg font-bold text-slate-900">
                    R$ {novaTransacao.valor ? (parseFloat(novaTransacao.valor) / novaTransacao.totalParcelas).toFixed(2) : '0,00'}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="mt-3 p-3 bg-orange-100 rounded-lg">
              <p className="text-sm text-orange-800 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                As parcelas serão distribuídas automaticamente nos próximos {novaTransacao.totalParcelas} meses a partir da data selecionada.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderResumoMensal = () => {
    const transacoesMes = transacoes[ano]?.[mesSelecionado];
    const resumo = calcularResumoMes(mesSelecionado);
    
    // Combinar e ordenar todas as transações por data
    const todasTransacoes: (Transaction & { tipoTransacao: 'entrada' | 'saida' })[] = [];
    
    if (transacoesMes) {
      transacoesMes.entradas.forEach(t => todasTransacoes.push({...t, tipoTransacao: 'entrada'}));
      transacoesMes.saidas.forEach(t => todasTransacoes.push({...t, tipoTransacao: 'saida'}));
    }
    
    todasTransacoes.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());

    return (
      <div className="space-y-8">
        {/* Seletor de mês */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6 transition-all duration-300 hover:shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-slate-900 flex items-center gap-3">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Resumo Detalhado
            </h3>
            
            <select
              value={mesSelecionado}
              onChange={(e) => setMesSelecionado(parseInt(e.target.value))}
              className="px-4 py-2 rounded-xl border border-slate-300 bg-white/50 backdrop-blur-sm text-slate-900 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {meses.map((mes, index) => (
                <option key={index} value={index + 1}>{mes} {ano}</option>
              ))}
            </select>
          </div>
   
          {/* Cards de resumo */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm font-medium">Entradas</p>
                  <p className="text-xl font-bold">R$ {resumo.entradas.toFixed(2)}</p>
                </div>
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-red-500 to-pink-600 text-white rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-red-100 text-sm font-medium">Saídas</p>
                  <p className="text-xl font-bold">R$ {resumo.saidas.toFixed(2)}</p>
                </div>
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                  </svg>
                </div>
              </div>
            </div>

            <div className={`text-white rounded-xl p-4 ${resumo.saldo >= 0 ? 'bg-gradient-to-r from-blue-500 to-blue-600' : 'bg-gradient-to-r from-orange-500 to-red-600'}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium">Saldo</p>
                  <p className="text-xl font-bold">R$ {resumo.saldo.toFixed(2)}</p>
                </div>
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Formulário de nova transação */}
        {renderFormularioTransacao('mensal')}

        {/* Lista de transações */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6 transition-all duration-300 hover:shadow-xl">
          <div className="border-b border-slate-200 pb-4 mb-6">
            <h3 className="text-xl font-semibold text-slate-900 flex items-center gap-3">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
              Transações de {meses[mesSelecionado - 1]} {ano}
            </h3>
            <p className="text-sm text-slate-600 mt-1">
              Total: {todasTransacoes.length} transaç{todasTransacoes.length !== 1 ? 'ões' : 'ões'}
            </p>
          </div>

          <div className="space-y-3">
            {todasTransacoes.length === 0 ? (
              <div className="text-center py-12">
                <svg className="w-16 h-16 text-slate-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-slate-500 text-lg">Nenhuma transação encontrada</p>
                <p className="text-slate-400 text-sm">As transações deste mês aparecerão aqui</p>
              </div>
            ) : (
              todasTransacoes.map(transacao => {
                // CORREÇÃO 3: Calcular o valor real para exibição no card
                const valorExibicao = calcularValorReal(transacao);
                
                return (
                  <div key={transacao.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors duration-200 border-l-4 border-l-transparent hover:border-l-blue-400">
                    <div className="flex items-center gap-4 flex-1">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${transacao.tipoTransacao === 'entrada' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                        {transacao.tipoTransacao === 'entrada' ? (
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                          </svg>
                        ) : (
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                          </svg>
                        )}
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-slate-900">{transacao.descricao}</h4>
                          {transacao.parcelado && (
                            <span className="px-2 py-1 bg-orange-100 text-orange-600 text-xs rounded-full font-medium flex items-center gap-1">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                              </svg>
                              {transacao.parcelaAtual}/{transacao.totalParcelas}
                            </span>
                          )}
                          {transacao.recorrente && (
                            <span className="px-2 py-1 bg-purple-100 text-purple-600 text-xs rounded-full font-medium flex items-center gap-1">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                              </svg>
                              Recorrente
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-slate-600">
                          <span className="flex items-center gap-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            {formatarData(transacao.data)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <span className={`font-bold text-lg ${transacao.tipoTransacao === 'entrada' ? 'text-green-600' : 'text-red-600'}`}>
                        {transacao.tipoTransacao === 'entrada' ? '+' : '-'}R$ {valorExibicao.toFixed(2)}
                      </span>
                      <button
                        onClick={() => removerTransacao(transacao.id)}
                        className="text-red-500 hover:text-red-700 p-2 rounded-lg hover:bg-red-50 transition-colors duration-200"
                        title="Remover transação"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    );
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
        {renderFormularioTransacao('principal')}

        {/* Resumo Anual  */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6 transition-all duration-300 hover:shadow-xl">
          <div className="border-b border-slate-200 pb-4 mb-6">
            <h3 className="text-xl font-semibold text-slate-900 flex items-center gap-3">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Resumo Anual - {ano}
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
                  onClick={() => removerTransacaoRecorrente(transacao.id)}
                  className="text-red-500 hover:text-red-700 p-2 rounded-lg hover:bg-red-50 transition-colors duration-200"
                  title="Remover transação recorrente"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
          
          {transacoesRecorrentes.filter(t => t.ativa).length === 0 && (
            <div className="text-center py-12">
              <svg className="w-16 h-16 text-slate-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <p className="text-slate-500 text-lg">Nenhuma transação recorrente ativa</p>
              <p className="text-slate-400 text-sm">Crie uma nova transação recorrente acima</p>
            </div>
          )}
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
                {[2024, 2025, 2026, 2027].map(year => (
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
            onClick={() => setAbaSelecionada('resumo-mensal')}
            className={`px-6 py-3 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer ${abaSelecionada === 'resumo-mensal' ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg' : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'}`}
          >
            <svg className="w-5 h-5 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Resumo Mensal
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
        {abaSelecionada === 'resumo-mensal' && renderResumoMensal()}
        {abaSelecionada === 'recorrentes' && renderRecorrentes()}
      </main>
    </div>
  );
};

export default FinancialDashboard;