// pages/suporte.js

import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { FiPhone, FiMail, FiMessageSquare, FiTool } from 'react-icons/fi'; // Importando todos os ícones usados
import ContatoModal from '@/components//ContatoModal'; 
import TecnicoModal from '@/components/TecnicoModal';
import toast from 'react-hot-toast'; 

function FaqItem({ question, answer }) {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <div className="border-b border-gray-200 py-4">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex justify-between items-center text-left text-gray-800 focus:outline-none group"
            >
                <span className="font-semibold text-base group-hover:text-blue-600 transition-colors">{question}</span>
                <svg className={`w-5 h-5 text-gray-500 transform transition-transform duration-300 ${isOpen ? 'rotate-180 text-blue-600' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </button>
            {isOpen && (
                <div className="mt-3 text-gray-600 text-sm leading-relaxed pr-6">
                    <p>{answer}</p>
                </div>
            )}
        </div>
    );
}

// Dados completos do FAQ
const faqData = [
    {
        category: "Compras",
        emoji: "🛍️",
        questions: [
            { q: "Como faço uma compra?", a: "Para comprar, basta fazer login na plataforma, adicionar os produtos ao carrinho, preencher as informações de endereço e forma de pagamento e finalizar. Depois disso, o lojista começará a preparar o seu pedido." },
            { q: "Posso retirar meu pedido na loja?", a: "Sim! Se o lojista oferecer essa opção, você poderá escolher a retirada no local durante a finalização da compra." }
        ]
    },
    {
        category: "Pedidos e Entregas",
        emoji: "📦",
        questions: [
            { q: "Como acompanho o status do meu pedido?", a: "Você pode acompanhar o status acessando a página 'Meus Pedidos' (é necessário estar logado)." },
            { q: "Como funciona a entrega? Quem é responsável?", a: "A entrega é de responsabilidade do lojista. Ele definirá a forma e o prazo de entrega conforme as opções disponíveis." },
            { q: "E se eu não estiver em casa na hora da entrega?", a: "Recomendamos entrar em contato diretamente com o lojista para combinar uma nova tentativa de entrega ou retirada." },
            { q: "Recebi um produto errado. O que devo fazer?", a: "Entre em contato diretamente com o lojista pelo canal de atendimento disponível na página do pedido para relatar o problema." }
        ]
    },
    {
        category: "Cancelamentos e Devoluções",
        emoji: "❌",
        questions: [
            { q: "Como cancelo meu pedido?", a: "Na página de 'Meus Pedidos', se o status permitir, você verá um botão “Cancelar”. Após a solicitação, o lojista analisará e poderá aceitar ou recusar, explicando o motivo." },
            { q: "Quais pedidos não podem ser cancelados?", a: "Pedidos com os status 'Em preparo', 'Pronto', 'Em rota de entrega' ou 'Finalizado' não podem ser cancelados." },
            { q: "Em quanto tempo recebo uma resposta sobre o cancelamento?", a: "O prazo de resposta pode variar de acordo com o lojista. A maioria responde em poucas horas." }
        ]
    },
    {
        category: "Pagamentos",
        emoji: "💳",
        questions: [
            { q: "Como faço o pagamento do meu pedido?", a: "O pagamento é realizado diretamente com o lojista, fora da plataforma. Você poderá pagar no momento da entrega ou retirada, conforme combinado." },
            { q: "Quais formas de pagamento estão disponíveis?", a: "As formas de pagamento são definidas por cada lojista. Consulte as opções disponíveis ao finalizar o pedido ou entre em contato com o vendedor." }
        ]
    },
    {
        category: "Minha Conta",
        emoji: "👤",
        questions: [
            { q: "Como crio uma conta na plataforma?", a: "Na página inicial, clique em “Login” e depois em “Criar conta”. Preencha os dados e pronto!" },
            { q: "Esqueci minha senha. E agora?", a: "Clique em “Esqueci minha senha” na tela de login. Você receberá um e-mail com instruções para redefinir sua senha." }
        ]
    }
];


export default function SuportePage() {
    const router = useRouter();
    const { slug: slugLoja } = router.query;

    const [loja, setLoja] = useState(null);
    const [empresa, setEmpresa] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null); 
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isTecnicoModalOpen, setIsTecnicoModalOpen] = useState(false);

    const [openCategory, setOpenCategory] = useState(null);

    const handleCategoryClick = (categoryName) => {
        if (openCategory === categoryName) {
            setOpenCategory(null); // Fecha se clicar na mesma categoria
        } else {
            setOpenCategory(categoryName); // Abre a nova categoria clicada
        }
    };

    useEffect(() => {
        if (!slugLoja) {
            setLoading(false);
            // Poderia definir um erro aqui também, se o slug for obrigatório
            // setError("Slug da loja não fornecido."); 
            return;
        }

        async function fetchLojaData() {
            setLoading(true);
            setError(null); // Limpa erros anteriores
            try {
                const response = await fetch(`${process.env.NEXT_PUBLIC_EMPRESA_API}/loja/slug-completo/${slugLoja}`);
                if (!response.ok) {
                    throw new Error("Loja não encontrada ou falha na comunicação.");
                }
                
                const data = await response.json();

                if (data && data.loja) {
                    setLoja(data.loja);
                    setEmpresa(data.empresa);
                } else {
                    throw new Error("Os dados da loja retornados estão incompletos.");
                }

            } catch (err) {
                console.error("Erro ao buscar dados da loja:", err);
                setError(err.message); // <-- Define a mensagem de erro no estado
            } finally {
                setLoading(false);
            }
        }

        fetchLojaData();
    }, [slugLoja]);
    
    // Função com a lógica de mensagem aprimorada
    const handleContatoSubmit = (motivo, numeroPedido) => {
        if (!empresa || !empresa.telefone) {
            toast.error("O número de contato da loja não está disponível.");
            return;
        }

        const numeroLimpo = `55${empresa.telefone.replace(/\D/g, '')}`;
        let assunto = '';

        // Usamos um switch para montar a parte principal da mensagem de forma clara
        switch (motivo) {
            case 'Pedido':
                assunto = numeroPedido
                    ? `Ajuda com o Pedido ${numeroPedido.trim()}`
                    : 'Ajuda com um Pedido';
                break;
            case 'Produto':
                assunto = 'Dúvida sobre um Produto';
                break;
            case 'Entrega':
                assunto = 'Informações sobre a Entrega';
                break;
            case 'Pagamento':
                assunto = 'Questão sobre Pagamento';
                break;
            default:
                assunto = 'Outro Assunto';
                break;
        }

        const mensagemCompleta = `Olá, ${loja.nome_fantasia}! Entrei em contato através da Central de Ajuda.\n\nAssunto: *${assunto}*.`;
        
        const mensagemFinal = encodeURIComponent(mensagemCompleta);
        const whatsappUrl = `https://wa.me/${numeroLimpo}?text=${mensagemFinal}`;

        window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
        setIsModalOpen(false); // Fecha o modal após abrir o link
    };
    

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen bg-gray-50">
                <p className="text-gray-500">Carregando informações da loja...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col justify-center items-center min-h-screen bg-gray-50 text-center p-4">
                <h1 className="text-2xl font-bold text-red-600 mb-2">Ocorreu um Erro</h1>
                <p className="text-gray-700">{error}</p>
                <button onClick={() => router.back()} className="mt-6 bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600">
                    Voltar
                </button>
            </div>
        );
    }

    // Se não está carregando e não deu erro, mas a loja não foi encontrada.
    if (!loja) {
        return (
             <div className="flex flex-col justify-center items-center min-h-screen bg-gray-50 text-center p-4">
                <h1 className="text-2xl font-bold text-gray-800 mb-2">Loja não encontrada</h1>
                <p className="text-gray-600">Não foi possível encontrar as informações da loja solicitada.</p>
                 <button onClick={() => router.back()} className="mt-6 bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600">
                    Voltar
                </button>
            </div>
        )
    }

    // Renderização principal (só ocorre se 'loja' e 'empresa' existirem)
    return (
        <div className="bg-gray-50 min-h-screen">
            <header style={{ backgroundColor: loja.cor_primaria || '#333' }} className="p-4 text-white shadow-md sticky top-0 z-10">
                <div className="max-w-4xl mx-auto flex items-center gap-3">
                    <button onClick={() => router.back()} className="p-2 rounded-full hover:bg-black/20 transition-colors" aria-label="Voltar">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold">Central de Ajuda</h1>
                        {/* Agora é seguro acessar loja.nome_fantasia */}
                        <p className="text-sm opacity-90">Suporte para a loja {loja.nome_fantasia}</p>
                    </div>
                </div>
            </header>

            <main className="max-w-4xl mx-auto py-8 sm:py-12 px-4">
                
                 <section className="mb-12">
                    <h2 className="text-2xl font-bold text-gray-900 mb-5">Perguntas Frequentes (FAQ)</h2>
                    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                        {faqData.map((categoryItem) => (
                            <div key={categoryItem.category} className="border-b border-gray-200 last:border-b-0">
                                {/* Nível 1: Botão da Categoria */}
                                <button
                                    onClick={() => handleCategoryClick(categoryItem.category)}
                                    className="w-full flex justify-between items-center text-left p-4 sm:p-6 focus:outline-none group"
                                >
                                    <h3 className="text-base sm:text-lg font-semibold text-gray-800 flex items-center gap-3 group-hover:text-blue-600 transition-colors">
                                        <span className="text-xl">{categoryItem.emoji}</span>
                                        {categoryItem.category}
                                    </h3>
                                    <svg 
                                        className={`w-5 h-5 text-gray-500 transform transition-transform duration-300 ${openCategory === categoryItem.category ? 'rotate-180 text-blue-600' : ''}`} 
                                        fill="none" viewBox="0 0 24 24" stroke="currentColor"
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>

                                {/* Nível 2: Lista de Perguntas (condicional) */}
                                {openCategory === categoryItem.category && (
                                    <div className="px-4 pb-4 sm:px-6 sm:pb-6 bg-gray-50/50">
                                        <div className="border-t border-gray-200 pt-2">
                                            {categoryItem.questions.map((item, index) => (
                                                <FaqItem key={index} question={item.q} answer={item.a} />
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </section>

                {/* Seção "Ainda precisa de ajuda?" */}
                <section>
                    <h2 className="text-2xl font-bold text-gray-900 mb-5">Ainda precisa de ajuda?</h2>
                    <div className="grid sm:grid-cols-2 gap-6">
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="bg-white p-6 rounded-xl shadow-sm hover:shadow-lg transition-shadow flex items-center gap-4 group text-left"
                        >
                            <FiMessageSquare className="w-8 h-8 text-green-500 flex-shrink-0" />
                            <div>
                                <h3 className="font-semibold text-gray-800 group-hover:text-green-600">Falar com o Lojista</h3>
                                <p className="text-sm text-gray-600">Tire dúvidas sobre produtos ou seu pedido via WhatsApp.</p>
                            </div>
                        </button>
                        <button
                            onClick={() => setIsTecnicoModalOpen(true)}
                            className="bg-white p-6 rounded-xl shadow-sm hover:shadow-lg transition-shadow flex items-center gap-4 group text-left"
                        >
                            <FiTool className="w-8 h-8 text-purple-500 flex-shrink-0" />
                            <div>
                                <h3 className="font-semibold text-gray-800 group-hover:text-purple-600">Problema Técnico?</h3>
                                <p className="text-sm text-gray-600">Relate um erro ou problema com a plataforma.</p>
                            </div>
                        </button>
                    </div>
                </section>
            </main>
            <ContatoModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleContatoSubmit}
            />
            <TecnicoModal 
                isOpen={isTecnicoModalOpen}
                onClose={() => setIsTecnicoModalOpen(false)}
            />
        </div>
    );
}