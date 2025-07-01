import supabase from '../../config/SupaBase.js';

export const buscarEnderecoCliente = async (req, res) => {
    try {
        const { clienteId } = req.params;

        const { data, error } = await supabase
            .from('enderecos_entrega')
            .select('*')
            .eq('cliente_id', clienteId);

        if (error) throw error;

        if (!data) {
            return res.status(404).json({ message: 'Endereço não encontrado' });
        }

        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const salvarEnderecoCliente = async (req, res) => {
    try {
        const { clienteId } = req.params;
        const enderecoData = req.body;

        const { data, error } = await supabase
            .from('enderecos_entrega')
            .insert([{ ...enderecoData, cliente_id: clienteId }])
            .select();

        if (error) throw error;

        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const atualizarEnderecoCliente = async (req, res) => {
    try {
        const { clienteId, enderecoId } = req.params;
        const enderecoData = req.body;

        const { data, error } = await supabase
            .from('enderecos_entrega')
            .update(enderecoData)
            .eq('id', enderecoId)
            .eq('cliente_id', clienteId)
            .select();

        if (error) throw error;

        if (!data || data.length === 0) {
            return res.status(404).json({ message: 'Endereço não encontrado' });
        }

        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const deletarEnderecoCliente = async (req, res) => {
    try {
        const { clienteId, enderecoId } = req.params;

        const { error } = await supabase
            .from('enderecos_entrega')
            .delete()
            .eq('id', enderecoId)
            .eq('cliente_id', clienteId);

        if (error) throw error;

        res.status(200).json({ message: 'Endereço deletado com sucesso' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
