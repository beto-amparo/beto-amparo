// C:\Users\Dallyla\OneDrive\Área de Trabalho\beto-amparo\beto-amparo\backEnd\src\models\ImageModel.js

import supabase from '../config/SupaBase.js';

const bucket = "imagens";

export async function salvarImagem(buffer, originalName, mimetype, UUID) {
    const pasta = `clientes/${UUID}`;
    const nomeFinal = `${pasta}/${originalName}-${Date.now()}`;

    const { error } = await supabase.storage
      .from(bucket)
      .upload(nomeFinal, buffer, { contentType: mimetype });

    if (error) throw new Error("Erro ao salvar imagem: " + error.message);

    const { data } = supabase.storage.from(bucket).getPublicUrl(nomeFinal);
    return data.publicUrl;
}

export async function deletarImagem(imagePathInStorage) { // Renomeei a prop para clareza
  try {
    // A 'path' que você passa aqui deve ser o caminho relativo dentro do bucket.
    // Ex: 'clientes/5/bife-a-milanesa.jpeg-1748994654189'
    // Se você está passando a URL pública completa, precisa extrair o caminho.
    // Pelo seu log, parece que você está passando a URL completa.
    // Vamos extrair o caminho correto para o Supabase.
    const urlParts = imagePathInStorage.split('/public/imagens/'); // 'imagens' é o nome do seu bucket.
    let pathToRemove = imagePathInStorage; // Valor padrão, caso não seja URL pública

    if (urlParts.length > 1) {
        pathToRemove = urlParts[1]; // Ex: 'clientes/5/bife-a-milanesa.jpeg-1748994654189'
    } else {
        // Se não for uma URL pública do nosso bucket, assume que já é o caminho relativo
        console.warn("ImageModel: deletarImagem recebeu um path que não parece ser uma URL pública completa do bucket 'imagens'. Tentando remover diretamente:", imagePathInStorage);
    }


    const { data, error } = await supabase.storage.from(bucket).remove([pathToRemove]);

    if (error) {
      console.error("ImageModel: Erro ao deletar imagem do Supabase Storage:", error.message);
      // Em vez de throw, retorne um objeto de erro para ser capturado no controller
      return { error: true, message: error.message };
    }

    console.log("ImageModel: Imagem deletada com sucesso:", data);
    return { error: false, message: "Imagem deletada com sucesso" }; // Retorne um objeto de sucesso
  } catch (err) {
    console.error("ImageModel: Erro inesperado em deletarImagem:", err);
    return { error: true, message: err.message }; // Captura erros inesperados
  }
}

export async function getUrlImagem(path) {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}