import express from 'express';
import enviarEmailSuporte from '../controllers/suporteController.js';
import enviarEmailSuporteCliente from '../controllers/suporteController.js';
const router = express.Router();

router.post('/suporte', enviarEmailSuporte);
router.post('/suporte/cliente',  enviarEmailSuporteCliente);


export default router;
