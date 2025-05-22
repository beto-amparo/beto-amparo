import { useRouter } from 'next/router';
import Image from 'next/image';

export default function Sidebar({ sidebarOpen, setSidebarOpen }) {
  const router = useRouter();

  return (
    <>
      {/* Topbar com botão hambúrguer no mobile */}
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

      {/* Sidebar responsiva */}
      <aside className={`
        fixed md:static z-40 bg-[#3681B6] text-white w-64 min-h-screen p-4 flex flex-col justify-between
        transition-transform duration-300
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0
      `}>
        <div>
          <div className="flex items-center mb-4">
            <Image src="/logo.png" alt="Logo" width={40} height={40} className="mr-2" />
            <div className="leading-tight">
              <div className="font-bold text-2xl">BETO</div>
              <div className="text-sm -mt-1">Amparo</div>
            </div>
          </div>
          <div className="flex flex-col gap-4">
            <div
              onClick={() => router.push('/owner')}
              className="flex flex-col items-center gap-2 p-2 cursor-pointer text-center"
            >
              <Image src="/icons/store_white.svg" alt="Área do dono" width={40} height={40} />
              <span className="font-semibold text-lg">Área do dono</span>
            </div>

            <NavItem icon="/icons/dashboard_white.svg" label="Dashboard" path="http://localhost:3000/dashboard" />
            <NavItem icon="/icons/add_white.svg" label="Adicionar Produtos" path="/adicionar-produto" />
            <NavItem icon="/icons/notification_white.svg" label="Notificações" path="/owner/notificacoes" />
            <NavItem icon="/icons/paint_white.svg" label="Personalizar Loja" path="/personalizacao-loja" />
            <NavItem icon="/icons/help_white.svg" label="Suporte" path="/suporte" />
          </div>
        </div>
        <button className="bg-orange-400 hover:bg-orange-500 p-2 rounded text-white mt-4">SAIR</button>
        <div className="h-0 md:hidden" />
      </aside>
    </>
  );
}

function NavItem({ icon, label, path }) {
  const router = useRouter();
  return (
    <div
      onClick={() => router.push(path)}
      className="flex items-center gap-2 p-2 hover:bg-blue-700 cursor-pointer rounded"
    >
      <Image src={icon} alt={label} width={20} height={20} />
      <span>{label}</span>
    </div>
  );
}