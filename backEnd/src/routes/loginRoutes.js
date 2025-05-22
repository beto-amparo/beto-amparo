// src/routes/loginRoutes.js
import express from 'express';
import loginController from '../controllers/loginController.js';
const router = express.Router();

// Middleware para log das requisições
router.use((req, res, next) => {
  console.log(`Recebida requisição para: ${req.method} ${req.path}`);
  next();
});

// Rota para autenticação
router.post('/login', loginController.autenticar);
router.post('/login/google', loginController.loginComGoogle);
// Exportação ES Module
export default router;