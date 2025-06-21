import supabase from '../../config/SupaBase.js';
import dotenv from 'dotenv';
import * as LojaModel from '../../models/Loja.js';
dotenv.config();

export const criarPersonalizacao = async (req, res) => {
  try {
    // --- ALTERAÇÃO AQUI: Adicione idEmpresa ao req.body ---
    const { nomeFantasia, corPrimaria, corSecundaria, slogan, fotoLoja, slugLoja, idEmpresa, tema_visual } = req.body;
    // --- FIM DA ALTERAÇÃO ---
    console.log('criarPersonalizacao: Dados recebidos no req.body:', req.body); // ADICIONE ESTE LOG
    console.log('criarPersonalizacao: ID da empresa recebido:', idEmpresa); // ADICIONE ESTE LOG
    // Verificar se o slug já existe
    const { data: existingStore, error: checkError } = await supabase
      .from('loja')
      .select('slug_loja')
      .eq('slug_loja', slugLoja)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Erro no Supabase ao verificar slug existente:', checkError.message);
      return res.status(500).json({ message: 'Erro interno ao verificar o link.', error: checkError.message });
    }
    if (existingStore) {
      return res.status(400).json({ message: 'Este link já está em uso. Por favor, escolha outro.' });
    }

    // Inserir nova personalização
    const { data, error } = await supabase
      .from('loja')
      .insert({
        nome_fantasia: nomeFantasia,
        cor_primaria: corPrimaria,
        cor_secundaria: corSecundaria,
        slogan: slogan || null,
        foto_loja: fotoLoja || null,
        slug_loja: slugLoja,
        // --- ALTERAÇÃO AQUI: Adicione id_empresa na inserção ---
        id_empresa: idEmpresa, // Certifique-se de que o nome da coluna no seu DB é 'id_empresa'
        // --- FIM DA ALTERAÇÃO ---
        tema_visual: tema_visual,
      })
      .select();

    if (error) {
      console.error('Erro ao inserir personalização:', error.message);
      return res.status(500).json({ message: 'Erro ao salvar personalização', error: error.message });
    }

    return res.status(201).json(data[0]);
  } catch (error) {
    console.error('Erro inesperado em criarPersonalizacao:', error.message);
    return res.status(500).json({ message: 'Erro ao salvar personalização', error: error.message });
  }
};

export const verificarSlug = async (req, res) => {
  try {
    const { slug } = req.query;

    if (!slug || !/^[a-z0-9-]+$/.test(slug)) {
      return res.status(400).json({ message: 'Slug inválido. Use apenas letras minúsculas, números e hífens.' });
    }

    const { data, error } = await supabase
      .from('loja') 
      .select('slug_loja') 
      .eq('slug_loja', slug)
      .single();

    if (error && error.code !== 'PGRST116') {
      // Se houver qualquer outro erro do Supabase que não seja "nenhum resultado"
      console.error('Erro do Supabase ao verificar slug:', error.message);
      return res.status(500).json({ message: 'Erro interno ao verificar a disponibilidade do link.', error: error.message });
    }

    // Se data for null, significa que não encontrou (ou error.code era PGRST116)
    // Se data não for null, significa que encontrou e o slug já existe
    return res.status(200).json({ exists: !!data, message: data ? 'Este link já está em uso.' : 'Link disponível.' });
  } catch (error) {
    console.error('Erro inesperado ao verificar slug:', error.message);
    return res.status(500).json({ message: 'Erro ao verificar slug', error: error.message });
  }
};

export const getLojaBySlug = async (req, res) => {
  try {
      const { slug } = req.params;
      console.log('Controller: getLojaBySlug recebido para slug:', slug); // <-- NOVO LOG

      if (!slug) {
          return res.status(400).json({ mensagem: 'Slug da Loja não fornecido.' });
      }

      // Chama a função do modelo para buscar a Loja completa
      const { data: Loja, error: modelError } = await LojaModel.buscarLojaPorSlugCompleta(slug);
      console.log('Controller: Resultado de buscarLojaPorSlugCompleta:', Loja, modelError); // <-- NOVO LOG

      if (modelError) {
          // Se o modelo retornou um erro (que não seja "não encontrado")
          console.error('PersonalizacaoController: Erro do modelo ao buscar Loja:', modelError);
          // Você pode decidir enviar uma mensagem de erro mais genérica aqui
          return res.status(500).json({ mensagem: 'Erro ao buscar dados da Loja.', erro: modelError });
      }

      if (!Loja) {
          // Se o modelo retornou data: null (Loja não encontrada)
          console.log('PersonalizacaoController: Loja não encontrada para o slug:', slug);
          return res.status(404).json({ mensagem: 'Loja não encontrada com o identificador fornecido.' });
      }

      console.log('PersonalizacaoController: Loja encontrada, retornando dados.');
      return res.status(200).json(Loja); // Retorna o objeto completo da Loja

  } catch (err) {
      console.error('PersonalizacaoController: Erro inesperado em getLojaBySlug:', err.message);
      return res.status(500).json({ mensagem: 'Erro interno do servidor.', erro: err.message });
  }
};

export const atualizarPersonalizacao = async (req, res) => {
  try {
    const { slug } = req.params;
    const { nome_fantasia, cor_primaria, cor_secundaria, slogan, foto_loja, slug_loja, banner, tema_visual } = req.body;

    if (!slug) {
      return res.status(400).json({ mensagem: 'Slug da Loja não fornecido.' });
    }

    // Atualiza a Loja com base no slug
    const { data, error } = await supabase
      .from('loja')
      .update({
        nome_fantasia: nome_fantasia,
        cor_primaria: cor_primaria,
        cor_secundaria: cor_secundaria,
        slogan: slogan || null,
        foto_loja: foto_loja || null,
        slug_loja: slug_loja,
        banner: banner,
        tema_visual: tema_visual,
      })
      .eq('slug_loja', slug)
      .select()
      .single();

    if (error) {
      console.error('Erro ao atualizar Loja:', error.message);
      return res.status(500).json({ mensagem: 'Erro ao atualizar personalização da Loja.', erro: error.message });
    }

    if (!data) {
      return res.status(404).json({ mensagem: 'Loja não encontrada com o slug fornecido.' });
    }

    return res.status(200).json({ mensagem: 'Personalização atualizada com sucesso.', Loja: data });
  } catch (err) {
    console.error('Erro inesperado ao atualizar Loja:', err.message);
    return res.status(500).json({ mensagem: 'Erro interno do servidor.', erro: err.message });
  }
};


