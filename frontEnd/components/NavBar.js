// frontEnd/components/NavBar.js

import Link from "next/link";
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import { verificarTipoDeLoja } from '../hooks/verificarTipoLoja';
import Image from "next/image";

const NavBar = ({ site, corPrimaria = "#3B82F6" }) => {
  const router = useRouter();
  const slug = site || router.query.slug || '';
  const [tipo, setTipo] = useState("");

  useEffect(() => {
    const fetchTipo = async () => {
      setTipo(await verificarTipoDeLoja(slug));
    };
    if (slug) fetchTipo();
  }, [slug]);

  const isActive = (path, exact = false) => {
    if (exact) {
      return router.asPath === path;
    }
    return router.asPath.startsWith(path);
  };
  
  const activeClass = "text-gray-400 rounded-lg px-3 py-1";

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 flex justify-around items-center text-white py-2 shadow-inner rounded-t-4xl"
      style={{ backgroundColor: corPrimaria }}
    >
      <Link
        href={`/loja/${slug}`}
        className={`flex flex-col items-center hover:opacity-80 ${
          isActive(`/loja/${slug}`, true) ? activeClass : ''
        }`}
      >
        <Image
          src="/icons/home2.svg"
          alt="Início"
          width={24} 
          height={24} 
          // Adicione 'block' e 'flex-shrink-0' para garantir que não haja expansão indesejada
          className="mb-1 block flex-shrink-0" 
          unoptimized 
        />
        <span>Início</span>
      </Link>

      {tipo !== "atendimento" && (
        <Link
          href={`/loja/${slug}/pedidos`}
          className={`flex flex-col items-center hover:opacity-80 ${isActive(`/loja/${slug}/pedidos`) ? activeClass : ''}`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V5a4 4 0 00-8 0v6M5 8h14l1 13H4L5 8z" />
          </svg>
          <span>Pedidos</span>
        </Link>
      )}

      {tipo !== "atendimento" && (
        <Link
          href={`/loja/${slug}/carrinho`}
          className={`flex flex-col items-center hover:opacity-80 ${isActive(`/loja/${slug}/carrinho`) ? activeClass : ''}`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-1.6 8m10.6-8l1.6 8M9 21a1 1 0 100-2 1 1 0 000 2zm6 0a1 1 0 100-2 1 1 0 000 2z" />
          </svg>
          <span>Carrinho</span>
        </Link>
      )}

      {tipo === "atendimento" && (
        <Link
          href={`/loja/${slug}/agendamento`}
          className={`flex flex-col items-center hover:opacity-80 ${isActive(`/loja/${slug}/agendamento`) ? activeClass : ''}`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m3-3H9m8-7V4a1 1 0 00-1-1h-1m-6 0H8a1 1 0 00-1 1v1m10 4H6m14 0v10a2 2 0 01-2 2H6a2 2 0 01-2-2V7h16z" />
          </svg>
          <span>Agendamento</span>
        </Link>
      )}

      {tipo === "atendimento" && (
        <Link
          href={`/loja/${slug}/visualizarAgendamento`}
          className={`flex flex-col items-center hover:opacity-80 ${isActive(`/loja/${slug}/visualizarAgendamento`) ? activeClass : ''}`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
          </svg>
          <span>Meus Agendamentos</span>
        </Link>
      )}
    </nav>
  );
};

export default NavBar;