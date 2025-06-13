// C:\Users\Dallyla\OneDrive\Área de Trabalho\beto-amparo\beto-amparo\frontEnd\pages\client\carrinho.js
import { useEffect, useState } from "react";
import Image from "next/image";
import { FaTrashAlt } from "react-icons/fa"; 
import NavBar from "@/components/NavBar"; 
import { useRouter } from "next/router"; 

export default function CarrinhoCliente({ empresaId }) {
  const [itensCarrinho, setItensCarrinho] = useState([]);
  const [subtotal, setSubtotal] = useState(0);
  const [corPrimaria, setCorPrimaria] = useState("#3B82F6");
  const [lojaId, setLojaId] = useState(null);
  const [cliente, setCliente] = useState(null);

  const [totalPontosCliente, setTotalPontosCliente] = useState(0);
  const [pontosParaUsar, setPontosParaUsar] = useState(0);
  const [descontoAplicado, setDescontoAplicado] = useState(0);

  const [ativarFidelidade, setAtivarFidelidade] = useState(false);

  const router = useRouter();
  const { slug } = router.query;
  
  useEffect(() => {
    if (!slug) return;

    async function verificarLoginCliente() {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_EMPRESA_API}/me`, {
          credentials: 'include',
        });
        if (response.ok) {
          const data = await response.json();
          setCliente(data.cliente);
        } else {
          router.push(`/login?redirect=${encodeURIComponent(router.asPath)}`);
        }
      } catch (err) {
        console.error("Erro ao verificar login", err);
        router.push(`/login?redirect=${encodeURIComponent(router.asPath)}`);
      }
    } 

    // Buscar a corPrimaria da loja
    async function fetchLoja() {
      
      try {
        const url = `${process.env.NEXT_PUBLIC_EMPRESA_API}/loja/slug/${slug}`;
        const response = await fetch(url);
        if (!response.ok) throw new Error("Erro ao buscar loja");
        const data = await response.json();
        setCorPrimaria(data.cor_primaria || "#3B82F6"); // Atualiza com a cor da API ou usa o fallback
        setLojaId(data.id);
        setAtivarFidelidade(data.ativarFidelidade || false);
      } catch (error) {
        console.error("Erro ao buscar loja:", error);
        setCorPrimaria("#3B82F6"); // Fallback em caso de erro
      }
    }   
    
    // Buscar itens do carrinho
    async function fetchCarrinho() {
      try {
        // CORREÇÃO AQUI: Adicione '/loja/' ao caminho da API
        const url = `${process.env.NEXT_PUBLIC_EMPRESA_API}/loja/${slug}/carrinho`; 
        console.log("Buscando carrinho em:", url); 
        const response = await fetch(url);
        if (!response.ok) throw new Error("Erro ao buscar carrinho");
        const data = await response.json();
        console.log("Carrinho carregado:", data);
        console.log("Campo ativarFidelidade vindo como:", data.ativarFidelidade);
        setItensCarrinho(data);
        const total = data.reduce((acc, item) => acc + item.quantidade * item.produto.preco, 0);
        setSubtotal(total);
      } catch (error) {
        console.error("Erro ao carregar carrinho:", error);
      }
    }


    async function fetchCliente() {
      try {
        const id_cliente = cliente?.id; // depois tornar dinâmico
        const url = `${process.env.NEXT_PUBLIC_EMPRESA_API}/clientes/${id_cliente}`;
        const response = await fetch(url);
        if (!response.ok) throw new Error("Erro ao buscar cliente");
        const data = await response.json();
        setTotalPontosCliente(data.total_pontos || 0);
        setPontosParaUsar(data.total_pontos || 0); // por padrão usar todos
      } catch (error) {
        console.error("Erro ao buscar cliente:", error);
      }
    }

    verificarLoginCliente();
    fetchCliente();
    fetchLoja();
    fetchCarrinho();
  }, [slug]);

  const aplicarDesconto = () => {
    const pontosDisponiveis = Math.min(pontosParaUsar, totalPontosCliente);

    const percentualDesconto = pontosDisponiveis 
    const valorDesconto = (subtotal * percentualDesconto) / 100;

    setPontosParaUsar(pontosDisponiveis);
    setDescontoAplicado(valorDesconto);
  };

  const totalFinal = Math.max(0, subtotal - descontoAplicado);
  
  const handleFinalizarCompra = async () => {
  try {
    const id_cliente = cliente?.id;
    const dataPedido = new Date().toISOString().split('T')[0]; // AAAA-MM-DD
    const status = 0; // Pedido ainda não confirmado
    const observacoes = ""; // vazio por padrão

    const pedidoUrl = `${process.env.NEXT_PUBLIC_EMPRESA_API}/loja/${slug}/pedidos`;
    
    // 1. Criar pedido
    const pedidoResponse = await fetch(`${process.env.NEXT_PUBLIC_EMPRESA_API}/loja/${slug}/pedidos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id_cliente,
        id_loja: lojaId,
        data: dataPedido,
        total: totalFinal,
        desconto: descontoAplicado,
        status,
        observacoes
      }),
    });

    const pedidoCriado = await pedidoResponse.json();
    if (!pedidoResponse.ok) {
      console.error("Erro ao criar pedido:", pedidoCriado);
      throw new Error(pedidoCriado.erro || "Erro ao criar pedido");
    }

    const pedidoId = pedidoCriado.id;

    // 2. Adicionar itens ao pedido
    for (const item of itensCarrinho) {
      const itemResponse = await fetch(`${process.env.NEXT_PUBLIC_EMPRESA_API}/loja/${slug}/pedidos/item`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pedido_id: pedidoId,
          produto_id: item.produto.id,
          quantidade: item.quantidade,
          preco_unitario: item.produto.preco,
        }),
      });

      const itemData = await itemResponse.json();
      if (!itemResponse.ok) {
        console.error("Erro ao adicionar item ao pedido:", itemData);
        throw new Error(itemData.erro || "Erro ao adicionar item ao pedido");
      }
    }
    
    // 3. Limpar carrinho
    for (const item of itensCarrinho) {
      const deleteResponse = await fetch(`${process.env.NEXT_PUBLIC_EMPRESA_API}/loja/${slug}/carrinho/${item.id}`, {
       method: 'DELETE',
      });

      if (!deleteResponse.ok) {
        console.error("Resposta do backend:", responseData);
        console.error(`Erro ao remover item ${item.id} do carrinho`);
      }
    }
   // 4. Atualizar pontos 
   const usouPontos = descontoAplicado > 0;

    if (usouPontos) {
      // Cliente usou pontos → desconta os pontos usados
      const urlAtualizaPontos = `${process.env.NEXT_PUBLIC_EMPRESA_API}/clientes/${id_cliente}/pontos`;
      await fetch(urlAtualizaPontos, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ total_pontos: totalPontosCliente - pontosParaUsar }),
      });
      console.log(urlAtualizaPontos);
    } else {
      // Cliente não usou pontos → GANHA novos pontos
      const urlGanharPontos = `${process.env.NEXT_PUBLIC_EMPRESA_API}/clientes/${id_cliente}/ganhar-pontos`;
      await fetch(urlGanharPontos, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ valorTotalCompra: subtotal, usouPontos: false, id_loja: lojaId}),
      });
      console.log(urlGanharPontos);
    }

    alert("Compra finalizada com sucesso!");
    setItensCarrinho([]);
    setSubtotal(0);
    router.push(`/loja/${slug}`);
  } catch (error) {
    console.error("Erro ao finalizar compra:", error);
    alert("Ocorreu um erro ao finalizar a compra.");
  }
};


  async function handleRemoverItem(id) {
    try {
      const novosItens = itensCarrinho.filter((item) => item.id !== id);
      setItensCarrinho(novosItens);
      const novoSubtotal = novosItens.reduce((acc, item) => acc + item.quantidade * item.produto.preco, 0);
      //setTotalPontosCliente((prev) => prev - pontosGastos + novosPontosGanhos); 
      setSubtotal(novoSubtotal);
      
      // CORREÇÃO AQUI: Adicione '/loja/' ao caminho da API
      const url = `${process.env.NEXT_PUBLIC_EMPRESA_API}/loja/${slug}/carrinho/${id}`;
      console.log("Removendo item em:", url);
      const response = await fetch(url, { method: 'DELETE' });
      if (!response.ok) throw new Error("Erro ao remover item do carrinho");
    } catch (error) {
      console.error("Erro ao remover item:", error);
    }
  }

  const getImagemProduto = (caminhoImagem) => {
    console.log("Imagem recebida:", caminhoImagem); 
    if (!caminhoImagem) return '/fallback.png';
    if (caminhoImagem.startsWith('http')) return caminhoImagem;
    const baseUrl = 'https://cufzswdymzevdeonjgan.supabase.co/storage/v1/object/public';
    return `${baseUrl}/imagens/clientes/${encodeURIComponent(caminhoImagem)}`;
  };


  return (
    <div className="flex flex-col min-h-screen bg-white text-black">
      <header
        className="text-white px-4 py-3 shadow flex items-center justify-center"
        style={{ backgroundColor: corPrimaria }}
      >
        <h1 className="text-xl font-bold">Seu Carrinho</h1>
      </header>

      <div className="flex-1 flex items-center justify-center">
       <div className="max-w-2xl w-full pb-28">

      {ativarFidelidade && ( 
        <div className="space-y-2 mb-4">
          <label htmlFor="pontos" className="block text-sm text-gray-700">Usar pontos:</label>
          
          <input
            id="pontos"
            type="number"
            value={pontosParaUsar}
            onChange={(e) => {
              const novoValor = parseInt(e.target.value, 10);
              if (!isNaN(novoValor) && novoValor >= 0 && novoValor <= totalPontosCliente) {
                setPontosParaUsar(novoValor);
              }
            }}
            className="border p-2 rounded w-full"
          />
          
          <p className="text-sm text-gray-500">Você tem {totalPontosCliente} pontos disponíveis.</p>
          
          <button
            onClick={aplicarDesconto}
            className="px-4 py-2 rounded text-white"
            style={{ backgroundColor: corPrimaria }}
          >
            Aplicar Desconto
          </button>

          {descontoAplicado > 0 && (
            <div className="text-green-700 font-semibold">
              Desconto aplicado: R$ {descontoAplicado.toFixed(2)}
            </div>
          )}
        </div>
      )}


          {itensCarrinho.length === 0 ? (
            <p className="text-center text-gray-700 mt-10">Seu carrinho está vazio.</p>
          ) : (
            <div className="space-y-4">
              {itensCarrinho.map((item, index) => (
                <div key={index} className="flex items-center border rounded p-4 shadow-sm">
                  <Image
                    src={getImagemProduto(item.produto.image)}
                    alt={item.produto.nome}
                    width={80}
                    height={80}
                    className="rounded object-cover"
                    unoptimized
                  />
                  <div className="ml-4 flex-1">
                    <p className="text-lg font-medium text-black">{item.produto.nome}</p>
                    <p className="text-sm text-gray-800">Valor unitário: R$ {item.produto.preco.toFixed(2)}</p>
                    <p className="text-sm text-gray-800">Qtd: {item.quantidade}</p>
                  </div>
                  <button
                    onClick={() => handleRemoverItem(item.id)}
                    className="ml-4 text-red-500 hover:text-red-700"
                  >
                    <FaTrashAlt size={20} />
                  </button>
                </div>
              ))}

              <div className="flex justify-between font-bold border-t pt-4 text-black text-lg">
                <span>Subtotal:</span>
                <span>R$ {subtotal.toFixed(2)}</span>
              </div>

              {ativarFidelidade && (
                <div className="flex justify-between text-black">
                  <span>Desconto aplicado:</span>
                  <span>R$ {descontoAplicado.toFixed(2)}</span>
                </div>
              )}

              <div className="flex justify-between text-black font-bold text-xl">
                <span>Total final:</span>
                <span>R$ {totalFinal.toFixed(2)}</span>
              </div>

              <button
                onClick={handleFinalizarCompra}
                disabled={lojaId === null}
                className="w-full py-3 rounded-xl mt-6 text-white hover:opacity-90 transition-opacity"
                style={{ backgroundColor: corPrimaria }}
              >
                Finalizar Compra
              </button>
            </div>
          )}
        </div>
      </div>

      <NavBar empresaId={empresaId} corPrimaria={corPrimaria} />
    </div>
  );
}