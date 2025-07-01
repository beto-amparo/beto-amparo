import { useEffect, useState } from "react";
import Image from "next/image";
import { FiEdit, FiTrash2, FiChevronDown, FiChevronUp } from "react-icons/fi";
import { useRouter } from "next/router";
import NavBar from "@/components/NavBar";
import toast from 'react-hot-toast'; 
import ConfirmModal from "@/components/ConfirmModal";

const getImagemProduto = (caminhoImagem) => {
    if (!caminhoImagem) return null;
    if (caminhoImagem.startsWith('http')) return caminhoImagem;
    const baseUrl = 'https://cufzswdymzevdeonjgan.supabase.co/storage/v1/object/public';
    return `${baseUrl}/imagens/clientes/${encodeURIComponent(caminhoImagem)}`;
};

export async function getServerSideProps(context) {
    const { slug, pedidoId } = context.query;

    if (!slug || !pedidoId) {
        return {
            notFound: true,
        };
    }

    return {
        props: {},
    };
}

export default function FinalizarPedido() {
    const [itensCarrinho, setItensCarrinho] = useState([]);
    const [corPrimaria, setCorPrimaria] = useState("#3B82F6");
    const [loading, setLoading] = useState(true);
    const [activeSection, setActiveSection] = useState(null);
    const [metodoPagamento, setMetodoPagamento] = useState("pix");
    const [aceiteTermos, setAceiteTermos] = useState(false);
    const [desconto, setDesconto] = useState(0);
    const [pedidoFinalizado, setPedidoFinalizado] = useState(false);
    const [pedidoInfo, setPedidoInfo] = useState(null);
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
    const [enderecoEditado, setEnderecoEditado] = useState(false);

    const router = useRouter();
    const { slug, pedidoId, clienteId  } = router.query;
    console.log("ID do cliente:", clienteId);

    const toggleSection = (section) => {
        setActiveSection(activeSection === section ? null : section);
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
                    'Content-Type': 'application/json'
                },
                credentials: 'include', 
                body: JSON.stringify({
                    ...novoEndereco,
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
        toast.error("Preencha todos os campos obrigatórios do endereço!");
        return;
    }
    const [modal, setModal] = useState({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => {},
    });

    try {
        if (!clienteId) {
            toast.error("Erro: ID do cliente não encontrado.");
            router.push(`/login?redirect=${encodeURIComponent(router.asPath)}`);
            return;
        }

        if (enderecoEditado) {
            await atualizarEnderecoCliente(enderecoEditado);
        } else {
            await salvarEnderecoCliente(clienteId);
        }

        setMostrarFormulario(false);
        setEnderecoEditado(false);
        setNovoEndereco({
            destinatario: '',
            cep: '',
            rua: '',
            numero: '',
            bairro: '',
            cidade: '',
            estado: '',
            complemento: ''
        });

        toast.error("Endereço salvo com sucesso!");

        const enderecoResponse = await fetch(`${process.env.NEXT_PUBLIC_EMPRESA_API}/clientes/${clienteId}/endereco`, {
            credentials: 'include'
        });
        if (enderecoResponse.ok) {
            const enderecoData = await enderecoResponse.json();
            if (enderecoData && enderecoData.length > 0) {
                setEnderecos(enderecoData);
                setEnderecoEntrega(enderecoData[0]);
            } else {
                setEnderecos([]);
                setEnderecoEntrega({});
                setMostrarFormulario(true);
            }
        }
    } catch (error) {
        console.error("Erro ao salvar endereço:", error);
        toast.error("Erro ao salvar endereço: " + error.message);
    }
    };


    useEffect(() => {
        const fetchData = async () => {
            if (!slug || !pedidoId) {
                setLoading(false);
                return;
            }

            setLoading(true);

            try {
                const pedidoResponse = await fetch(`${process.env.NEXT_PUBLIC_EMPRESA_API}/loja/${slug}/pedidos/${pedidoId}`);
                if (!pedidoResponse.ok) {
                    throw new Error("Erro ao carregar dados do pedido.");
                }
                const pedidoData = await pedidoResponse.json();
                if (pedidoData && pedidoData.itens) {
                    setItensCarrinho(pedidoData.itens);
                }                            
                if (pedidoData.desconto) {
                    setDesconto(pedidoData.desconto);
                }


            if (clienteId) {
                const meResponse = await fetch(`${process.env.NEXT_PUBLIC_EMPRESA_API}/me`, {
                    credentials: 'include',
                });

                if (meResponse.ok) {
                    const meData = await meResponse.json();
                    setDadosCliente({
                        nome: meData.cliente.nome,
                        email: meData.cliente.email,
                        telefone: meData.cliente.telefone
                    });

                    const enderecosResponse = await fetch(`${process.env.NEXT_PUBLIC_EMPRESA_API}/clientes/${clienteId}/endereco`);
                    if (enderecosResponse.ok) {
                        const enderecosData = await enderecosResponse.json();
                        if (enderecosData && enderecosData.length > 0) {
                            setEnderecos(enderecosData);
                            setEnderecoEntrega(enderecosData[0]);
                        } else {
                            setEnderecos([]);
                            setEnderecoEntrega({ rua: "", numero: "", complemento: "", bairro: "", cep: "", cidade: "", estado: "" });
                            setMostrarFormulario(true);
                        }
                    } else {
                        setEnderecos([]);
                        setEnderecoEntrega({ rua: "", numero: "", complemento: "", bairro: "", cep: "", cidade: "", estado: "" });
                        setMostrarFormulario(true);
                    }
                }
            }


            } catch (error) {
                console.error("Erro ao carregar dados na FinalizarPedido:", error);
                toast.error("Não foi possível carregar as informações do pedido. Tente novamente.");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [slug, pedidoId, router, enderecoEditado]); // Adicionado router e enderecoEditado

    const atualizarEnderecoCliente = async (enderecoId) => {
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_EMPRESA_API}/clientes/${clienteId}/endereco/${enderecoId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({
                    ...novoEndereco,
                    destinatario: novoEndereco.destinatario || dadosCliente.nome || "Cliente"
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || "Erro ao atualizar endereço");
            }

            return await response.json();
        } catch (error) {
            console.error("Erro ao atualizar endereço:", error);
            throw error;
        }
    };

    const handleEditarEndereco = (endereco) => {
        setNovoEndereco({
            destinatario: endereco.destinatario || '',
            cep: endereco.cep || '',
            rua: endereco.rua || '',
            numero: endereco.numero || '',
            bairro: endereco.bairro || '',
            cidade: endereco.cidade || '',
            estado: endereco.estado || '',
            complemento: endereco.complemento || ''
        });
        setEnderecoEditado(endereco.id); // Aqui guarda o id do endereço que será atualizado
        setMostrarFormulario(true);
    };

    const deletarEnderecoCliente = async (enderecoId) => {
        try {
            const confirm = window.confirm("Tem certeza que deseja deletar este endereço?");
            if (!confirm) return;

            const response = await fetch(`${process.env.NEXT_PUBLIC_EMPRESA_API}/clientes/${clienteId}/endereco/${enderecoId}`, {
                method: 'DELETE',
                credentials: 'include'
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || "Erro ao deletar endereço");
            }

            toast.error("Endereço deletado com sucesso!");

            // Atualiza a lista de endereços após deletar
            const enderecoResponse = await fetch(`${process.env.NEXT_PUBLIC_EMPRESA_API}/clientes/${clienteId}/endereco`, {
                credentials: 'include'
            });
            if (enderecoResponse.ok) {
                const enderecoData = await enderecoResponse.json();
                setEnderecos(enderecoData);
                if (enderecoData.length > 0) {
                    setEnderecoEntrega(enderecoData[0]);
                } else {
                    setEnderecoEntrega({});
                    setMostrarFormulario(true);
                }
            }

        } catch (error) {
            console.error("Erro ao deletar endereço:", error);
            toast.error("Erro ao deletar endereço: " + error.message);
        }
    };

    const calcularSubtotal = () => {
        return itensCarrinho.reduce((acc, item) => acc + (item.produto.preco * item.quantidade), 0);
    };

    const calcularTotal = () => {
        const subtotal = calcularSubtotal();
        let total = subtotal - desconto;
        if (metodoPagamento === 'cartao_credito') {
            total = total * 1.05; // acréscimo de 5%
        }
        return total;
    };

    const subtotal = calcularSubtotal();
    const total = calcularTotal();
    const acrescimoCartao = metodoPagamento === 'cartao_credito' ? (subtotal - desconto) * 0.05 : 0;

    const handleFinalizarPedido = async () => {
        if (!aceiteTermos) {
            toast.error("Você precisa aceitar os termos e condições!");
            return;
        }

        setLoading(true);

        try {
            const payload = {
                metodoPagamento,
                enderecoEntrega: {
                    destinatario: enderecoEntrega.destinatario || dadosCliente.nome || "Cliente",
                    cep: enderecoEntrega.cep,
                    rua: enderecoEntrega.rua,
                    numero: enderecoEntrega.numero,
                    complemento: enderecoEntrega.complemento || "",
                    bairro: enderecoEntrega.bairro,
                    cidade: enderecoEntrega.cidade,
                    estado: enderecoEntrega.estado,
                },
                clienteId: clienteId, 
                itens: itensCarrinho,
                total: total
            };

            console.log("Payload enviado para finalizar pedido:", payload);

            const response = await fetch(
                `${process.env.NEXT_PUBLIC_EMPRESA_API}/loja/${slug}/pedidos/${pedidoId}/finalizar`,
                {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(payload)
                }
            );
            const data = await response.json();

            if (response.ok) {
                toast.success("Pedido finalizado com sucesso! Você será redirecionado.");
                router.push(`/loja/${slug}/pedidos`);
            } else {
                console.error("Erro na resposta:", data);
                toast.error(data.erro || "Erro ao finalizar pedido.");
            }
        } catch (error) {
            console.error("Erro ao finalizar pedido:", error);
            toast.error(error.message.includes('Estoque insuficiente')
                ? error.message
                : "Erro ao processar pedido. Tente novamente."
            );

            if (error.message.includes('Estoque insuficiente')) {
                router.reload();
            }
        } finally {
            setLoading(false);
        }
    };

    const handleVoltar = () => {
        router.push(`/loja/${slug}`);
    };

    if (loading) {
        return (
            <div className="flex flex-col min-h-screen items-center justify-center bg-gray-50 text-black">
                <p>Carregando pedido...</p>
            </div>
        );
    }

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
                    <p className="font-bold text-xl mb-6">Total: R$ {pedidoInfo.total.toFixed(2)}</p>

                    <div className="flex flex-col space-y-4">
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
            <NavBar />
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
                        <h2 className="text-lg font-bold">2. Endereço</h2>
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
                                                <h3 className="font-medium">
                                                    {endereco.destinatario || dadosCliente.nome} 
                                                    {endereco.id === enderecoEntrega.id && " (Selecionado)"}
                                                </h3>
                                                
                                                <div className="flex items-center gap-4">
                                                    <button 
                                                        onClick={() => handleEditarEndereco(endereco)}
                                                        className="text-blue-600 text-sm"
                                                    >
                                                        Editar
                                                    </button>
                                                    <button 
                                                        onClick={() => deletarEnderecoCliente(endereco.id)}
                                                        className="text-blue-600 text-sm"
                                                    >
                                                        Excluir
                                                    </button>
                                                </div>
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
                                        onClick={() => {
                                            setMostrarFormulario(true);
                                            setEnderecoEditado(false); // 🔥 Resetar modo edição
                                            setNovoEndereco({
                                                destinatario: '',
                                                cep: '',
                                                rua: '',
                                                numero: '',
                                                bairro: '',
                                                cidade: '',
                                                estado: '',
                                                complemento: ''
                                            });
                                        }}
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

                {/* 3. Forma de Pagamento */}
                <div className="bg-white rounded-lg shadow-sm mb-6 overflow-hidden">
                    <div
                        className="flex justify-between items-center p-4 cursor-pointer"
                        onClick={() => toggleSection('pagamento')}
                    >
                        <h2 className="text-lg font-bold">3. Forma de Pagamento</h2>
                        {activeSection === 'pagamento' ? <FiChevronUp size={20} /> : <FiChevronDown size={20} />}
                    </div>

                    {activeSection === 'pagamento' && (
                        <div className="p-4 border-t">
                            <div className="space-y-3">
                                <label className="flex items-start p-3 border rounded-lg cursor-pointer">
                                    <input
                                        type="radio"
                                        name="metodoPagamento"
                                        value="pix"
                                        checked={metodoPagamento === "pix"}
                                        onChange={() => setMetodoPagamento("pix")}
                                        className="mt-1 mr-3"
                                    />
                                    <div className="flex-1">
                                        <span className="font-medium">PIX</span>
                                        <p className="text-sm text-gray-600">Pagamento instantâneo.</p>
                                    </div>
                                </label>
                                <label className="flex items-start p-3 border rounded-lg cursor-pointer">
                                    <input
                                        type="radio"
                                        name="metodoPagamento"
                                        value="dinheiro"
                                        checked={metodoPagamento === "dinheiro"}
                                        onChange={() => setMetodoPagamento("dinheiro")}
                                        className="mt-1 mr-3"
                                    />
                                    <div className="flex-1">
                                        <span className="font-medium">Dinheiro</span>
                                        <p className="text-sm text-gray-600">Pagamento instantâneo.</p>
                                    </div>
                                </label>
                                <label className="flex items-start p-3 border rounded-lg cursor-pointer">
                                    <input
                                        type="radio"
                                        name="metodoPagamento"
                                        value="cartao_credito"
                                        checked={metodoPagamento === "cartao_credito"}
                                        onChange={() => setMetodoPagamento("cartao_credito")}
                                        className="mt-1 mr-3"
                                    />
                                    <div className="flex-1">
                                        <span className="font-medium">Cartão de Crédito</span>
                                        <p className="text-sm text-gray-600">Acrescimo de 5% de juros</p>
                                    </div>
                                </label>
                                <label className="flex items-start p-3 border rounded-lg cursor-pointer">
                                    <input
                                        type="radio"
                                        name="metodoPagamento"
                                        value="cartao_debito"
                                        checked={metodoPagamento === "cartao_debito"}
                                        onChange={() => setMetodoPagamento("cartao_debito")}
                                        className="mt-1 mr-3"
                                    />
                                    <div className="flex-1">
                                        <span className="font-medium">Cartão de Débito</span>
                                        <p className="text-sm text-gray-600">Sem juros</p>
                                    </div>
                                </label>
                            </div>
                        </div>
                    )}
                </div>

                <div className="bg-white rounded-lg shadow-sm p-4">
                    <h2 className="text-lg font-bold mb-4">Resumo da Compra</h2>
                    <div className="space-y-2">
                        <div className="flex justify-between">
                            <span>Subtotal:</span>
                            <span>R$ {subtotal.toFixed(2)}</span>
                        </div>

                        <div className="flex justify-between">
                            <span>Desconto:</span>
                            <span>- R$ {desconto.toFixed(2)}</span>
                        </div>

                        {metodoPagamento === 'cartao_credito' && (
                            <div className="flex justify-between text-red-600">
                                <span>Acréscimo (5% Cartão Crédito):</span>
                                <span>+ R$ {acrescimoCartao.toFixed(2)}</span>
                            </div>
                        )}

                        <div className="flex justify-between text-xl font-bold pt-2 border-t">
                            <span>Total:</span>
                            <span>R$ {total.toFixed(2)}</span>
                        </div>
                    </div>

                    <div className="mt-6">
                    <label className="flex items-start cursor-pointer">
                        <input
                            type="checkbox"
                            checked={aceiteTermos}
                            onChange={(e) => setAceiteTermos(e.target.checked)}
                            className="mt-1 mr-2"
                        />
                        <span className="text-sm text-gray-700">
                            Eu concordo com os{" "}
                            <a
                            href="/termos/termos.html"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 underline hover:text-blue-800"
                            >
                            Termos e Condições
                            </a>{" "}
                            e com a{" "}
                            <a
                            href="/termos/politicaTrocas.html"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 underline hover:text-blue-800"
                            >
                            Política de Trocas
                            </a>.
                        </span>
                        </label>
                    </div>

                    <button
                        onClick={handleFinalizarPedido}
                        className="w-full py-3 mt-6 text-white font-semibold rounded-lg transition-colors"
                        style={{ backgroundColor: corPrimaria }}
                        disabled={loading}
                    >
                        {loading ? "Finalizando..." : "Finalizar Pedido"}
                    </button>
                </div>
            </div>
        </div>
    );
}