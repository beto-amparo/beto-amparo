/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
      remotePatterns: [
        {
          protocol: 'https',
          hostname: 'cufzswdymzevdeonjgan.supabase.co',
          pathname: '/storage/v1/object/public/**',
        },
      ],
    },



  async rewrites() {
    return [
      {
        source: '/loja/produto/:site/:id',
        destination: '/client/produto',
      },
      {
        source: '/loja/:slug/agendamento',
        destination: '/client/agendamento',
      },
      {
        source: '/loja/:slug/visualizarAgendamento',
        destination: '/client/visualizarAgendamentoCliente',
      },
      {
        source: '/loja/:slug/carrinho',
        destination: '/client/carrinho',
      },
      {
        source: '/loja/:slug/pedidos',
        destination: '/client/pedidos',
      },
      {
        source: '/loja/:site',
        destination: '/client/ClienteHome',
      },
      {
        source: '/cadastro',
        destination: '/client/cadastrar_cliente',
      },
      {
        source: '/login',
        destination: '/client/loginCliente',
      },
      {
        source: '/empresa/personalizar',
        destination: '/empresa/personalizacao-loja',
      },
      {
        source: '/loginEmpresa',
        destination: '/empresa/LoginEmpresa',
      },
      {
        source: '/cadastroEmpresa',
        destination: '/empresa/CadastroEmpresa',
      },
      {
        source: '/empresa/adicionarProduto',
        destination: '/empresa/AdicionarProduto',
      },
      {
        source: '/empresa/meusAgendamentos',
        destination: '/empresa/visualizacaoAgendamento',
      },
    ];
  },
};

module.exports = nextConfig;
