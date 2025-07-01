export const validarProduto = (dados) => {
    const erros = [];

    if (!dados.nome?.trim()) erros.push('O nome do produto é obrigatório.');

    if (!dados.descricao?.trim()) erros.push('A descrição do produto é obrigatória.');
    if (typeof dados.preco !== 'number' || dados.preco <= 0) erros.push('O preço deve ser um número positivo.');

    // --- MUDANÇA AQUI: LINHA REMOVIDA (OU COMENTADA) ---
    // if (!dados.categoria?.trim()) erros.push('A categoria do produto é obrigatória.');

    if (dados.quantidade !== undefined) {
        const quantidadeNum = parseInt(dados.quantidade, 10);
        if (isNaN(quantidadeNum) || quantidadeNum < 0) {
            erros.push('A quantidade deve ser um número inteiro não negativo.');
        }
    }

    return erros.length > 0
        ? { valido: false, erros }
        : { valido: true, erros: null };
};