import express from 'express';
import DonoController from '../controllers/Empresa/DonoController.js';

const router = express.Router();

router.get('/dono/:slug', DonoController.getDonoData.bind(DonoController));

export default router;
