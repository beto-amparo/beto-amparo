import express from 'express';
import {
    buscarEnderecoCliente,
    salvarEnderecoCliente,
    atualizarEnderecoCliente,
    deletarEnderecoCliente
} from '../controllers/client/enderecoController.js';

const router = express.Router();

router.get('/clientes/:clienteId/endereco', buscarEnderecoCliente);
router.post('/clientes/:clienteId/endereco', salvarEnderecoCliente);
router.put('/clientes/:clienteId/endereco/:enderecoId', atualizarEnderecoCliente);
router.delete('/clientes/:clienteId/endereco/:enderecoId', deletarEnderecoCliente);



export default router;