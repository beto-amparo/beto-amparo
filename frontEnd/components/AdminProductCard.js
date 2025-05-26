// components/AdminProductCard.js (Atualizado)

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';

// Adicione buttonLabel como prop
export default function AdminProductCard({ produto, getImagemProduto, onEdit, onDelete, buttonLabel = 'Inativar' }) {
  const router = useRouter();

  if (!produto) {
    return null;
  }

  const imageUrl = getImagemProduto(produto.image);
  const altText = produto.nome || 'Produto sem nome';
  const precoFormatado = produto.preco ?
    `R$ ${parseFloat(produto.preco).toFixed(2).replace('.', ',')}` :
    'Preço N/A';

  const handleCardClick = () => {
    if (produto.id && router.query.slug) {
      router.push(`/empresa/${router.query.slug}/editar-produto/${produto.id}`);
    }
  };

  return (
    <div
      className="bg-white rounded-lg shadow-lg overflow-hidden flex flex-col h-full
                   transition-transform duration-300 transform hover:scale-103 hover:shadow-xl cursor-pointer"
      onClick={handleCardClick}
    >
      {/* Imagem do Produto - Área Superior */}
      <div className="relative w-full h-48 sm:h-56 bg-gray-100 flex items-center justify-center">
        <Image
          src={imageUrl}
          alt={altText}
          fill
          className="object-cover transition-transform duration-300"
          onError={(e) => { e.target.src = '/placeholder.png'; e.target.alt = 'Imagem não disponível'; }}
          unoptimized
        />
      </div>

      {/* Detalhes do Produto - Área Central */}
      <div className="p-4 flex-grow flex flex-col justify-between">
        <h3 className="text-xl font-semibold text-gray-900 mb-2 truncate" title={produto.nome}>
          {produto.nome || 'Produto sem Nome'}
        </h3>
        <p className="text-sm text-gray-600 mb-3 line-clamp-1">
          {produto.descricao || 'Nenhuma descrição disponível.'}
        </p>
        <p className="text-2xl font-bold text-green-700 mt-auto">
          {precoFormatado}
        </p>
      </div>

      {/* Ações do Admin - Área Inferior (botões de Editar/Ação) */}
      <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-around items-center">
        {/* Botão de Editar */}
        {onEdit && (
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(produto.id); }}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium transition-colors duration-200"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zm-3.109 9.281a1 1 0 01-1.414 0L9 12.414l-4.586 4.586a1 1 0 01-1.414-1.414l4.586-4.586-2.121-2.121a1 1 0 010-1.414L7.586 5h5.828L15 6.414V12a1 1 0 01-1 1h-3zm-1.414-1.414a1 1 0 011.414 0l-2.121 2.121-1.414-1.414 2.121-2.121z" />
            </svg>
            Editar
          </button>
        )}

        {/* Botão de Ação (Inativar/Ativar) */}
        {onDelete && ( // Mantemos 'onDelete' como nome da prop para compatibilidade
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(produto); }}
            className={`flex items-center gap-2 font-medium transition-colors duration-200
                        ${buttonLabel === 'Ativar' ? 'text-green-600 hover:text-green-800' : 'text-red-600 hover:text-red-800'}`}
          >
            {/* Ícone dinâmico baseado na label */}
            {buttonLabel === 'Ativar' ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 4a1 1 0 011-1h12a1 1 0 011 1v5a2 2 0 01-2 2H5a2 2 0 01-2-2V8zm1.5 5a.5.5 0 000 1h11a.5.5 0 000-1h-11z" clipRule="evenodd" />
              </svg>
            )}
            {buttonLabel}
          </button>
        )}
      </div>
    </div>
  );
}