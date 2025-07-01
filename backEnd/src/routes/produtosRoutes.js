// backend/src/routes/produtosRoutes.js
import express from 'express';
import * as produto from '../controllers/produto/ProdutoController.js';
import multer from 'multer';
import { routePrivate } from '../middleware/protectRoutes.js'; // Seu middleware de autenticação

const router = express.Router();

// Configuração do Multer para upload de imagens
const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
    fileFilter: (req, file, cb) => {
        const filetypes = /jpeg|jpg|png|gif/;
        const extname = filetypes.test(file.originalname.toLowerCase());
        const mimetype = filetypes.test(file.mimetype);
        if (extname && mimetype) {
            cb(null, true);
        } else {
            cb(new Error('Apenas imagens são permitidas!'), false);
        }
    },
});

// ROTAS

// Criar novo produto (privado com upload de imagem)
router.post('/produtos', routePrivate, upload.single('imagem'), produto.criarProduto);

// Listar todos os produtos (pode ser usado para administração, se houver filtro no controller)
router.get('/produtos', produto.getProdutos);

// Buscar um produto por ID
router.get('/produtos/:id', produto.buscarProdutoPorId);

// Atualizar produto por ID (privado)
router.put('/produtos/:id', routePrivate, upload.single('imagem'), produto.atualizarProduto);

// --- ROTAS PARA INATIVAÇÃO/ATIVAÇÃO ---
router.put('/produtos/inativar/:id', routePrivate, produto.inativarProduto);
router.put('/produtos/ativar/:id', routePrivate, produto.ativarProduto);

// Listar produtos por loja (para clientes e para a dashboard)
router.get('/produtos/loja/:slug', produto.listarProdutosPorLoja);
router.get('/produto/:id', produto.buscarProdutoPorId);

// Listar produtos por empresa (privado)
router.get('/produtos/empresa/:empresaId', routePrivate, produto.listarProdutosPorEmpresa);

// Deletar produto
router.delete('/produtos/excluir/:id', produto.deleteProduto);

// Ajustar estoque
router.put('/produtos/estoque/:id', produto.ajustarEstoqueProduto);

// --- AVALIAÇÕES (NOVO) ---
router.post('/produto/:id/avaliacao', produto.inserirAvaliacao);
router.get('/produto/:id/avaliacoes', produto.listarAvaliacoesPorProduto);

export default router;
