import { Resend } from 'resend';
import multer from 'multer';

// Helper to make Multer work with Next.js API routes (which don't use Express directly)
const runMiddleware = (req, res, fn) => {
  return new Promise((resolve, reject) => {
    fn(req, res, (result) => {
      if (result instanceof Error) {
        return reject(result);
      }
      return resolve(result);
    });
  });
};

// Configure Multer to use memory storage for file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Disable the default Next.js body parser for this route to allow Multer to work
export const config = {
  api: {
    bodyParser: false,
  },
};

// Initialize the Resend client with your API key
const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Creates the HTML email template for corporate support tickets (with CNPJ).
 * @param {object} formData - The form data.
 * @returns {string} The HTML string for the email body.
 */
const criarTemplateEmailHTML = (formData) => {
  const { nome, email, cnpj, titulo, descricao } = formData;
  
  const corPrincipal = '#5698c6';
  const corDestaque = '#FAA042';
  const corFundo = '#f4f7f6';
  const corTexto = '#333333';

  return `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { margin: 0; padding: 0; background-color: ${corFundo}; }
        table { border-collapse: collapse; }
        h1, p, strong { font-family: Arial, sans-serif; color: ${corTexto}; }
        .container { padding: 20px; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .header { background-color: ${corPrincipal}; color: #ffffff; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .header h1 { color: #ffffff; margin: 0; }
        .content { padding: 30px 20px; }
        .content-table td { padding: 8px 0; border-bottom: 1px solid #eeeeee; }
        .footer { text-align: center; padding: 20px; font-size: 12px; color: #888888; }
      </style>
    </head>
    <body>
      <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: ${corFundo}; padding: 20px;">
        <tr>
          <td align="center">
            <div class="container">
              <div class="header">
                <h1>Novo Chamado de Suporte (Empresarial)</h1>
              </div>
              <div class="content">
                <p style="font-size: 16px;">Um novo chamado de suporte foi aberto. Detalhes abaixo:</p>
                <hr style="border: 0; border-top: 1px solid #eeeeee; margin: 20px 0;">
                <table width="100%" class="content-table">
                  <tr><td width="150px"><strong>Título:</strong></td><td>${titulo}</td></tr>
                  <tr><td><strong>Nome do Cliente:</strong></td><td>${nome}</td></tr>
                  <tr><td><strong>Email:</strong></td><td><a href="mailto:${email}" style="color: ${corDestaque};">${email}</a></td></tr>
                  <tr><td><strong>CNPJ:</strong></td><td>${cnpj}</td></tr>
                </table>
                <hr style="border: 0; border-top: 1px solid #eeeeee; margin: 20px 0;">
                <h3 style="color: ${corPrincipal};">Descrição do Problema:</h3>
                <p style="font-size: 14px; line-height: 1.6;">${descricao.replace(/\n/g, '<br>')}</p>
              </div>
              <div class="footer">Beto Amparo &copy; ${new Date().getFullYear()}</div>
            </div>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
};

/**
 * Creates the HTML email template for individual client support tickets (with CPF).
 * @param {object} formData - The form data.
 * @returns {string} The HTML string for the email body.
 */
const criarTemplateEmailHTMLCliente = (formData) => {
  const { nome, email, cpf, titulo, descricao } = formData;
  
  const corPrincipal = '#5698c6';
  const corDestaque = '#FAA042';
  const corFundo = '#f4f7f6';
  const corTexto = '#333333';

  return `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { margin: 0; padding: 0; background-color: ${corFundo}; }
        table { border-collapse: collapse; }
        h1, p, strong { font-family: Arial, sans-serif; color: ${corTexto}; }
        .container { padding: 20px; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .header { background-color: ${corPrincipal}; color: #ffffff; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .header h1 { color: #ffffff; margin: 0; }
        .content { padding: 30px 20px; }
        .content-table td { padding: 8px 0; border-bottom: 1px solid #eeeeee; }
        .footer { text-align: center; padding: 20px; font-size: 12px; color: #888888; }
      </style>
    </head>
    <body>
      <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: ${corFundo}; padding: 20px;">
        <tr>
          <td align="center">
            <div class="container">
              <div class="header">
                <h1>Novo Chamado de Suporte (Cliente)</h1>
              </div>
              <div class="content">
                <p style="font-size: 16px;">Um novo chamado de suporte foi aberto. Detalhes abaixo:</p>
                <hr style="border: 0; border-top: 1px solid #eeeeee; margin: 20px 0;">
                <table width="100%" class="content-table">
                  <tr><td width="150px"><strong>Título:</strong></td><td>${titulo}</td></tr>
                  <tr><td><strong>Nome do Cliente:</strong></td><td>${nome}</td></tr>
                  <tr><td><strong>Email:</strong></td><td><a href="mailto:${email}" style="color: ${corDestaque};">${email}</a></td></tr>
                  <tr><td><strong>CPF:</strong></td><td>${cpf}</td></tr>
                </table>
                <hr style="border: 0; border-top: 1px solid #eeeeee; margin: 20px 0;">
                <h3 style="color: ${corPrincipal};">Descrição do Problema:</h3>
                <p style="font-size: 14px; line-height: 1.6;">${descricao.replace(/\n/g, '<br>')}</p>
              </div>
              <div class="footer">Beto Amparo &copy; ${new Date().getFullYear()}</div>
            </div>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
};

/**
 * The single API route handler for submitting support tickets.
 * It differentiates between corporate (CNPJ) and individual (CPF) clients.
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Apenas o método POST é permitido' });
  }

  try {
    // Run the Multer middleware to handle multipart/form-data
    await runMiddleware(req, res, upload.single('anexo'));
    const { email, titulo, descricao, nome } = req.body;
    const anexo = req.file;

    const attachments = [];
    if (anexo) {
      attachments.push({
        filename: anexo.originalname,
        content: anexo.buffer,
      });
    }
    
    let htmlBody;
    let subject;
    
    // Logic to handle corporate support tickets (with CNPJ)
    if (req.body.cnpj) {
      const { cnpj } = req.body;
      if (!nome || !email || !cnpj || !titulo || !descricao) {
        return res.status(400).json({ message: 'Todos os campos de texto são obrigatórios para suporte empresarial.' });
      }
      htmlBody = criarTemplateEmailHTML(req.body);
      subject = `Suporte Empresarial: ${titulo}`;

    // Logic to handle individual client support tickets (with CPF)
    } else if (req.body.cpf) {
      const { cpf } = req.body;
       if (!nome || !email || !cpf || !titulo || !descricao) {
        return res.status(400).json({ message: 'Todos os campos de texto são obrigatórios para suporte a clientes.' });
      }
      htmlBody = criarTemplateEmailHTMLCliente(req.body);
      subject = `Suporte ao Cliente: ${titulo}`;
    
    // If neither CPF nor CNPJ is provided, return an error
    } else {
      return res.status(400).json({ message: 'A solicitação deve incluir um CPF ou CNPJ válido.' });
    }

    // Send the email using Resend
    const data = await resend.emails.send({
      from: 'Suporte Beto Amparo <onboarding@resend.dev>',
      to: ['suportebetoamparo@gmail.com'], // The destination email address
      reply_to: email, // Set the client's email as the reply-to address
      subject: subject,
      html: htmlBody,
      attachments: attachments,
    });

    return res.status(200).json({ message: 'Email enviado com sucesso', id: data.id });

  } catch (error) {
    console.error('Erro no handler da API:', error);
    const errorMessage = error.message || 'Erro interno ao processar a solicitação.';
    return res.status(500).json({ message: errorMessage });
  }
}
