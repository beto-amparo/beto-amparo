import React, { useEffect, useState, useMemo } from 'react';
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
import { Bar, Doughnut, Line } from 'react-chartjs-2';

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

const formatarDataBR = (dataISO) => {
  if (!dataISO) return '';
  const date = new Date(dataISO);
  return new Intl.DateTimeFormat('pt-BR').format(date);
};

const DashboardAtendimento = ({ slug }) => {
  const [dados, setDados] = useState([]);
  const [statusSelecionado, setStatusSelecionado] = useState('Todos');
  const [periodo, setPeriodo] = useState('30');
  const [resumo, setResumo] = useState({
    agendado: 0,
    confirmado: 0,
    'concluído': 0,
    cancelado: 0,
  });

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_EMPRESA_API}/empresa/agendamentos/${slug}`, {
      credentials: 'include',
    })
      .then(res => res.json())
      .then(data => setDados(data))
      .catch(err => console.error(err));
  }, [slug]);

  const dataFiltrada = useMemo(() => {
    const hoje = new Date();
    const dias = parseInt(periodo);
    return dados.filter(item => {
      const statusOk = statusSelecionado === 'Todos' || item.status.toLowerCase() === statusSelecionado.toLowerCase();
      const dataItem = new Date(item.data);
      const dataOk = periodo === 'Todos' || (hoje - dataItem) / (1000 * 60 * 60 * 24) <= dias;
      return statusOk && dataOk;
    });
  }, [dados, statusSelecionado, periodo]);

  const total = dataFiltrada.length;

  const resumoAtual = useMemo(() => {
    const contagem = {
      agendado: 0,
      confirmado: 0,
      'concluído': 0,
      cancelado: 0,
    };
    dataFiltrada.forEach(item => {
      const status = item.status?.toLowerCase();
      if (contagem[status] !== undefined) contagem[status]++;
    });
    setResumo(contagem);
    return contagem;
  }, [dataFiltrada]);

  const agendamentosPorData = useMemo(() => {
    const contagem = {};
    dataFiltrada.forEach(item => {
      const dataFormatada = formatarDataBR(item.data?.split('T')[0]);
      contagem[dataFormatada] = (contagem[dataFormatada] || 0) + 1;
    });

    return Object.entries(contagem)
      .sort(([a], [b]) => new Date(a.split('/').reverse().join('-')) - new Date(b.split('/').reverse().join('-')))
      .map(([data, total]) => ({ data, total }));
  }, [dataFiltrada]);

  const barData = {
    labels: ['Agendado', 'Confirmado', 'Concluído', 'Cancelado'],
    datasets: [
      {
        label: 'Quantidade',
        data: [
          resumoAtual.agendado,
          resumoAtual.confirmado,
          resumoAtual['concluído'],
          resumoAtual.cancelado,
        ],
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',
          'rgba(16, 185, 129, 0.8)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(239, 68, 68, 0.8)',
        ],
        borderWidth: 1,
      },
    ],
  };

  const doughnutData = {
    labels: ['Agendado', 'Confirmado', 'Concluído', 'Cancelado'],
    datasets: [
      {
        data: [
          resumoAtual.agendado,
          resumoAtual.confirmado,
          resumoAtual['concluído'],
          resumoAtual.cancelado,
        ],
        backgroundColor: [
          'rgba(59, 130, 246, 0.7)',
          'rgba(16, 185, 129, 0.7)',
          'rgba(245, 158, 11, 0.7)',
          'rgba(239, 68, 68, 0.7)',
        ],
        borderColor: '#fff',
        borderWidth: 2,
      },
    ],
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      tooltip: {
        callbacks: {
          label: (tooltipItem) => {
            const value = tooltipItem.raw;
            const percentage = total ? ((value / total) * 100).toFixed(1) : 0;
            return `${tooltipItem.label}: ${percentage}%`;
          },
        },
      },
    },
  };

  const lineData = {
    labels: agendamentosPorData.map(item => item.data),
    datasets: [
      {
        label: 'Agendamentos por dia',
        data: agendamentosPorData.map(item => item.total),
        fill: true,
        borderColor: 'rgba(59, 130, 246, 1)',
        backgroundColor: 'rgba(59, 130, 246, 0.2)',
        tension: 0.3,
      },
    ],
  };

  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        ticks: {
          autoSkip: true,
          maxRotation: 45,
          minRotation: 25,
          color: '#475569',
        },
      },
      y: {
        ticks: {
          beginAtZero: true,
          color: '#475569',
        },
      },
    },
    plugins: {
      legend: {
        labels: {
          color: '#334155',
        },
      },
      tooltip: {
        mode: 'index',
        intersect: false,
      },
    },
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold text-slate-800 mb-4">Dashboard de Atendimentos</h1>

        {/* Filtros */}
        <div className="flex flex-wrap gap-4 mb-6 items-center">
          <select
            className="p-2 rounded-md shadow bg-white border"
            value={statusSelecionado}
            onChange={e => setStatusSelecionado(e.target.value)}
          >
            <option value="Todos">Todos os Status</option>
            <option value="agendado">Agendado</option>
            <option value="confirmado">Confirmado</option>
            <option value="concluído">Concluído</option>
            <option value="cancelado">Cancelado</option>
          </select>

          <select
            className="p-2 rounded-md shadow bg-white border"
            value={periodo}
            onChange={e => setPeriodo(e.target.value)}
          >
            <option value="7">Últimos 7 dias</option>
            <option value="30">Últimos 30 dias</option>
            <option value="Todos">Todos os dias</option>
          </select>
        </div>

        {/* Resumo */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card title="Agendado" value={resumoAtual.agendado} color="text-blue-600" />
          <Card title="Confirmado" value={resumoAtual.confirmado} color="text-green-600" />
          <Card title="Concluído" value={resumoAtual['concluído']} color="text-yellow-600" />
          <Card title="Cancelado" value={resumoAtual.cancelado} color="text-red-600" />
        </div>

        {/* Gráficos */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <ChartCard title="Gráfico de Barras">
            <Bar data={barData} options={{ responsive: true, maintainAspectRatio: false }} />
          </ChartCard>

          <ChartCard title="Distribuição de Status (%)">
            <Doughnut data={doughnutData} options={doughnutOptions} />
          </ChartCard>
        </div>

        <div className="grid grid-cols-1 gap-8">
          <ChartCard title="Agendamentos por Dia">
            <Line data={lineData} options={lineOptions} />
          </ChartCard>
        </div>
      </div>
    </div>
  );
};

const Card = ({ title, value, color }) => (
  <div className="bg-white p-4 rounded-xl shadow text-center">
    <p className="text-sm text-slate-600">{title}</p>
    <p className={`text-xl font-bold ${color}`}>{value}</p>
  </div>
);

const ChartCard = ({ title, children }) => (
  <div className="bg-white p-6 rounded-xl shadow">
    <h3 className="text-lg font-semibold text-slate-700 mb-4">{title}</h3>
    <div className="h-72 overflow-x-auto">{children}</div>
  </div>
);

export default DashboardAtendimento;
