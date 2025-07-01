import { useEffect, useState } from "react";
import Image from "next/image";
import { FiEdit, FiTrash2, FiChevronDown, FiChevronUp } from "react-icons/fi";
import { useRouter } from "next/router";
import NavBar from "@/components/NavBar"; // Certifique-se de que este componente está correto e não interfere

const getImagemProduto = (caminhoImagem) => {
    if (!caminhoImagem) return null;
    if (caminhoImagem.startsWith('http')) return caminhoImagem;
    const baseUrl = 'https://cufzswdymzevdeonjgan.supabase.co/storage/v1/object/public';
    return `${baseUrl}/imagens/clientes/${encodeURIComponent(caminhoImagem)}`;
};

// getServerSideProps é executado no servidor e não tem acesso ao localStorage.
// Ele apenas garante que slug e pedidoId estejam presentes antes do componente ser renderizado.
export async function getServerSideProps(context) {
    const { slug, pedidoId } = context.query;

    if (!slug || !pedidoId) {
        return {
            notFound: true,
        };
    }

    return {
        props: {}, // O componente FinalizarPedido não está usando 'empresaId' ou 'initialData' dos props
    };
}

export default function FinalizarPedido() { // Removidos empresaId, initialData dos props
    const [itensCarrinho, setItensCarrinho] = useState([]);
    const [corPrimaria, setCorPrimaria] = useState("#3B82F6"); // Você pode querer carregar isso da loja
    const [loading, setLoading] = useState(true); // Começa como true para indicar carregamento
    const [activeSection, setActiveSection] = useState(null);
    const [metodoEntrega, setMetodoEntrega] = useState("retirada");
    const [metodoPagamento, setMetodoPagamento] = useState("pix");
    const [aceiteTermos, setAceiteTermos] = useState(false);
    const [frete, setFrete] = useState(0);
    const [desconto, setDesconto] = useState(0);
    const [pedidoFinalizado, setPedidoFinalizado] = useState(false);
    const [pedidoInfo, setPedidoInfo] = useState(null); // guardar dados que vão para o comprovante
    const [dadosCliente, setDadosCliente] = useState({
        nome: "",
        email: "",
        telefone: "",
        endereco: {}
    });
    const [enderecos, setEnderecos] = useState([]);
    const [enderecoEntrega, setEnderecoEntrega] = useState({
        rua: "",
        numero: "",
        complemento: "",
        bairro: "",
        cep: "",
        cidade: "",
        estado: ""
    });
    const [mostrarFormulario, setMostrarFormulario] = useState(false);
    const [novoEndereco, setNovoEndereco] = useState({
        cep: '',
        rua: '',
        numero: '',
        bairro: '',
        cidade: '',
        estado: '',
        complemento: '',
        destinatario: ''
    });
    const [enderecoEditado, setEnderecoEditado] = useState(false); // Esta variável pode não ser necessária ou precisa de uso mais claro
    const [cartoes, setCartoes] = useState([]); // Não usado no snippet, mas mantido
    const [cliente, setCliente] = useState(null); // Adicionado: Estado para guardar os dados do cliente logado

    const router = useRouter();
    const { slug, pedidoId } = router.query;

    const toggleSection = (section) => {
        setActiveSection(activeSection === section ? null : section);
    };

    // Função auxiliar para obter o ID do cliente do localStorage
    const getClienteId = () => {
        const userData = localStorage.getItem('user');
        return userData ? JSON.parse(userData).id : null;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setNovoEndereco((prev) => ({ ...prev, [name]: value }));
    };

    const buscarCEP = async (cep) => {
        try {
            const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
            const data = await response.json();
            if (!data.erro) {
                setNovoEndereco(prev => ({
                    ...prev,
                    rua: data.logradouro || '',
                    bairro: data.bairro || '',
                    cidade: data.localidade || '',
                    estado: data.uf || '',
                    complemento: data.complemento || ''
                }));
            }
        } catch (error) {
            console.error("Erro ao buscar CEP:", error);
        }
    };

    const validarEndereco = () => {
        const camposObrigatorios = ['rua', 'numero', 'bairro', 'cep', 'cidade', 'estado'];
        return camposObrigatorios.every(campo => novoEndereco[campo]);
    };

    const salvarEnderecoCliente = async (clienteId) => {
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_EMPRESA_API}/clientes/${clienteId}/endereco`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token_cliente')}`
                },
                body: JSON.stringify({
                    ...novoEndereco,
                    // Garante que destinatario seja preenchido se dadosCliente.nome não estiver disponível
                    destinatario: novoEndereco.destinatario || dadosCliente.nome || "Cliente"
                })
            });
            console.log("Resposta ao salvar endereço:", response);
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || "Erro ao salvar endereço");
            }

            return await response.json();
        } catch (error) {
            console.error("Erro detalhado ao salvar endereço:", error);
            throw error;
        }
    };

    const handleSalvarEndereco = async () => {
        if (!validarEndereco()) {
            alert("Preencha todos os campos obrigatórios do endereço!");
            return;
        }

        try {
            const clienteId = getClienteId();
            if (!clienteId) {
                alert("Erro: ID do cliente não encontrado. Por favor, faça login novamente.");
                router.push(`/login?redirect=${encodeURIComponent(router.asPath)}`);
                return;
            }

            await salvarEnderecoCliente(clienteId);
            setMostrarFormulario(false);
            setEnderecoEditado(true); // Indica que um endereço foi editado/adicionado
            alert("Endereço salvo com sucesso!");

            // Recarregar os endereços após salvar um novo
            const enderecoResponse = await fetch(`${process.env.NEXT_PUBLIC_EMPRESA_API}/clientes/${clienteId}/endereco`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token_cliente')}`
                }
            });

            const enderecoData = await enderecoResponse.json();
            if (enderecoData && enderecoData.length > 0) {
                setEnderecos(enderecoData); // Atualiza a lista de endereços
                setEnderecoEntrega(enderecoData[0]); // Define o primeiro como endereço de entrega padrão ou o recém-salvo
            }
        } catch (error) {
            console.error("Erro ao salvar endereço:", error);
            alert("Erro ao salvar endereço: " + error.message);
        }
    };

    // Este useEffect é o mais importante para a correção do loop de login
    useEffect(() => {
        const fetchData = async () => {
            if (!slug || !pedidoId) {
                setLoading(false);
                return;
            }

            setLoading(true); // Inicia o carregamento

            try {
                // 1. Verificar login do cliente
                const token = localStorage.getItem('token_cliente');
                if (!token) {
                    console.log("Token de cliente não encontrado, redirecionando para login.");
                    router.push(`/login?redirect=${encodeURIComponent(router.asPath)}`);
                    setLoading(false);
                    return;
                }

                const authResponse = await fetch(`${process.env.NEXT_PUBLIC_EMPRESA_API}/me`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (!authResponse.ok) {
                    console.log("Sessão expirada ou inválida, redirecionando para login.");
                    localStorage.removeItem('token_cliente'); // Limpa token inválido
                    localStorage.removeItem('user'); // Limpa user inválido
                    router.push(`/login?redirect=${encodeURIComponent(router.asPath)}`);
                    setLoading(false);
                    return;
                }

                const authData = await authResponse.json();
                setCliente(authData.cliente); // Armazena os dados do cliente
                const clienteId = authData.cliente.id;

                // 2. Buscar dados do pedido
                const pedidoResponse = await fetch(`${process.env.NEXT_PUBLIC_EMPRESA_API}/loja/${slug}/pedidos/${pedidoId}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                if (!pedidoResponse.ok) throw new Error("Erro ao carregar dados do pedido.");
                const pedidoData = await pedidoResponse.json();
                if (pedidoData && pedidoData.itens) {
                    setItensCarrinho(pedidoData.itens);
                }

                // 3. Buscar dados do cliente (detalhes)
                const clienteDetailsResponse = await fetch(`${process.env.NEXT_PUBLIC_EMPRESA_API}/clientes/${clienteId}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (!clienteDetailsResponse.ok) throw new Error("Erro ao carregar detalhes do cliente.");
                const clienteDetailsData = await clienteDetailsResponse.json();
                setDadosCliente({
                    nome: clienteDetailsData.nome,
                    email: clienteDetailsData.email,
                    telefone: clienteDetailsData.telefone
                });

                // 4. Buscar endereços do cliente
                const enderecosResponse = await fetch(`${process.env.NEXT_PUBLIC_EMPRESA_API}/clientes/${clienteId}/endereco`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                if (!enderecosResponse.ok) throw new Error("Erro ao carregar endereços.");
                const enderecosData = await enderecosResponse.json();

                if (enderecosData && enderecosData.length > 0) {
                    setEnderecos(enderecosData);
                    // Define o primeiro endereço ou um "principal" se houver
                    setEnderecoEntrega(enderecosData[0]);
                } else {
                    setEnderecos([]);
                    setEnderecoEntrega({ rua: "", numero: "", complemento: "", bairro: "", cep: "", cidade: "", estado: "" });
                    // Se não houver endereço, pode ser útil mostrar o formulário automaticamente
                    // setMostrarFormulario(true);
                }

            } catch (error) {
                console.error("Erro ao carregar dados:", error);
                // Pode adicionar um alerta para o usuário aqui
                alert("Não foi possível carregar as informações. Tente novamente ou faça login.");
                // Se o erro for de autenticação, o redirecionamento já aconteceu
            } finally {
                setLoading(false); // Termina o carregamento
            }
        };

        fetchData();
    }, [slug, pedidoId, router, enderecoEditado]); // Adicionado 'router' e 'enderecoEditado' (para recarregar endereços)

    const subtotal = itensCarrinho.reduce((acc, item) => acc + (item.produto.preco * item.quantidade), 0);
    const total = subtotal + frete - desconto;

    const handleRemoverItem = async (id) => {
        try {
            await fetch(`${process.env.NEXT_PUBLIC_EMPRESA_API}/carrinho/${id}`, {
                method: 'DELETE',
                headers: { // Adicionar cabeçalho de autorização aqui também
                    'Authorization': `Bearer ${localStorage.getItem('token_cliente')}`
                }
            });
            setItensCarrinho(itensCarrinho.filter(item => item.id !== id));
        } catch (error) {
            console.error("Erro ao remover item:", error);
            alert("Erro ao remover item do carrinho.");
        }
    };

    const handleFinalizarPedido = async () => {
        if (!aceiteTermos) {
            alert("Você precisa aceitar os termos e condições!");
            return;
        }
        if (metodoEntrega === "padrao" || metodoEntrega === "expresso") {
            // Verifica se o endereço de entrega está preenchido
            if (!enderecoEntrega.rua || !enderecoEntrega.numero || !enderecoEntrega.bairro || !enderecoEntrega.cep || !enderecoEntrega.cidade || !enderecoEntrega.estado) {
                alert("Por favor, selecione ou adicione um endereço de entrega completo.");
                return;
            }
        }


        setLoading(true);

        try {
            const clienteId = getClienteId();
            if (!clienteId) {
                throw new Error("Usuário não autenticado. Por favor, faça login novamente.");
            }

            const payload = {
                metodoPagamento,
                metodoEntrega, // Adicionado metodoEntrega ao payload
                enderecoEntrega: metodoEntrega === "retirada" ? null : { // Envia endereço apenas se não for retirada
                    destinatario: enderecoEntrega.destinatario || dadosCliente.nome || "Cliente",
                    cep: enderecoEntrega.cep,
                    rua: enderecoEntrega.rua,
                    numero: enderecoEntrega.numero,
                    complemento: enderecoEntrega.complemento || "",
                    bairro: enderecoEntrega.bairro,
                    cidade: enderecoEntrega.cidade,
                    estado: enderecoEntrega.estado,
                },
                clienteId,
                itens: itensCarrinho,
                frete: frete, // Inclui o frete no payload
                desconto: desconto, // Inclui o desconto no payload
                total: total // Inclui o total calculado no payload
            };

            console.log("Payload enviado para finalizar pedido:", payload);

            const response = await fetch(
                `${process.env.NEXT_PUBLIC_EMPRESA_API}/loja/${slug}/pedidos/${pedidoId}/finalizar`, // Ajustado o endpoint para incluir pedidoId
                {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('token_cliente')}`
                    },
                    body: JSON.stringify(payload)
                }
            );

            const responseText = await response.text(); // Lê o corpo da resposta apenas uma vez

            if (response.ok) {
                const pedidoConfirmado = JSON.parse(responseText);
                setPedidoFinalizado(true);
                setPedidoInfo(pedidoConfirmado);
                // Não redirecione aqui imediatamente se for mostrar o comprovante na mesma página
                // router.push(`/${slug}/pedido/confirmacao/${pedidoConfirmado.id}`); // Mova isso para o handleVerComprovante se for o caso
                return;
            }

            let errorMessage = "Erro ao finalizar pedido";
            try {
                const errorData = JSON.parse(responseText);
                errorMessage = errorData.erro || errorMessage;
            } catch (e) {
                console.error("Resposta inesperada ou não JSON:", responseText);
                errorMessage = `Erro do servidor: ${responseText.substring(0, 100)}...`;
            }
            throw new Error(errorMessage);

        } catch (error) {
            console.error("Erro ao finalizar pedido:", error);
            alert(error.message.includes('Estoque insuficiente')
                ? error.message
                : "Erro ao processar pedido. Tente novamente."
            );

            if (error.message.includes('Estoque insuficiente')) {
                router.reload(); // Recarregar a página para atualizar o carrinho/estoque
            }
        } finally {
            setLoading(false);
        }
    };

    const handleVerComprovante = () => {
        if (pedidoInfo && pedidoInfo.id) { // Usa pedidoInfo.id que foi guardado após a finalização
            router.push(`/comprovante/${pedidoInfo.id}`);
        } else {
            alert("Nenhuma informação de pedido para mostrar o comprovante.");
        }
    };

    const handleVoltar = () => {
        router.push(`/loja/${slug}`);
    };

    // Renderiza uma tela de carregamento se os dados ainda estiverem sendo carregados
    if (loading) {
        return (
            <div className="flex flex-col min-h-screen items-center justify-center bg-gray-50 text-black">
                <p>Carregando pedido...</p>
                {/* Você pode adicionar um spinner de carregamento aqui */}
            </div>
        );
    }

    // Se o pedido foi finalizado com sucesso, exibe a tela de confirmação
    if (pedidoFinalizado && pedidoInfo) {
        return (
            <div className="flex flex-col min-h-screen bg-gray-50 text-black">
                <header
                    className="text-white px-4 py-3 shadow flex items-center justify-center"
                    style={{ backgroundColor: corPrimaria }}
                >
                    <h1 className="text-xl font-bold">Pedido Finalizado!</h1>
                </header>
                <div className="flex-1 px-4 py-6 max-w-4xl mx-auto w-full text-center">
                    <h2 className="text-2xl font-bold text-green-600 mb-4">Seu pedido foi confirmado!</h2>
                    <p className="text-lg mb-2">Número do Pedido: <span className="font-semibold">{pedidoInfo.id}</span></p>
                    <p className="mb-4">Aguarde a aprovação do pagamento.</p>
                    {/* Exibir informações relevantes do pedido aqui, como método de pagamento, etc. */}
                    <p className="font-bold text-xl mb-6">Total: R$ {pedidoInfo.total.toFixed(2)}</p>

                    <div className="flex flex-col space-y-4">
                        <button
                            onClick={handleVerComprovante}
                            className="bg-blue-600 text-white py-3 px-6 rounded-lg text-lg font-semibold hover:bg-blue-700 transition-colors"
                        >
                            Ver Comprovante
                        </button>
                        <button
                            onClick={handleVoltar}
                            className="bg-gray-200 text-gray-800 py-3 px-6 rounded-lg text-lg font-semibold hover:bg-gray-300 transition-colors"
                        >
                            Voltar para a Loja
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-screen bg-gray-50 text-black">
            {/* NavBar pode ser condicional ou precisar de props, dependendo de como você a usa */}
            {/* <NavBar /> */}
            <header
                className="text-white px-4 py-3 shadow flex items-center justify-center"
                style={{ backgroundColor: corPrimaria }}
            >
                <h1 className="text-xl font-bold">Finalizar Pedido</h1>
            </header>

            <div className="flex-1 px-4 py-6 max-w-4xl mx-auto w-full">
                {/* 1. Resumo do Pedido */}
                <div className="bg-white rounded-lg shadow-sm mb-6 overflow-hidden">
                    <div
                        className="flex justify-between items-center p-4 cursor-pointer"
                        onClick={() => toggleSection('resumo')}
                    >
                        <h2 className="text-lg font-bold">1. Resumo do Pedido</h2>
                        {activeSection === 'resumo' ? <FiChevronUp size={20} /> : <FiChevronDown size={20} />}
                    </div>

                    {activeSection === 'resumo' && (
                        <div className="p-4 border-t">
                            {itensCarrinho.length === 0 ? (
                                <p className="text-gray-600 text-center">Seu carrinho está vazio.</p>
                            ) : (
                                itensCarrinho.map((item, index) => (
                                    <div key={index} className="flex items-start py-4 border-b last:border-b-0">
                                        <Image
                                            src={getImagemProduto(item.produto.image)}
                                            alt={item.produto.nome}
                                            width={80}
                                            height={80}
                                            className="rounded object-cover border"
                                        />

                                        <div className="ml-4 flex-1">
                                            <div className="flex justify-between">
                                                <h3 className="font-medium">{item.produto.nome}</h3>
                                                <span className="font-bold">R$ {(item.produto.preco * item.quantidade).toFixed(2)}</span>
                                            </div>

                                            <p className="text-sm text-gray-600 mt-1">Qtd: {item.quantidade}</p>
                                            {item.variacoes && (
                                                <div className="text-sm text-gray-600">
                                                    {Object.entries(item.variacoes).map(([key, value]) => (
                                                        <p key={key}>{key}: {value}</p>
                                                    ))}
                                                </div>
                                            )}

                                            <div className="flex mt-2 space-x-4">
                                                {/* Botões de editar e remover */}
                                                <button className="flex items-center text-sm text-blue-600">
                                                    <FiEdit className="mr-1" /> Editar
                                                </button>
                                                <button
                                                    className="flex items-center text-sm text-red-600"
                                                    onClick={() => handleRemoverItem(item.id)}
                                                >
                                                    <FiTrash2 className="mr-1" /> Remover
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}


                            <div className="flex justify-between mt-4 pt-4 border-t">
                                <span className="font-bold">Subtotal:</span>
                                <span className="font-bold">R$ {subtotal.toFixed(2)}</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* 2. Endereço de Entrega */}
                <div className="bg-white rounded-lg shadow-sm mb-6 overflow-hidden">
                    <div
                        className="flex justify-between items-center p-4 cursor-pointer"
                        onClick={() => toggleSection('endereco')}
                    >
                        <h2 className="text-lg font-bold">2. Endereço de Entrega</h2>
                        {activeSection === 'endereco' ? <FiChevronUp size={20} /> : <FiChevronDown size={20} />}
                    </div>

                    {activeSection === 'endereco' && (
                        <div className="p-4 border-t">
                            <div className="space-y-4">
                                {enderecos.length === 0 ? (
                                    <p className="text-gray-600 text-center">Nenhum endereço cadastrado.</p>
                                ) : (
                                    enderecos.map(endereco => (
                                        <div key={endereco.id} className={`border rounded-lg p-4 ${endereco.id === enderecoEntrega.id ? "border-blue-500 bg-blue-50" : ""}`}>
                                            <div className="flex justify-between items-center">
                                                <h3 className="font-medium">{endereco.destinatario || dadosCliente.nome} {endereco.id === enderecoEntrega.id && "(Selecionado)"}</h3>
                                                {/* Lógica para editar endereço pode ser mais complexa, este é um placeholder */}
                                                <button className="text-blue-600 text-sm">Editar</button>
                                            </div>

                                            <p className="mt-2">{endereco.rua}, {endereco.numero} {endereco.complemento && `- ${endereco.complemento}`}</p>
                                            <p>{endereco.bairro}, {endereco.cidade} - {endereco.estado}</p>
                                            <p>CEP: {endereco.cep}</p>

                                            {endereco.id !== enderecoEntrega.id && (
                                                <button
                                                    onClick={() => setEnderecoEntrega(endereco)}
                                                    className="mt-2 px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-md hover:bg-blue-200"
                                                >
                                                    Usar este endereço
                                                </button>
                                            )}
                                        </div>
                                    ))
                                )}

                                {!mostrarFormulario && (
                                    <button
                                        className="w-full py-2 border-2 border-dashed rounded-lg text-gray-500 hover:border-blue-500 hover:text-blue-500"
                                        onClick={() => setMostrarFormulario(true)}
                                    >
                                        + Adicionar novo endereço
                                    </button>
                                )}
                                {mostrarFormulario && (
                                    <div className="space-y-2 bg-gray-50 p-4 rounded border">
                                        <input type="text" name="destinatario" placeholder="Nome do Destinatário (ex: Seu nome)" value={novoEndereco.destinatario} onChange={handleChange} className="w-full border p-2 rounded" />
                                        <input type="text" name="cep" placeholder="CEP" value={novoEndereco.cep} onChange={(e) => { handleChange(e); if (e.target.value.length === 8) buscarCEP(e.target.value); }} className="w-full border p-2 rounded" maxLength={8} />
                                        <input type="text" name="rua" placeholder="Rua" value={novoEndereco.rua} onChange={handleChange} className="w-full border p-2 rounded" />
                                        <input type="text" name="numero" placeholder="Número" value={novoEndereco.numero} onChange={handleChange} className="w-full border p-2 rounded" />
                                        <input type="text" name="complemento" placeholder="Complemento (Opcional)" value={novoEndereco.complemento} onChange={handleChange} className="w-full border p-2 rounded" />
                                        <input type="text" name="bairro" placeholder="Bairro" value={novoEndereco.bairro} onChange={handleChange} className="w-full border p-2 rounded" />
                                        <input type="text" name="cidade" placeholder="Cidade" value={novoEndereco.cidade} onChange={handleChange} className="w-full border p-2 rounded" />
                                        <input type="text" name="estado" placeholder="Estado (Ex: SP)" value={novoEndereco.estado} onChange={handleChange} className="w-full border p-2 rounded" maxLength={2} />

                                        <div className="flex justify-end gap-2">
                                            <button onClick={() => setMostrarFormulario(false)} className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400">
                                                Cancelar
                                            </button>
                                            <button onClick={handleSalvarEndereco} className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
                                                Salvar Endereço
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* 3. Método de Entrega */}
                <div className="bg-white rounded-lg shadow-sm mb-6 overflow-hidden">
                    <div
                        className="flex justify-between items-center p-4 cursor-pointer"
                        onClick={() => toggleSection('entrega')}
                    >
                        <h2 className="text-lg font-bold">3. Método de Entrega</h2>
                        {activeSection === 'entrega' ? <FiChevronUp size={20} /> : <FiChevronDown size={20} />}
                    </div>

                    {activeSection === 'entrega' && (
                        <div className="p-4 border-t">
                            <div className="space-y-3">
                                <label className="flex items-start p-3 border rounded-lg cursor-pointer">
                                    <input
                                        type="radio"
                                        name="metodoEntrega"
                                        value="retirada"
                                        checked={metodoEntrega === "retirada"}
                                        onChange={() => { setMetodoEntrega("retirada"); setFrete(0); }}
                                        className="mt-1 mr-3"
                                    />
                                    <div className="flex-1">
                                        <div className="flex justify-between">
                                            <span className="font-medium">Retirada na Loja</span>
                                            <span className="font-bold">Grátis</span>
                                        </div>
                                        <p className="text-sm text-gray-600">Disponível em 1 dia útil</p>
                                    </div>
                                </label>

                                <label className="flex items-start p-3 border rounded-lg cursor-pointer">
                                    <input
                                        type="radio"
                                        name="metodoEntrega"
                                        value="padrao"
                                        checked={metodoEntrega === "padrao"}
                                        onChange={() => {
                                            setMetodoEntrega("padrao");
                                            setFrete(15.90);
                                        }}
                                        className="mt-1 mr-3"
                                    />
                                    <div className="flex-1">
                                        <div className="flex justify-between">
                                            <span className="font-medium">Entrega Padrão</span>
                                            <span className="font-bold">R$ 15,90</span>
                                        </div>
                                        <p className="text-sm text-gray-600">Entrega em 3-5 dias úteis</p>
                                    </div>
                                </label>

                                <label className="flex items-start p-3 border rounded-lg cursor-pointer">
                                    <input
                                        type="radio"
                                        name="metodoEntrega"
                                        value="expresso"
                                        checked={metodoEntrega === "expresso"}
                                        onChange={() => {
                                            setMetodoEntrega("expresso");
                                            setFrete(29.90);
                                        }}
                                        className="mt-1 mr-3"
                                    />
                                    <div className="flex-1">
                                        <div className="flex justify-between">
                                            <span className="font-medium">Entrega Expressa</span>
                                            <span className="font-bold">R$ 29,90</span>
                                        </div>
                                        <p className="text-sm text-gray-600">Entrega em 1-2 dias úteis</p>
                                    </div>
                                &gt;
                                </label>
                            </div>
                        </div>
                    )}
                </div>

                {/* 4. Forma de Pagamento */}
                <div className="bg-white rounded-lg shadow-sm mb-6 overflow-hidden">
                    <div
                        className="flex justify-between items-center p-4 cursor-pointer"
                        onClick={() => toggleSection('pagamento')}
                    >
                        <h2 className="text-lg font-bold">4. Forma de Pagamento</h2>
                        {activeSection === 'pagamento' ? <FiChevronUp size={20} /> : <FiChevronDown size={20} />}
                    </div>

                    {activeSection === 'pagamento' && (
                        <div className="p-4 border-t">
                            <div className="space-y-4">
                                {/* Opção PIX */}
                                <label className="flex items-start p-3 border rounded-lg cursor-pointer">
                                    <input
                                        type="radio"
                                        name="metodoPagamento"
                                        value="pix"
                                        checked={metodoPagamento === "pix"}
                                        onChange={() => { setMetodoPagamento("pix"); setDesconto(subtotal * 0.05); }} // Calcula 5% de desconto no subtotal
                                        className="mt-1 mr-3"
                                    />
                                    <div className="flex-1">
                                        <div className="flex justify-between">
                                            <span className="font-medium">PIX</span>
                                            <span className="text-green-600">5% de desconto</span>
                                        </div>
                                        {metodoPagamento === "pix" && (
                                            <div className="mt-3 bg-gray-100 p-4 rounded-lg text-center">
                                                <p className="font-medium">Chave PIX:</p>
                                                <p className="text-sm text-gray-600">123.456.789-00</p> {/* Substitua pela chave PIX real */}
                                                <div className="mt-2 p-2 bg-white inline-block">
                                                    {/* QR Code placeholder */}
                                                    <div className="w-32 h-32 bg-gray-300 flex items-center justify-center">
                                                        <span className="text-xs">QR Code</span>
                                                    </div>
                                                </div>
                                                <p className="mt-2 text-sm">Pague com PIX e ganhe 5% de desconto</p>
                                            </div>
                                        )}
                                    </div>
                                </label>

                                {/* Opção Cartão de Crédito */}
                                <label className="flex items-start p-3 border rounded-lg cursor-pointer">
                                    <input
                                        type="radio"
                                        name="metodoPagamento"
                                        value="cartao"
                                        checked={metodoPagamento === "cartao"}
                                        onChange={() => { setMetodoPagamento("cartao"); setDesconto(0); }} // Remove desconto se mudar para cartão
                                        className="mt-1 mr-3"
                                    />
                                    <div className="flex-1">
                                        <div className="flex justify-between">
                                            <span className="font-medium">Cartão de Crédito</span>
                                            <span>Sem desconto</span>
                                        </div>
                                        {metodoPagamento === "cartao" && (
                                            <div className="mt-3 bg-gray-100 p-4 rounded-lg">
                                                <p className="mb-2 text-sm text-gray-700">Selecione ou adicione um cartão:</p>
                                                {/* Formulário/seleção de cartão pode ser complexo, aqui um placeholder */}
                                                <p className="text-gray-500 text-sm">Funcionalidade de cartão de crédito não implementada neste exemplo.</p>
                                            </div>
                                        )}
                                    </div>
                                </label>
                            </div>
                        </div>
                    )}
                </div>

                {/* Resumo Final e Botão Finalizar */}
                <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
                    <h2 className="text-lg font-bold mb-4">Resumo Final</h2>
                    <div className="flex justify-between text-sm mb-2">
                        <span>Subtotal do Pedido:</span>
                        <span>R$ {subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm mb-2">
                        <span>Frete:</span>
                        <span>R$ {frete.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm mb-4">
                        <span>Desconto:</span>
                        <span className="text-green-600">- R$ {desconto.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-lg border-t pt-4">
                        <span>Total:</span>
                        <span>R$ {total.toFixed(2)}</span>
                    </div>

                    <div className="mt-6">
                        <label className="flex items-center text-sm cursor-pointer">
                            <input
                                type="checkbox"
                                checked={aceiteTermos}
                                onChange={(e) => setAceiteTermos(e.target.checked)}
                                className="mr-2"
                            />
                            Li e aceito os <a href="#" className="text-blue-600 hover:underline">termos e condições</a>
                        </label>
                    </div>

                    <button
                        onClick={handleFinalizarPedido}
                        disabled={!aceiteTermos || loading || itensCarrinho.length === 0}
                        className={`w-full py-3 mt-6 rounded-lg text-white font-bold transition-colors ${!aceiteTermos || loading || itensCarrinho.length === 0 ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'}`}
                    >
                        {loading ? 'Finalizando...' : 'Finalizar Pedido'}
                    </button>
                </div>
            </div>
            {/* Opcional: Adicionar um rodapé ou barra de navegação inferior */}
            {/* <footer className="bg-white border-t p-4 text-center text-gray-600">
                &copy; {new Date().getFullYear()} Sua Loja. Todos os direitos reservados.
            </footer> */}
        </div>
    );
}