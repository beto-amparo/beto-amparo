import ProdutoCard from "./ProdutoCard";

export default function SecaoCategoria({
    nomeCategoria,
    produtosDaCategoria,
    slug,
    corPrimaria,
    onAdicionar,
    getImagemProduto,
    isLojaClosed,
    quantidades
}) {
    // Se a categoria não tiver produtos (após uma busca, por exemplo), não renderiza nada.
    if (!produtosDaCategoria || produtosDaCategoria.length === 0) {
        return null;
    }

    return (
        <section className="my-8">
            {/* Título da Categoria */}
            <h2 className="text-2xl font-bold text-gray-900 px-4 mb-4">
                {nomeCategoria}:
            </h2>

            {/* Container com Scroll Horizontal */}
            <div className="flex gap-4 overflow-x-auto px-4 pb-4 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
                
                {/* Mapeia os produtos da categoria */}
                {produtosDaCategoria.map(produto => (
                    <div key={produto.id} className="flex-shrink-0">
                        <ProdutoCard
                            produto={produto}
                            quantidade={quantidades[produto.id] || 1}
                            onAdicionar={() => onAdicionar(produto)}
                            getImagemProduto={getImagemProduto}
                            slug={slug}
                            cor={corPrimaria}
                            isIndisponivel={produto.indisponivel_automatico || isLojaClosed}
                            statusEstoque={produto.status_estoque}
                        />
                    </div>
                ))}
                 {/* Elemento extra para dar um respiro no final do scroll */}
                 <div className="flex-shrink-0 w-1"></div>
            </div>
        </section>
    );
}