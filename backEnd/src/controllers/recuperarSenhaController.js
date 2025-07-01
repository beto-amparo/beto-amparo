import crypto from 'crypto';
import nodemailer from 'nodemailer';
import { buscarEmpresaPorEmail, atualizarTokenEmpresa } from '../models/EmpresaModel.js';
import { buscarClientePorEmail, atualizarTokenCliente } from '../models/ClientModel.js';

export const enviarEmailRecuperacao = async (req, res) => {
    const { email, redirect  } = req.body;
      console.log('redirect:', redirect);

    if (!email) {
        return res.status(400).json({ mensagem: 'Email é obrigatório.' });
    }

    try {
        // Tenta encontrar uma empresa com o e-mail
        const resultadoEmpresa = await buscarEmpresaPorEmail(email);
        const empresa = resultadoEmpresa?.data;

        // Se não for empresa, tenta buscar como cliente
        const resultadoCliente = !empresa ? await buscarClientePorEmail(email) : null;
        const cliente = resultadoCliente?.data;

        if (!empresa && !cliente) {
            return res.status(404).json({ mensagem: 'Nenhum usuário encontrado com esse e-mail.' });
        }

        // Gera token de recuperação
        const token = crypto.randomBytes(32).toString('hex');
        const expiracao = new Date(Date.now() + 1000 * 60 * 60); // 1 hora

        try {
            if (empresa) {
                await atualizarTokenEmpresa(email, token, expiracao);
            } else if (cliente) {
                await atualizarTokenCliente(email, token, expiracao);
            }
        } catch (erroUpdate) {
            return res.status(500).json({ mensagem: 'Erro ao salvar token de recuperação.' });
        }

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS1,
            },
        });

        const linkRecuperacao = `${process.env.URL_FRONTEND}/nova-senha?token=${token}${redirect ? `&redirect=${encodeURIComponent(redirect)}` : ''}`;

        const mailOptions = {
            from: `"Sistema" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: 'Recuperação de senha',
            html: `
                <p>Olá,</p>
                <p>Você solicitou a recuperação de senha. Clique no link abaixo para criar uma nova senha:</p>
                <a href="${linkRecuperacao}">Recuperar senha</a>
                <p>Esse link expira em 1 hora.</p>
            `,
        };

        await transporter.sendMail(mailOptions);

        res.status(200).json({ mensagem: 'E-mail de recuperação enviado com sucesso.' });

    } catch (err) {
        console.error('Erro ao enviar email:', err);
        res.status(500).json({ mensagem: 'Erro interno ao enviar email.' });
    }
};
