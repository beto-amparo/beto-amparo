// components/ProductFormulario.js
import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';

export default function ProductFormulario({
  initialData = {},
  onSubmit,
  isSaving = false,
  error = null,
  title,
  slug,
}) {
  const [formData, setFormData] = useState({
    nome: '',
    categoria: '',
    novaCategoria: false,
    novaCategoriaTexto: '',
    imagem: null,
    preco: '',
    descricao: '',
  });
  const [tamanhos, setTamanhos] = useState([]);
  const [novoTamanho, setNovoTamanho] = useState('');
  const [quantidade, setQuantidade] = useState('');
  const [controlarEstoque, setControlarEstoque] = useState(true);
  const [imagePreviewUrl, setImagePreviewUrl] = useState(null);

  const [categoriasLoja, setCategoriasLoja] = useState([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);

  useEffect(() => {
    async function fetchCategorias() {
      if (!slug) return;

      setIsLoadingCategories(true);
      try {
        const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

        const lojaIdParaCategorias = initialData.id_loja;
        if (!lojaIdParaCategorias) {
          console.warn("ProductFormulario: ID da loja não disponível para buscar categorias. Certifique-se de passar initialData.id_loja.");
          setIsLoadingCategories(false);
          return;
        }

        const response = await fetch(`${API_BASE_URL}/categorias/loja/${lojaIdParaCategorias}`, {
          credentials: 'include',
        });
        const data = await response.json();
        if (response.ok) {
          setCategoriasLoja(data);
        } else {
          console.error('Erro ao carregar categorias:', data);
          setCategoriasLoja([]);
        }
      } catch (err) {
        console.error('Erro na requisição de categorias:', err);
        setCategoriasLoja([]);
      } finally {
        setIsLoadingCategories(false);
      }
    }
    fetchCategorias();
  }, [slug, initialData.id_loja]);

  useEffect(() => {
    if (initialData && Object.keys(initialData).length > 0) {
      setFormData((prev) => ({
        ...prev,
        nome: initialData.nome || '',
        categoria: initialData.categoria_id || '',
        novaCategoria: false,
        novaCategoriaTexto: '',
        imagem: initialData.image || null,
        preco: initialData.preco !== undefined ? initialData.preco.toString() : '',
        descricao: initialData.descricao || '',
      }));
      setTamanhos(initialData.tamanhos || []);
      setQuantidade(initialData.quantidade !== undefined ? initialData.quantidade.toString() : '');
      setControlarEstoque(initialData.controlar_estoque !== undefined ? initialData.controlar_estoque : true);

      if (initialData.image && typeof initialData.image === 'string') {
        setImagePreviewUrl(initialData.image);
      } else {
        setImagePreviewUrl(null);
      }
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData((prev) => ({
        ...prev,
        imagem: file,
      }));
      setImagePreviewUrl(URL.createObjectURL(file));
    } else {
      setFormData((prev) => ({ ...prev, imagem: null }));
      setImagePreviewUrl(null);
    }
  };

  const handleRemoveImage = () => {
    setFormData(prev => ({ ...prev, imagem: null }));
    setImagePreviewUrl(null);
    const fileInput = document.getElementById('imagemUpload');
    if (fileInput) fileInput.value = '';
  };

  const toggleNovaCategoria = () => {
    setFormData((prev) => ({
      ...prev,
      novaCategoria: !prev.novaCategoria,
      categoria: '',
      novaCategoriaTexto: '',
    }));
  };

  const adicionarTamanho = () => {
    if (novoTamanho.trim() && !tamanhos.includes(novoTamanho.trim().toUpperCase())) {
      setTamanhos([...tamanhos, novoTamanho.trim().toUpperCase()]);
      setNovoTamanho('');
    }
  };

  const removerTamanho = (tamanhoToRemove) => {
    setTamanhos(tamanhos.filter((t) => t !== tamanhoToRemove));
  };

  const toggleControlarEstoque = () => {
    setControlarEstoque(!controlarEstoque);
    if (controlarEstoque) {
      setQuantidade('');
    }
  };


  const handleSubmitInternal = (e) => {
      e.preventDefault();
  
      let currentError = '';
      if (!formData.nome) {
        currentError = 'O nome do produto é obrigatório.';
      } else if (formData.preco === '' || parseFloat(formData.preco) <= 0) {
        currentError = 'O preço deve ser maior que zero.';
      } else if (formData.novaCategoria && !formData.novaCategoriaTexto.trim()) {
        currentError = 'Digite o nome da nova categoria.';
      } else if (
        (!formData.novaCategoria && !formData.categoria)
      ) {
        currentError = 'Selecione uma categoria ou adicione uma nova.';
      } else if (
        ((formData.novaCategoria && formData.novaCategoriaTexto.toLowerCase() === 'roupas') ||
          (!formData.novaCategoria && categoriasLoja.find(cat => cat.id === formData.categoria)?.nome?.toLowerCase() === 'roupas')) &&
        tamanhos.length === 0
      ) {
        currentError = 'Adicione pelo menos um tamanho para roupas.';
      } else if (controlarEstoque && (quantidade === '' || parseInt(quantidade) < 0)) {
        currentError = 'A quantidade em estoque deve ser um número maior ou igual a zero quando o controle de estoque está ativado.';
      }
      // Validação para imagem: Obrigatória apenas na criação, mas não na edição se já existir.
      // Ou se em edição, não tem imagem e não foi removida.
      if (!initialData.id && !formData.imagem) { // Se for novo produto E não tem imagem
          currentError = 'A imagem do produto é obrigatória.';
      } else if (initialData.id && !formData.imagem && !imagePreviewUrl) { // Se for edição E não tem imagem nova E não tem imagem antiga
          currentError = 'A imagem do produto é obrigatória.';
      }
  
      if (currentError) {
        onSubmit(null, currentError);
        return;
      }
  
      const finalFormData = new FormData();
      finalFormData.append('nome', formData.nome);
  
      // Categoria: Enviar o ID da categoria existente ou o texto da nova
      if (formData.novaCategoria) {
          finalFormData.append('novaCategoriaTexto', formData.novaCategoriaTexto);
      } else {
          if (formData.categoria) { // Garante que formData.categoria não é vazio
              finalFormData.append('categoria_id', formData.categoria);
          }
      }
  
      finalFormData.append('preco', parseFloat(formData.preco).toFixed(2));
      finalFormData.append('descricao', formData.descricao);
      finalFormData.append('tamanhos', JSON.stringify(tamanhos));
      finalFormData.append('controlar_estoque', controlarEstoque.toString());
      finalFormData.append('quantidade', controlarEstoque ? (parseInt(quantidade) || 0).toString() : '0');
  
      // ADIÇÃO MAIS IMPORTANTE: Envia o ID da loja para o backend
      if (initialData.id_loja) {
          finalFormData.append('id_loja', initialData.id_loja.toString()); // Garante que o ID da loja é enviado
      } else {
          console.warn('ProductFormulario: initialData.id_loja não está disponível para envio. Certifique-se de que a página pai o está passando.');
          // Se id_loja for estritamente obrigatório no backend, você pode querer adicionar um `currentError` aqui também.
      }
  
  
      // Lógica para lidar com a imagem (novo upload, existente, ou removida)
      if (formData.imagem instanceof File) {
          finalFormData.append('imagem', formData.imagem);
      } else if (initialData.image && formData.imagem === null && !imagePreviewUrl) { // Se existia imagem e foi removida manualmente (via trash icon)
          finalFormData.append('removerImagemExistente', 'true');
      }
      // Se initialData.image existe e formData.imagem não é um File (ou seja, não foi alterado), não precisamos fazer nada.
      // O backend irá manter a imagem existente se nenhum novo arquivo for enviado.
  
      if (slug) {
        finalFormData.append('slug_loja', slug);
      }
  
      // Para edição de produto, você PRECISA enviar o ID do produto
      if (initialData.id) {
          finalFormData.append('produto_id', initialData.id);
      }
  
      for (let pair of finalFormData.entries()) {
        console.log(pair[0]+ ': ' + pair[1]);
      }
      onSubmit(finalFormData);
    };

  return (
    <div className="p-8 max-w-4xl mx-auto bg-white rounded-lg shadow-md min-h-[600px]">
      <h1 className="text-3xl font-bold text-[#3681B6] mb-6">{title}</h1>

      {error && (
        <div className="text-center p-4 mb-4 bg-red-100 text-red-700 rounded-md font-semibold">
          Erro: {error}
        </div>
      )}

      <form onSubmit={handleSubmitInternal} className="space-y-4 text-black">
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

        {/* Categoria */}
        <div>
          <label htmlFor="categoria" className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
          {formData.novaCategoria ? (
            <input
              type="text"
              id="novaCategoriaTexto"
              name="novaCategoriaTexto"
              value={formData.novaCategoriaTexto}
              onChange={handleChange}
              placeholder="Nova categoria"
              className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3681B6]"
              required
            />
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
              {isLoadingCategories ? (
                <option disabled>Carregando categorias...</option>
              ) : (
                categoriasLoja.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.nome}
                  </option>
                ))
              )}
            </select>
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
              {formData.imagem instanceof File ? formData.imagem.name : (imagePreviewUrl ? 'Imagem atual selecionada' : 'Nenhum arquivo escolhido')}
            </span>
          </div>
          <input
            id="imagemUpload"
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />
          {imagePreviewUrl && (
            <div className="mt-4 relative">
              <Image
                src={imagePreviewUrl}
                alt="Preview da Imagem"
                width={200}
                height={200}
                className="max-h-48 rounded-xl object-contain border border-gray-300 w-full"
                onError={(e) => { e.target.src = '/placeholder.png'; e.target.alt = 'Erro ao carregar imagem'; }}
                unoptimized
              />
              <button
                type="button"
                onClick={handleRemoveImage}
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
        {(formData.novaCategoria && formData.novaCategoriaTexto?.toLowerCase() === 'roupas') ||
         (!formData.novaCategoria && categoriasLoja.find(cat => cat.id === formData.categoria)?.nome?.toLowerCase() === 'roupas') ? (
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
                name="novoTamanho"
                value={novoTamanho}
                onChange={(e) => setNovoTamanho(e.target.value)}
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
        ) : null}

        {/* Controlar Estoque */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Controlar Estoque
          </label>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="controlarEstoque"
              name="controlarEstoque"
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
              name="quantidade"
              value={quantidade}
              onChange={(e) => setQuantidade(e.target.value)}
              min="0"
              className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3681B6]"
              placeholder="Ex: 20"
              required
            />
          </div>
        )}

        {/* Botões de Ação */}
        <div className="flex justify-end gap-4">
          <Link href={`/empresa/${slug}/produtos`} className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 transition duration-200">
            Cancelar
          </Link>
          <button
            type="submit"
            className="w-full p-3 rounded-xl text-white font-medium hover:opacity-90 transition cursor-pointer"
            style={{ backgroundColor: '#3681B6' }}
            disabled={isSaving}
          >
            {isSaving ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </form>
    </div>
  );
}