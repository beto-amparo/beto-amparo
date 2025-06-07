import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";

export default function Navbar() {
  const [menuAberto, setMenuAberto] = useState(false);
  const [logado, setLogado] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Verifica se o cookie token_empresa está presente
    const cookies = document.cookie.split("; ").reduce((acc, current) => {
      const [key, value] = current.split("=");
      acc[key] = value;
      return acc;
    }, {});

    if (cookies.token_empresa) {
      setLogado(true);
    }
  }, []);

  const handleLogout = async () => {
    try {
      await fetch("/api/logoutEmpresa", {
        method: "POST",
      });

      // Limpa o cookie manualmente no cliente (por precaução, apesar do backend também limpar)
      document.cookie = "token_empresa=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";

      setLogado(false);
      router.push("/");
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
    }
  };

  return (
    <>
      <header className="flex justify-between items-center p-4 lg:px-12 lg:py-0">
        <div className="flex items-center gap-2 lg:gap-4">
          <Image src="/logo.svg" alt="Logo" width={50} height={50} />
          <div className="hidden lg:block">
            <Image src="/name.svg" alt="Nome" width={100} height={100} />
          </div>
        </div>

        <div className="absolute top-7.5 left-1/2 transform -translate-x-1/2 lg:hidden">
          <Image src="/name.png" alt="Nome" width={120} height={120} />
        </div>

        <button onClick={() => setMenuAberto(true)} className="lg:hidden">
          <Image src="/icons/menu_icon.svg" alt="Menu" width={24} height={24} />
        </button>

        <nav className="hidden lg:flex items-center gap-4 text-sm text-[#0F1D2A]">
          <Link href="/" className="hover:underline flex items-center gap-2">
            <Image src="/icons/home.svg" alt="Home" width={20} height={20} />
            Home
          </Link>
          <Link href="/empresa/donoarea" className="hover:underline flex items-center gap-2">
            <Image src="/icons/store_black.svg" alt="Sobre" width={20} height={20} />
            Área do Dono
          </Link>
          <Link href="/planos" className="hover:underline flex items-center gap-2">
            <Image src="/icons/plan.svg" alt="Planos" width={20} height={20} />
            Planos e Assinaturas
          </Link>
          <Link href="/suporte" className="hover:underline flex items-center gap-2">
            <Image src="/icons/help.svg" alt="Suporte" width={20} height={20} />
            Suporte
          </Link>

          {logado ? (
            <button
              onClick={handleLogout}
              className="bg-red-500 text-white px-4 py-2 rounded-md font-semibold hover:opacity-90 transition"
            >
              Sair
            </button>
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

      {menuAberto && (
        <div className="fixed top-0 right-0 h-full w-64 bg-white shadow-lg z-50 p-6 rounded-l-2xl flex flex-col gap-6 lg:hidden">
          <button
            onClick={() => setMenuAberto(false)}
            className="self-end text-gray-500 hover:text-gray-800 text-xl"
          >
            ✕
          </button>

          <div className="flex items-center gap-2">
            <Image src="/logo.svg" alt="Logo" width={40} height={40} />
            <Image src="/name.svg" alt="Logo" width={120} height={120} />
          </div>

          <nav className="flex flex-col gap-4 mt-4 text-sm text-[#0F1D2A]">
            <Link href="/" className="flex items-center gap-2 hover:underline">
              <Image src="/icons/home.svg" alt="Home" width={20} height={20} />
              Home
            </Link>
            <Link href="/empresa/donoarea" className="flex items-center gap-2 hover:underline">
              <Image src="/icons/store_black.svg" alt="Sobre" width={20} height={20} />
              Área do Dono
            </Link>
            <Link href="/planos" className="flex items-center gap-2 hover:underline">
              <Image src="/icons/plan.svg" alt="Planos" width={20} height={20} />
              Planos e Assinaturas
            </Link>
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
