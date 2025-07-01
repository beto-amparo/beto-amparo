// components/ControleEstoqueTable.js

import React, { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/router';

export default function ControleEstoqueTable({ produtos, getImagemProduto }) {
  const router = useRouter();
  const [editingId, setEditingId] = useState(null);
  const [newQuantity, setNewQuantity] = useState('');
  const [loadingAdjust, setLoadingAdjust] = useState(false);
  const [errorAdjust, setErrorAdjust] = useState(null);

  // Função para iniciar a edição de uma quantidade
  const handleEditQuantity = (produto) => {
    setEditingId(produto.id);
    // CORRIGIDO: Agora usa 'produto.quantidade' para obter o valor do estoque
    setNewQuantity((produto.quantidade || 0).toString()); // Se for undefined/null, usa 0
    setErrorAdjust(null);
  };

  // Função para cancelar a edição
  const handleCancelEdit = () => {
    setEditingId(null);
    setNewQuantity('');
    setErrorAdjust(null);
  };

  // Função para salvar a nova quantidade
  const handleSaveQuantity = async (produtoId) => {
    setLoadingAdjust(true);
    setErrorAdjust(null);

    const parsedQuantity = parseInt(newQuantity, 10);

    // Validação de entrada
    if (isNaN(parsedQuantity) || parsedQuantity < 0) {
      setErrorAdjust('Quantidade inválida. Deve ser um número inteiro positivo ou zero.');
      setLoadingAdjust(false);
      return;
    }

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_EMPRESA_API}/produtos/estoque/${produtoId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ novaQuantidade: parsedQuantity }),
      });

      if (response.status === 401) {
        const errorData = await response.json();
        const targetUrl = errorData.redirectTo || `/empresa/LoginEmpresa?returnTo=${encodeURIComponent(router.asPath)}`;
        router.push(targetUrl);
        return;
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.mensagem || `Erro HTTP ${response.status} ao ajustar estoque.`);
      }

      // Sucesso: Notificar o pai para refetch dos dados ou atualizar localmente de forma mais inteligente
      // A melhor prática é notificar o componente pai (DashboardPage) para refetch
      // ou para atualizar seu estado de 'produtosEstoque'.
      // Por simplicidade, vamos manter um alert e fechar a edição.
     // alert('Estoque ajustado com sucesso!');
      // TODO: Adicionar uma prop onStockAdjusted={() => router.reload()} ou similar do pai
      handleCancelEdit(); // Fecha o modo de edição
      router.reload();
    } catch (err) {
      console.error('Erro ao ajustar estoque:', err);
      setErrorAdjust(err.message || 'Não foi possível ajustar o estoque. Verifique o console do backend.');
    } finally {
      setLoadingAdjust(false);
    }
  };


  if (!produtos || produtos.length === 0) {
    return <p className="text-gray-600">Nenhum produto para gerenciar estoque.</p>;
  }

  return (
    <div className="overflow-x-auto shadow-md rounded-lg">
      <table className="min-w-full bg-white border border-gray-200">
        <thead className="bg-gray-100">
          <tr>
            <th className="py-3 px-4 border-b text-left text-sm font-semibold text-gray-700">Produto</th>
            <th className="py-3 px-4 border-b text-left text-sm font-semibold text-gray-700">Categoria</th>
            <th className="py-3 px-4 border-b text-left text-sm font-semibold text-gray-700">Estoque Atual</th>
            <th className="py-3 px-4 border-b text-left text-sm font-semibold text-gray-700">Status</th> {/* Nova Coluna */}
            <th className="py-3 px-4 border-b text-left text-sm font-semibold text-gray-700">Ações</th>
          </tr>
        </thead>
        <tbody>
          {produtos.map((produto) => (
            <tr key={produto.id} className="border-b hover:bg-gray-50 transition-colors duration-150">
              <td className="py-3 px-4 text-sm text-gray-800">
                <div className="flex items-center gap-3">
                  <div className="relative w-12 h-12 flex-shrink-0">
                    <Image
                      src={getImagemProduto(produto.image)}
                      alt={produto.nome}
                      layout="fill"
                      objectFit="cover"
                      className="rounded"
                    />
                  </div>
                  <span>{produto.nome}</span>
                </div>
              </td>
              <td className="py-3 px-4 text-sm text-gray-800">{produto.categorias?.nome || 'N/A'}</td>
              <td className="py-3 px-4 text-sm text-gray-800">
                {/* Exibição da quantidade editável */}
                {editingId === produto.id ? (
                  <input
                    type="number"
                    value={newQuantity}
                    onChange={(e) => setNewQuantity(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveQuantity(produto.id);
                    }}
                    className="w-20 p-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-300"
                    disabled={loadingAdjust}
                  />
                ) : (
                  // EXIBINDO 'produto.quantidade'
                  <span>{produto.quantidade}</span>
                )}
              </td>
              {/* NOVA COLUNA: Status do Estoque */}
              <td className="py-3 px-4 text-sm text-gray-800">
                {produto.controlar_estoque ? ( // Só exibe status se o controle de estoque estiver ativo
                  <>
                    {produto.status_estoque === 'esgotado' && (
                      <span className="bg-red-100 text-red-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">Esgotado</span>
                    )}
                    {produto.status_estoque === 'estoque_baixo' && (
                      <span className="bg-yellow-100 text-yellow-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">Poucas unidades</span>
                    )}
                    {produto.status_estoque === 'disponivel' && (
                      <span className="bg-green-100 text-green-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">Disponível</span>
                    )}
                  </>
                ) : (
                  <span className="bg-gray-100 text-gray-600 text-xs font-semibold px-2.5 py-0.5 rounded-full">Não Controlado</span>
                )}
              </td>
              {/* Coluna de Ações */}
              <td className="py-3 px-4 text-sm">
                {editingId === produto.id ? (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleSaveQuantity(produto.id)}
                      className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 transition-colors duration-150 text-xs"
                      disabled={loadingAdjust}
                    >
                      {loadingAdjust ? 'Salvando...' : 'Salvar'}
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="bg-gray-300 text-gray-800 px-3 py-1 rounded hover:bg-gray-400 transition-colors duration-150 text-xs"
                      disabled={loadingAdjust}
                    >
                      Cancelar
                    </button>
                  </div>
                ) : (
                  // Só permite ajustar se o controle de estoque estiver ativo
                  produto.controlar_estoque ? (
                    <button
                      onClick={() => handleEditQuantity(produto)}
                      className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 transition-colors duration-150 text-xs"
                    >
                      Ajustar
                    </button>
                  ) : (
                    <span className="text-gray-500 text-xs">Ajuste manual desativado</span>
                  )
                )}
                {errorAdjust && editingId === produto.id && (
                  <p className="text-red-500 text-xs mt-1">{errorAdjust}</p>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}