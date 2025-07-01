import express from 'express';
import {
    listarPedidosPorEmpresa,
    criarPedido,
    getPedidoPorId,
    adicionarItemPedido,
    finalizarPedido,
    getHistoricoPedidos,
    getDadosGraficoVendas,
    getItensDoPedido,
    listarPedidosPorCliente,
    atualizarStatusPedido,
    listarTodosPedidosDaLoja,
    cancelarPedidoDireto
} from '../controllers/pedidoController.js';

const router = express.Router();

router.get('/loja/:slug/pedidos/cliente/:clienteId', listarPedidosPorCliente);
router.get('/loja/:slugLoja/pedidos', listarTodosPedidosDaLoja);
router.get('/loja/:slug/pedidos/:pedidoId', getPedidoPorId);
router.get('/pedidos/:idPedido/itens', getItensDoPedido);
router.put('/pedidos/:idPedido/status', atualizarStatusPedido);
router.put('/pedidos/:idPedido/cancelar-direto', cancelarPedidoDireto); 
router.post('/loja/:slug/pedidos', criarPedido);
router.post('/loja/:slug/pedidos/item', adicionarItemPedido);
router.put('/loja/:slug/pedidos/:idPedido/finalizar', finalizarPedido);

router.get('/pedidos/historico/loja/:slugLoja', getHistoricoPedidos);
router.get('/pedidos/grafico/loja/:slugLoja', getDadosGraficoVendas);

export default router;