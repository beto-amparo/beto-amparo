// middleware.js
import { NextResponse } from 'next/server';
import * as jose from 'jose';

function parseJwt(token) {
    try {
        return jose.decodeJwt(token);
    } catch (e) {
        return null;
    }
}

export async function middleware(req) {
    console.log('🛡 Middleware executado para:', req.nextUrl.pathname);

    const url = req.nextUrl.clone();
    const pathname = url.pathname;

    const loginEmpresaPath = '/empresa/LoginEmpresa'; // Rota de login genérica da área /empresa
    const loginClientePath = '/login';
    const authSuccessPath = '/auth-success';

    const tokenEmpresaCookie = req.cookies.get('token_empresa')?.value;
    const tokenClienteCookie = req.cookies.get('token_cliente')?.value;
  
    // Regex para capturar o [nomeEmpresa] de rotas como /[nomeEmpresa]/lojas ou /[nomeEmpresa]/LoginEmpresa
    const dynamicEmpresaRouteMatch = pathname.match(/^\/([a-z0-9-]+)\/(lojas|LoginEmpresa|dashboard|produtos|personalizacao|horarioEmpresa|meusAgendamentos|conquistas|suporte|configuracoes)(\/.*)?$/);

    let nomeEmpresaSlugFromUrl = null;
    let isDynamicEmpresaSubPath = false;
    let isDynamicEmpresaLoginPage = false;

    if (dynamicEmpresaRouteMatch) {
        nomeEmpresaSlugFromUrl = dynamicEmpresaRouteMatch[1];
        const subPath = dynamicEmpresaRouteMatch[2];
        
        // Define quais sub-caminhos dentro do [nomeEmpresa] são protegidos (para o dono)
        const protectedSubPathsForOwner = ['lojas', 'dashboard', 'produtos', 'personalizacao', 'horarioEmpresa', 'meusAgendamentos', 'conquistas', 'suporte', 'configuracoes'];

        if (protectedSubPathsForOwner.includes(subPath)) {
            isDynamicEmpresaSubPath = true;
        }
        if (subPath === 'LoginEmpresa') {
            isDynamicEmpresaLoginPage = true;
        }
    }

    // 1. ROTAS PÚBLICAS GERAIS OU INTERNAS DO NEXT.JS (SEM AUTENTICAÇÃO)
    if (
        pathname === loginClientePath || // Login de cliente
        pathname === authSuccessPath ||
        pathname.startsWith('/_next/') ||
        pathname.startsWith('/api/') ||
        pathname === '/favicon.ico' ||
        pathname === '/logo.png' ||
        pathname.startsWith('/static/') ||
        pathname === '/cadastroEmpresa' || // Cadastro de empresa (público)
        pathname === '/recuperar-senha' || // Recuperar senha (público)
        // Se a rota dinâmica for a própria página de login da empresa (ex: /ben/LoginEmpresa),
        // ela é pública (não exige login para ser acessada)
        (nomeEmpresaSlugFromUrl && isDynamicEmpresaLoginPage) ||
        // Se a rota for o login principal da empresa (ex: /empresa/LoginEmpresa), também é pública
        pathname === loginEmpresaPath
    ) {
        return NextResponse.next();
    }

    let token;
    let decodedPayload;
   
    // 2. ROTAS PROTEGIDAS DA EMPRESA (Incluindo as dinâmicas /nomeEmpresa/...)
    if (pathname.startsWith('/empresa') || (nomeEmpresaSlugFromUrl && isDynamicEmpresaSubPath)) {
        token = tokenEmpresaCookie;

        if (!token) {
            // Determine a URL de login correta baseada na rota que foi acessada
            let finalLoginPath = loginEmpresaPath; // Padrão: /empresa/LoginEmpresa
            if (nomeEmpresaSlugFromUrl) {
                // Se a rota tinha um slug de empresa (ex: /ben/lojas), redireciona para o login DINÂMICO
                finalLoginPath = `/${nomeEmpresaSlugFromUrl}/LoginEmpresa`;
            }

            const redirectUrl = new URL(finalLoginPath, req.url);
            redirectUrl.searchParams.set('returnTo', pathname); // returnTo: /ben/lojas
            return NextResponse.redirect(redirectUrl);
        }

        try {
            const secretKey = process.env.NEXT_PUBLIC_JWT_SECRET_KEY_EMPRESA;

            if (!secretKey) {
                console.error('Middleware: ERRO CRÍTICO: Variável de ambiente NEXT_PUBLIC_JWT_SECRET_KEY_EMPRESA não definida ou vazia!');
                throw new Error('Chave secreta de empresa não fornecida para verificar o JWT.');
            }
           
            const encodedSecret = new TextEncoder().encode(secretKey);
            const { payload } = await jose.jwtVerify(token, encodedSecret);
            decodedPayload = payload;
            
            if (decodedPayload.tipo !== 'empresa') {
                // Se o token não é de empresa, redireciona para o login (escolhe o dinâmico se aplicável)
                let finalLoginPath = loginEmpresaPath;
                if (nomeEmpresaSlugFromUrl) {
                    finalLoginPath = `/${nomeEmpresaSlugFromUrl}/LoginEmpresa`;
                }
                const redirectUrl = new URL(finalLoginPath, req.url);
                redirectUrl.searchParams.set('returnTo', pathname);
                return NextResponse.redirect(redirectUrl);
            }

            // Opcional: Verifique se o ID da empresa no token corresponde ao slug da URL
            // Isso exige que o payload do token contenha o id da empresa e que você tenha uma forma
            // de mapear o slug para o id da empresa NO FRONTEND (ou uma API que faça isso sem autenticação)
            // OU, confie no seu middleware de backend para fazer essa validação mais granular.
            // Para simplicidade, vamos assumir que a validação de slug é feita no backend.
            
            return NextResponse.next();

        } catch (error) {
            console.error('Middleware: Erro na verificação do token (empresa/dinâmico):', error.message);
            let finalLoginPath = loginEmpresaPath;
            if (nomeEmpresaSlugFromUrl) {
                finalLoginPath = `/${nomeEmpresaSlugFromUrl}/LoginEmpresa`;
            }
            const redirectUrl = new URL(finalLoginPath, req.url);
            redirectUrl.searchParams.set('returnTo', pathname);
            return NextResponse.redirect(redirectUrl);
        }
    }

    // 3. ROTAS PROTEGIDAS DO CLIENTE
    else if (pathname.startsWith('/cliente')) {
        token = tokenClienteCookie;

        if (!token) {
            const redirectUrl = new URL(loginClientePath, req.url);
            redirectUrl.searchParams.set('returnTo', pathname);
            return NextResponse.redirect(redirectUrl);
        }

        try {
            const secretKeyCliente = process.env.NEXT_PUBLIC_JWT_SECRET_KEY_CLIENTE;

            if (!secretKeyCliente) {
                console.error('Middleware: ERRO CRÍTICO: Variável de ambiente NEXT_PUBLIC_JWT_SECRET_KEY_CLIENTE não definida ou vazia!');
                throw new Error('Chave secreta de cliente não fornecida para verificar o JWT.');
            }

            const encodedSecretCliente = new TextEncoder().encode(secretKeyCliente);
            const { payload } = await jose.jwtVerify(token, encodedSecretCliente);
            decodedPayload = payload;

            if (decodedPayload.tipo !== 'cliente') {
                const redirectUrl = new URL(loginClientePath, req.url);
                redirectUrl.searchParams.set('returnTo', pathname);
                return NextResponse.redirect(redirectUrl);
            }
            return NextResponse.next();

        } catch (error) {
            console.error('Middleware: Erro na verificação do token (cliente):', error.message);
            const redirectUrl = new URL(loginClientePath, req.url);
            redirectUrl.searchParams.set('returnTo', pathname);
            return NextResponse.redirect(redirectUrl);
        }
    }

    // 4. OUTRAS ROTAS (NÃO PROTEGIDAS OU COM LÓGICA ESPECÍFICA)
    return NextResponse.next();
}

export const config = {
    matcher: [
        '/empresa/:path*',
        '/cliente/:path*',
        '/:path*/lojas', // Isso precisa ser mais específico para o contexto de empresa dinâmica
        '/:path*/LoginEmpresa', // Adicionei isso para a página de login dinâmica ser interceptada
        // Adicione outros sub-caminhos da área do dono se necessário (ex: /:path*/dashboard, /:path*/produtos)
        // para garantir que eles também sejam protegidos pelo mesmo bloco de lógica.
        // Exemplo:
        // '/:path*/(dashboard|produtos|personalizacao|horarioEmpresa|meusAgendamentos|conquistas|suporte|configuracoes)',
    ],
};