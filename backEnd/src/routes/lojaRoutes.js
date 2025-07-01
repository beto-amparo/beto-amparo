import express from 'express';

// Importações do personalizacaoController (criação/verificação de slug)
import { criarPersonalizacao, verificarSlug, getLojaBySlug } from '../controllers/Empresa/personalizacaoController.js'; // getLojaBySlug do personalizacaoController

// Importe o controller de produtos
import { listarProdutosPorLoja } from '../controllers/produto/ProdutoController.js';

// Importe os middlewares de proteção
import { empresaPrivate } from '../middleware/protectRouterEmpresa.js'; 
import { routePrivate } from '../middleware/protectRoutes.js'; // Mantido, caso seja usado em outras partes não mostradas

// Importe outras funções do lojaController (para rotas de gerenciamento interno da loja)
import * as lojaController from '../controllers/Empresa/lojaController.js'; 

// Importe o controller de recomendações
import { buscarRecomendacoes } from '../controllers/recomendacaoController.js';


const router = express.Router();

// Rota GET de teste
router.get('/', (req, res) => {
    res.send('Rota da loja funcionando!');
});

// Rota GET de produtos (exemplo) - se é um mock, remova
router.get('/produtos', (req, res) => {
    res.json([
        { id: 1, nome: 'Produto A' },
        { id: 2, nome: 'Produto B' },
    ]);
});


router.post('/personalizacao', empresaPrivate, criarPersonalizacao); // **RESOLVIDO**: Protegido com empresaPrivate
router.get('/check-slug', verificarSlug); // Verificar disponibilidade de slug

router.get('/slug/:slug', getLojaBySlug); 
router.get('/produtos/loja/:slug', listarProdutosPorLoja);

// Rota para buscar outras lojas da mesma empresa
router.get('/outras-da-empresa', lojaController.getOutrasLojasDaMesmaEmpresa);

router.get('/empresa/loja/:slugLoja', empresaPrivate, lojaController.getLojaBySlugAndEmpresaController);

// Rota para alternar o status de aberto/fechado da loja
router.put('/loja/:slugLoja/toggle-status', empresaPrivate, lojaController.toggleLojaStatusController);

// Rota para atualizar os horários de funcionamento da loja
router.put('/loja/:slugLoja/horarios', empresaPrivate, lojaController.updateHorariosFuncionamentoController);

// Rota para atualizar a visibilidade de outras lojas
router.put('/loja/:slugLoja/visibilidade-outras-lojas', empresaPrivate, lojaController.updateVisibilidadeOutrasLojasController);

// Rota para deletar loja
router.post('/:idLoja/deletar', empresaPrivate, lojaController.deletarLoja); 

// Rota para buscar recomendações
router.get('/:slug/recomendacoes', buscarRecomendacoes);

router.get('/tipoLoja/:slug' , lojaController.tipoLoja)

export default router;