// pages/empresa/[slug]/AdicionarProduto.js
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/router';
import Link from 'next/link';
import toast from 'react-hot-toast'; 

export default function AdicionarProduto() {
    const router = useRouter();
    const { slug } = router.query; // Pega o slug da URL para o link de voltar e para a loja

    // --- Novos Estados para Categorias ---
    const [categoriasExistentes, setCategoriasExistentes] = useState([]); // Armazena as categorias carregadas
    const [loadingCategorias, setLoadingCategorias] = useState(true); // Estado de carregamento de categorias
    const [errorCategorias, setErrorCategorias] = useState(null); // Estado de erro de categorias
    const [lojaId, setLojaId] = useState(null); // Precisaremos do ID da loja para associar categorias/produtos

    // --- Estados Existentes (mantidos) ---
    const [tamanhos, setTamanhos] = useState(['P', 'M', 'G']);
    const [novoTamanho, setNovoTamanho] = useState('');
    const [quantidade, setQuantidade] = useState('');
    const [controlarEstoque, setControlarEstoque] = useState(true);
    const [formData, setFormData] = useState({
        nome: '',
        categoria: '', // Será o ID da categoria selecionada ou o nome da nova categoria
        novaCategoria: false,
        novaCategoriaTexto: '',
        imagem: null,
        preco: '',
        descricao: '',
    });
    const [error, setError] = useState(''); // Erro geral do formulário
    const [isLoading, setIsLoading] = useState(false); // Carregamento do submit do produto
    const [isAuthChecking, setIsAuthChecking] = useState(true); // Carregamento da autenticação

    // URL base da sua API backend
    const API_BASE_URL = process.env.NEXT_PUBLIC_EMPRESA_API || 'http://localhost:4000';

    // --- useEffect para Verificar Autenticação (Mantido) ---
    useEffect(() => {
        const checkAuthStatus = async () => {
            console.log('AdicionarProduto - useEffect: Iniciando verificação de autenticação.');
            try {
                const response = await fetch(`${API_BASE_URL}/verifyAuthStatus`, { // Use API_BASE_URL
                    method: 'GET',
                    credentials: 'include',
                });

                if (response.status === 401) {
                    const errorData = await response.json();
                    console.log('AdicionarProduto - useEffect: Resposta 401 do backend:', errorData);
                    const targetUrl = errorData.redirectTo || `/empresa/LoginEmpresa?returnTo=${encodeURIComponent(router.asPath)}`;
                    router.push(targetUrl);
                    return;
                }
                console.log('AdicionarProduto - useEffect: Usuário autenticado.');

                // Se autenticado, buscar o ID da loja associado ao slug
                // Isso é crucial para buscar categorias e adicionar produtos
                const lojaResponse = await fetch(`http://localhost:4000/loja/slug/${slug}`);
                                                                                  // Ou a rota exata que você usa para obter ID da loja por slug, como /loja/slug/:slug
                if (!lojaResponse.ok) {
                    const errorData = await lojaResponse.json();
                    throw new Error(errorData.mensagem || errorData.message || `Erro ao carregar ID da loja: ${lojaResponse.status}`);
                }
                const lojaData = await lojaResponse.json();
                setLojaId(lojaData.id); // Define o ID da loja aqui

            } catch (err) {
                console.error('AdicionarProduto - useEffect: Erro na verificação de autenticação/loja:', err);
                const targetUrl = `/empresa/LoginEmpresa?returnTo=${encodeURIComponent(router.asPath)}`;
                router.push(targetUrl);
            } finally {
                setIsAuthChecking(false);
            }
        };

        if (router.isReady && slug) { // Garante que o router e o slug estão prontos
            checkAuthStatus();
        }
    }, [router, slug]); // Depende do router e do slug

    // --- NOVO useEffect: Buscar Categorias Existentes ---
    useEffect(() => {
        if (!lojaId) return; // Só busca categorias se o ID da loja estiver disponível

        async function fetchCategorias() {
            setLoadingCategorias(true);
            setErrorCategorias(null);
            try {
                // *** ATENÇÃO: VOCÊ PRECISARÁ DESTA ROTA NO SEU BACKEND ***
                // Esta rota deve retornar um array de objetos de categoria para a loja
                const url = `${API_BASE_URL}/categorias/loja/${lojaId}`;
                console.log('AdicionarProduto - Fetching categorias from:', url);
                const response = await fetch(url, {
                    credentials: 'include',
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.mensagem || errorData.message || `Erro ao carregar categorias: ${response.status}`);
                }

                const data = await response.json();
                console.log('AdicionarProduto - Categorias recebidas:', data);
                if (Array.isArray(data)) {
                    setCategoriasExistentes(data);
                } else {
                    console.warn('API de categorias retornou dados não-array. Tratando como vazio.', data);
                    setCategoriasExistentes([]);
                }
            } catch (err) {
                console.error('AdicionarProduto - Erro ao buscar categorias:', err);
                setErrorCategorias(err.message || "Erro ao carregar categorias.");
                setCategoriasExistentes([]); // Garante que é um array vazio em caso de erro
            } finally {
                setLoadingCategorias(false);
            }
        }

        fetchCategorias();
    }, [lojaId]); // Roda quando o ID da loja muda

    // --- Handlers (Mantidos e Ajustados para Categoria) ---
    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));
        setError('');
    };

    const handleImageUpload = (e) => { /* ... inalterado ... */
        const file = e.target.files[0];
        if (file) {
          setFormData((prev) => ({
            ...prev,
            imagem: file,
          }));
        } else {
          setFormData((prev) => ({ ...prev, imagem: null }));
        }
        setError('');
    };

    // Lógica de categorias
    const toggleNovaCategoria = () => {
        setFormData((prev) => ({
            ...prev,
            novaCategoria: !prev.novaCategoria,
            categoria: '', // Limpa a categoria selecionada se for nova
            novaCategoriaTexto: '', // Limpa o texto da nova categoria se for selecionar existente
        }));
        setError('');
    };

    const adicionarTamanho = () => { /* ... inalterado ... */
        if (novoTamanho.trim() && !tamanhos.includes(novoTamanho.trim().toUpperCase())) {
            setTamanhos([...tamanhos, novoTamanho.trim().toUpperCase()]);
            setNovoTamanho('');
        }
    };

    const removerTamanho = (tamanhoToRemove) => { /* ... inalterado ... */
        setTamanhos(tamanhos.filter((t) => t !== tamanhoToRemove));
    };

    const toggleControlarEstoque = () => { /* ... inalterado ... */
        setControlarEstoque(!controlarEstoque);
        if (controlarEstoque) {
            setQuantidade('');
        }
    };

    // --- handleSubmit: Adicionar Produto ---
  
      const handleSubmit = async (e) => {
          e.preventDefault();
          setIsLoading(true);
          setError('');
  
          // --- Início das Validações do Formulário ---
          if (!formData.nome) { setError('O nome do produto é obrigatório.'); setIsLoading(false); return; }
          if (formData.preco === '' || parseFloat(formData.preco) <= 0) { setError('O preço deve ser maior que zero.'); setIsLoading(false); return; }
          if (formData.novaCategoria && !formData.novaCategoriaTexto.trim()) { setError('Digite o nome da nova categoria.'); setIsLoading(false); return; }
          if (!formData.novaCategoria && !formData.categoria) { setError('Selecione uma categoria ou adicione uma nova.'); setIsLoading(false); return; }
          if (((formData.categoria === 'roupas' && !formData.novaCategoria) || (formData.novaCategoria && formData.novaCategoriaTexto.toLowerCase() === 'roupas')) && tamanhos.length === 0) {
              setError('Adicione pelo menos um tamanho para roupas.'); setIsLoading(false); return;
          }
          if (controlarEstoque && (quantidade === '' || parseInt(quantidade) < 0)) { setError('A quantidade em estoque deve ser um número maior ou igual a zero quando o controle de estoque está ativado.'); setIsLoading(false); return; }
          if (!formData.imagem) { setError('A imagem do produto é obrigatória.'); setIsLoading(false); return; }
          if (!lojaId) { setError('Erro: ID da loja não disponível. Tente recarregar a página.'); setIsLoading(false); return; }
          // --- Fim das Validações do Formulário ---
  
          let categoriaIdParaEnviar = null; // Variável para armazenar o ID da categoria final
  
          // --- Lógica para CATEGORIA: Nova ou Existente ---
          try {
              if (formData.novaCategoria) {
                  // Se é uma nova categoria (ou uma que pode já existir), tenta criá-la ou usar a existente
                  const novaCategoriaNome = formData.novaCategoriaTexto.trim();
                  console.log('AdicionarProduto - Criando nova categoria:', novaCategoriaNome, 'para lojaId:', lojaId);
  
                  const createCategoryResponse = await fetch(`${API_BASE_URL}/categorias`, { // Rota para criar categoria
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      credentials: 'include',
                      body: JSON.stringify({ nome: novaCategoriaNome, id_loja: lojaId }),
                  });
  
                  const createdCategoryData = await createCategoryResponse.json();
  
                  // --- INÍCIO DA LÓGICA ATUALIZADA PARA CATEGORIAS REPETIDAS NO FRONTEND ---
                  if (createCategoryResponse.ok) { // response.ok abrange status 200-299
                      if (createCategoryResponse.status === 200 && createdCategoryData.mensagem === 'Categoria já existe.') {
                          console.log('AdicionarProduto - Categoria já existe, usando ID existente:', createdCategoryData.id);
                          toast.error(`Categoria "${novaCategoriaNome}" já existe e será usada.`); // Opcional: avisar o usuário
                      } else {
                          console.log('AdicionarProduto - Nova categoria criada, ID:', createdCategoryData.id);
                        //  alert(`Categoria "${novaCategoriaNome}" criada com sucesso!`); // Opcional: avisar o usuário
                      }
                      categoriaIdParaEnviar = createdCategoryData.id; // Pega o ID (seja novo ou existente)
                  } else {
                      // Se o status não for OK (ex: 400, 500)
                      console.error('AdicionarProduto - Erro ao criar nova categoria:', createdCategoryData);
                      throw new Error(createdCategoryData.mensagem || 'Erro ao criar nova categoria.');
                  }
                  // --- FIM DA LÓGICA ATUALIZADA PARA CATEGORIAS REPETIDAS NO FRONTEND ---
  
              } else {
                  // Se selecionou uma categoria existente no dropdown, usa o ID dela
                  categoriaIdParaEnviar = formData.categoria; // 'categoria' já é o ID da categoria selecionada
                  console.log('AdicionarProduto - Usando categoria existente com ID:', categoriaIdParaEnviar);
              }
          } catch (catError) {
              console.error('AdicionarProduto - Erro no processo de categoria:', catError);
              setError(`Erro ao lidar com a categoria: ${catError.message}`);
              setIsLoading(false);
              return;
          }
  
          // --- Continuação: Enviar Produto ---
          const formDataToSend = new FormData();
          formDataToSend.append('nome', formData.nome);
          formDataToSend.append('categoria_id', categoriaIdParaEnviar); // Agora envia o ID da categoria
          formDataToSend.append('preco', parseFloat(formData.preco).toFixed(2));
          formDataToSend.append('descricao', formData.descricao);
          formDataToSend.append('tamanhos', JSON.stringify(tamanhos));
          formDataToSend.append('controlar_estoque', controlarEstoque.toString());
          formDataToSend.append('quantidade', controlarEstoque ? (parseInt(quantidade) || 0).toString() : '0');
          formDataToSend.append('id_loja', lojaId); // Envia o ID da loja para associar o produto
  
          if (formData.imagem) {
              formDataToSend.append('imagem', formData.imagem);
          }
  
          console.log('AdicionarProduto - Enviando FormData do produto:', Object.fromEntries(formDataToSend));
  
          try {
              console.log('AdicionarProduto - Início da requisição POST para:', `${API_BASE_URL}/produtos`);
              const response = await fetch(`${API_BASE_URL}/produtos`, { // Rota para adicionar produto
                  method: 'POST',
                  credentials: 'include',
                  body: formDataToSend,
              });
              console.log('AdicionarProduto - Resposta recebida. Status:', response.status, 'OK:', response.ok);
  
  
              if (response.status === 401) {
                  const errorData = await response.json();
                  console.log('AdicionarProduto - handleSubmit: Resposta 401 do backend:', errorData);
                  const targetUrl = errorData.redirectTo || `/empresa/LoginEmpresa?returnTo=${encodeURIComponent(router.asPath)}`;
                  router.push(targetUrl);
                  setIsLoading(false);
                  return;
              }
  
              let responseData;
              try {
                  responseData = await response.json();
                  console.log('AdicionarProduto - Resposta JSON do backend:', responseData);
              } catch (jsonError) {
                  const rawText = await response.text();
                  console.error('AdicionarProduto - Erro ao parsear JSON. Resposta bruta:', rawText);
                  throw new Error('Formato de resposta inesperado do servidor.');
              }
              
              if (!response.ok) {
                  const errorMessage = responseData?.mensagem || responseData?.message || 'Erro desconhecido';
                  console.log('AdicionarProduto - handleSubmit: Erro na resposta do backend:', responseData);
                  throw new Error(errorMessage);
              }
  
            //  alert('Produto cadastrado com sucesso!');
              router.push(`/empresa/${slug}/produtos`); // Redireciona para a página de produtos da loja
  
          } catch (error) {
              console.error('AdicionarProduto - handleSubmit: Erro ao enviar os dados:', error);
              setError(`Erro: ${error.message}`);
          } finally {
              setIsLoading(false);
          }
      };

    // Se 'isAuthChecking' é true, mostra uma mensagem de carregamento.
    if (isAuthChecking) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100">
                <p className="text-xl text-[#3681B6]">Verificando autenticação...</p>
            </div>
        );
    }

    // Renderiza o formulário apenas se a autenticação foi verificada
    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4 py-8">
            <div className="bg-white rounded-2xl shadow-lg p-5 w-full sm:max-w-xl relative">
                <Link href={`/empresa/${slug}/produtos`} passHref>
                    <button className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-3xl font-bold p-1 leading-none">
                        &times;
                    </button>
                </Link>

                <div className="flex justify-between items-center mb-3 mt-3">
                    <div className="h-12 object-contain">
                        <Image src="/logo.png" width={80} height={70} alt="Logo da Marca" />
                    </div>
                </div>
                <h1 className="text-2xl sm:text-3xl font-semibold mb-3" style={{ color: '#3681B6' }}>
                    Adicionar Produto
                </h1>

                {error && (
                    <div className="bg-red-100 text-red-700 p-3 rounded-xl mb-4 text-sm">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4 text-black">
                    {/* Nome do Produto */}
                    <div>
                        <label htmlFor="nome" className="block text-sm font-medium text-gray-700 mb-1">Nome do Produto</label>
                        <input
                            type="text"
                            id="nome"
                            name="nome"
                            value={formData.nome}
                            onChange={handleChange}
                            placeholder="Ex: Arroz branco"
                            className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3681B6] text-black placeholder:text-gray-400"
                            required
                        />
                    </div>

                    {/* Categoria - LÓGICA ATUALIZADA AQUI */}
                    <div>
                        <label htmlFor="categoria" className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
                        {formData.novaCategoria ? (
                            <input
                                type="text"
                                id="novaCategoriaTexto"
                                name="novaCategoriaTexto"
                                value={formData.novaCategoriaTexto}
                                onChange={handleChange}
                                placeholder="Nome da nova categoria"
                                className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3681B6]"
                                required
                            />
                        ) : (
                            <>
                                {loadingCategorias ? (
                                    <p className="text-gray-500">Carregando categorias...</p>
                                ) : errorCategorias ? (
                                    <p className="text-red-500">Erro ao carregar categorias: {errorCategorias}</p>
                                ) : (
                                    <select
                                        id="categoria"
                                        name="categoria"
                                        value={formData.categoria}
                                        onChange={handleChange}
                                        className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3681B6]"
                                        required
                                    >
                                        <option value="">Selecione uma categoria</option>
                                        {categoriasExistentes.length > 0 ? (
                                            categoriasExistentes.map(cat => (
                                                <option key={cat.id} value={cat.id}>
                                                    {cat.nome}
                                                </option>
                                            ))
                                        ) : (
                                            <option value="" disabled>Nenhuma categoria disponível</option>
                                        )}
                                    </select>
                                )}
                            </>
                        )}
                        <button
                            type="button"
                            className="text-sm mt-1 hover:underline"
                            style={{ color: '#3681B6' }}
                            onClick={toggleNovaCategoria}
                        >
                            {formData.novaCategoria ? 'Selecionar categoria existente' : 'Adicionar nova categoria'}
                        </button>
                    </div>

                    {/* Imagem do Produto */}
                    <div>
                        <label htmlFor="imagemUpload" className="block text-sm font-medium text-gray-700 mb-1">Imagem</label>
                        <div className="flex items-center gap-4">
                            <label
                                htmlFor="imagemUpload"
                                className="cursor-pointer bg-[#3681B6] text-white px-4 py-2 rounded-xl hover:opacity-90 transition"
                            >
                                Escolher imagem
                            </label>
                            <span className="text-sm text-gray-500">
                                {formData.imagem ? formData.imagem.name || 'Imagem selecionada' : 'Nenhum arquivo escolhido'}
                            </span>
                        </div>
                        <input
                            id="imagemUpload"
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="hidden"
                        />
                        {formData.imagem && (
                            <div className="mt-4 relative">
                                <img
                                    src={URL.createObjectURL(formData.imagem)}
                                    alt="Preview da Imagem"
                                    className="max-h-48 rounded-xl object-contain border border-gray-300 w-full"
                                />
                                <button
                                    type="button"
                                    onClick={() => setFormData((prev) => ({ ...prev, imagem: null }))}
                                    className="absolute top-2 right-2 bg-white border border-gray-300 rounded-full p-1 hover:bg-red-100 transition cursor-pointer"
                                    title="Remover imagem"
                                >
                                    🗑️
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Preço do Produto */}
                    <div>
                        <label htmlFor="preco" className="block text-sm font-medium text-gray-700 mb-1">Preço (R$)</label>
                        <input
                            type="number"
                            id="preco"
                            name="preco"
                            value={formData.preco}
                            onChange={handleChange}
                            step="0.01"
                            min="0.01"
                            placeholder="Ex: 49.90"
                            className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3681B6]"
                            required
                        />
                    </div>

                    {/* Descrição */}
                    <div>
                        <label htmlFor="descricao" className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                        <textarea
                            id="descricao"
                            name="descricao"
                            value={formData.descricao}
                            onChange={handleChange}
                            placeholder="Descreva o produto..."
                            className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3681B6]"
                            rows={4}
                            required
                        ></textarea>
                    </div>

                    {/* Tamanhos Disponíveis (se categoria for roupas) */}
                    {(formData.categoria === categoriasExistentes.find(c => c.nome.toLowerCase() === 'roupas')?.id || // Se 'roupas' for categoria existente selecionada
                      (formData.novaCategoria && formData.novaCategoriaTexto.toLowerCase() === 'roupas')) && ( // Se 'roupas' for a nova categoria
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Tamanhos Disponíveis</label>
                            <div className="flex flex-wrap gap-2 mb-2">
                                {tamanhos.map((t) => (
                                    <div
                                        key={t}
                                        className="flex items-center gap-1 bg-gray-200 px-3 py-1 rounded-full text-sm"
                                    >
                                        {t}
                                        <button
                                            type="button"
                                            onClick={() => removerTamanho(t)}
                                            className="text-red-500 font-bold"
                                        >
                                            ×
                                        </button>
                                    </div>
                                ))}
                            </div>
                            <div className="flex gap-2 mb-4">
                                <input
                                    type="text"
                                    value={novoTamanho}
                                    onChange={(e) => setNovoTamanho(e.target.value.toUpperCase())}
                                    placeholder="Ex: PP, GG"
                                    className="flex-1 p-2 border rounded-xl"
                                />
                                <button
                                    type="button"
                                    onClick={adicionarTamanho}
                                    className="bg-blue-500 text-white px-4 py-2 rounded-xl hover:opacity-90"
                                >
                                    Adicionar
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Controlar Estoque */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Controlar Estoque
                        </label>
                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                checked={controlarEstoque}
                                onChange={toggleControlarEstoque}
                                className="h-4 w-4 text-[#3681B6] border-gray-300 rounded"
                            />
                            <span className="text-sm text-gray-700">
                                {controlarEstoque ? 'Ativado' : 'Desativado'}
                            </span>
                        </div>
                    </div>

                    {/* Quantidade em Estoque (se controlarEstoque ativado) */}
                    {controlarEstoque && (
                        <div>
                            <label htmlFor="quantidade" className="block text-sm font-medium text-gray-700 mb-1">Quantidade em Estoque</label>
                            <input
                                type="number"
                                id="quantidade"
                                value={quantidade}
                                onChange={(e) => setQuantidade(e.target.value)}
                                min="0"
                                className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3681B6]"
                                placeholder="Ex: 20"
                                required
                            />
                        </div>
                    )}

                    <button
                        type="submit"
                        className="w-full p-3 rounded-xl text-white font-medium hover:opacity-90 transition cursor-pointer"
                        style={{ backgroundColor: '#3681B6' }}
                        disabled={isLoading}
                    >
                        {isLoading ? 'Cadastrando...' : 'Cadastrar Produto'}
                    </button>
                </form>
            </div>
        </div>
    );
}