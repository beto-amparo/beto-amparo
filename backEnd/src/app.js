import express from 'express';
import dotenv from 'dotenv';
import empresaRoutes from './routes/empresaRoutes.js';
import produtosRoutes from './routes/produtosRoutes.js';
import clienteRoutes from './routes/clienteRoutes.js';
import carrinhoRoutes from './routes/carrinhoRoutes.js';
import lojaRoutes from './routes/lojaRoutes.js';
import pedidoRoutes from './routes/pedidoRoutes.js';
import enderecoRoutes from './routes/enderecoRoutes.js';
import categoriaRoutes from './routes/categoriaRoutes.js';
import donoRoutes from './routes/donoRoutes.js';
import orderCancellationRoutes from './routes/orderCancellationRoutes.js';
import achievementsRoutes from './routes/achievementsRoutes.js';
import suporteRoutes from './routes/suporteRoutes.js';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import cookieParser from "cookie-parser";
import cron from 'node-cron'; 
import supabase from './config/SupaBase.js';

// Importe AMBAS as funções de Cron Job
import { checkWeeklyRevenue, checkBestSellingProduct } from '../cron/missionCronJobs.js'; // Ajuste o caminho se necessário

dotenv.config();

const app = express();

app.use(cors({
  origin: true, 
  credentials: true
}));

app.use(cookieParser());
app.use(express.json());

// Configuração do Multer para upload de imagens (mantida)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|gif/;
    const isValid = filetypes.test(path.extname(file.originalname).toLowerCase()) && filetypes.test(file.mimetype);
    if (isValid) cb(null, true);
    else cb(new Error('Apenas imagens são permitidas!'), false);
  },
}).single('image');

app.post('/upload', (req, res) => {
  upload(req, res, async (err) => {
    if (err) return res.status(400).json({ message: err.message });
    const file = req.file;
    const fileName = `${Date.now()}-${file.originalname}`;
    const { data, error } = await supabase.storage
      .from('loja')
      .upload(fileName, file.buffer, {
        contentType: file.mimetype,
      });
    if (error) return res.status(500).json({ message: error.message });
    const { data: publicUrlData } = supabase.storage.from('loja').getPublicUrl(fileName);
    res.json({ message: 'Imagem enviada com sucesso!', url: publicUrlData.publicUrl });
  });
});

// Suas rotas
app.use(empresaRoutes);
app.use(produtosRoutes);
app.use(clienteRoutes);
app.use(pedidoRoutes);
app.use(enderecoRoutes);
app.use(suporteRoutes);
app.use('/loja', carrinhoRoutes);
app.use('/categorias', categoriaRoutes);
app.use('/loja', lojaRoutes);
app.use(lojaRoutes); // Essa linha fica SEMPRE depois de carrinho. Não remova!!! Dallyla aqui
app.use(donoRoutes);
app.use('/order-cancellations', orderCancellationRoutes);
app.use(achievementsRoutes);

app.get('/', (req, res) => {
  res.send('API do Beto Amparo está no ar!');
});

const PORT = process.env.PORT || 4000;

// Inicialize o servidor e chame os cron jobs manualmente para teste
(async () => {
  app.listen(PORT, () => {
    console.log(`Clique no link para abrir: http://localhost:${PORT}`);
  });

  // CHAMADAS MANUAIS PARA TESTE DOS CRON JOBS (APENAS PARA DESENVOLVIMENTO)
  console.log('TESTE MANUAL: Chamando cron jobs de faturamento agora...');
  await checkWeeklyRevenue(); // Teste manual do semanal
  await checkBestSellingProduct(); // Teste manual do mensal
  console.log('TESTE MANUAL: Cron jobs concluídos.');
})();