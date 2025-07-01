/** @type {import('next').NextConfig} */

const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  scope: "/empresa/",
});

const nextConfig = withPWA({
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
      {
        protocol: 'https',
        hostname: 'qkiyyvnyvjqsjnobfyqn.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
/*
      remotePatterns: [
        {
          protocol: 'https',
          hostname: 'qkiyyvnyvjqsjnobfyqn.supabase.co',
          pathname: '/storage/v1/object/public/**',
        },
      ],
    },
*/

  async rewrites() {
    return [
      {
        source: '/loja/produto/:site/:id',
        destination: '/client/produto',
      },
      {
        source: '/empresa/:slug/suporte',
        destination: '/suporte',
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
        source: '/loja/:slug/minha-conta',
        destination: '/client/minha-conta',
      },
      {
        source: '/loja/:slug/ajuda',
        destination: '/client/faq_suporte',
      },
      {
        source: '/loja/:slug/pedidos',
        destination: '/client/pedidos',
      },
      {
        source: '/:slug/carrinho',
        destination: '/client/carrinho',
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
        source: '/empresa/:slug/meusAgendamentos',
        destination: '/empresa/visualizacaoAgendamento',
      },
      {
        source: '/empresa/:slug/horarioEmpresa',
        destination: '/empresa/horarioEmpresa',
      },
      {
        source: '/api/:path*',
        destination: 'https://beto-amparo.onrender.com/:path*',
      },
    ];
  },
});

module.exports = nextConfig;
