import express from 'express';
import orderCancellationController from '../controllers/orderCancellationController.js';

const router = express.Router();

// Cliente cria solicitação de cancelamento
router.post('/', orderCancellationController.criar);

// Admin vê todas as solicitações
router.get('/', orderCancellationController.listar);

// Admin atualiza status (aprova/rejeita)
router.put('/:id', orderCancellationController.atualizarStatus);

router.get('/loja/:slug/pendentes', orderCancellationController.listarPendentesPorLoja);

export default router;
