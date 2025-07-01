import * as PedidoModel from "../../models/PedidoModel.js";
import * as ProdutoModel from"../../models/ProdutoModel.js"
import  OrderCancellationModel from "../../models/OrderCancellationModel.js"
import * as loja  from "../../models/Loja.js";



export const buscarInsightsPorSlug = async (req, res) => {
    const slug = req.params.slug;
    const startDate = req.query.start;
    const endDate = req.query.end;
  
    if (!slug) {
      return res.status(400).json({ mensagem: "Slug não fornecido." });
    }
  
    try {
    let pedidos
    if(!startDate){
         pedidos = await PedidoModel.buscarPedidosPorSlug(slug);

    }
    else{
       
         pedidos = await PedidoModel.buscarPedidosPorSlugAndData(slug , startDate , endDate);
         
    }

      if (!pedidos || pedidos.length === 0) {
        
      return res.status(200).json({
        totalPedidos: 0,
        pedidosConcluidos: 0,
        pedidosCancelados: 0,
        ticketPorData: [],
        top5Produtos: []
      });
      }
  
  
      let ids = pedidos.map(p => p.id);
  
   
      const cancelados = await OrderCancellationModel.getOrdens(ids);
      const pedidosConcluidos = pedidos.filter(
        pedido => !cancelados.some(c => c.order_id === pedido.id)
      );
  

      const ticket = pedidosConcluidos.reduce((acc, pedido) => {
        const data = pedido.data.split('T')[0];
        const valor = pedido.total;
  
        if (!acc[data]) {
          acc[data] = {
            totalReceita: 0,
            totalQuantidade: 0
          };
        }
  
        acc[data].totalReceita += valor;
        acc[data].totalQuantidade += 1;
  
        return acc;
      }, {});
  
      
      const pedido_itens = await PedidoModel.getPedido_itens(ids);
     
      const somados = pedido_itens.reduce((acc, item) => {
        const id = item.produto_id;
        acc[id] = (acc[id] || 0) + item.quantidade ;
        return acc;
      }, {});
      
    
      const agrupados = Object.entries(somados).map(([produto_id, quantidade]) => ({
        produto_id: Number(produto_id),
        quantidade
      }));
  
    
      const top5 = agrupados
        .sort((a, b) => b.quantidade - a.quantidade)
        .slice(0, 5);
  
      const top5ProdutoID = top5.map(p => p.produto_id);
  
   
      const produtos = await ProdutoModel.getProduto(top5ProdutoID);

  
      const produtoAndQuantidade = produtos.flatMap(produto => {
        const relacionado = agrupados.find(p => p.produto_id === produto.id);
        if (relacionado) {
          return { ...relacionado, nome: produto.nome , preco : produto.preco};
        }
        return [];
      });
      const top5ordenado = produtoAndQuantidade.sort((a, b) => b.quantidade - a.quantidade)
     
      return res.status(200).json({
        totalPedidos: pedidos.length,
        pedidosConcluidos: pedidosConcluidos.length,
        pedidosCancelados: pedidos.length - pedidosConcluidos.length,
        ticketPorData: ticket,
        top5Produtos: top5ordenado
      });
  
    } catch (error) {
      console.error("Erro ao buscar insights:", error);
      return res.status(500).json({ mensagem: "Erro interno ao buscar insights." });
    }
  };
  