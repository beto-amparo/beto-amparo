// pages/empresa/[slug]/editar-produto/[id].js
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Image from 'next/image'; // Mantido, embora não diretamente usado no JSX principal desta página
import ProductFormulario from 'components/ProductFormulario';
import toast from 'react-hot-toast'; 

export default function EditarProdutoPage() {
    const router = useRouter();
    const { slug, id } = router.query;

    const [productData, setProductData] = useState(null);
    const [isLoadingProduct, setIsLoadingProduct] = useState(true);
    const [isSavingForm, setIsSavingForm] = useState(false);
    const [error, setError] = useState(null);
    const [isAuthChecking, setIsAuthChecking] = useState(true);

    // Defina a URL base da API aqui, se ainda não estiver globalmente disponível
    const API_BASE_URL = process.env.NEXT_PUBLIC_EMPRESA_API || 'http://localhost:4000';

    useEffect(() => {
        const checkAuthStatus = async () => {
            try {
                const response = await fetch(`${API_BASE_URL}/verifyAuthStatus`, {
                    method: 'GET',
                    credentials: 'include',
                });

                if (response.status === 401) {
                    const errorData = await response.json();
                    const targetUrl = errorData.redirectTo || `/empresa/LoginEmpresa?returnTo=${encodeURIComponent(router.asPath)}`;
                    router.push(targetUrl);
                    return;
                }
            } catch (err) {
                const targetUrl = `/empresa/LoginEmpresa?returnTo=${encodeURIComponent(router.asPath)}`;
                router.push(targetUrl);
            } finally {
                setIsAuthChecking(false);
            }
        };

        if (router.isReady) {
            checkAuthStatus();

            if (id) {
                const fetchProduct = async () => {
                    try {
                        setIsLoadingProduct(true);
                        setError(null);

                        const response = await fetch(`${API_BASE_URL}/produtos/${id}`); // Use API_BASE_URL

                        if (!response.ok) {
                            const errorText = await response.text();
                            throw new Error(`Erro ao buscar produto: ${response.status} ${response.statusText} - ${errorText}`);
                        }

                        const data = await response.json();
                        // Importante: A API de produtos deve retornar o id_loja junto com os dados do produto!
                        setProductData(data);

                    } catch (err) {
                        setError(err.message || "Não foi possível carregar os dados do produto.");
                    } finally {
                        setIsLoadingProduct(false);
                    }
                };
                fetchProduct();
            }
        }
    }, [router, id, API_BASE_URL]); // Adicione API_BASE_URL às dependências

    const handleEditProduct = async (formDataToSend, formError) => {
        if (formError) {
            setError(formError);
            toast.error(formError); // Exibe o erro do formulário como toast
            return;
        }
        setError(null);
        setIsSavingForm(true);

        let categoriaIdFinal = null;
        // Pega o nome da nova categoria se ele foi enviado pelo formulário
        const novaCategoriaNome = formDataToSend.get('novaCategoriaTexto');
        
        // Pega o ID da loja dos dados do produto que já foram carregados
        const lojaId = productData?.id_loja; 

        try {
            if (novaCategoriaNome) {
                // Se o usuário digitou um nome para uma nova categoria, primeiro processamos ela
                if (!lojaId) {
                    throw new Error('Erro: ID da loja não disponível para criar nova categoria. Recarregue a página.');
                }
                
                console.log('EditarProdutoPage - Processando categoria: Tentando criar/obter ID de nova categoria:', novaCategoriaNome, 'para lojaId:', lojaId);
                
                // Chamada à API para criar ou obter a categoria existente (igual ao AdicionarProduto.js)
                const createCategoryResponse = await fetch(`${API_BASE_URL}/categorias`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({ nome: novaCategoriaNome, id_loja: lojaId }),
                });

                const createdCategoryData = await createCategoryResponse.json();

                if (createCategoryResponse.ok) {
                    // Se a resposta for OK (200 ou 201), pegamos o ID retornado
                    categoriaIdFinal = createdCategoryData.id;
                    console.log('EditarProdutoPage - Categoria processada com sucesso, ID final:', categoriaIdFinal);
                    // Opcional: toast.success(`Categoria "${novaCategoriaNome}" ${createdCategoryData.mensagem === 'Categoria já existe.' ? 'já existe e foi usada.' : 'criada com sucesso!'}`);
                } else {
                    // Se houver erro na criação/obtenção da categoria, lançamos um erro
                    console.error('EditarProdutoPage - Erro ao criar/obter nova categoria:', createdCategoryData);
                    throw new Error(createdCategoryData.mensagem || 'Erro ao processar nova categoria.');
                }
                
                // Remove o campo 'novaCategoriaTexto' do FormData que será enviado para o produto
                formDataToSend.delete('novaCategoriaTexto');
                // Adiciona o 'categoria_id' com o ID REAL da categoria (criada ou existente)
                formDataToSend.append('categoria_id', categoriaIdFinal);

            } else {
                // Se não é uma nova categoria, usa o categoria_id que já veio do formulário
                categoriaIdFinal = formDataToSend.get('categoria_id');
                if (!categoriaIdFinal) {
                    // Isso deve ser pego pela validação do ProductFormulario, mas é um bom fallback.
                    throw new Error('Erro: Categoria não selecionada.');
                }
                console.log('EditarProdutoPage - Usando categoria existente com ID:', categoriaIdFinal);
            }

            // Agora, com o categoria_id correto, podemos prosseguir com a atualização do produto
            console.log('EditarProdutoPage - Enviando requisição PUT para o produto:', id);
            // DEBUG: Você pode logar o FormData aqui para ver o que está sendo enviado
            // for (let pair of formDataToSend.entries()) {
            //     console.log(pair[0]+ ': ' + pair[1]);
            // }

            const response = await fetch(`${API_BASE_URL}/produtos/${id}`, {
                method: 'PUT',
                body: formDataToSend, // formDataToSend agora tem 'categoria_id' e não 'novaCategoriaTexto'
                credentials: 'include',
            });

            if (response.status === 401) {
                const errorData = await response.json();
                console.log('EditarProdutoPage - handleEditProduct: Resposta 401 do backend:', errorData);
                const targetUrl = errorData.redirectTo || `/empresa/LoginEmpresa?returnTo=${encodeURIComponent(router.asPath)}`;
                router.push(targetUrl);
                setIsSavingForm(false); // Garante que o loading seja desativado antes do redirecionamento
                return;
            }

            let responseData;
            try {
                responseData = await response.json();
                console.log('EditarProdutoPage - Resposta PUT do backend:', responseData);
            } catch (jsonError) {
                const rawText = await response.text();
                console.error('EditarProdutoPage - Erro ao parsear JSON na resposta PUT. Resposta bruta:', rawText);
                throw new Error('Formato de resposta inesperado do servidor ao atualizar produto.');
            }

            if (!response.ok) {
                const errorMessage = responseData?.mensagem || responseData?.message || 'Erro desconhecido';
                console.error('EditarProdutoPage - Erro na resposta do backend (PUT):', responseData);
                throw new Error(errorMessage);
            }

            toast.success("Produto atualizado com sucesso!"); // <--- ADICIONADO: toast de sucesso
            router.push(`/empresa/${slug}/produtos`); // Redireciona após o sucesso

        } catch (err) {
            console.error('EditarProdutoPage - Erro durante a atualização do produto ou categoria:', err);
            setError(`Erro ao salvar produto: ${err.message}`);
            toast.error(`Erro ao salvar produto: ${err.message}`); // Exibe o erro como toast
        } finally {
            setIsSavingForm(false);
        }
    };

    if (isAuthChecking || isLoadingProduct) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100">
                <p className="text-xl text-[#3681B6]">Carregando conteúdo do produto...</p>
            </div>
        );
    }

    if (error && !productData) {
        return (
            <div className="text-center p-8 text-xl text-red-700">
                Erro ao carregar o produto: {error}
                <p className="mt-4">
                    Por favor, <button onClick={() => router.reload()} className="text-[#3681B6] hover:underline">tente recarregar a página</button>.
                </p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4 py-8">
            <div className="bg-white rounded-2xl shadow-lg p-5 w-full sm:max-w-xl">
                <div className="flex justify-between">
                    <div className="h-12 mb-1 object-contain">
                        <Image src="/logo.png" width={80} height={70} alt="Logo da Marca" />
                    </div>
                </div>

                <ProductFormulario
                    title="Editar Produto"
                    initialData={productData || {}}
                    onSubmit={handleEditProduct}
                    isSaving={isSavingForm}
                    error={error}
                    slug={slug}
                />
            </div>
        </div>
    );
}