import { useEffect, useState } from 'react';

// Função para formatar a categoria (pode ficar fora do componente ou dentro, mas fora é mais limpo se não depender do estado do componente)
function formatarCategoria(categoria) {
    const categorias = {
        'alimento': 'Alimento',
        'higiene': 'Higiene',
        'roupa': 'Roupa'
    };
    return categorias[categoria] || categoria;
}

// Função para formatar o preço (pode ficar fora do componente)
function formatarPreco(preco) {
    // Certifique-se de que 'preco' é um número antes de chamar toLocaleString
    const numericPreco = parseFloat(preco);
    if (isNaN(numericPreco)) {
        return 'Preço Inválido'; // Ou algum outro tratamento de erro
    }
    return numericPreco.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    });
}

export default function ListarProdutos() {
    const [produtos, setProdutos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchProdutos = async () => {
            try {
                // Acessa process.env.NEXT_PUBLIC_EMPRESA_API no client-side
                const response = await fetch(`${process.env.NEXT_PUBLIC_EMPRESA_API}/produtos`, {
                    mode: 'cors'
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const data = await response.json();
                setProdutos(data);
            } catch (err) {
                console.error('Erro ao carregar produtos:', err);
                setError('Ocorreu um erro ao carregar os produtos. Recarregue a página.');
            } finally {
                setLoading(false);
            }
        };

        fetchProdutos();
    }, []); // O array vazio [] garante que o useEffect rode apenas uma vez, após a primeira renderização do componente no cliente.

    if (loading) {
        return <p>Carregando produtos...</p>;
    }

    if (error) {
        return <p>{error}</p>;
    }

    if (!produtos || produtos.length === 0) {
        return <p>Nenhum produto cadastrado ainda.</p>;
    }

    return (
        <div id="produtos-container">
            {produtos.map(produto => (
                <div key={produto.id} className="produto-card">
                    {produto.image ? 
                        <img src={`/uploads/${produto.image}`} alt={produto.nome} className="produto-imagem" /> : 
                        <div style={{height:'180px', display:'flex', alignItems:'center', justifyContent:'center', color:'#777'}}>Sem imagem</div>
                    }
                    <h3 className="produto-nome">{produto.nome}</h3>
                    <span className="produto-categoria">{formatarCategoria(produto.categoria)}</span>
                    <p className="produto-preco">{formatarPreco(produto.preco)}</p>
                    {produto.descricao ? <p>{produto.descricao}</p> : ''}
                </div>
            ))}
        </div>
    );
}