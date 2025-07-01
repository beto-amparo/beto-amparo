// frontEnd/pages/comprovante/[pedidoId].js
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

export default function Comprovante() {
  const router = useRouter();
  const { pedidoId } = router.query;

  const [pedido, setPedido] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!pedidoId) return;

    async function fetchPedido() {
      try {
        const res = await fetch(`http://localhost:4000/loja/slug/pedidos/${pedidoId}`, {
          credentials: 'include', // se precisar enviar cookies/sessão
        });

        if (!res.ok) throw new Error('Erro ao buscar o pedido');

        const data = await res.json();
        setPedido(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchPedido();
  }, [pedidoId]);

  if (loading) return <p>Carregando comprovante...</p>;
  if (error) return <p>Erro: {error}</p>;
  if (!pedido) return <p>Nenhum pedido encontrado.</p>;

  return (
    <div style={{ maxWidth: 600, margin: '2rem auto', padding: '1rem', border: '1px solid #ccc', borderRadius: 8 }}>
      <h1>Comprovante do Pedido #{pedido.id}</h1>
      <p><strong>Data:</strong> {pedido.data}</p>
      <p><strong>Total:</strong> R$ {(Number(pedido.total) || 0).toFixed(2)}</p>
      <p><strong>Status:</strong> {pedido.status === 1 ? 'Confirmado' : 'Aguardando confirmação'}</p>
      <p><strong>Observações:</strong> {pedido.observacoes || 'Nenhuma'}</p>

      <h2>Itens</h2>
      <ul>
        {pedido.itens && pedido.itens.length > 0 ? (
          pedido.itens.map((item) => (
            <li key={item.id}>
              {item.quantidade} x {item.nome} - R$ {(Number(item.preco) || 0).toFixed(2)}
            </li>
          ))
        ) : (
          <li>Sem itens no pedido</li>
        )}
      </ul>
    </div>
  );
}
