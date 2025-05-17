import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import NavBar from '@/components/NavBar';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function Pedidos() {
  const router = useRouter();
  const { slug } = router.query;

  const [pedidos, setPedidos] = useState([]);
  const [loja, setLoja] = useState(null);

  useEffect(() => {
    if (!slug) return;

    async function fetchDados() {
      try {
        // Busca dados da loja
        const resLoja = await fetch(`http://localhost:4000/api/empresa/slug/${slug}`);
        if (!resLoja.ok) throw new Error(`Erro loja! status: ${resLoja.status}`);
        const dataLoja = await resLoja.json();
        setLoja(dataLoja);

        // Busca pedidos da loja
        const resPedidos = await fetch(`http://localhost:4000/empresa/${slug}/pedidos`);
        if (!resPedidos.ok) throw new Error(`Erro pedidos! status: ${resPedidos.status}`);
        const dataPedidos = await resPedidos.json();
        setPedidos(dataPedidos);
      } catch (error) {
        console.error("Erro ao buscar dados:", error);
      }
    }

    fetchDados();
  }, [slug]);

  const traduzirStatus = (status) => {
    switch (status) {
      case '0':
      case 0:
        return 'Aguardando confirmação';
      case '1':
      case 1:
        return 'Confirmado';
      default:
        return 'Status desconhecido';
    }
  };
const convertImageToBase64 = async (imageUrl) => {
  const response = await fetch(imageUrl);
  const blob = await response.blob();

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

const gerarConfirmacaoPDF = async (pedido, loja) => {
  if (!pedido || !loja) {
    console.error('Pedido ou loja indefinido.');
    return;
  }

  const doc = new jsPDF();

  const corPrimaria = loja.cor_primaria || '#4287f5';
  const corSecundaria = loja.cor_secundaria || '#07c5f5';

  // Cabeçalho com nome da loja
  doc.setFillColor(corPrimaria);
  doc.rect(0, 0, 210, 30, 'F');
  doc.setTextColor('#ffffff');
  doc.setFontSize(18);
  doc.text(loja.nome_fantasia, 105, 20, { align: 'center' });

  // Foto da loja, se houver
  if (loja.foto_loja) {
    try {
      const imgBase64 = await convertImageToBase64(loja.foto_loja);
      doc.addImage(imgBase64, 'JPEG', 10, 5, 20, 20);
    } catch (e) {
      console.warn('Erro ao carregar imagem da loja:', e);
    }
  }

  let y = 40;

  // Cartão de informações do pedido
  doc.setFillColor(corPrimaria);
  doc.roundedRect(10, y, 190, 40, 5, 5, 'F');

  doc.setTextColor('#000000');
  doc.setFontSize(12);
  doc.text(`Pedido nº: ${pedido.id}`, 15, y + 10);
  doc.text(`Data: ${pedido.data}`, 15, y + 18);
  doc.text(`Total: R$ ${Number(pedido.total).toFixed(2)}`, 15, y + 26);
  doc.text(`Status: ${pedido.status === 1 ? 'Confirmado' : 'Aguardando'}`, 15, y + 34);
  y += 50;
  doc.text(`Observações: ${pedido.observacoes || 'Nenhuma'}`, 15, y);
  y += 10;

  // Produtos
  for (const produto of pedido.produtos || []) {
    if (y > 260) {
      doc.addPage();
      y = 20;
    }

    // Caixa rosa claro para cada produto
    doc.setFillColor(corPrimaria);
    doc.roundedRect(40, y, 155, 28, 10, 10, 'F');

    // Imagem do produto
    if (produto.image) {
      try {
        const imgBase64 = await convertImageToBase64(produto.image);
        doc.addImage(imgBase64, 'JPEG', 12, y + 2, 24, 24);
      } catch (err) {
        console.warn('Erro ao carregar imagem do produto:', produto.image);
      }
    }

    // Texto do produto
    doc.setTextColor('#000000');
    doc.setFontSize(10);
    const linhaY = y + 8;
    doc.text(`Produto: ${produto.nome}`, 45, linhaY);
    doc.text(`Qtd: ${produto.quantidade}`, 45, linhaY + 6);
    doc.text(`Preço: R$ ${produto.preco_unitario.toFixed(2)}`, 45, linhaY + 12);
    doc.text(`Subtotal: R$ ${(produto.quantidade * produto.preco_unitario).toFixed(2)}`, 120, linhaY + 12);

    y += 38;
  }

  // Rodapé
  const dataAgora = new Date().toLocaleString('pt-BR');
  doc.setFontSize(8);
  doc.setTextColor(corSecundaria);
  doc.text(`Gerado em: ${dataAgora}`, 15, 290);

  doc.save(`pedido-${pedido.id}.pdf`);
};



  if (!slug) return <p className="text-black text-center mt-10">Carregando...</p>;

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Barra superior */}
      <header className="bg-blue-300 text-white px-4 py-3 flex items-center justify-center shadow">
        <h1 className="text-xl font-bold">Seus pedidos em {slug}</h1>
      </header>

      {/* Conteúdo principal */}
      <main className="flex-1 p-4 flex flex-col items-center">
        {pedidos.length === 0 ? (
          <p className="text-black text-center text-lg mt-10">Você ainda não fez pedidos.</p>
        ) : (
          <div className="flex flex-col items-center gap-4 w-full max-w-md">
            {pedidos.map((pedido) => (
              <div
                key={pedido.id}
                className="bg-white border border-gray-300 rounded-md p-4 w-full text-black shadow"
              >
                <p><strong>Data:</strong> {pedido.data}</p>
                <p><strong>Total:</strong> R$ {(Number(pedido.total) || 0).toFixed(2)}</p>
                <p><strong>Status:</strong> {traduzirStatus(pedido.status)}</p>
                <p><strong>Observações:</strong> {pedido.observacoes || 'Nenhuma'}</p>

                <button
                  onClick={() => gerarConfirmacaoPDF(pedido, loja)}
                  className="mt-2 px-4 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                  disabled={!loja} // desabilita até loja estar carregada
                >
                  Baixar Confirmação
                </button>
              </div>
            ))}
          </div>
        )}
      </main>

      <NavBar site={slug} />
    </div>
  );
}
