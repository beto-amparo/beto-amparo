// pages/empresa/[slug]/pedidos-dono.js

import { useRouter } from 'next/router';
import { useEffect, useState, useCallback } from 'react';
import OwnerSidebar from '@/components/OwnerSidebar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input"; 

// IMPORTS NECESSÁRIOS
import { jsPDF } from 'jspdf';
import { format } from 'date-fns';
import { differenceInMinutes } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { formatInTimeZone, toZonedTime } from 'date-fns-tz';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import toast from 'react-hot-toast';


// Componente auxiliar para a bolinha de status
const OrderStatusBadge = ({ status, statusMap }) => {
    const statusInfo = statusMap[status];
    if (!statusInfo) return null;

    return (
        <div className="flex items-center gap-2">
            <span className={`w-3 h-3 rounded-full ${statusInfo.color}`}></span>
            <Badge variant={statusInfo.badgeVariant}>
                {statusInfo.text}
            </Badge>
        </div>
    );
};

// FUNÇÃO: Normaliza uma string removendo acentos e convertendo para minúsculas
const normalizeAndLowercase = (str) => {
    if (!str) return '';
    return str
        .normalize("NFD") 
        .replace(/[\u0300-\u036f]/g, "") 
        .toLowerCase(); 
};


export default function PedidosDono() {
    const router = useRouter();
    const { slug } = router.query;

    const [pedidos, setPedidos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [pedidoDetalhes, setPedidoDetalhes] = useState(null);
    const [showDetalhesModal, setShowDetalhesModal] = useState(false);

    const [activeTab, setActiveTab] = useState('em_aberto');

    const [showUpdateStatusModal, setShowUpdateStatusModal] = useState(false);
    const [pedidoParaAtualizar, setPedidoParaAtualizar] = useState(null);
    const [novoStatus, setNovoStatus] = useState('');
    const [updatingStatus, setUpdatingStatus] = useState(false);

    const [searchTerm, setSearchTerm] = useState('');
    const [showItemsInline, setShowItemsInline] = useState(false); 

    const corPrimaria = "#3B82F6";

    const statusMap = {
        0: { text: 'Aguardando confirmação', color: 'bg-gray-500', badgeVariant: 'secondary' },
        1: { text: 'Confirmado', color: 'bg-green-500', badgeVariant: 'success' },
        2: { text: 'Em Preparação', color: 'bg-yellow-500', badgeVariant: 'warning' },
        3: { text: 'Saiu para Entrega', color: 'bg-indigo-500', badgeVariant: 'default' },
        4: { text: 'Entregue', color: 'bg-emerald-600', badgeVariant: 'success' },
        5: { text: 'Cancelado', color: 'bg-red-500', badgeVariant: 'destructive' },
    };

    const statusOptions = Object.entries(statusMap).map(([value, info]) => ({
        value: value,
        label: info.text
    }));

    const TIME_ZONE = 'America/Araguaina'; 

    const formatarData = (dataISO) => {
        if (!dataISO) return 'N/A';
        try {
            const zonedDate = toZonedTime(dataISO, TIME_ZONE);
            return formatInTimeZone(zonedDate, TIME_ZONE, 'dd/MM/yyyy HH:mm', { locale: ptBR });
        } catch (error) {
            console.error('Erro ao formatar data:', error);
            return 'Erro na data';
        }
    };

    const isNewOrder = (orderDateISO) => {
        const orderDate = toZonedTime(orderDateISO, TIME_ZONE);
        const now = toZonedTime(new Date(), TIME_ZONE);
        const minutesDiff = differenceInMinutes(now, orderDate);
        return minutesDiff <= 15;
    };


    const fetchPedidos = useCallback(async () => {
        if (!slug) return;
        setLoading(true);
        try {
            // ATENÇÃO: Verifique se o seu BACKEND está configurado para retornar
            // os 'pedido_itens' e 'produto' junto com os dados do pedido.
            // Exemplo de como deve ser no pedidoController.js em listarTodosPedidosDaLoja:
            // .select(`*, cliente:id_cliente ( id, nome, email, telefone ), pedido_itens:pedido_itens ( *, produto:produto_id ( id, nome, preco, image, descricao ) )`)
            const url = `${process.env.NEXT_PUBLIC_EMPRESA_API}/loja/${slug}/pedidos`; 
            const res = await fetch(url, {
                method: "GET",
                credentials: 'include',
            });

            if (!res.ok) {
                if (res.status === 401 || res.status === 403) {
                    router.push('/loginEmpresa');
                    return;
                }
                throw new Error(`HTTP error! status: ${res.status}`);
            }
            const data = await res.json();
            
            const pedidosVisiveis = data.filter(pedido => parseInt(pedido.status) >= 0); 
            
            setPedidos(pedidosVisiveis);
        } catch (err) {
            console.error("Erro ao buscar pedidos:", err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [slug, router]);

    useEffect(() => {
        if (router.isReady) {
            fetchPedidos();
            const interval = setInterval(fetchPedidos, 30000); // Atualiza a cada 30 segundos
            return () => clearInterval(interval);
        }
    }, [router.isReady, fetchPedidos]);

    const abrirModalDetalhes = async (pedido) => {
        try {
            let itens = pedido.pedido_itens || []; 

            if (itens.length === 0) { 
                const res = await fetch(`${process.env.NEXT_PUBLIC_EMPRESA_API}/pedidos/${pedido.id}/itens`);
                if (!res.ok) throw new Error(`Erro ao buscar itens: ${res.status}`);
                itens = await res.json();
            }
            setPedidoDetalhes({ ...pedido, itens });
            setShowDetalhesModal(true);
        } catch (err) {
            console.error("Erro ao buscar detalhes do pedido:", err);
            toast.error("Erro ao buscar detalhes do pedido.");
        }
    };

    const handleOpenUpdateStatusModal = (pedido) => {
        setPedidoParaAtualizar(pedido);
        setNovoStatus(String(pedido.status));
        setShowUpdateStatusModal(true);
    };

    const confirmUpdateStatus = async () => {
        if (!pedidoParaAtualizar || !novoStatus) return;

        setUpdatingStatus(true);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_EMPRESA_API}/pedidos/${pedidoParaAtualizar.id}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ status: novoStatus }),
                credentials: 'include',
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.mensagem || `Erro ao atualizar status: ${res.status}`);
            }

            setPedidos(prevPedidos =>
                prevPedidos.map(p =>
                    p.id === pedidoParaAtualizar.id ? { ...p, status: novoStatus } : p
                )
            );
            toast.success("Status atualizado com sucesso!");
            setShowUpdateStatusModal(false);
            setPedidoParaAtualizar(null);
            setNovoStatus('');
        } catch (err) {
            console.error("Erro ao atualizar status:", err);
            toast.error(`Erro ao atualizar status: ${err.message}`);
        } finally {
            setUpdatingStatus(false);
        }
    };

    const markOrderAsDelivered = async (pedidoId) => {
        setUpdatingStatus(true); 
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_EMPRESA_API}/pedidos/${pedidoId}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ status: 4 }), // Status 4 é 'Entregue'
                credentials: 'include',
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.mensagem || `Erro ao marcar como entregue: ${res.status}`);
            }

            setPedidos(prevPedidos =>
                prevPedidos.map(p =>
                    p.id === pedidoId ? { ...p, status: '4', data_finalizacao: new Date().toISOString() } : p
                )
            );
            toast.success("Pedido marcado como entregue com sucesso!");
        } catch (err) {
            console.error("Erro ao marcar pedido como entregue:", err);
            toast.error(`Erro ao marcar como entregue: ${err.message}`);
        } finally {
            setUpdatingStatus(false);
        }
    };


    const generateOrderPdf = async (pedido) => {
        const doc = new jsPDF();
        let yPos = 20;

        doc.setFontSize(18);
        doc.text(`Pedido #${pedido.id}`, 14, yPos);
        yPos += 10;

        doc.setFontSize(12);
        doc.text(`Loja: ${slug}`, 14, yPos);
        yPos += 7;
        doc.text(`Data do Pedido: ${formatarData(pedido.data)}`, 14, yPos);
        yPos += 15;

        doc.setFontSize(14);
        doc.text('Dados do Cliente:', 14, yPos);
        yPos += 8;
        doc.setFontSize(12);
        doc.text(`Nome: ${pedido.nome_cliente || 'N/A'}`, 14, yPos);
        yPos += 7;
        doc.text(`Email: ${pedido.cliente_email || 'N/A'}`, 14, yPos);
        yPos += 7;
        doc.text(`Telefone: ${pedido.cliente_telefone || 'N/A'}`, 14, yPos);
        yPos += 15;

        doc.setFontSize(14);
        doc.text('Endereço de Entrega:', 14, yPos);
        yPos += 8;
        doc.setFontSize(12);
        let enderecoFormatado = 'Não especificado';
        if (typeof pedido.endereco_entrega === 'object' && pedido.endereco_entrega !== null) {
            const end = pedido.endereco_entrega;
            enderecoFormatado = `${end.rua}, ${end.numero}`;
            if (end.complemento) enderecoFormatado += ` (${end.complemento})`;
            enderecoFormatado += `\n${end.bairro}, ${end.cidade} - ${end.estado}\nCEP: ${end.cep}`;
        } else if (typeof pedido.endereco_entrega === 'string') {
            enderecoFormatado = pedido.endereco_entrega;
        }

        doc.text(enderecoFormatado, 14, yPos, { maxWidth: 180 });
        yPos += (enderecoFormatado.split('\n').length * 7) + 8;

        let itensDoPedido = pedido.pedido_itens || []; 

        if (itensDoPedido.length === 0) { 
            try {
                const itensResponse = await fetch(`${process.env.NEXT_PUBLIC_EMPRESA_API}/pedidos/${pedido.id}/itens`);
                if (itensResponse.ok) {
                    itensDoPedido = await itensResponse.json();
                } else {
                    console.error("Erro ao buscar itens para PDF:", itensResponse.status);
                    itensDoPedido = [];
                }
            } catch (itemErr) {
                console.error("Erro ao buscar itens para PDF:", itemErr);
                itensDoPedido = [];
            }
        }

        doc.setFontSize(14);
        doc.text('Itens do Pedido:', 14, yPos);
        yPos += 8;

        if (itensDoPedido && itensDoPedido.length > 0) {
            itensDoPedido.forEach(item => {
                doc.setFontSize(12);
                doc.text(`- ${item.quantidade}x ${item.nome_produto || item.produto?.nome || 'Produto Desconhecido'} (R$ ${Number(item.preco_unitario).toFixed(2)})`, 14, yPos);
                if (item.observacoes_item) {
                    yPos += 5;
                    doc.setFontSize(10);
                    doc.text(`   Obs: ${item.observacoes_item}`, 18, yPos);
                }
                yPos += 7;
                if (yPos > 280) {
                    doc.addPage();
                    yPos = 20;
                }
            });
        } else {
            doc.setFontSize(12);
            doc.text('Nenhum item encontrado para este pedido.', 14, yPos);
            yPos += 7;
        }

        yPos += 10;
        doc.setFontSize(14);
        doc.text(`Total: R$ ${Number(pedido.total).toFixed(2)}`, 14, yPos);
        yPos += 10;
        doc.setFontSize(12);
        doc.text(`Observações do Pedido: ${pedido.observacoes || 'Nenhuma'}`, 14, yPos);

        doc.save(`pedido-${pedido.id}_${pedido.nome_cliente?.split(' ')[0] || 'cliente'}.pdf`);
    };


    if (loading) {
        return (
            <OwnerSidebar slug={slug}>
                <div className="flex justify-center items-center min-h-screen">
                    <p className="text-gray-700 text-lg">Carregando pedidos...</p>
                </div>
            </OwnerSidebar>
        );
    }

    if (error) {
        return (
            <OwnerSidebar slug={slug}>
                <div className="flex justify-center items-center min-h-screen">
                    <p className="text-red-600 text-lg">Erro: {error}</p>
                </div>
            </OwnerSidebar>
        );
    }

    // Filtrar pedidos com base no termo de busca (APENAS ID E TELEFONE)
    const pedidosFiltrados = searchTerm
        ? pedidos.filter(pedido => { 
            const normalizedSearchTerm = normalizeAndLowercase(searchTerm);

            // Busca por ID do pedido
            const matchesId = pedido.id.toString().includes(normalizedSearchTerm);
            
            // Busca por Telefone do cliente (removendo caracteres não numéricos para comparação)
            const clienteTelefoneNormalized = normalizeAndLowercase(pedido.cliente_telefone).replace(/\D/g, ''); 
            const normalizedSearchTermPhone = normalizedSearchTerm.replace(/\D/g, '');
            const matchesPhone = clienteTelefoneNormalized.includes(normalizedSearchTermPhone);
            
            return matchesId || matchesPhone; // Retorna true se encontrar no ID ou no Telefone
        })
        : pedidos; // Se o termo de busca estiver vazio, retorna todos os pedidos


    return (
        <OwnerSidebar slug={slug}>
            <div className="min-h-screen bg-gray-100 flex flex-col items-center p-4">
                <div className="w-full max-w-6xl flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold text-gray-800">Gerenciamento de Pedidos</h1>
                    {/* BOTÃO "Mostrar/Esconder Itens dos Pedidos" */}
                    <Button 
                        onClick={() => setShowItemsInline(!showItemsInline)}
                        className="bg-blue-600 hover:bg-blue-700 text-white cursor-pointer px-4 py-2 rounded-md"
                    >
                        {showItemsInline ? 'Esconder Detalhes dos Pedidos' : 'Mostrar Detalhes dos Pedidos'}
                    </Button>
                </div>
                
                {/* Barra de Busca */}
                <div className="w-full max-w-6xl mb-6">
                    <Input
                        type="text"
                        placeholder="Buscar por ID do pedido ou telefone..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="p-2 border rounded-md w-full"
                    />
                </div>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full max-w-6xl">
                    <TabsList className="grid w-full grid-cols-3 md:grid-cols-3" style={{ backgroundColor: corPrimaria }}>
                        <TabsTrigger
                            value="em_aberto"
                            className="text-white data-[state=active]:bg-white data-[state=active]:text-blue-600 cursor-pointer"
                            style={{ backgroundColor: activeTab === 'em_aberto' ? 'white' : corPrimaria, color: activeTab === 'em_aberto' ? corPrimaria : 'white' }}
                        >
                            Pedidos em Aberto 
                        </TabsTrigger>
                        <TabsTrigger
                            value="finalizados"
                            className="text-white data-[state=active]:bg-white data-[state=active]:text-blue-600 cursor-pointer"
                            style={{ backgroundColor: activeTab === 'finalizados' ? 'white' : corPrimaria, color: activeTab === 'finalizados' ? corPrimaria : 'white' }}
                        >
                            Pedidos Finalizados
                        </TabsTrigger>
                        <TabsTrigger
                            value="motoboy"
                            className="text-white data-[state=active]:bg-white data-[state=active]:text-blue-600 cursor-pointer"
                            style={{ backgroundColor: activeTab === 'motoboy' ? 'white' : corPrimaria, color: activeTab === 'motoboy' ? corPrimaria : 'white' }}
                        >
                            Área do Motoboy
                        </TabsTrigger>
                    </TabsList>

                    {/* Aba: Pedidos em Aberto */}
                    <TabsContent key={activeTab + '-' + searchTerm + '-em_aberto'} value="em_aberto" className="mt-6">
                        {pedidosFiltrados.filter(p => [0, 1, 2, 3].includes(parseInt(p.status))).length === 0 ? (
                            <p className="text-black text-center text-lg mt-10">
                                {searchTerm ? "Nenhum pedido em aberto encontrado para a busca." : "Nenhum pedido em aberto no momento."}
                            </p>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {pedidosFiltrados.filter(p => [0, 1, 2, 3].includes(parseInt(p.status))).map((pedido) => (
                                    <Card key={pedido.id} className="shadow-lg">
                                        <CardHeader className="relative flex flex-col pb-2">
                                            <div className="flex justify-between items-start w-full">
                                                <CardTitle className="text-lg font-semibold text-gray-700">
                                                    Pedido #{pedido.id}
                                                </CardTitle>
                                                <div className="flex flex-col items-end -mt-1 mr-2">
                                                    <OrderStatusBadge status={parseInt(pedido.status)} statusMap={statusMap} />
                                                    {isNewOrder(pedido.data) && parseInt(pedido.status) === 0 && (
                                                        <Badge variant="default" className="bg-blue-500 text-white mt-1 px-2 py-0.5 text-xs animate-pulse">
                                                            NOVO
                                                        </Badge>
                                                    )}
                                                    <span
                                                        onClick={() => generateOrderPdf(pedido)}
                                                        className="text-sm text-blue-600 hover:text-blue-800 cursor-pointer mt-1"
                                                        title="Imprimir PDF do Pedido"
                                                    >
                                                        Imprimir PDF
                                                    </span>
                                                </div>
                                            </div>
                                            <CardDescription className="text-gray-700 w-full text-left mt-1">
                                                Cliente: {pedido.nome_cliente || 'Desconhecido'} - {formatarData(pedido.data)}
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent className="space-y-1 text-gray-600">
                                            <p><strong>Total:</strong> R$ {Number(pedido.total || 0).toFixed(2)}</p>
                                            <p><strong>Status Atual:</strong> <span className="font-medium">{statusMap[parseInt(pedido.status)]?.text || 'Desconhecido'}</span></p>
                                            {pedido.endereco_entrega && (
                                                <p><strong>Endereço:</strong> {typeof pedido.endereco_entrega === 'object' ? `${pedido.endereco_entrega.rua}, ${pedido.endereco_entrega.numero}, ${pedido.endereco_entrega.bairro}` : pedido.endereco_entrega}</p>
                                            )}
                                            <p>
                                                <strong>Contato:</strong>{' '}
                                                {pedido.cliente_telefone ? (
                                                    <a href={`tel:${pedido.cliente_telefone.replace(/\D/g, '')}`} className="text-blue-600 hover:underline">
                                                        {pedido.cliente_telefone}
                                                    </a>
                                                ) : 'N/A'}
                                            </p>
                                            <p><strong>Obs:</strong> {pedido.observacoes || 'Nenhuma'}</p>

                                            {showItemsInline && (
                                                <div className="mt-2 border-t pt-2">
                                                    <p className="font-semibold">Itens do Pedido:</p>
                                                    <ul className="list-disc list-inside text-sm pl-4">
                                                        {pedido.pedido_itens && pedido.pedido_itens.length > 0 ? (
                                                            pedido.pedido_itens.map((item) => (
                                                                <li key={item.id}>
                                                                    {item.produto?.nome || item.nome_produto || 'Produto Desconhecido'} - {item.quantidade}x R$ {(Number(item.preco_unitario) || 0).toFixed(2)}
                                                                    {item.observacoes_item && <span className="italic ml-1">({item.observacoes_item})</span>}
                                                                </li>
                                                            ))
                                                        ) : (
                                                            <li>Nenhum item encontrado.</li>
                                                        )}
                                                    </ul>
                                                </div>
                                            )}
                                        </CardContent>
                                        <CardFooter className="flex flex-col gap-2 pt-4">
                                            <Button
                                                onClick={() => abrirModalDetalhes(pedido)}
                                                className="w-full bg-blue-600 hover:bg-blue-700 text-white cursor-pointer"
                                            >
                                                Ver Detalhes
                                            </Button>
                                            <Button
                                                onClick={() => handleOpenUpdateStatusModal(pedido)}
                                                className="w-full bg-green-600 hover:bg-green-700 text-white cursor-pointer"
                                            >
                                                Atualizar Status
                                            </Button>
                                        </CardFooter>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </TabsContent>

                    {/* Aba: Pedidos Finalizados */}
                    <TabsContent key={activeTab + '-' + searchTerm + '-finalizados'} value="finalizados" className="mt-6">
                        {pedidosFiltrados.filter(p => [4, 5].includes(parseInt(p.status))).length === 0 ? (
                            <p className="text-black text-center text-lg mt-10">
                                {searchTerm ? "Nenhum pedido finalizado ou cancelado encontrado para a busca." : "Nenhum pedido finalizado ou cancelado."}
                            </p>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {pedidosFiltrados.filter(p => [4, 5].includes(parseInt(p.status))).map((pedido) => (
                                    <Card key={pedido.id} className="shadow-lg opacity-80">
                                        <CardHeader className="relative flex flex-col pb-2">
                                            <div className="flex justify-between items-start w-full">
                                                <CardTitle className="text-lg font-semibold text-gray-700">
                                                    Pedido #{pedido.id}
                                                </CardTitle>
                                                <div className="flex flex-col items-end -mt-1 mr-2">
                                                    <OrderStatusBadge status={parseInt(pedido.status)} statusMap={statusMap} />
                                                    {isNewOrder(pedido.data) && (
                                                        <Badge variant="default" className="bg-blue-500 text-white mt-1 px-2 py-0.5 text-xs animate-pulse">
                                                            NOVO
                                                        </Badge>
                                                    )}
                                                    <span
                                                        onClick={() => generateOrderPdf(pedido)}
                                                        className="text-sm text-blue-600 hover:text-blue-800 cursor-pointer mt-1"
                                                        title="Re-imprimir PDF do Pedido"
                                                    >
                                                        Re-imprimir PDF
                                                    </span>
                                                </div>
                                            </div>
                                            <CardDescription className="text-gray-700 w-full text-left mt-1">
                                                Cliente: {pedido.nome_cliente || 'Desconhecido'} - {formatarData(pedido.data)}
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent className="space-y-1 text-gray-600">
                                            <p><strong>Total:</strong> R$ {Number(pedido.total || 0).toFixed(2)}</p>
                                            <p><strong>Status:</strong> <span className="font-medium">{statusMap[parseInt(pedido.status)]?.text || 'Desconhecido'}</span></p>
                                            <p><strong>Finalizado em:</strong> {pedido.data_finalizacao ? formatarData(pedido.data_finalizacao) : 'N/A'}</p>
                                            <p>
                                                <strong>Contato:</strong>{' '}
                                                {pedido.cliente_telefone ? (
                                                    <a href={`tel:${pedido.cliente_telefone.replace(/\D/g, '')}`} className="text-blue-600 hover:underline">
                                                        {pedido.cliente_telefone}
                                                    </a>
                                                ) : 'N/A'}
                                            </p>

                                            {showItemsInline && (
                                                <div className="mt-2 border-t pt-2">
                                                    <p className="font-semibold">Itens do Pedido:</p>
                                                    <ul className="list-disc list-inside text-sm pl-4">
                                                        {pedido.pedido_itens && pedido.pedido_itens.length > 0 ? (
                                                            pedido.pedido_itens.map((item) => (
                                                                <li key={item.id}>
                                                                    {item.produto?.nome || item.nome_produto || 'Produto Desconhecido'} - {item.quantidade}x R$ {(Number(item.preco_unitario) || 0).toFixed(2)}
                                                                    {item.observacoes_item && <span className="italic ml-1">({item.observacoes_item})</span>}
                                                                </li>
                                                            ))
                                                        ) : (
                                                            <li>Nenhum item encontrado.</li>
                                                        )}
                                                    </ul>
                                                </div>
                                            )}
                                        </CardContent>
                                        <CardFooter className="pt-4">
                                            <Button
                                                onClick={() => abrirModalDetalhes(pedido)}
                                                className="w-full bg-blue-600 hover:bg-blue-700 text-white cursor-pointer"
                                            >
                                                Ver Detalhes
                                            </Button>
                                        </CardFooter>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </TabsContent>

                    {/* Aba: Área do Motoboy */}
                    <TabsContent key={activeTab + '-' + searchTerm + '-motoboy'} value="motoboy" className="mt-6">
                        <h2 className="text-2xl font-semibold mb-4 text-gray-800">Pedidos para Entrega (Motoboy)</h2>
                        {pedidosFiltrados.filter(p => parseInt(p.status) === 3).length === 0 ? (
                            <p className="text-black text-center text-lg mt-10">
                                {searchTerm ? "Nenhum pedido em entrega encontrado para a busca." : "Nenhum pedido saiu para entrega no momento."}
                            </p>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {pedidosFiltrados.filter(p => parseInt(p.status) === 3).map((pedido) => (
                                    <Card key={pedido.id} className="shadow-lg border-l-4 border-indigo-500">
                                        <CardHeader className="relative flex flex-col pb-2">
                                            <div className="flex justify-between items-start w-full">
                                                <CardTitle className="text-lg font-semibold text-gray-700">
                                                    Pedido #{pedido.id}
                                                </CardTitle>
                                                <div className="flex flex-col items-end -mt-1 mr-2">
                                                    <OrderStatusBadge status={parseInt(pedido.status)} statusMap={statusMap} />
                                                    {isNewOrder(pedido.data) && (
                                                        <Badge variant="default" className="bg-blue-500 text-white mt-1 px-2 py-0.5 text-xs animate-pulse">
                                                            NOVO
                                                        </Badge>
                                                    )}
                                                    <span
                                                        onClick={() => generateOrderPdf(pedido)}
                                                        className="text-sm text-blue-600 hover:text-blue-800 cursor-pointer mt-1"
                                                        title="Imprimir PDF do Pedido"
                                                    >
                                                        Imprimir PDF
                                                    </span>
                                                </div>
                                            </div>
                                            <CardDescription className="text-gray-700 w-full text-left mt-1">
                                                Cliente: {pedido.nome_cliente || 'Desconhecido'} - {formatarData(pedido.data)}
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent className="space-y-1 text-gray-600">
                                            <p><strong>Total:</strong> R$ {Number(pedido.total || 0).toFixed(2)}</p>
                                            {pedido.endereco_entrega && (
                                                <p><strong>Endereço:</strong> {typeof pedido.endereco_entrega === 'object' ? `${pedido.endereco_entrega.rua}, ${pedido.endereco_entrega.numero}, ${pedido.endereco_entrega.bairro}` : pedido.endereco_entrega}</p>
                                            )}
                                            <p>
                                                <strong>Contato:</strong>{' '}
                                                {pedido.cliente_telefone ? (
                                                    <a href={`tel:${pedido.cliente_telefone.replace(/\D/g, '')}`} className="text-blue-600 hover:underline">
                                                        {pedido.cliente_telefone}
                                                    </a>
                                                ) : 'N/A'}
                                            </p>

                                            {showItemsInline && (
                                                <div className="mt-2 border-t pt-2">
                                                    <p className="font-semibold">Itens do Pedido:</p>
                                                    <ul className="list-disc list-inside text-sm pl-4">
                                                        {pedido.pedido_itens && pedido.pedido_itens.length > 0 ? (
                                                            pedido.pedido_itens.map((item) => (
                                                                <li key={item.id}>
                                                                    {item.produto?.nome || item.nome_produto || 'Produto Desconhecido'} - {item.quantidade}x R$ {(Number(item.preco_unitario) || 0).toFixed(2)}
                                                                    {item.observacoes_item && <span className="italic ml-1">({item.observacoes_item})</span>}
                                                                </li>
                                                            ))
                                                        ) : (
                                                            <li>Nenhum item encontrado.</li>
                                                        )}
                                                    </ul>
                                                </div>
                                            )}
                                        </CardContent>
                                        <CardFooter className="flex flex-col gap-2 pt-4">
                                            <Button
                                                onClick={() => markOrderAsDelivered(pedido.id)}
                                                className="w-full bg-emerald-500 hover:bg-emerald-600 text-white cursor-pointer"
                                                disabled={updatingStatus}
                                            >
                                                Marcar como Entregue
                                            </Button>
                                        </CardFooter>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </TabsContent>
                </Tabs>


                {/* Modal de Detalhes do Pedido - Correção de nome de produto */}
                {showDetalhesModal && pedidoDetalhes && (
                    <div className="fixed inset-0 backdrop-blur-sm bg-black/30 flex items-center justify-center z-50 p-4">
                        <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full text-black">
                            <h2 className="text-xl font-bold mb-4 text-center">Detalhes do Pedido #{pedidoDetalhes.id}</h2>
                            <div className="space-y-2 text-gray-700">
                                <p><strong>Data:</strong> {formatarData(pedidoDetalhes.data)}</p>
                                <p><strong>Status:</strong> {statusMap[parseInt(pedidoDetalhes.status)]?.text || 'Desconhecido'}</p>
                                <p><strong>Desconto:</strong> R$ {(Number(pedidoDetalhes.desconto) || 0).toFixed(2)}</p>
                                <p><strong>Total:</strong> R$ {Number(pedidoDetalhes.total).toFixed(2)}</p>
                                <h3 className="mt-4 font-semibold text-lg">Dados do Cliente:</h3>
                                <p><strong>Nome:</strong> {pedidoDetalhes.nome_cliente || 'N/A'}</p>
                                <p><strong>Email:</strong> {pedidoDetalhes.cliente_email || 'N/A'}</p>
                                <p><strong>Telefone:</strong> {pedidoDetalhes.cliente_telefone || 'N/A'}</p>

                                {pedidoDetalhes.endereco_entrega && (
                                    <>
                                        <h3 className="mt-4 font-semibold text-lg">Endereço de Entrega:</h3>
                                        <p>{typeof pedidoDetalhes.endereco_entrega === 'object' ? `${pedidoDetalhes.endereco_entrega.rua}, ${pedidoDetalhes.endereco_entrega.numero}` : pedidoDetalhes.endereco_entrega}</p>
                                        {typeof pedidoDetalhes.endereco_entrega === 'object' && (
                                            <>
                                                <p>{pedidoDetalhes.endereco_entrega.bairro}, {pedidoDetalhes.endereco_entrega.cidade} - {pedidoDetalhes.endereco_entrega.estado}</p>
                                                <p>CEP: {pedidoDetalhes.endereco_entrega.cep}</p>
                                                {pedidoDetalhes.endereco_entrega.complemento && <p>Complemento: {pedidoDetalhes.endereco_entrega.complemento}</p>}
                                            </>
                                        )}
                                    </>
                                )}
                                <h3 className="mt-4 font-semibold text-lg">Itens:</h3>
                                <ul className="list-disc list-inside space-y-1">
                                    {pedidoDetalhes.itens?.map((item) => (
                                        <li key={item.id} className="text-gray-700">
                                            {item.nome_produto || item.produto?.nome || 'Produto Desconhecido'} - {item.quantidade}x R$ {(Number(item.preco_unitario) || 0).toFixed(2)}
                                            {item.observacoes_item && <span className="text-sm italic ml-2">({item.observacoes_item})</span>}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <div className="flex justify-end mt-6">
                                <Button
                                    onClick={() => setShowDetalhesModal(false)}
                                    className="bg-gray-300 hover:bg-gray-400 text-black px-4 py-2 rounded-md cursor-pointer"
                                >
                                    Fechar
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Modal de Atualização de Status (inalterado) */}
                <Dialog open={showUpdateStatusModal} onOpenChange={setShowUpdateStatusModal}>
                    <DialogContent className="bg-white text-black max-w-sm">
                        <DialogHeader>
                            <DialogTitle className="text-xl font-bold text-center">Atualizar Status do Pedido #{pedidoParaAtualizar?.id}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <label htmlFor="status-select" className="block text-md font-medium text-gray-700">
                                Novo Status:
                            </label>
                            <Select onValueChange={setNovoStatus} value={novoStatus}>
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Selecione um status" />
                                </SelectTrigger>
                                <SelectContent>
                                    {statusOptions.map(option => (
                                        <SelectItem key={option.value} value={option.value}>
                                            {option.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <DialogFooter className="flex justify-end gap-2">
                            <Button
                                onClick={() => setShowUpdateStatusModal(false)}
                                className="bg-gray-300 hover:bg-gray-400 text-black cursor-pointer"
                                disabled={updatingStatus}
                            >
                                Cancelar
                            </Button>
                            <Button
                                onClick={confirmUpdateStatus}
                                className="bg-green-600 hover:bg-green-700 text-white cursor-pointer"
                                disabled={updatingStatus || !novoStatus}
                            >
                                {updatingStatus ? 'Atualizando...' : 'Atualizar'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </OwnerSidebar>
    );
}