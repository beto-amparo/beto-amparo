import ProdutoCard from "./ProdutoCard";

export default function SecaoRecomendacoes({ 
    titulo, 
    produtos,
    slug,
    corPrimaria, 
    onAdicionar,
    getImagemProduto,
    isLojaClosed 
}) {
    if (!produtos || produtos.length === 0) {
        return null;
    }

    return (

        <section className="my-8">
            <h2 className="text-2xl font-bold text-gray-900 px-4 mb-4">{titulo}:</h2>
            
            <div className="flex overflow-x-auto gap-4 px-4 pb-4 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
                {produtos.map((produto) => (
                    // 3. O wrapper de cada card. "flex-shrink-0" é vital para que os cards não encolham.
                    <div key={produto.id} className="flex-shrink-0">
                        <ProdutoCard
                            // 4. É AQUI que todo o estilo visual (fundo, sombra, etc.) acontece.
                            produto={produto}
                            onAdicionar={() => onAdicionar(produto)}
                            getImagemProduto={getImagemProduto}
                            slug={slug}
                            cor={corPrimaria}
                            isIndisponivel={produto.indisponivel_automatico || isLojaClosed}
                            statusEstoque={produto.status_estoque}
                            // Omitimos a prop 'className' aqui, pois o ProdutoCard já tem seus próprios estilos.
                        />
                    </div>
                ))}
                 {/* Elemento extra para dar um respiro no final do scroll */}
                 <div className="flex-shrink-0 w-1"></div>
            </div>
        </section>
    );
}