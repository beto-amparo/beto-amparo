// backend/routes/achievementsRoutes.js
import express from 'express';
import { getOwnerAchievements } from '../controllers/Empresa/AchievementController.js';
// MUDE DE 'routePrivate' PARA SEU MIDDLEWARE ESPECÍFICO DE EMPRESA
import { empresaPrivate } from '../middleware/protectRouterEmpresa.js'; // <--- CORREÇÃO AQUI!

const router = express.Router();

// A rota de conquistas da empresa DEVE usar o middleware 'empresaPrivate'
// para garantir que req.Id contenha o ID da empresa logada.
router.get('/empresa/:slugLoja/achievements', empresaPrivate, getOwnerAchievements); // <--- CORREÇÃO AQUI!

export default router;