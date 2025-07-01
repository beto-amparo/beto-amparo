import { useEffect, useState } from 'react';
import { BellIcon } from 'lucide-react'; // certifique-se que está instalado

const fetchOrders = async () => {
  return [
    { id: 123, status: 'em preparação', lida: false },
    { id: 124, status: 'pendente', lida: false },
    { id: 125, status: 'entregue', lida: false },
  ];
};

export default function FloatingNotificationsTop() {
  const [toasts, setToasts] = useState([]);
  const [showToasts, setShowToasts] = useState(false);

  useEffect(() => {
    const carregar = async () => {
      const dados = await fetchOrders();
      const novas = dados.filter((o) => !o.lida);
      setToasts(novas);

      novas.forEach((n, i) => {
        setTimeout(() => {
          setToasts((prev) => prev.filter((t) => t.id !== n.id));
        }, 5000 * (i + 1));
      });
    };
    carregar();
  }, []);

  const fecharToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <>
      {/* Sino flutuante no topo direito */}
      <div className="fixed top-4 right-4 z-50">
        <button
          onClick={() => setShowToasts((prev) => !prev)}
          className="relative p-2 bg-gray-800 rounded-full shadow hover:bg-gray-700" // Corrigido aqui para fundo escuro no botão
        >
          <BellIcon className="w-6 h-6 text-gray-200" /> {/* Cor do ícone para contrastar */}
          {toasts.length > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {toasts.length}
            </span>
          )}
        </button>
      </div>

      {/* Toasts flutuantes abaixo do sino */}
      {showToasts && (
        <div className="fixed top-16 right-4 z-40 space-y-2">
          {toasts.map((toast) => (
            <div
              key={toast.id}
              onClick={() => fecharToast(toast.id)}
              className="bg-gray-800 border border-gray-700 shadow-lg rounded-lg px-4 py-3 w-80 cursor-pointer transition hover:bg-gray-700" // Corrigido aqui para fundo escuro no toast
            >
              <p className="text-sm text-gray-100"> {/* Corrigido aqui para texto claro */}
                Pedido <strong>#{toast.id}</strong> está <strong>{toast.status}</strong>
              </p>
              <p className="text-xs text-gray-400">Clique para fechar</p>
            </div>
          ))}
        </div>
      )}
    </>
  );
}