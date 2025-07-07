import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import Navbar from "@/components/NavBar_Beto";
import Footer from "@/components/Rodape_Beto";


export default function Home() {
  const [menuAberto, setMenuAberto] = useState(false);
  const imagensHero = ["/hero_image1.jpg", "/hero_image2.jpg", "/hero_image3.jpg"];
  const [indiceAtual, setIndiceAtual] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndiceAtual((prev) => (prev + 1) % imagensHero.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [imagensHero.length]);

  return (
    <div className="min-h-screen flex flex-col justify-between bg-gray-50 text-[#1B1B1B] relative">
      <Navbar />
      <section className="relative w-full h-[500px] lg:h-[600px] flex items-center justify-center text-white overflow-hidden">
        <div className="absolute inset-0 z-0 transition-opacity duration-5000 ease-in-out brightness-[0.5]">
          <Image
            src={imagensHero[indiceAtual]}
            alt="Capa"
            fill
            priority
            className="object-cover"
          />
          <div className="absolute inset-0 bg-black/50" />
        </div>
        <div className="z-20 text-center px-4">
          <h1 className="text-3xl lg:text-5xl font-bold mb-4">Transforme o atendimento do seu negócio</h1>
          <p className="text-lg lg:text-xl mb-6">Automatize pedidos e agendamentos com a cara do seu negócio.</p>
          <div className="flex flex-col lg:flex-row gap-4 justify-center">
            <Link href="/cadastroEmpresa" passHref>
              <button className="bg-[#F7941D] text-white font-semibold px-6 py-3 rounded-xl shadow-md hover:bg-[#d37313] transition duration-300">
                Quero experimentar agora
              </button>
            </Link>
            <Link href="/sobre" passHref>
              <button className="border-2 border-white text-white font-semibold px-6 py-3 rounded-xl hover:bg-white hover:text-[#1B1B1B] transition duration-300">
                Saiba mais
              </button>
            </Link>
          </div>
        </div>
      </section>

        <section className="w-full max-w-5xl mx-auto my-12 bg-white p-6 rounded-2xl shadow-md text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-6 text-[#1B1B1B]">
            Uma plataforma feita para simplificar seu atendimento
          </h2>
          <iframe
            className="w-full aspect-video rounded-xl"
            src="https://www.youtube.com/embed/ilpYFOydH80"
            title="Vídeo promocional Beto Amparo"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </section>

      <main className="bg-gray-50 flex flex-col items-center px-6 text-center gap-6 lg:px-32">
        <section className="py-16">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">Como funciona o Beto Amparo?</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-10 text-center">
              <div className="bg-white p-8 rounded-2xl shadow-md hover:shadow-lg transition">
                <Image src="/icons/whatsapp_icon.svg" width={64} height={64} className="mx-auto mb-6" alt="Ícone WhatsApp" />
                <h3 className="text-xl font-semibold mb-3">1. O cliente entra em contato via WhatsApp</h3>
                <p className="text-gray-600">
                  O atendimento começa automaticamente com mensagens pré-programadas e link direto para o site.
                </p>
              </div>
              <div className="bg-white p-8 rounded-2xl shadow-md hover:shadow-lg transition">
                <Image src="/logo.png" width={64} height={64} className="mx-auto mb-6" alt="Ícone Site" />
                <h3 className="text-xl font-semibold mb-3">2. Ele faz o pedido ou agendamento no site</h3>
                <p className="text-gray-600">
                  A plataforma web responsiva permite escolher produtos, horários ou serviços de forma prática, sem depender de atendimento humano.
                </p>
              </div>
              <div className="bg-white p-8 rounded-2xl shadow-md hover:shadow-lg transition">
                <Image src="/icons/dashboard_icon.svg" width={64} height={64} className="mx-auto mb-6" alt="Ícone Dashboard" />
                <h3 className="text-xl font-semibold mb-3">3. Você recebe e gerencia tudo no seu painel</h3>
                <p className="text-gray-600">
                  Acompanhe pedidos e agendamentos em tempo real, receba notificações e tenha controle total do seu atendimento.
                </p>
              </div>
            </div>
          </div>
        </section>

        <div className="mt-8 w-full max-w-6xl">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">Benefícios do Beto Amparo:</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: "/icons/rocket.svg",
                title: "Fácil de usar",
                text: "Receba pedidos em um só lugar, sem perder nenhuma mensagem.",
              },
              {
                icon: "/icons/calendar.svg",
                title: "Agendamentos sem esforço",
                text: "Clientes escolhem horários sem precisar te chamar.",
              },
              {
                icon: "/icons/chart.svg",
                title: "Painel para acompanhar tudo",
                text: "Veja seus atendimentos e pedidos em um só clique.",
              },
              {
                icon: "/icons/money.svg",
                title: "Mais vendas, menos trabalho",
                text: "Tenha mais produtividade e resultados com menos esforço.",
              },
            ].map((card, index) => (
              <div
                key={index}
                className="bg-white p-6 rounded-2xl shadow-md hover:shadow-lg transition duration-300 hover:-translate-y-1 hover:scale-[1.03] flex flex-col items-center text-center border border-gray-200"
              >
                <div className="bg-[#EAF3FA] p-4 rounded-full mb-4">
                  <Image src={card.icon} alt={card.title} width={32} height={32} />
                </div>
                <h3 className="text-[#1B76C6] font-bold text-lg mb-2">{card.title}</h3>
                <p className="text-sm text-[#333]">{card.text}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-16 w-full max-w-md lg:max-w-4xl">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">Planos pensados para cada etapa do seu crescimento:</h2>
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3 lg:gap-8">
            <div className="bg-[#EAF3FA] p-6 rounded-2xl shadow-md flex flex-col justify-between h-full hover:scale-105 transition-all">
              <div className="flex-grow flex flex-col items-center">
                <h3 className="font-bold text-[#1B76C6] text-lg mb-4">Plano Básico</h3>
                <p className="text-sm text-center mb-6">Para pequenos negócios começando a usar a plataforma.</p>
                <p className="font-semibold text-xl mb-4">R$ 29,90/mês</p>
              </div>
              <Link href="/planos" passHref>
                <button className="bg-[#F7941D] text-white px-6 py-3 rounded-xl shadow-md w-full hover:bg-[#d77900] transition-all">Saiba mais</button>
              </Link>
            </div>
            <div className="bg-[#EAF3FA] p-6 rounded-lg shadow-lg flex flex-col justify-between h-full border-2 border-[#F7941D] relative transform hover:scale-105 transition duration-300">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#F7941D] text-white text-xs font-semibold px-3 py-1 rounded-full shadow-md">
                Mais Popular
              </div>

              <div className="flex-grow flex flex-col items-center mt-4">
                <h3 className="font-bold text-[#1B76C6] text-lg mb-4">Plano Profissional</h3>
                <p className="text-sm text-center mb-6">Para negócios em crescimento que precisam de mais funcionalidades.</p>
                <p className="font-semibold text-xl mb-4">R$ 49,90/mês</p>
              </div>
              <Link href="/planos" passHref>
                <button className="bg-[#F7941D] text-white px-6 py-3 rounded-xl shadow-md w-full mt-4 hover:bg-[#dd831b] transition">
                  Saiba mais
                </button>
              </Link>
            </div>
            <div className="bg-[#EAF3FA] p-6 rounded-2xl shadow-md flex flex-col justify-between h-full hover:scale-105 transition-all">
              <div className="flex-grow flex flex-col items-center">
                <h3 className="font-bold text-[#1B76C6] text-lg mb-4">Plano Empresarial</h3>
                <p className="text-sm text-center mb-6">Para empresas que precisam de suporte completo e recursos avançados.</p>
                <p className="font-semibold text-xl mb-4">R$ 69,90/mês</p>
              </div>
              <Link href="/planos" passHref>
                <button className="bg-[#F7941D] text-white px-6 py-3 rounded-xl shadow-md w-full hover:bg-[#d77900] transition-all">Saiba mais</button>
              </Link>
            </div>
          </div>
        </div>
      </main>

      <footer className="bg-[#3681B6] text-sm text-center py-4 mt-10 px-4">
        <div className="flex flex-row flex-wrap justify-center gap-4 mb-2">
          <Link href="/suporte" className="font-semibold hover:underline text-white">Suporte</Link>
          <Link href="/politicas" className="font-semibold hover:underline text-white">Política de Privacidade</Link>
          <Link href="/cadastroEmpresa" className="font-semibold hover:underline text-white">Comece agora</Link>
        </div>
        <p className="text-xs text-white opacity-60">© 2025 Beto Amparo. Todos os direitos reservados.</p>
      </footer>
    </div>
  );
}