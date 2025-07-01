// frontEnd/components/ProdutoCard.js

import { useState } from "react";
import Image from "next/image";

export default function ProdutoCard({
    produto,
    quantidade = 1,
    onAdicionar,
    onAumentar,
    onDiminuir,
    getImagemProduto,
    slug,
    cor,
    isIndisponivel,
    statusEstoque,
}) {
    console.log(`DEBUG: ProdutoCard - Renderizando: ${produto.nome}, ID: ${produto.id}`);
    console.log(`  - Props: isIndisponivel=${isIndisponivel}, statusEstoque=${statusEstoque}, produto.quantidade=${produto.quantidade}, produto.controlar_estoque=${produto.controlar_estoque}, produto.ativo=${produto.ativo}`);

    const [imageSrc, setImageSrc] = useState(getImagemProduto(produto.image));

    const handleCardClick = () => {
        window.location.href = `produto/${slug}/${produto.id}`;
    };

    const handleAdicionarClick = (event) => {
        event.stopPropagation();
        if (!shouldDisableAddToCart) {
            onAdicionar(produto);
        }
    };

    const shouldDisableAddToCart = isIndisponivel;

    let statusLabel = '';
    let statusClass = '';

    if (produto.controlar_estoque && (statusEstoque === 'esgotado' || statusEstoque === 'estoque_baixo')) {
        if (statusEstoque === 'esgotado') {
            statusLabel = 'ESGOTADO';
            statusClass = 'bg-red-500 text-white';
        } else if (statusEstoque === 'estoque_baixo') {
            statusLabel = `Últimas ${produto.quantidade} unidades!`;
            statusClass = 'bg-yellow-500 text-gray-800';
        }
    } else if (statusEstoque === 'indisponivel_manual') {
        statusLabel = 'INDISPONÍVEL';
        statusClass = 'bg-gray-500 text-white';
    } else {
        // Nada para exibir se estiver disponível ou não controlado (e não estoque_baixo)
    }
    console.log(`DEBUG: ProdutoCard - ${produto.nome} - Status Final da Etiqueta: ${statusLabel || 'Nenhum'}`);


    return (
        <div
            className={`
                relative bg-white rounded-xl shadow-md p-3 w-40 sm:w-48 md:w-56 lg:w-64 flex flex-col items-center cursor-pointer
                ${shouldDisableAddToCart ? 'opacity-60 grayscale' : ''}
            `}
            onClick={handleCardClick}
        >
            {/* Etiqueta de status (ESGOTADO / POUCAS UNIDADES) */}
            {statusLabel && (
                <span className={`
                    absolute top-2 left-2 px-3 py-1 text-xs font-bold rounded-full z-20 
                    ${statusClass}
                `}>
                    {statusLabel}
                </span>
            )}

            <div className="relative w-full h-32 sm:h-36 md:h-40 aspect-[4/3] overflow-hidden"> {/* Adicionado overflow-hidden aqui se não tiver */}
                <Image
                    src={imageSrc}
                    alt={produto.nome}
                    fill
                    className="rounded-md object-cover"
                    unoptimized
                    onError={() => setImageSrc("/fallback.png")}
                />
            </div>

            <div className="w-full text-center mt-2">
                <h2 className="text-sm sm:text-base font-semibold text-gray-800 truncate">{produto.nome}</h2>
                <p className="text-xs text-gray-500 line-clamp-1">{produto.descricao}</p>
                <p className="text-green-600 font-bold mt-1">
                    R$ {parseFloat(produto.preco).toFixed(2)}
                </p>
            </div>

            <button
                onClick={handleAdicionarClick}
                className={`
                    mt-2 px-2 py-1 text-white rounded text-xs sm:text-sm font-medium flex items-center gap-1 transition-all
                    ${shouldDisableAddToCart ? 'bg-gray-400 cursor-not-allowed' : ''}
                `}
                style={{ backgroundColor: shouldDisableAddToCart ? 'gray' : cor }}
                onMouseEnter={(e) => !shouldDisableAddToCart && (e.currentTarget.style.filter = "brightness(90%)")}
                onMouseLeave={(e) => !shouldDisableAddToCart && (e.currentTarget.style.filter = "brightness(100%)")}
                disabled={shouldDisableAddToCart}
            >
                <Image src="/icons/cart_icon.svg" alt="Carrinho" width={14} height={14} />
                {shouldDisableAddToCart ? 'Esgotado' : 'Adicionar'}
            </button>
        </div>
    );
}