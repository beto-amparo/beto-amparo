import validator from 'validator';

export default function validarDadosEmpresa(dados) {
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

  const {
    nome,
    cnpj,
    responsavel,
    categoria,
    telefone,
    endereco,
    cidade,
    uf,
    site,
    email,
    senha
  } = dados;

  const erros = {};

  // Nome
  if (!nome || nome.trim().length < 3) {
    erros.nome = 'Nome deve conter ao menos 3 caracteres.';
  }

  // CNPJ
  const cnpjLimpo = cnpj ? cnpj.replace(/[^\d]/g, '') : '';
  if (!cnpjLimpo || cnpjLimpo.length !== 14) {
    erros.cnpj = 'CNPJ inválido. Deve conter 14 dígitos numéricos.';
  }

  // Responsável
  if (!responsavel || responsavel.trim().length < 3) {
    erros.responsavel = 'Nome do responsável deve ter pelo menos 3 caracteres.';
  }

  // Categoria
  if (!categoria || categoria.trim().length < 2) {
    erros.categoria = 'Categoria inválida.';
  }

  // Telefone
  const telefoneLimpo = telefone ? telefone.replace(/[^\d]/g, '') : '';
  if (!telefoneLimpo || telefoneLimpo.length < 10) {
    erros.telefone = 'Telefone inválido.';
  }

  // Endereço
  if (!endereco || endereco.trim().length < 5) {
    erros.endereco = 'Endereço muito curto.';
  }

  // Cidade
  if (!cidade || cidade.trim().length < 2) {
    erros.cidade = 'Cidade inválida.';
  }

  
  if (!uf || uf.trim().length !== 2) {
    erros.uf = 'UF deve ter exatamente 2 letras.';
  }

  
  if (site && !validator.isURL(site, { require_protocol: false })) {
    erros.site = 'URL do site inválida.';
  }


  if (!email || !validator.isEmail(email)) {
    erros.email = 'Email inválido.';
  }

  
  if (!senha || !passwordRegex.test(senha)) {
    erros.senha = 'A senha deve conter no mínimo 8 caracteres, incluindo ao menos uma letra maiúscula, uma minúscula, um número e um símbolo especial.';
  }

  return erros;
}
