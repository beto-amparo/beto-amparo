// /pages/sobre.js

'use client'; 

import { useRouter } from 'next/router';
import { Rocket, Globe, LayoutDashboard, ZapOff, ArrowLeft } from 'lucide-react';
import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link'; // Importação do Link para o footer
import Navbar from "@/components/NavBar_Beto"; 

export default function SobreNosPage() {
  const router = useRouter();

  return (
    <>
      <Head>
        <title>Nossa Missão | A plataforma que impulsiona seu negócio</title>
        <meta name="description" content="Nascemos para libertar pequenos empreendedores da complexidade e ajudá-los a prosperar no mundo digital." />
      </Head>

      <header className="bg-white shadow-md sticky top-0 z-50">
        <Navbar />
      </header>

      <div className="bg-white font-sans">
        

        {/* --- HERO BANNER --- */}
        <section 
          className="relative text-white py-24 lg:py-40 bg-cover bg-center"
          style={{ backgroundImage: "url('/banner-empreendedores.webp')" }}
        >
          <div className="absolute inset-0 bg-blue-800 opacity-80"></div>
          <div className="container mx-auto px-6 relative z-10 text-center">
            <h1 className="text-4xl md:text-6xl font-extrabold leading-tight tracking-tight">
              Construído por quem entende, para quem faz.
            </h1>
            <p className="mt-6 text-lg md:text-xl max-w-3xl mx-auto text-blue-100">
              Nossa missão é clara: dar a você, empreendedor, as ferramentas para brilhar online, de forma simples e humana.
            </p>
          </div>
        </section>

        {/* --- NOSSA JORNADA (com imagem) --- */}
        <section className="py-20 lg:py-28 bg-slate-50">
          <div className="container mx-auto px-6">
            <div className="grid md:grid-cols-2 gap-12 lg:gap-20 items-center">
              <div className="order-2 md:order-1">
                <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-6 leading-snug">
                  Entendemos o seu corre. Vivemos a sua paixão.
                </h2>
                <p className="text-gray-600 text-lg mb-4">
                  A ideia da nossa plataforma não nasceu em uma sala de reunião, mas da observação atenta da rotina de pequenos negócios. Vimos a luta para gerenciar pedidos no WhatsApp, a dificuldade em ter um site profissional e a falta de tempo para tudo.
                </p>
                <p className="text-gray-600 text-lg">
                  Decidimos criar mais que um software: uma parceria. Uma solução que simplifica processos, fortalece sua presença digital e abre espaço para você focar no que faz seu negócio crescer — encantar clientes e expandir seu sonho.
                </p>
              </div>
              <div className="order-1 md:order-2">
                <div className="relative w-full h-80 md:h-96">
                   <Image 
                      src="/empreendedor-focado.png" 
                      alt="Ilustração de empreendedor planejando seu negócio" 
                      layout="fill"
                      objectFit="contain"
                   />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* --- A SOLUÇÃO (Features) --- */}
        <section className="py-20 lg:py-24 bg-white">
          <div className="container mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-800">Sua plataforma completa para decolar</h2>
              <p className="text-lg text-gray-500 mt-4">Tudo que você precisa, sem a complexidade que você não quer.</p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                <div className="bg-slate-50/70 p-8 rounded-2xl border border-slate-100 hover:border-blue-200 transition-colors duration-300">
                    <Globe size={40} className="text-blue-600 mb-5" />
                    <h3 className="text-2xl font-bold text-gray-800 mb-3">Sua Vitrine na Web</h3>
                    <p className="text-gray-600">Crie um site profissional que funciona como seu melhor vendedor, 24 horas por dia.</p>
                </div>
                <div className="bg-slate-50/70 p-8 rounded-2xl border border-slate-100 hover:border-blue-200 transition-colors duration-300">
                    <LayoutDashboard size={40} className="text-blue-600 mb-5" />
                    <h3 className="text-2xl font-bold text-gray-800 mb-3">Gestão Centralizada</h3>
                    <p className="text-gray-600">Acompanhe pedidos e agendamentos em um painel único. Menos caos, mais controle.</p>
                </div>
                <div className="bg-slate-50/70 p-8 rounded-2xl border border-slate-100 hover:border-blue-200 transition-colors duration-300">
                    <ZapOff size={40} className="text-blue-600 mb-5" />
                    <h3 className="text-2xl font-bold text-gray-800 mb-3">Automação Inteligente</h3>
                    <p className="text-gray-600">Libere-se do trabalho manual e deixe a plataforma cuidar dos agendamentos e confirmações.</p>
                </div>
            </div>
          </div>
        </section>

        {/* --- CALL TO ACTION FINAL --- */}
        <section className="bg-slate-50">
          <div className="container mx-auto px-6 py-20 lg:py-24">
            <div className="bg-gradient-to-r from-blue-600 to-teal-500 text-white p-10 lg:p-16 rounded-2xl shadow-2xl text-center lg:text-left flex flex-col lg:flex-row justify-between items-center">
              <div>
                <h2 className="text-3xl md:text-4xl font-extrabold">Chegou a hora de focar no que você ama.</h2>
                <p className="text-lg text-blue-100 mt-2 max-w-2xl">Deixe a organização com a gente e dedique sua energia ao seu talento.</p>
              </div>
              <a 
                href="/cadastroEmpresa"
                className="mt-8 lg:mt-0 flex-shrink-0 bg-white text-blue-600 font-bold text-lg px-10 py-4 rounded-full shadow-lg hover:shadow-xl hover:scale-105 transform transition-all duration-300"
              >
                Comece sua jornada grátis
              </a>
            </div>
          </div>
        </section>

        {/* --- FOOTER ADICIONADO AQUI --- */}
        <footer className="bg-[#3681B6] text-sm text-center py-4 mt-10 px-4">
            <div className="flex flex-row flex-wrap justify-center gap-4 mb-2">
                <Link href="/suporte" className="font-semibold hover:underline text-white">Suporte</Link>
                <Link href="/politicas" className="font-semibold hover:underline text-white">Política de Privacidade</Link>
                <Link href="/cadastro" className="font-semibold hover:underline text-white">Comece grátis</Link>
            </div>
            <p className="text-xs text-white opacity-60">© 2025 Beto Amparo. Todos os direitos reservados.</p>
        </footer>
        
      </div>
    </>
  );
}