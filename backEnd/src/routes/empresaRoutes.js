import express from 'express';
import supabase from '../config/SupaBase.js';
import * as empresaController from '../controllers/EmpresaController.js';

const router = express.Router();

router.post('/addEmpresa', async (req, res) => {
  try {
    const dados = req.body;
    console.log('Dados recebidos:', dados);

    const { data, error } = await supabase
      .from('empresas') // nome exato da tabela no Supabase
      .insert([dados]);

    if (error) {
      console.error('Erro Supabase:', error);
      return res.status(500).json({ mensagem: 'Erro ao salvar no Supabase', erro: error.message });
    }

    res.status(201).json({ mensagem: 'Empresa cadastrada com sucesso!', data });
  } catch (error) {
    console.error('Erro geral:', error);
    res.status(500).json({ mensagem: 'Erro no servidor.', erro: error.message });
  }
});

// Rota para buscar o primeiro nome da tabela empresas
router.get('/getNome', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('empresas')
      .select('responsavel')
      .limit(1)
      .single(); // Garante que apenas um registro seja retornado

    if (error) {
      console.error('Erro ao buscar nome:', error);
      return res.status(500).json({ error: 'Erro ao buscar nome' });
    }

    if (!data) {
      return res.status(404).json({ error: 'Nenhum nome encontrado' });
    }

    // Extrai o primeiro nome (antes do primeiro espaço)
    const primeiroNome = data.responsavel.split(' ')[0];
    res.json({ primeiroNome });
  } catch (err) {
    console.error('Erro inesperado:', err);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

export default router;
