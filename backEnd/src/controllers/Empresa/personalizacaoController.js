// backend/controllers/Empresa/personalizacaoController.js

import supabase from '../../config/SupaBase.js'; // Ajuste o caminho se necessário
import * as LojaModel from '../../models/Loja.js'; // Importe o modelo de loja
import * as ImageModel from '../../models/ImageModel.js'; // Importe o ImageModel (presumindo que está aqui)

export const criarPersonalizacao = async (req, res) => {
    console.log("Controller: Chamando criarPersonalizacao.");
    // id_empresa NÃO deve vir do req.body. Ele vem do middleware (req.Id)
    const {
        nome_fantasia,
        slogan,
        cor_primaria,
        cor_secundaria,
        ativarFidelidade,
        valorPonto,
        // Remover id_empresa do req.body: id_empresa, // NÃO DESESTRUTURE ISSO DO REQ.BODY
        banner: bannerFile, // arquivo Multer
        foto_loja: fotoLojaFile // arquivo Multer
    } = req.body;

    // ID da empresa autenticada é o que vem do middleware (confiável)
    const id_empresa_autenticada = req.Id; 
    console.log('criarPersonalizacao: ID da empresa autenticada:', id_empresa_autenticada);

    if (!id_empresa_autenticada) {
        return res.status(401).json({ mensagem: 'Não autorizado: ID da empresa não fornecido pelo token.' });
    }
    if (!nome_fantasia) {
        return res.status(400).json({ mensagem: 'Nome fantasia é obrigatório.' });
    }

    try {
        // Verifica se já existe uma loja para este id_empresa
        const { data: existingLoja, error: checkError } = await supabase
            .from('loja')
            .select('id')
            .eq('id_empresa', id_empresa_autenticada) // Usa o ID autenticado
            .single();

        if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows found
            console.error('Controller: Erro ao verificar loja existente:', checkError.message);
            throw checkError;
        }
        if (existingLoja) {
            return res.status(409).json({ mensagem: 'Esta empresa já possui uma loja configurada.' });
        }

        // Gera o slug
        const slug_loja = nome_fantasia.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

        // Salva a imagem da foto da loja (se houver)
        let fotoLojaUrl = null;
        if (fotoLojaFile) {
            // Assumindo que ImageModel.salvarImagem recebe id_empresa para bucket pathing ou RLS
            fotoLojaUrl = await ImageModel.salvarImagem(fotoLojaFile.buffer, fotoLojaFile.originalname, fotoLojaFile.mimetype, id_empresa_autenticada); 
            if (!fotoLojaUrl) {
                return res.status(500).json({ mensagem: 'Erro ao salvar imagem da loja.' });
            }
        }

        // Salva a imagem do banner (se houver)
        let bannerUrl = null;
        if (bannerFile) {
            bannerUrl = await ImageModel.salvarImagem(bannerFile.buffer, bannerFile.originalname, bannerFile.mimetype, id_empresa_autenticada);
            if (!bannerUrl) {
                return res.status(500).json({ mensagem: 'Erro ao salvar imagem do banner.' });
            }
        }

        // Insere a nova loja no Supabase
        const { data: novaLoja, error: insertError } = await supabase
            .from('loja')
            .insert({
                nome_fantasia,
                slug_loja,
                id_empresa: id_empresa_autenticada, // Usa o ID da empresa autenticada
                foto_loja: fotoLojaUrl,
                cor_primaria,
                cor_secundaria,
                slogan,
                banner: bannerUrl,
                ativarFidelidade,
                valorPonto,
                level_tier: 'Nenhum' // Define o nível inicial da loja
            })
            .select('id, slug_loja') // Retorna o ID e slug da loja criada
            .single();

        if (insertError) {
            console.error('Controller: Erro ao criar loja:', insertError.message);
            return res.status(500).json({ mensagem: 'Erro ao criar loja.', erro: insertError.message });
        }

        // --- NOVO: Pré-popular conquistas para a nova loja ---
        const novaLojaId = novaLoja.id;
        console.log(`DEBUG_PERSONALIZACAO: Pré-populando conquistas para nova loja ID: ${novaLojaId}`);

        const { data: allAchievements, error: fetchAchievementsError } = await supabase
            .from('achievements')
            .select('id'); // Busca apenas os IDs das definições de conquistas

        if (fetchAchievementsError) {
            console.error('DEBUG_PERSONALIZACAO: Erro ao buscar definições de conquistas para pré-popular:', fetchAchievementsError.message);
            // Escolha se quer falhar a criação da loja ou apenas logar e continuar
            // Por enquanto, vamos apenas logar e permitir a criação da loja
        } else if (allAchievements && allAchievements.length > 0) {
            const achievementsToInsert = allAchievements.map(ach => ({
                loja_id: novaLojaId, // ID da loja para esta conquista
                achievement_id: ach.id, // ID da conquista
                current_progress: 0,
                completed_at: null,
                last_reset_at: null,
                owner_id: id_empresa_autenticada // Mantém owner_id se você o tiver na owner_achievements
            }));

            const { error: insertAchievementsError } = await supabase
                .from('owner_achievements')
                .insert(achievementsToInsert);

            if (insertAchievementsError) {
                console.error('DEBUG_PERSONALIZACAO: Erro ao pré-popular owner_achievements:', insertAchievementsError.message);
            } else {
                console.log(`DEBUG_PERSONALIZACAO: ${achievementsToInsert.length} conquistas pré-populadas para loja ${novaLojaId}.`);
            }
        } else {
            console.log('DEBUG_PERSONALIZACAO: Nenhuma definição de conquista encontrada para pré-popular.');
        }
        // --- FIM NOVO: Pré-popular conquistas ---


        return res.status(201).json({
            mensagem: 'Loja criada e personalizada com sucesso!',
            loja: novaLoja
        });

    } catch (error) {
        console.error('Controller: Erro inesperado em criarPersonalizacao:', error);
        return res.status(500).json({
            mensagem: 'Erro interno do servidor ao criar personalização.',
            erro: error.message,
        });
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
        const { nome_fantasia, cor_primaria, cor_secundaria, slogan, foto_loja, slug_loja, banner } = req.body;

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