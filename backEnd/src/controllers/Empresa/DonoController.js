import supabase from '../../config/SupaBase.js';
import jwt from 'jsonwebtoken';

class DonoController {
  async getDonoData(req, res) {
    try {
      const { slug } = req.params;

      if (!slug) {
        return res.status(400).json({ error: 'Slug não fornecido' });
      }

      // 🔒 Verifica o token da empresa
      const token = req.cookies?.token_empresa;
      if (!token) {
        return res.status(401).json({ error: 'Token não fornecido' });
      }

      let empresaId;
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        empresaId = decoded.id;
      } catch (err) {
        return res.status(401).json({ error: 'Token inválido ou expirado' });
      }

      // 📦 Busca a loja e a empresa relacionada
      const { data: loja, error: lojaError } = await supabase
        .from('loja')
        .select('*, empresas(*)')
        .eq('slug_loja', slug)
        .single();

      if (lojaError || !loja) {
        return res.status(404).json({ error: 'Loja não encontrada' });
      }

      // 🔐 Validação: loja pertence à empresa logada?
      if (loja.empresas?.id !== empresaId) {
        return res.status(403).json({
          status: 'forbidden',
          title: 'Acesso negado',
          detail: 'Você não tem permissão para acessar os dados desta loja.',
        });
      }



      const { empresas: empresa, ...lojaData } = loja;

      const { data: produtos, error: produtosError } = await supabase
        .from('produto')
        .select('*')
        .eq('id_loja', lojaData.id);

      if (produtosError) {
        return res.status(500).json({ error: 'Erro ao buscar produtos' });
      }

      return res.status(200).json({
        empresa,
        loja: lojaData,
        produtos: produtos ?? [],
      });
    } catch (error) {
      console.error('Erro inesperado:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

}

export default new DonoController();
