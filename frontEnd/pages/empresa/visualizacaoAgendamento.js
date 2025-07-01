import React, { useEffect, useState } from 'react';
import OwnerSidebar from '@/components/OwnerSidebar';
import { se } from 'date-fns/locale';
import { useRouter } from 'next/router';
const statusOptions = ['Agendado', 'Confirmado', 'Concluído', 'Cancelado'];

const getStatusColor = (status) => ({
  Agendado: 'bg-blue-100 text-blue-800',
  Confirmado: 'bg-green-100 text-green-800',
  Concluído: 'bg-gray-100 text-gray-800',
  Cancelado: 'bg-red-100 text-red-800',
}[status] || 'bg-gray-100 text-gray-800');

const ModalBase = ({ title, children, onClose }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={onClose}>
    <div
      className="relative bg-white text-black rounded-2xl shadow-2xl max-w-md w-full p-6 border border-zinc-300"
      onClick={(e) => e.stopPropagation()}
      style={{ maxHeight: '90vh', overflowY: 'auto' }}
    >
      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 transition-colors text-2xl"
        >
          &times;
        </button>
      )}
      <h3 className="text-2xl font-semibold mb-6 text-center">{title}</h3>
      {children}
    </div>
  </div>
);

const ClienteDetalhesModal = ({ cliente, onClose }) => (
  <ModalBase title="Detalhes do Cliente" onClose={onClose}>
    <div className="space-y-3 text-gray-800">
      <p><strong>Nome:</strong> {cliente.nome}</p>
      <p><strong>Telefone:</strong> {cliente.telefone}</p>
      <p><strong>Email:</strong> {cliente.email}</p>
      <p><strong>Endereço:</strong> {cliente.endereco}</p>
    </div>
  </ModalBase>
);

const ConfirmacaoModal = ({ onCancel, onConfirm }) => (
  <ModalBase title="Confirmar Exclusão" onClose={onCancel}>
    <p className="text-gray-600 mb-6 text-center">
      Tem certeza de que deseja excluir este agendamento? Esta ação não pode ser desfeita.
    </p>
    <div className="flex gap-4 justify-center">
      <button
        onClick={onCancel}
        className="px-5 py-2 border border-gray-400 rounded-md text-gray-700 hover:bg-gray-100"
      >
        Cancelar
      </button>
      <button
        onClick={onConfirm}
        className="px-5 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
      >
        Excluir
      </button>
    </div>
  </ModalBase>
);

const ModalAlterarStatus = ({ statusAtual, onClose, onSave }) => {
  const [novoStatus, setNovoStatus] = useState(statusAtual);

  return (
    <ModalBase title="Alterar Status" onClose={onClose}>
      <label className="block text-sm font-medium text-gray-700 mb-3">Novo Status</label>
      <select
        value={novoStatus}
        onChange={(e) => setNovoStatus(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 mb-6"
      >
        {statusOptions.map((status) => (
          <option key={status} value={status}>{status}</option>
        ))}
      </select>
      <div className="flex gap-4 justify-end">
        <button
          onClick={onClose}
          className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100"
        >
          Cancelar
        </button>
        <button
          onClick={() => onSave(novoStatus)}
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
        >
          Salvar
        </button>
      </div>
    </ModalBase>
  );
};

export default function VisualizarAgendamento() {
const router = useRouter()
const { slug } = router.query;
  const [clientData, setClientData] = useState([]);
  const [agendamentos, setAgendamentos] = useState([]);
  const [clienteSelecionado, setClienteSelecionado] = useState(null);
  const [agendamentoParaDeletar, setAgendamentoParaDeletar] = useState(null);
  const [filtroStatus, setFiltroStatus] = useState('Todos');
  const [pesquisaCliente, setPesquisaCliente] = useState('');
  const [filtroData, setFiltroData] = useState('');
  const [agendamentoParaEditarStatus, setAgendamentoParaEditarStatus] = useState(null);

  useEffect(() => {
    const getAgendamentos = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_EMPRESA_API}/empresa/agendamentos/`+ slug, { credentials: 'include' });
        if (response.status === 401) return window.location.href = '/loginEmpresa';
        const data = await response.json();
        if (!data?.length) return;

        const IDs_Cliente = [...new Set(data.map(item => item.id_cliente))];
        const responses = await Promise.all(IDs_Cliente.map(async (id) => {
          const res = await fetch(`${process.env.NEXT_PUBLIC_EMPRESA_API}/clientes/${id}`, { credentials: 'include' });
          return res.json();
        }));
       
        
        setClientData(responses);
        const agendamentosComClientes = data.map((item, index) => {
          const cliente = responses.find(c => c.id === item.id_cliente) || { id: item.id_cliente, nome: 'Cliente Desconhecido', telefone: '', email: '', endereco: '' };
          return { id: index, data: item.data, horario: item.time.slice(0, 5), status: item.status, cliente };
        });
        setAgendamentos(agendamentosComClientes);
      } catch (err) {
        console.error('Erro ao buscar dados:', err);
      }
    };
    getAgendamentos();
  }, slug);

  const deletarAgendamento = async (id) => {
    const agendamento = agendamentos.find((a) => a.id === id);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_EMPRESA_API}/empresa/agendamentos/`+ slug, {
        method: 'DELETE',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_cliente: agendamento.cliente.id, data: agendamento.data, time: agendamento.horario })
      });
      if (!res.ok) throw new Error('Erro ao excluir agendamento');
      setAgendamentos(prev => prev.filter((a) => a.id !== id));
      setAgendamentoParaDeletar(null);
    } catch (err) {
      console.error(err);
    }
  };

  const alterarStatus = async (id, status) => {
    const agendamento = agendamentos.find((a) => a.id === id);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_EMPRESA_API}/empresa/agendamentos/`+ slug, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_cliente: agendamento.cliente.id, data: agendamento.data, time: agendamento.horario, status })
      });
      if (!res.ok) throw new Error('Erro ao alterar status');
      setAgendamentos(prev => prev.map(a => a.id === id ? { ...a, status } : a));
      setAgendamentoParaEditarStatus(null);
    } catch (err) {
      console.error(err);
    }
  };

  const agendamentosFiltrados = agendamentos.filter((a) => {
    const statusOk = filtroStatus === 'Todos' || a.status === filtroStatus;
    const pesquisa = pesquisaCliente.toLowerCase();
    const clienteOk = a.cliente.nome.toLowerCase().includes(pesquisa) || a.cliente.telefone.includes(pesquisa) || a.cliente.email.toLowerCase().includes(pesquisa);
    const dataOk = !filtroData || a.data === filtroData;
    return statusOk && clienteOk && dataOk;
  });

  return (
       <OwnerSidebar slug={slug}>
        
          
    <div className="max-w-3xl mx-auto  bg-gray-50 p-6">
        
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Gerenciar Agendamentos</h1>
          <p className="text-gray-600">Visualize, gerencie e exclua agendamentos</p>
        </header>

        <section className="mb-6 bg-white rounded-lg p-4 border border-gray-300 shadow-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Filtrar por status:</label>
              <select value={filtroStatus} onChange={(e) => setFiltroStatus(e.target.value)} className="w-full px-3 py-2 border rounded-md">
                <option value="Todos">Todos</option>
                {statusOptions.map(status => <option key={status} value={status}>{status}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Pesquisar cliente:</label>
              <input value={pesquisaCliente} onChange={(e) => setPesquisaCliente(e.target.value)} className="w-full px-3 py-2 border rounded-md" placeholder="Nome, telefone ou email" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Filtrar por data:</label>
              <input type="date" value={filtroData} onChange={(e) => setFiltroData(e.target.value)} className="w-full px-3 py-2 border rounded-md" />
            </div>
          </div>
        </section>

        {/* Agendamentos */}
        <section className="bg-white rounded-lg p-4 border border-gray-300 shadow-sm">
          {agendamentosFiltrados.length === 0 ? (
            <p className="text-center text-gray-500">Nenhum agendamento encontrado.</p>
          ) : (
            <ul className="divide-y">
              {agendamentosFiltrados.map((a) => (
                <li key={a.id} className="py-4 flex justify-between items-center">
                  <div>
                    <p className="text-lg font-semibold">{a.cliente.nome}</p>
                    <p className="text-sm text-gray-500">{a.data} às {a.horario}</p>
                    <span className={`text-xs px-2 py-1 rounded ${getStatusColor(a.status)}`}>{a.status}</span>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setClienteSelecionado(a.cliente)} className="text-blue-600 hover:underline text-sm">Ver cliente</button>
                    <button onClick={() => setAgendamentoParaEditarStatus(a)} className="text-indigo-600 hover:underline text-sm">Alterar status</button>
                    <button onClick={() => setAgendamentoParaDeletar(a)} className="text-red-600 hover:underline text-sm">Excluir</button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {clienteSelecionado && <ClienteDetalhesModal cliente={clienteSelecionado} onClose={() => setClienteSelecionado(null)} />}
      {agendamentoParaDeletar && <ConfirmacaoModal onCancel={() => setAgendamentoParaDeletar(null)} onConfirm={() => deletarAgendamento(agendamentoParaDeletar.id)} />}
      {agendamentoParaEditarStatus && <ModalAlterarStatus statusAtual={agendamentoParaEditarStatus.status} onClose={() => setAgendamentoParaEditarStatus(null)} onSave={(status) => alterarStatus(agendamentoParaEditarStatus.id, status)} />}
    </div>
    
    </OwnerSidebar>
  );
}
