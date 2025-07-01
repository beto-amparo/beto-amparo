import { useState } from 'react';

export default function CancelarPedidoModal({ pedidoId, clienteId, onClose }) {
  const [motivo, setMotivo] = useState('');
  const [loading, setLoading] = useState(false);
  const [mensagem, setMensagem] = useState('');
  const [sucesso, setSucesso] = useState(false); // novo estado

  const handleCancelar = async () => {
    if (!motivo.trim()) {
      setMensagem('Por favor, informe o motivo do cancelamento.');
      return;
    }

    setLoading(true);
    setMensagem('');

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_EMPRESA_API}/order-cancellations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          order_id: pedidoId,
          cliente_id: clienteId,
          motivo
        })
      });

      const data = await response.json();

      if (response.ok) {
        setSucesso(true); // exibe modal de sucesso
        setTimeout(() => {
          setSucesso(false);
          onClose(); // fecha modal original
        }, 2000);
      } else {
        setMensagem(data.error || 'Erro ao enviar solicitação.');
      }
    } catch (err) {
      setMensagem('Erro na conexão com o servidor.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 g-gray-100 bg-opacity-40 backdrop-blur-sm flex items-center justify-center z-50 px-4">
      {sucesso ? (
        <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-lg text-center">
        <h2 className="text-2xl font-semibold text-green-600 mb-2">✅ Solicitação Enviada!</h2>
        <p className="text-gray-700 text-base">Sua solicitação de cancelamento será analisada pelo estabelecimento.</p>
    </div>
      ) : (
        <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-lg">
          <h2 className="text-xl font-semibold mb-4 text-black">Confirmar cancelamento</h2>
          <p className="text-sm text-gray-700 mb-2">Que pena 💔! Poderia nos informar o motivo do cancelamento?</p>

          <textarea
            className="w-full p-2 border rounded mb-3 text-black text-base resize-none"
            rows="3"
            placeholder="Descreva o motivo..."
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
          />

          {mensagem && (
            <div className="text-sm mb-2 text-red-500">{mensagem}</div>
          )}

          <div className="flex justify-end gap-2 flex-wrap">
            <button
              className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400 transition-all duration-200"
              onClick={onClose}
              disabled={loading}
            >
              Fechar
            </button>
            <button
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 disabled:opacity-50 transition-all duration-200"
              onClick={handleCancelar}
              disabled={loading}
            >
              {loading ? 'Enviando...' : 'Confirmar'}
            </button>
          </div>
        </div>
      )}
    </div>

  );
}