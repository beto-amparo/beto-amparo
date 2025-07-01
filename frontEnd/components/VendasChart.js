// components/VendasChart.js
import React from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

// Importa e registra os componentes necessários do Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

export default function VendasChart({ labels, totals }) {
  const data = {
    labels: labels, // Ex: ['Seg', 'Ter', 'Qua', ...]
    datasets: [
      {
        label: 'Vendas Totais (R$)',
        data: totals, // Ex: [150, 200, 180, ...]
        fill: true,
        backgroundColor: 'rgba(54, 162, 235, 0.2)', // Cor de fundo da área abaixo da linha
        borderColor: 'rgba(54, 162, 235, 1)',      // Cor da linha
        tension: 0.3, // Suaviza a linha do gráfico
        pointBackgroundColor: 'rgba(54, 162, 235, 1)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgba(54, 162, 235, 1)',
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false, // Permite que o gráfico se ajuste ao tamanho do container
    plugins: {
      legend: {
        position: 'top',
        labels: {
          font: {
            size: 14,
          },
        },
      },
      title: {
        display: true,
        text: 'Vendas Diárias na Última Semana', // Título do gráfico
        font: {
          size: 16,
          weight: 'bold',
        },
        padding: {
          top: 10,
          bottom: 20,
        },
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += `R$ ${context.parsed.y.toFixed(2).replace('.', ',')}`; // Formata o valor
            }
            return label;
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          display: false, // Remove as linhas de grade verticais
        },
        title: {
          display: true,
          text: 'Dias',
        },
      },
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(200, 200, 200, 0.2)', // Cor das linhas de grade horizontais
        },
        title: {
          display: true,
          text: 'Valor (R$)',
        },
        ticks: {
          callback: function(value) {
            return `R$ ${value.toFixed(2).replace('.', ',')}`; // Formata os rótulos do eixo Y
          }
        }
      },
    },
  };

  return (
    <div className="relative h-96 w-full"> {/* Define uma altura para o gráfico */}
      {labels.length > 0 && totals.length > 0 ? (
        <Line data={data} options={options} />
      ) : (
        <p className="text-gray-600 text-center py-4">Sem dados de vendas para exibir no período selecionado.</p>
      )}
    </div>
  );
}