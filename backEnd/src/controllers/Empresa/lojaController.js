import { buscarLojaPorSlugCompleta, toggleLojaStatus, updateHorariosLoja, buscarTipoLoja  } from '../../models/Loja.js';
import supabase from '../../config/SupaBase.js';
import bcrypt from 'bcryptjs';


export const getLojaBySlugAndEmpresaController = async (req, res) => {
    const empresaId = req.idEmpresa; 
    const slugLoja = req.params.slugLoja;

    console.log("DEBUG: ID da empresa:", empresaId);
    console.log("DEBUG: Slug da loja:", slugLoja);

    if (!empresaId || !slugLoja) {
        return res.status(400).json({ message: "ID da empresa ou slug da loja não fornecidos." });
    }

    try {
        const { data: loja, error } = await buscarLojaPorSlugCompleta(slugLoja);

        if (error) {
            if (error.code === 'NOT_FOUND') {
                return res.status(404).json({ message: error.message });
            }
            console.error("Erro ao buscar loja por slug:", error.message);
            return res.status(500).json({ message: "Erro interno do servidor ao buscar a loja." });
        }

        if (!loja) {
            return res.status(404).json({ message: "Loja não encontrada para o slug fornecido." });
        }

        if (loja.id_empresa !== empresaId) {
            return res.status(403).json({ message: "Acesso negado: A loja não pertence à empresa autenticada." });
        }

        // Retorna os dados da loja, que agora incluirão 'horarios_funcionamento'
        return res.status(200).json(loja);

    } catch (err) {
        console.error("Erro inesperado no controller ao buscar loja por slug:", err);
        return res.status(500).json({ message: "Erro inesperado do servidor." });
    }
};
export const updateHorariosFuncionamentoController = async (req, res) => {
    const { slugLoja } = req.params;
    const { horarios } = req.body;
    const empresaId = req.idEmpresa;

    console.log('DEBUG: Backend - updateHorariosFuncionamentoController foi chamado.');
    console.log('DEBUG: Backend - req.params.slugLoja:', slugLoja);
    console.log('DEBUG: Backend - req.body:', req.body); // VEJA O OBJETO COMPLETO QUE CHEGOU
    console.log('DEBUG: Backend - req.body.horarios:', horarios); // VEJA O OBJETO HORARIOS ESPECIFICAMENTE

    if (!empresaId) {
        return res.status(403).json({ message: "Acesso negado: Empresa não autenticada." });
    }

    // Validação básica dos dados de horários
    // Você pode adicionar validações mais robustas aqui se necessário
    if (!horarios || typeof horarios !== 'object' || Object.keys(horarios).length === 0) {
        return res.status(400).json({ message: 'Dados de horários inválidos ou ausentes.' });
    }

    try {
        // Opcional, mas recomendado: verificar se a loja existe e pertence à empresa logada.
        // A função `updateHorariosLoja` no modelo não faz essa checagem de propriedade.
        const { data: lojaExistente, error: fetchError } = await buscarLojaPorSlugCompleta(slugLoja);

        if (fetchError || !lojaExistente || lojaExistente.id_empresa !== empresaId) {
            console.error('Erro ou loja não encontrada/não pertence à empresa:', fetchError?.message || 'Loja não encontrada ou acesso não autorizado.');
            return res.status(404).json({ message: 'Loja não encontrada ou você não tem permissão para editar os horários desta loja.' });
        }

        // Chama a função do modelo para atualizar os horários no banco de dados
        const { data, error } = await updateHorariosLoja(slugLoja, horarios);

        if (error) {
            console.error("Erro ao atualizar horários via modelo:", error);
            return res.status(500).json({ message: "Erro ao salvar os horários de funcionamento.", error: error });
        }

        return res.status(200).json({ message: "Horários de funcionamento atualizados com sucesso!", horarios: data.horarios_funcionamento });

    } catch (err) {
        console.error("Erro inesperado no controller ao atualizar horários:", err);
        return res.status(500).json({ message: "Erro inesperado do servidor ao salvar os horários." });
    }
};

export const toggleLojaStatusController = async (req, res) => {
    const { slugLoja } = req.params; // Assume que o slug vem da URL, ex: /loja/ben-burguer/toggle-status
    const { isClosed } = req.body;   // Assume que o novo status (true/false) vem do corpo da requisição

    // Você também pode querer verificar se a loja pertence à empresa logada, usando req.IdEmpresa
    // const empresaId = req.IdEmpresa;
    // const loja = await buscarLojaPorSlugCompleta(slugLoja);
    // if (!loja || loja.id_empresa !== empresaId) { ... return 403 ... }

    if (typeof isClosed !== 'boolean') {
        return res.status(400).json({ message: 'O status isClosed deve ser um valor booleano (true/false).' });
    }

    try {
        const { data, error } = await toggleLojaStatus(slugLoja, isClosed);

        if (error) {
            return res.status(500).json({ message: error });
        }

        return res.status(200).json({
            message: `Status da loja ${data.slug_loja} atualizado para ${data.is_closed_for_orders ? 'Fechada' : 'Aberta'}.`,
            is_closed_for_orders: data.is_closed_for_orders
        });

    } catch (err) {
        console.error("Erro no controller ao alternar status da loja:", err);
        return res.status(500).json({ message: 'Erro interno do servidor ao alternar status da loja.' });
    }
};
export const deletarLoja = async (req, res) => {
    try {
        const { idLoja } = req.params;
        const { password } = req.body;
        const idEmpresaLogado = req.idEmpresa;

        if (!idLoja || !password) {
            return res.status(400).json({ mensagem: 'ID da loja e senha são obrigatórios.' });
        }

        const idLojaNum = parseInt(idLoja, 10);
        if (isNaN(idLojaNum)) {
            return res.status(400).json({ mensagem: 'ID da loja inválido.' });
        }
        
        if (!idEmpresaLogado) {
            return res.status(403).json({ mensagem: 'Acesso não autorizado. ID da empresa logada não disponível.' });
        }

        // 1. Verificar se a loja existe E se ela pertence à empresa do usuário logado
        const { data: lojaData, error: lojaError } = await supabase
            .from('loja')
            .select('id_empresa')
            .eq('id', idLojaNum)
            .eq('id_empresa', idEmpresaLogado)
            .single();

        if (lojaError || !lojaData) {
            console.error('LojaController: Erro ao buscar loja ou não pertence à empresa do usuário logado:', lojaError?.message);
            return res.status(404).json({ mensagem: 'Loja não encontrada ou você não tem permissão para excluí-la.' });
        }

        // 2. Obter as informações da EMPRESA (dono) para verificar a senha
        const { data: empresaData, error: empresaError } = await supabase
            .from('empresas')
            .select('senha') 
            .eq('id', idEmpresaLogado)
            .single();

        if (empresaError || !empresaData) {
            console.error('LojaController: Erro ao buscar dados da empresa/dono para verificação de senha:', empresaError?.message);
            return res.status(401).json({ mensagem: 'Acesso não autorizado: Dados da empresa não encontrados.' });
        }

        // 3. Comparar a senha fornecida com o hash armazenado
        const isPasswordValid = await bcrypt.compare(password, empresaData.senha); 
        if (!isPasswordValid) {
            return res.status(401).json({ mensagem: 'Senha incorreta. Por favor, digite sua senha atual para confirmar.' });
        }

        // --- 4. Excluir dados associados APENAS a ESTA LOJA (ordem importa!) ---
        // A ordem de exclusão deve ser:
        // Dependentes de 'produtos' (se houver, ex: itens_pedido_produto, avaliacoes_produto)
        // Pedidos
        // Carrinhos
        // Produtos
        // Categorias
        // OWNER ACHIEVEMENTS (NOVO!) <-- Esta é a que causa o erro
        // Loja

        // Excluir pedidos relacionados a esta loja
        const { error: pedidosDeleteError } = await supabase.from('pedidos').delete().eq('id_loja', idLojaNum);
        if (pedidosDeleteError) console.error('Erro ao deletar pedidos:', pedidosDeleteError.message);

        // Excluir itens de carrinho relacionados a esta loja
        const { error: carrinhoDeleteError } = await supabase.from('carrinho').delete().eq('loja_id', idLojaNum);
        if (carrinhoDeleteError) console.error('Erro ao deletar carrinho:', carrinhoDeleteError.message);

        // Excluir produtos vinculados a esta loja
        const { error: produtoDeleteError } = await supabase.from('produto').delete().eq('id_loja', idLojaNum);
        if (produtoDeleteError) console.error('Erro ao deletar produtos:', produtoDeleteError.message);

        // Excluir categorias vinculadas a esta loja
        const { error: categoriasDeleteError } = await supabase.from('categorias').delete().eq('loja_id', idLojaNum);
        if (categoriasDeleteError) console.error('Erro ao deletar categorias:', categoriasDeleteError.message);

        // NOVO: Excluir conquistas do proprietário vinculadas a esta loja
        // A coluna de ligação na tabela 'owner_achievements' é 'loja_id' (conforme o nome da constraint)
        const { error: achievementsDeleteError } = await supabase.from('owner_achievements').delete().eq('loja_id', idLojaNum);
        if (achievementsDeleteError) console.error('Erro ao deletar conquistas do proprietário:', achievementsDeleteError.message);


        // --- 5. Finalmente, excluir a loja em si ---
        const { error: deleteLojaError } = await supabase
            .from('loja')
            .delete()
            .eq('id', idLojaNum);

        if (deleteLojaError) {
            console.error('LojaController: Erro no Supabase ao deletar loja:', deleteLojaError.message);
            return res.status(500).json({ mensagem: 'Erro ao deletar a loja. Tente novamente.' });
        }
        
        return res.status(200).json({ mensagem: 'Loja e dados associados excluídos com sucesso. Você ainda pode acessar outras lojas ou criar uma nova.' });

    } catch (err) {
        console.error('LojaController: Erro inesperado ao deletar loja:', err.message);
        return res.status(500).json({ mensagem: 'Erro interno do servidor ao encerrar a conta da loja.', erro: err.message });
    }
};
export const getOutrasLojasDaMesmaEmpresa = async (req, res) => {
    const { idEmpresa, currentLojaSlug } = req.query; // Recebe o ID da empresa e o slug da loja atual

    if (!idEmpresa) {
        return res.status(400).json({ mensagem: 'ID da empresa não fornecido.' });
    }

    try {
        const { data, error } = await supabase
            .from('loja')
            .select('nome_fantasia, slug_loja, foto_loja') // Selecione apenas os campos necessários
            .eq('id_empresa', idEmpresa) // Filtra pelo ID da empresa
            .neq('slug_loja', currentLojaSlug); // Exclui a loja atual

        if (error) {
            console.error('Erro ao buscar outras lojas da mesma empresa:', error.message);
            return res.status(500).json({ mensagem: 'Erro ao buscar outras lojas.', erro: error.message });
        }

        if (!data || data.length === 0) {
            return res.status(200).json({ mensagem: 'Nenhuma outra loja encontrada para esta empresa.', lojas: [] });
        }

        return res.status(200).json({ lojas: data });

    } catch (err) {
        console.error('Erro inesperado em getOutrasLojasDaMesmaEmpresa:', err.message);
        return res.status(500).json({ mensagem: 'Erro interno do servidor.' });
    }
};
export const updateVisibilidadeOutrasLojasController = async (req, res) => {
    const { slugLoja } = req.params;
    const { mostrar_outras_lojas } = req.body;
    const empresaId = req.idEmpresa; // Assegure-se de que o middleware empresaPrivate esteja rodando

    if (typeof mostrar_outras_lojas !== 'boolean') {
        return res.status(400).json({ mensagem: 'O valor de "mostrar_outras_lojas" deve ser booleano.' });
    }

    try {
        // Primeiro, verifique se a loja existe e pertence à empresa logada
        const { data: lojaExistente, error: fetchError } = await supabase
            .from('loja')
            .select('id_empresa')
            .eq('slug_loja', slugLoja)
            .single();

        if (fetchError || !lojaExistente || lojaExistente.id_empresa !== empresaId) {
            console.error('Erro ou loja não encontrada/não pertence à empresa:', fetchError?.message || 'Loja não encontrada ou acesso não autorizado.');
            return res.status(404).json({ mensagem: 'Loja não encontrada ou você não tem permissão para editar esta loja.' });
        }

        // Atualiza a coluna no Supabase
        const { data, error } = await supabase
            .from('loja')
            .update({ mostrar_outras_lojas: mostrar_outras_lojas })
            .eq('slug_loja', slugLoja)
            .select() // Retorna os dados atualizados
            .single();

        if (error) {
            console.error('Erro ao atualizar visibilidade de outras lojas:', error.message);
            return res.status(500).json({ mensagem: 'Erro ao salvar a configuração de visibilidade.', erro: error.message });
        }

        return res.status(200).json({ mensagem: 'Configuração de visibilidade atualizada com sucesso!', data });

    } catch (err) {
        console.error('Erro inesperado em updateVisibilidadeOutrasLojasController:', err.message);
        return res.status(500).json({ mensagem: 'Erro interno do servidor.' });
    }
};


export const tipoLoja = async (req, res) => {
    try {
      const slug = req.params.slug;
  
      if (!slug) {
        return res.status(400).json({ message: 'Slug não enviado.' });
      }
  
      const tipo = await buscarTipoLoja(slug);
  
      if (!tipo) {
        return res.status(404).json({ message: 'Tipo de loja não encontrado para o slug informado.' });
      }
  
      return res.status(200).json(tipo[0]);
    } catch (error) {
      console.error('Erro ao buscar tipo da loja:', error);
      return res.status(500).json({ message: 'Erro interno ao buscar o tipo da loja.' });
    }
  };
  
