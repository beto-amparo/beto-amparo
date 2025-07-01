import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import NavBar from "@/components/NavBar"; 
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

const ModalCancelarAgendamento = ({ onClose, onSave }) => (
  <ModalBase title="Cancelar Agendamento" onClose={onClose}>
    <p className="mb-6 text-gray-700">Tem certeza que deseja cancelar este agendamento?</p>
    <div className="flex gap-4 justify-end">
      <button
        onClick={onClose}
        className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100"
      >
        Voltar
      </button>
      <button
        onClick={onSave}
        className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
      >
        Confirmar Cancelamento
      </button>
    </div>
  </ModalBase>
);

export default function VisualizarAgendamento() {
  const router = useRouter();
  const { slug } = router.query;

  const [agendamentos, setAgendamentos] = useState([]);
  const [clienteSelecionado, setClienteSelecionado] = useState(null);
  const [filtroStatus, setFiltroStatus] = useState('Todos');
  const [filtroData, setFiltroData] = useState('');
  const [agendamentoParaCancelar, setAgendamentoParaCancelar] = useState(null);
  const [corPrimaria, setCorPrimaria] = useState("#3B82F6");


  const getAgendamentos = useCallback(async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_EMPRESA_API}/cliente/viewAgendamentos/${slug}`, {
        credentials: 'include',
      });

      if (response.status === 401) {
        window.location.href = '/login';
        return;
      }

      const data = await response.json();
      if (!data?.length) return;

      const agendamentosComId = data.map((item, index) => ({
        id: `${item.data}-${item.time}-${index}`,
        data: item.data,
        horario: item.time.slice(0, 5),
        status: item.status,
        id_empresa: item.id_empresa
      }));

      setAgendamentos(agendamentosComId);
    } catch (err) {
      console.error('Erro ao buscar dados:', err);
    }
  }, [slug]);

  async function fetchEmpresa() {
    try {

        const url = `${process.env.NEXT_PUBLIC_EMPRESA_API}/loja/slug/${slug}`;
        const response = await fetch(url);

        if (!response.ok) {
            let errorMessage = `Erro HTTP ${response.status}: ${response.statusText}`;
            try {
                const errorData = await response.json();
                if (errorData.message) {
                    errorMessage += ` - ${errorData.message}`;
                }
            } catch (jsonError) {
                // Não conseguiu parsear o JSON do erro
            }
            console.error("DEBUG: Erro na resposta da API de empresa:", errorMessage);
            return;
        }

        const data = await response.json();
        
        setCorPrimaria(data.cor_primaria || "#3B82F6"); // Define a cor primária ou usa um padrão
        console.log("DEBUG: Dados d:", corPrimaria);
        
    } catch (error) {
        console.error("DEBUG: Erro na requisição ao buscar empresa:", error.message || error);
    }
}


  useEffect(() => {


    if (slug){
      fetchEmpresa();
      getAgendamentos();
    }
  }, [slug, getAgendamentos]);

  const cancelarAgendamento = async (id) => {
    const agendamento = agendamentos.find((a) => a.id === id);
    if (!agendamento) return;

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_EMPRESA_API}/cliente/viewAgendamentos/${slug}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: agendamento.data,
          time: agendamento.horario,
          id_empresa: agendamento.id_empresa,
          status: "Cancelado"
        }),
      });

      if (!res.ok) throw new Error('Erro ao cancelar agendamento');

      console.log('Agendamento cancelado com sucesso');
      setAgendamentoParaCancelar(null);

      setAgendamentos((prev) =>
        prev.map((a) =>
          a.id === id ? { ...a, status: 'Cancelado' } : a
        )
      );
      

    } catch (err) {
      console.error(err);
    }
  };

  const agendamentosFiltrados = agendamentos.filter((a) => {
    const statusOk = filtroStatus === 'Todos' || a.status === filtroStatus;
    const dataOk = !filtroData || a.data === filtroData;
    return statusOk && dataOk;
  });

  return (
    <div className="max-w-3xl mx-auto bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Gerenciar Agendamentos</h1>
          <p className="text-gray-600">Visualize e gerencie os agendamentos</p>
        </header>

        <section className="mb-6 bg-white rounded-lg p-4 border border-gray-300 shadow-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Filtrar por status:</label>
              <select
                value={filtroStatus}
                onChange={(e) => setFiltroStatus(e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="Todos">Todos</option>
                {statusOptions.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Filtrar por data:</label>
              <input
                type="date"
                value={filtroData}
                onChange={(e) => setFiltroData(e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
          </div>
        </section>

        <section className="bg-white rounded-lg p-4 border border-gray-300 shadow-sm">
          {agendamentosFiltrados.length === 0 ? (
            <p className="text-center text-gray-500">Nenhum agendamento encontrado.</p>
          ) : (
            <ul className="divide-y">
              {agendamentosFiltrados.map((a) => (
                <li key={a.id} className="py-4 flex justify-between items-center">
                  <div>
                    <p className="text-sm text-gray-500">{format(new Date(a.data), "EEEE, dd 'de' MMMM", { locale: ptBR })} às {a.horario}</p>
                    <span className={`text-xs px-2 py-1 rounded ${getStatusColor(a.status)}`}>{a.status}</span>
                  </div>
                  <div className="flex gap-2">
                    {a.status !== 'Cancelado' && (
                      <button
                        onClick={() => setAgendamentoParaCancelar(a)}
                        className="text-red-600 hover:underline text-sm"
                      >
                        Cancelar
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {clienteSelecionado && (
        <ClienteDetalhesModal
          cliente={clienteSelecionado}
          onClose={() => setClienteSelecionado(null)}
        />
      )}

      {agendamentoParaCancelar && (
        <ModalCancelarAgendamento
          onClose={() => setAgendamentoParaCancelar(null)}
          onSave={async () => {
            await cancelarAgendamento(agendamentoParaCancelar.id);
            setAgendamentoParaCancelar(null); 
          }}
          
        />
      )}
       <NavBar site={slug} corPrimaria={corPrimaria} />
    </div>
  );
}
