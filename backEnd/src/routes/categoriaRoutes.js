// backend/src/routes/categoriaRoutes.js

import express from 'express';
import { listarCategoriasPorLoja, criarCategoria, atualizarCategoria, deletarCategoria } from '../controllers/CategoriaController.js';


const router = express.Router();

// Rota para listar categorias de uma loja específica
router.get('/loja/:idLoja', listarCategoriasPorLoja);

// Rota para criar uma nova categoria
router.post('/', criarCategoria);

// Nova rota para atualizar uma categoria existente
router.put('/:id', atualizarCategoria); 

// Nova rota para deletar uma categoria
router.delete('/:id', deletarCategoria); 

export default router;