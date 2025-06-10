import express from 'express';
import { listarPedidosPorEmpresa, criarPedido, adicionarItemPedido, getHistoricoPedidos, getDadosGraficoVendas } from '../controllers/pedidoController.js';


const router = express.Router();

router.get('/loja/:slug/pedidos', listarPedidosPorEmpresa);
router.post('/loja/:slug/pedidos', criarPedido); 
router.post('/loja/:slug/pedidos/item', adicionarItemPedido);
router.get('/pedidos/historico/loja/:slugLoja', getHistoricoPedidos);
router.get('/pedidos/grafico/loja/:slugLoja', getDadosGraficoVendas);

export default router;
