import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import NavBar from "@/components/NavBar";
import ProdutoCard from "@/components/ProdutoCard";


export default function ClienteHome({ site }) {
  const [empresaId, setEmpresaId] = useState(null);
  const [nomeEmpresa, setNomeEmpresa] = useState("Carregando...");
  const [produtos, setProdutos] = useState([]);
  const [searchTerm, setSearchTerm] = useState(""); 
  const produtosFiltrados = produtos.filter((produto) =>
    produto.nome.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const [quantidades, setQuantidades] = useState({});
  const [mensagem, setMensagem] = useState('');
  const [corMensagem, setCorMensagem] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [fotoLoja, setFotoLoja] = useState(null);
  const [nomeFantasia, setNomeFantasia] = useState('');

  useEffect(() => {
    if (!site) return;

    async function fetchEmpresa() {
      try {
        const url = `http://localhost:4000/api/empresa/slug/${site}`;
        const response = await fetch(url);
        if (!response.ok) throw new Error("Erro ao buscar empresa");
        const data = await response.json();
        setEmpresaId(data.id);
        setNomeEmpresa(data.nome || "Empresa não encontrada");
        setNomeFantasia(data.nome_fantasia || "Sem nome fantasia");
        setFotoLoja(data.foto_loja || null);
      } catch (error) {
        console.error("Erro ao buscar empresa:", error);
        setNomeEmpresa("Erro ao carregar");
      }
    }

    fetchEmpresa();
  }, [site]);

  useEffect(() => {
    if (!empresaId) return;

    async function fetchProdutos() {
      try {
        const url = `http://localhost:4000/produtos/empresa/${empresaId}`;
        const response = await fetch(url);
        if (!response.ok) throw new Error("Erro ao buscar produtos");
        const data = await response.json();
        setProdutos(data);
      } catch (error) {
        console.error("Erro ao buscar produtos:", error);
      }
    }

    fetchProdutos();
  }, [empresaId]);

  const handleShareClick = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Compartilhe este link",
          url: window.location.href,
        });
      } catch (error) {
        console.error("Erro ao compartilhar:", error);
      }
    } else {
      const url = window.location.href;
      const text = encodeURIComponent("Confira esse conteúdo:");
      const shareUrl = `https://api.whatsapp.com/send?text=${text}%20${url}`;
      window.open(shareUrl, "_blank");
    }
  };

const getImagemProduto = (caminhoImagem) => {
  if (!caminhoImagem) return '/fallback.jpg';
  if (caminhoImagem.startsWith('http')) return caminhoImagem;
  const baseUrl = 'https://cufzswdymzevdeonjgan.supabase.co/storage/v1/object/public';
  return `${baseUrl}/imagens/clientes/${encodeURIComponent(caminhoImagem)}`;
};
  

  useEffect(() => {
    if (!showSearch) {
      setSearchTerm(""); 
    }
  }, [showSearch]);
  const handleAumentar = (id) => {
    setQuantidades((prev) => ({
      ...prev,
      [id]: (prev[id] || 1) + 1,
    }));
  };
  
  const handleDiminuir = (id) => {
    setQuantidades((prev) => ({
      ...prev,
      [id]: Math.max(1, (prev[id] || 1) - 1),
    }));
  };
  
   const handleAdicionar = async (produto) => {
    try {
      const qtd = quantidades[produto.id] || 1;
      const id_cliente = 2; 

      console.log(`Adicionando ${qtd}x ${produto.nome} ao carrinho...`);
  
      const response = await fetch('http://localhost:4000/api/carrinho', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          produtoId: produto.id,
          quantidade: qtd,
          id_cliente,
          id_empresa: empresaId,
        }),
      });
  
      const data = await response.json();
  
      if (!response.ok) {
        console.error('Erro no backend:', data.erro);
        throw new Error(data.erro || 'Erro desconhecido');
      }
  
      console.log(`Produto ${produto.nome} adicionado com sucesso.`);
      setMensagem('Produto adicionado ao carrinho!');
      setCorMensagem('text-green-600');
    } catch (err) {
      console.error('Erro ao adicionar ao carrinho:', err);
      setMensagem(`Erro: ${err.message}`);
      setCorMensagem('text-red-600');
    }
  
    setTimeout(() => setMensagem(''), 3000);
  };
    
  
  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      <header className="bg-blue-300 text-white px-4 py-3 flex items-center justify-between shadow relative">
        {!showSearch && (
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full overflow-hidden">
              <Image
                src={fotoLoja ? getImagemProduto(fotoLoja) : "/fallback.jpg"}
                alt="Logo da Loja"
                width={50}
                height={50}
                className="object-cover w-full h-full"
              />
            </div>
            <h1 className="text-lg font-bold">{nomeFantasia}</h1>
          </div>

        )}
        {showSearch && (
          <div className="flex items-center bg-white rounded-full px-3 py-1 w-full max-w-xl mx-auto shadow">
            <Image src="/icons/search_icon.svg" alt="Buscar" width={16} height={16} className="mr-2" />
            <input
              type="text"
              placeholder="O que você quer comprar hoje?"
              className="flex-1 text-sm text-gray-800 outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />

            <button onClick={() => setShowSearch(false)} className="text-gray-500 hover:text-red-600">
              ✕
            </button>
          </div>
        )}
        {!showSearch && (
          <div className="flex items-center gap-3 ml-auto">
            <button onClick={() => setShowSearch(true)} className="flex flex-col items-center">
              <div className="bg-white/70 p-2 rounded-full shadow hover:bg-white transition-colors">
                <Image src="/icons/search_icon.svg" alt="Buscar" width={20} height={20} />
              </div>
              <span className="text-[10px] mt-1">Buscar</span>
            </button>
            <button onClick={handleShareClick} className="flex flex-col items-center">
              <div className="bg-white/70 p-2 rounded-full shadow hover:bg-white transition-colors">
                <Image src="/icons/share_icon.svg" alt="Compartilhar" width={20} height={20} />
              </div>
              <span className="text-[10px] mt-1">Compartilhar</span>
            </button>
          </div>
        )}
      </header>

      <div className="bg-blue-50 border border-blue-200 rounded-md mx-4 my-4 mt-3 px-3 py-2 flex items-center gap-2 text-sm text-blue-800">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        Atendimento: <strong>Segunda a Sexta, das 08h às 18h</strong>
      </div>

      <div className="flex-1 px-4 overflow-y-auto pb-24">
      {mensagem && (
        <div className={`text-center mb-4 font-medium ${corMensagem}`}>
          {mensagem}
        </div>
      )}
        <div className="flex-1 px-4 overflow-y-auto pb-24">
          {produtosFiltrados.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {produtosFiltrados.map((produto) => (
                <ProdutoCard
                  key={produto.id}
                  produto={produto}
                  quantidade={quantidades[produto.id] || 1}
                  onAumentar={() => handleAumentar(produto.id)}
                  onDiminuir={() => handleDiminuir(produto.id)}
                  onAdicionar={() => handleAdicionar(produto)}
                  getImagemProduto={getImagemProduto}
                />
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-600 mt-10 text-lg">
              Nenhum produto disponível no momento.
            </div>
          )}

        </div>
      </div>
      <NavBar empresaId={empresaId} />
    </div>
  );
  
}
