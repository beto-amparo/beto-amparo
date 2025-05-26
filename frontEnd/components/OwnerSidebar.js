// components/OwnerSidebar.js
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';

// Helper component for navigation items
// Adds an 'onClick' prop to handle actions like logout
function NavItem({ icon, label, path, currentSlug, onClick }) {
  const router = useRouter();
  let fullPath;

  // All navigation items within the sidebar (except "Área do dono" if it's treated separately outside NavItem)
  // should now use the slug.
  // The 'path' prop here is expected to be relative to the slug, e.g., "/dashboard", "/produtos".
  fullPath = `/empresa/${currentSlug}${path}`;

  // Render a button if onClick is provided, otherwise a Link
  if (onClick) {
    return (
      <button
        onClick={onClick}
        className="flex items-center gap-2 p-2 w-full text-left hover:bg-blue-700 cursor-pointer rounded"
      >
        <Image src={icon} alt={label} width={20} height={20} className="flex-shrink-0" />
        <span>{label}</span>
      </button>
    );
  }

  return (
    <Link
      href={fullPath}
      className="flex items-center gap-2 p-2 hover:bg-blue-700 cursor-pointer rounded"
    >
      <Image src={icon} alt={label} width={20} height={20} className="flex-shrink-0" />
      <span>{label}</span>
    </Link>
  );
}

export default function OwnerSidebar({ children, slug }) {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Logout function directly integrated into the sidebar
  const handleLogout = async () => {
    try {
      console.log('OwnerSidebar: Tentando fazer logout...');
      const response = await fetch(`${process.env.NEXT_PUBLIC_EMPRESA_API}/logout`, {
        method: 'POST', // Use POST for logout
        credentials: 'include', // Essential for sending the cookie
      });

      if (response.ok) {
        console.log('OwnerSidebar: Logout bem-sucedido. Redirecionando para a página inicial.');
        // Redirect to the company login page after logout
        router.push('/empresa/LoginEmpresa');
      } else {
        const errorData = await response.json();
        console.error('OwnerSidebar: Falha no logout:', errorData.mensagem || 'Erro desconhecido');
        alert(`Erro ao fazer logout: ${errorData.mensagem || 'Tente novamente.'}`);
      }
    } catch (error) {
      console.error('OwnerSidebar: Erro de rede ao fazer logout:', error);
      alert('Erro de conexão. Verifique sua rede e tente novamente.');
    }
  };

  // The main "Área do dono" link will now also use the slug for its path.
  // Assuming the 'donoarea' path is directly under the slug.
  const ownerAreaPath = `/empresa/${slug}/donoarea`;

  return (
    <div className="min-h-screen flex flex-col md:flex-row">

      {/* Mobile Header */}
      <div className="bg-[#3681B6] text-white flex items-center justify-between p-4 md:hidden">
        <div className="flex items-center gap-2">
          <Image src="/logo.png" alt="Logo" width={32} height={32} />
          <span className="font-bold text-lg">BETO Amparo</span>
        </div>
        <button onClick={() => setSidebarOpen(!sidebarOpen)}>
          <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      {/* Main Sidebar */}
      <aside className={`
        fixed md:static z-40 bg-[#3681B6] text-white w-64 min-h-screen p-4 flex flex-col justify-between
        transition-transform duration-300
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0
      `}>
        <div>
          <div className="flex items-center mb-4">
            <Image src="/logo.png" alt="Logo" width={40} height={40} className="mr-2" />
            <div className="leading-tight text-lg">
              <span className="font-bold">BETO</span>{' '}
              <span className="font-normal">Amparo</span>
            </div>
          </div>
          <div className="flex flex-col gap-4">
            {/* Link for the main owner area - now uses slug */}
            <Link
              href={ownerAreaPath} // Now points to /empresa/SLUG/donoarea
              className="flex flex-col items-center gap-2 p-2 cursor-pointer text-center"
            >
              <Image src="/icons/store_white.svg" alt="Área do dono" width={40} height={40} />
              <span className="font-semibold text-lg">Área do dono</span>
            </Link>

            {/* Navigation items - all now use slug via NavItem */}
            {/* path prop for NavItem is now relative to the slug */}
            <NavItem icon="/icons/dashboard_white.svg" label="Dashboard" path="/dashboard" currentSlug={slug} />
            <NavItem icon="/icons/add_white.svg" label="Meus Produtos" path="/produtos" currentSlug={slug} />
            <NavItem icon="/icons/paint_white.svg" label="Personalizar Loja" path="/personalizacao-loja" currentSlug={slug} />
            <NavItem icon="/icons/help_white.svg" label="Suporte" path="/suporte" currentSlug={slug} />
          </div>
        </div>
        
        {/* SAIR button at the bottom of the sidebar */}
        <button
          onClick={handleLogout} // Calls the logout function
          className="bg-orange-400 hover:bg-orange-500 p-2 rounded text-white mt-4 w-full"
        >
          SAIR
        </button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 bg-gray-100 p-6 md:p-8">
        {children}
      </main>
    </div>
  );
}