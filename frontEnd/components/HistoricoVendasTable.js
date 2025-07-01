// components/HistoricoVendasTable.js
import React, { useState } from 'react';
import Image from 'next/image';

export default function HistoricoVendasTable({ pedidos }) {
  // Estado para controlar qual pedido está expandido
  const [expandedPedidoId, setExpandedPedidoId] = useState(null);

  // Função para alternar a expansão de um pedido
  const toggleExpand = (pedidoId) => {
    setExpandedPedidoId(expandedPedidoId === pedidoId ? null : pedidoId);
  };

  // --- NOVA FUNÇÃO: Traduzir status numérico para texto ---
  const traduzirStatus = (status) => {
    switch (status) {
      case 0:
        return 'Aguardando confirmação';
      case 1:
        return 'Confirmado';
      case 2:
        return 'Em preparação';
      case 3:
        return 'Pronto para entrega';
      case 4:
        return 'Finalizado';
      case 5: // Este é o status de 'Cancelado' conforme sua lógica de backend
        return 'Cancelado';
      default:
        return 'Status desconhecido';
    }
  };

  // Função auxiliar para formatar a data
  const formatarData = (dataString) => {
    if (!dataString) return 'N/A';
    const date = new Date(dataString);
    // Formato Brasileiro: DD/MM/AAAA HH:MM
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Função auxiliar para formatar o preço
  const formatarPreco = (preco) => {
    if (typeof preco !== 'number') return 'R$ N/A';
    return `R$ ${preco.toFixed(2).replace('.', ',')}`;
  };

  // Função para obter a URL da imagem (se necessário, adapte para ser um helper global ou passada via props)
  const getImagemProduto = (imagePathOrFullUrl) => {
    if (imagePathOrFullUrl && (imagePathOrFullUrl.startsWith('http://') || imagePathOrFullUrl.startsWith('https://'))) {
      return imagePathOrFullUrl;
    }
    const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL ? process.env.NEXT_PUBLIC_BACKEND_URL.replace(/\/+$/, '') : '';
    if (imagePathOrFullUrl) {
      return `${baseUrl}/uploads/produtos/${imagePathOrFullUrl}`;
    }
    return '/placeholder.png';
  };


  if (!pedidos || pedidos.length === 0) {
    return <p className="text-gray-600">Nenhum pedido para exibir.</p>;
  }

  return (
    <div className="overflow-x-auto shadow-md rounded-lg">
      <table className="min-w-full bg-white border border-gray-200">
        <thead className="bg-gray-100">
          <tr>
            <th className="py-3 px-4 border-b text-left text-sm font-semibold text-gray-700">ID Pedido</th>
            <th className="py-3 px-4 border-b text-left text-sm font-semibold text-gray-700">Data</th>
            <th className="py-3 px-4 border-b text-left text-sm font-semibold text-gray-700">Cliente ID</th> {/* Ou nome do cliente se você juntar com a tabela de clientes */}
            <th className="py-3 px-4 border-b text-left text-sm font-semibold text-gray-700">Total</th>
            <th className="py-3 px-4 border-b text-left text-sm font-semibold text-gray-700">Status</th>
            <th className="py-3 px-4 border-b text-center text-sm font-semibold text-gray-700">Detalhes</th>
          </tr>
        </thead>
        <tbody>
          {pedidos.map((pedido) => (
            <React.Fragment key={pedido.id}>
              <tr className="border-b hover:bg-gray-50 transition-colors duration-150">
                <td className="py-3 px-4 text-sm text-gray-800">{pedido.id}</td>
                <td className="py-3 px-4 text-sm text-gray-800">{formatarData(pedido.data)}</td>
                <td className="py-3 px-4 text-sm text-gray-800">{pedido.id_cliente}</td> {/* Altere para pedido.clientes?.nome se estiver fazendo join */}
                <td className="py-3 px-4 text-sm text-gray-800">{formatarPreco(pedido.total)}</td>
                {/* --- MUDANÇA AQUI: Chamar a função traduzirStatus --- */}
                <td className="py-3 px-4 text-sm text-gray-800">{traduzirStatus(pedido.status)}</td>
                {/* --- FIM DA MUDANÇA --- */}
                <td className="py-3 px-4 text-center">
                  <button
                    onClick={() => toggleExpand(pedido.id)}
                    className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                  >
                    {expandedPedidoId === pedido.id ? 'Esconder' : 'Ver'} Itens
                  </button>
                </td>
              </tr>
              {expandedPedidoId === pedido.id && pedido.pedido_itens && pedido.pedido_itens.length > 0 && (
                <tr>
                  <td colSpan="6" className="p-4 bg-gray-50 border-t border-gray-200">
                    <h4 className="font-semibold text-gray-700 mb-2">Itens do Pedido ({pedido.id})</h4>
                    <ul className="space-y-2">
                      {pedido.pedido_itens.map((item) => (
                        <li key={item.id} className="flex items-center gap-4 p-2 bg-white rounded-md shadow-sm border border-gray-100">
                          <div className="relative w-12 h-12 flex-shrink-0">
                            <Image
                              src={getImagemProduto(item.produto?.image)} // Acesse a imagem do produto aninhado
                              alt={item.produto?.nome || 'Produto'}
                              layout="fill"
                              objectFit="cover"
                              className="rounded"
                            />
                          </div>
                          <div className="flex-grow">
                            <p className="font-medium text-gray-800">{item.produto?.nome || 'Produto Desconhecido'}</p>
                            <p className="text-sm text-gray-600">
                              {item.quantidade} x {formatarPreco(item.preco_unitario)}
                            </p>
                          </div>
                          <div className="text-right">
                             <p className="font-semibold text-gray-800">{formatarPreco(item.quantidade * item.preco_unitario)}</p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </td>
                </tr>
              )}
                {expandedPedidoId === pedido.id && (!pedido.pedido_itens || pedido.pedido_itens.length === 0) && (
                <tr>
                  <td colSpan="6" className="p-4 bg-gray-50 border-t border-gray-200">
                    <p className="text-gray-600 text-center">Nenhum item encontrado para este pedido.</p>
                  </td>
                </tr>
              )}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}