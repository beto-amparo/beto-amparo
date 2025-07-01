import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import { Menu } from '@headlessui/react';
import { FaUserCircle } from 'react-icons/fa';

export default function NavBar() {
    const [menuAberto, setMenuAberto] = useState(false);
    const [logado, setLogado] = useState(false);
    const [empresa, setEmpresa] = useState(null);
    const router = useRouter();

    useEffect(() => {
        const fetchSessionData = async () => {
            const apiUrl = `${process.env.NEXT_PUBLIC_EMPRESA_API}/verificar-sessao`;
            try {
                const response = await fetch(apiUrl, {
                    credentials: 'include',
                });

                if (response.ok) {
                    const data = await response.json();
                    if (data.logado) {
                        setLogado(true);
                        setEmpresa(data.empresa);
                    } else {
                        setLogado(false);
                        setEmpresa(null);
                    }
                } else {
                    setLogado(false);
                    setEmpresa(null);
                }
            } catch (error) {
                console.error("Erro ao verificar a sessão:", error);
                setLogado(false);
                setEmpresa(null);
            }
        };

        fetchSessionData();
    }, []);

    const handleLogout = async () => {
        try {
            await fetch("/api/logoutEmpresa", { method: "POST" });
            setLogado(false);
            setEmpresa(null);
            router.push("/");
        } catch (error) {
            console.error("Erro ao fazer logout:", error);
        }
    };

    const empresaSlug = empresa?.site || empresa?.slug;

    return (
        <>
            <header className="flex justify-between items-center p-4 lg:px-12 lg:py-4">
                {/* Logo e Nome */}
                <div className="flex items-center gap-2 lg:gap-4">
                    {/* CORREÇÃO AQUI: A tag <a> foi removida e seus classNames passados para o <Link> */}
                    <Link href="/" className="flex items-center gap-2 lg:gap-4 cursor-pointer">
                        <Image src="/logo.png" alt="Logo" width={60} height={60} />
                        <div className="hidden lg:block">
                            <Image src="/name.png" alt="Nome" width={140} height={60} />
                        </div>
                    </Link>
                </div>

                <div className="absolute top-7.5 left-1/2 transform -translate-x-1/2 lg:hidden">
                    <Image src="/name.png" alt="Nome" width={120} height={120} />
                </div>

                <button onClick={() => setMenuAberto(true)} className="lg:hidden">
                    <Image src="/icons/menu_icon.svg" alt="Menu" width={24} height={24} />
                </button>
                
                {/* Navegação Desktop */}
                <nav className="hidden lg:flex items-center gap-8 text-sm text-[#0F1D2A]">
                    <Link href="/" className="hover:underline flex items-center gap-2">
                        <Image src="/icons/home.svg" alt="Home" width={20} height={20} />
                        Home
                    </Link>
                    <Link href="/sobre" className="hover:underline flex items-center gap-2">
                        <Image src="/icons/info.svg" alt="Sobre" width={20} height={20} />
                        Sobre
                    </Link>
                    <Link href="/suporte" className="hover:underline flex items-center gap-2">
                        <Image src="/icons/help.svg" alt="Suporte" width={20} height={20} />
                        Suporte
                    </Link>

                    {logado ? (
                        <Menu as="div" className="relative">
                            <Menu.Button className="flex flex-col items-center cursor-pointer text-black focus:outline-none">
                                <FaUserCircle size={28} />
                                <span className="text-xs mt-1">Conta</span>
                            </Menu.Button>

                            <Menu.Items className="absolute right-0 mt-2 w-48 origin-top-right bg-white rounded-md shadow-lg py-1 z-50 border focus:outline-none">
                                {empresaSlug && (
                                    <Menu.Item>
                                        {({ active }) => (
                                            <Link
                                                href={`/${empresaSlug}/lojas`}
                                                className={`block px-4 py-2 text-sm text-gray-700 ${active ? 'bg-gray-100' : ''}`}
                                            >
                                                Minhas Lojas
                                            </Link>
                                        )}
                                    </Menu.Item>
                                )}
                                <Menu.Item>
                                    {({ active }) => (
                                        <button
                                            onClick={handleLogout}
                                            className={`block w-full text-left px-4 py-2 text-sm text-red-600 ${active ? 'bg-red-50' : ''}`}
                                        >
                                            Sair
                                        </button>
                                    )}
                                </Menu.Item>
                            </Menu.Items>
                        </Menu>
                    ) : (
                        <Link
                            href="/loginEmpresa"
                            className="bg-[#3681B6] text-white px-4 py-2 rounded-md font-semibold hover:opacity-90 transition"
                        >
                            Login
                        </Link>
                    )}
                </nav>
            </header>

            {/* Menu Mobile */}
            {menuAberto && (
        <div className="fixed top-0 right-0 h-full w-64 bg-white shadow-lg z-50 p-6 rounded-l-2xl flex flex-col gap-6 lg:hidden">
          <button
            onClick={() => setMenuAberto(false)}
            className="self-end text-gray-500 hover:text-gray-800 text-xl"
          >
            ✕
          </button>

          <div className="flex items-center gap-2">
            <Image src="/logo.png" alt="Logo" width={40} height={40} />
            <Image src="/name.png" alt="Logo" width={120} height={120} />
          </div>

          <nav className="flex flex-col gap-4 mt-4 text-sm text-[#0F1D2A]">
            <Link href="/" className="flex items-center gap-2 hover:underline">
              <Image src="/icons/home.svg" alt="Home" width={20} height={20} />
              Home
            </Link>
            <Link href="/sobre" className="flex items-center gap-2 hover:underline">
              <Image src="/icons/info.svg" alt="Sobre" width={20} height={20} />
              Sobre
            </Link>
            {logado && empresaSlug && (
              <Link href={`/${empresaSlug}/lojas`} className="flex items-center gap-2 hover:underline">
                <Image src="/icons/store_1.svg" alt="Lojas" width={20} height={20} />
                Minhas Lojas
              </Link>
            )}
            <Link href="/suporte" className="flex items-center gap-2 hover:underline">
              <Image src="/icons/help.svg" alt="Suporte" width={20} height={20} />
              Suporte
            </Link>
          </nav>

          {logado ? (
            <button
              onClick={handleLogout}
              className="mt-auto self-center bg-red-500 text-white px-8 py-2 rounded-md font-semibold hover:opacity-90 transition w-full max-w-[280px]"
            >
              Sair
            </button>
          ) : (
            <Link
              href="/loginEmpresa"
              className="mt-auto self-center bg-[#3681B6] text-white px-8 py-2 rounded-md font-semibold hover:opacity-90 transition w-full max-w-[280px] text-center"
            >
              Login
            </Link>
          )}
        </div>
      )}
    </>
  );
}