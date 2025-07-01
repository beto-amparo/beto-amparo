// models/ImageModel.js
import supabase from '../config/SupaBase.js';

export const salvarImagem = async (buffer, nomeArquivo, tipoMime, lojaId) => {
  const { data, error } = await supabase
    .storage
    .from('loja-imagens')
    .upload(`${lojaId}/${Date.now()}-${nomeArquivo}`, buffer, {
      contentType: tipoMime,
      upsert: true,
    });

  if (error) {
    console.error('Erro ao salvar imagem:', error);
    return null;
  }

  const urlPublica = supabase
    .storage
    .from('loja-imagens')
    .getPublicUrl(data.path).publicUrl;

  return urlPublica;
};
