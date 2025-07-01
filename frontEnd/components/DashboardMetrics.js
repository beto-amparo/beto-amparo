import React, { useEffect, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler,
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler
);

const Index = ({ slug }) => {
  const slugLoja = slug;
  const [ticketData, setTicketData] = useState({ labels: [], daily: [] });
  const [metrics, setMetrics] = useState({
    totalSales: 0,
    totalRevenue: '0',
    averageTicket: '0',
    cancellationRate: '0'
  });
  const [topProducts, setTopProducts] = useState([]);
  const [cancelPercent, setCancelPercent] = useState(0);
  const [dataATT, setDataATT] = useState('');
  
  const [dateFilter, setDateFilter] = useState('7d');
  const [currentPeriod, setCurrentPeriod] = useState(0);
  const [originalData, setOriginalData] = useState(null);

  const getDateRangeQuery = () => {
    if (dateFilter === 'all') return '';
  
    const days = parseInt(dateFilter);
    const today = new Date();
    const periodStart = new Date(today.getTime() - ((days * (currentPeriod + 1)) * 24 * 60 * 60 * 1000));
    const periodEnd = new Date(today.getTime() - ((days * currentPeriod) * 24 * 60 * 60 * 1000));
  
    const formatDate = d => d.toISOString().split('T')[0];
    return `?start=${formatDate(periodStart)}&end=${formatDate(periodEnd)}`;
  };

  const fetchData = () => {
    const query = getDateRangeQuery();
    const apiUrl = process.env.NEXT_PUBLIC_EMPRESA_API;
  
    fetch(`${apiUrl}/empresa/insights/${slugLoja}${query}`, {
      credentials: 'include' 
    })
      .then(res => res.json())
      .then(data => {
        setOriginalData(data);
        applyFilters(data);
        setDataATT(new Date().toLocaleTimeString('pt-BR'));
      })
      .catch(error => {
        console.error('Error fetching data:', error);
      });
  };

  useEffect(() => {
    fetchData();
  }, [dateFilter, currentPeriod, slugLoja]);

  useEffect(() => {
    if (originalData) {
      applyFilters(originalData);
    }
  }, [dateFilter, currentPeriod]);

  const applyFilters = (data) => {
    if (!data || !data.ticketPorData) return;

    let filteredData = { ...data };

    if (dateFilter !== 'all') {
      const days = parseInt(dateFilter);
      const today = new Date();
      
      const periodStart = new Date(today.getTime() - ((days * (currentPeriod + 1)) * 24 * 60 * 60 * 1000));
      const periodEnd = new Date(today.getTime() - ((days * currentPeriod) * 24 * 60 * 60 * 1000));
      
      const filteredTickets = Object.keys(data.ticketPorData)
        .filter(dateKey => {
          const date = new Date(dateKey);
          return date >= periodStart && date < periodEnd;
        })
        .reduce((obj, key) => {
          obj[key] = data.ticketPorData[key];
          return obj;
        }, {});
      
      filteredData.ticketPorData = filteredTickets;
    }

    const labels = Object.keys(filteredData.ticketPorData);
    const daily = labels.map(key => filteredData.ticketPorData[key]?.totalReceita || 0);

    setTicketData({ labels, daily });

    const receitaTotal = Object.values(filteredData.ticketPorData).reduce((acc, cur) => acc + (cur?.totalReceita || 0), 0);
    const quantidadeTotal = Object.values(filteredData.ticketPorData).reduce((acc, cur) => acc + (cur?.totalQuantidade || 0), 0);
    const averageTicket = quantidadeTotal > 0 ? receitaTotal / quantidadeTotal : 0;
    
    setMetrics({
      totalSales: quantidadeTotal,
      totalRevenue: receitaTotal.toFixed(2),
      averageTicket: averageTicket.toFixed(2),
      cancellationRate: data.pedidosCancelados === 0 ? '0' : ((data.pedidosCancelados / data.totalPedidos) * 100).toFixed(1),
    });

    const produtos = (data.top5Produtos || []).map(produto => ({
      name: produto.nome,
      sales: produto.quantidade,
      revenue: (produto.preco || 1) * produto.quantidade,
    }));
    
    setTopProducts(produtos);
    setCancelPercent(data.pedidosCancelados === 0 ? 0 : parseFloat(((data.pedidosCancelados / data.totalPedidos) * 100).toFixed(1)));
  };

  const resetFilters = () => {
    setDateFilter('7d');
    setCurrentPeriod(0);
  };

  const getPeriodLabel = () => {
    if (currentPeriod === 0) return 'Período Atual';
    if (currentPeriod === 1) return 'Período Anterior';
    return `${currentPeriod + 1} períodos atrás`;
  };

  const navigatePeriod = (direction) => {
    if (direction === 'prev') {
      setCurrentPeriod(prev => prev + 1);
    } else if (direction === 'next' && currentPeriod > 0) {
      setCurrentPeriod(prev => prev - 1);
    }
  };

  const enhancedDailySalesConfig = {
    labels: ticketData.labels || [],
    datasets: [
      {
        label: 'Vendas (R$)',
        data: ticketData.daily || [],
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
        fill: true,
        pointBackgroundColor: 'rgb(59, 130, 246)',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 6,
        pointHoverRadius: 8,
        borderWidth: 3,
      },
    ],
  };

  const topProductsConfig = {
    labels: topProducts.map(p => p.name),
    datasets: [
      {
        label: 'Unidades Vendidas',
        data: topProducts.map(p => p.sales),
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',
          'rgba(16, 185, 129, 0.8)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(239, 68, 68, 0.8)',
          'rgba(139, 92, 246, 0.8)',
        ],
        borderColor: [
          'rgb(59, 130, 246)',
          'rgb(16, 185, 129)',
          'rgb(245, 158, 11)',
          'rgb(239, 68, 68)',
          'rgb(139, 92, 246)',
        ],
        borderWidth: 2,
      },
    ],
  };

  const cancellationConfig = {
    labels: ['Vendas Concluídas', 'Cancelamentos'],
    datasets: [
      {
        data: [100 - cancelPercent, cancelPercent],
        backgroundColor: [
          'rgba(16, 185, 129, 0.8)',
          'rgba(239, 68, 68, 0.8)',
        ],
        borderColor: [
          'rgb(16, 185, 129)',
          'rgb(239, 68, 68)',
        ],
        borderWidth: 2,
      },
    ],
  };

  const enhancedChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { 
        position: 'top',
        labels: {
          usePointStyle: true,
          padding: 20,
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: false,
        callbacks: {
          label: function(context) {
            return `${context.parsed.y.toLocaleString('pt-BR')}`;
          }
        }
      },
    },
    scales: {
      y: { 
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
        ticks: {
          callback: function(value) {
            return value.toLocaleString('pt-BR');
          }
        }
      },
      x: {
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        }
      }
    },
    interaction: {
      intersect: false,
      mode: 'index',
    },
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom' },
    },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-2 sm:p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-4xl font-bold text-slate-800 mb-2">
            Dashboard de Métricas
          </h1>
          <p className="text-sm sm:text-base text-slate-600">
            Insights e análises de vendas em tempo real
          </p>
        </div>

        {/* Filtros Simplificados */}
        <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 border border-slate-200 mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-4">
            <h3 className="text-lg font-semibold text-slate-800">Filtros</h3>
            <button
              onClick={resetFilters}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium self-start sm:self-auto"
            >
              Limpar Filtros
            </button>
          </div>
          
          <div className="flex flex-col lg:flex-row lg:items-center gap-4">
            {/* Filtro de Período */}
            <div className="flex-1 min-w-full sm:min-w-48">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Período
              </label>
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="7d">Últimos 7 dias</option>
                <option value="30d">Últimos 30 dias</option>
                <option value="90d">Últimos 90 dias</option>
                <option value="all">Todos os períodos</option>
              </select>
            </div>

            {/* Navegação de Períodos */}
            {dateFilter !== 'all' && (
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => navigatePeriod('prev')}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors text-sm"
                >
                  ← Anterior
                </button>
                <span className="px-4 py-2 bg-blue-50 text-blue-700 rounded-lg font-medium text-sm">
                  {getPeriodLabel()}
                </span>
                <button
                  onClick={() => navigatePeriod('next')}
                  disabled={currentPeriod === 0}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors text-sm"
                >
                  Próximo →
                </button>
              </div>
            )}
          </div>

          {/* Indicador de filtro ativo */}
          {dateFilter !== '7d' && (
            <div className="flex flex-wrap gap-2 mt-4">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                Período: {dateFilter === 'all' ? 'Todos' : dateFilter}
                <button
                  onClick={() => setDateFilter('7d')}
                  className="ml-2 text-blue-600 hover:text-blue-800"
                >
                  ×
                </button>
              </span>
            </div>
          )}
        </div>

        {/* Cards de Métricas Principais */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-slate-600">Total de Vendas</p>
                <p className="text-xl sm:text-3xl font-bold text-slate-900">
                  {metrics.totalSales}
                </p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-slate-600">Receita Total</p>
                <p className="text-xl sm:text-3xl font-bold text-slate-900">
                  R$ {metrics.totalRevenue}
                </p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-slate-600">Ticket Médio</p>
                <p className="text-xl sm:text-3xl font-bold text-slate-900">
                  R$ {metrics.averageTicket}
                </p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 9a2 2 0 10-4 0v5a2 2 0 01-2 2h6m-6-4h4m8 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-slate-600">Taxa de Cancelamento</p>
                <p className="text-xl sm:text-3xl font-bold text-red-600">{metrics.cancellationRate}%</p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Gráficos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 mb-6 sm:mb-8">
          {/* Vendas por Dia */}
          <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 border border-slate-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-2">
              <h3 className="text-lg sm:text-xl font-bold text-slate-800">Vendas por Período</h3>
              <div className="text-xs sm:text-sm text-slate-500">
                {getPeriodLabel()}
              </div>
            </div>
            <div className="h-64 sm:h-80">
              <Line data={enhancedDailySalesConfig} options={enhancedChartOptions} />
            </div>
          </div>

          {/* Top 5 Produtos */}
          <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 border border-slate-200">
            <h3 className="text-lg sm:text-xl font-bold text-slate-800 mb-4">Top 5 Produtos Vendidos</h3>
            <div className="h-64 sm:h-80">
              <Bar data={topProductsConfig} options={enhancedChartOptions} />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 mb-6 sm:mb-8">
          {/* Taxa de Cancelamento */}
          <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 border border-slate-200">
            <h3 className="text-lg sm:text-xl font-bold text-slate-800 mb-4">Taxa de Cancelamento</h3>
            <div className="h-64 sm:h-80">
              <Doughnut data={cancellationConfig} options={doughnutOptions} />
            </div>
          </div>
        </div>

        {/* Tabela de Produtos Detalhada */}
        <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 border border-slate-200 mb-6 sm:mb-8">
          <h3 className="text-lg sm:text-xl font-bold text-slate-800 mb-4 sm:mb-6">Produtos Mais Vendidos - Detalhado</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="pb-3 text-xs sm:text-sm font-semibold text-slate-600">Produto</th>
                  <th className="pb-3 text-xs sm:text-sm font-semibold text-slate-600">Unidades Vendidas</th>
                  <th className="pb-3 text-xs sm:text-sm font-semibold text-slate-600">Receita Total</th>
                </tr>
              </thead>
              <tbody>
                {topProducts.map((product, index) => (
                  <tr key={index} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                    <td className="py-3 sm:py-4 text-xs sm:text-sm text-slate-800 font-medium">{product.name}</td>
                    <td className="py-3 sm:py-4 text-xs sm:text-sm text-slate-600">{product.sales}</td>
                    <td className="py-3 sm:py-4 text-xs sm:text-sm text-slate-600">R$ {product.revenue.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 sm:mt-8 text-center">
          <p className="text-slate-500 text-xs sm:text-sm">
            Dados atualizados em tempo real • Última atualização: {dataATT || new Date().toLocaleTimeString('pt-BR')}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Index;
