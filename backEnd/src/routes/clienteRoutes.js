// src/routes/clienteRoutes.js
import express from 'express';
import clienteController from '../controllers/client/clienteController.js';
import * as AuthClinteController from "../controllers/client/AuthClinteController.js";

import * as AgendamentoController from"../controllers/client/AgendamentoController.js"
import { clientePrivate } from '../middleware/protectRouterClient.js'; 

const router = express.Router();

router.use((req, res, next) => {
  console.log(`Recebida requisição para: ${req.method} ${req.path}`);
  next();
});


// Rota para listar clientes (opcional)
router.get('/clientes', clienteController.listar);  // Ajuste aqui para '/clientes'

// Rota para obter cliente por ID (opcional)
router.get('/clientes/:id', clienteController.obterPorId);  // Ajuste aqui para '/clientes/:id'

// Rota para atualizar cliente (opcional)
router.put('/clientes/:id', clienteController.atualizar);  // Ajuste aqui para '/clientes/:id'

// Rota para deletar cliente (opcional)
router.delete('/clientes/:id', clienteController.remover);  // Ajuste aqui para '/clientes/:id'

router.put('/clientes/:id/pontos', clienteController.atualizarPontos); 

router.post('/clientes/:id/ganhar-pontos', clienteController.ganharPontos);

router.get('/me', clientePrivate, async (req, res) => {
  try {
    // Se chegou aqui, o middleware 'clientePrivate' já validou o token
    // e adicionou o usuário em 'req.user'.
    res.status(200).json({ cliente: req.user });
  } catch (error) {
    console.error('Erro ao obter cliente autenticado:', error);
    res.status(500).json({ error: 'Erro interno ao obter cliente autenticado' });
  }
});


router.post('/login', AuthClinteController.login); 
router.post('/clientes', AuthClinteController.cadastrar); 
router.get('/clientLogout', AuthClinteController.logout);
router.get('/cliente/me', clientePrivate, clienteController.getMeuPerfil);
router.put('/cliente/me', clientePrivate, clienteController.atualizarMeuPerfil);
router.get('/:slug/Horarios',clientePrivate, AgendamentoController.getHoraririosAgendamentoController);
router.post('/:slug/agendamento', clientePrivate , AgendamentoController.postAgendamentoController);
router.get('/cliente/viewAgendamentos/:slug', clientePrivate , AgendamentoController.getAgendamentoByIdController);
router.put('/cliente/viewAgendamentos/:slug', clientePrivate , AgendamentoController.putAgendamentoCancelamentoController);

export default router;
