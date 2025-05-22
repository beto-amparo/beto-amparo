// src/models/loginModel.js
class Login {
  constructor({ email, senha, idToken }) {
    this.email = email;
    this.senha = senha;
    this.idToken = idToken;
  }

  validar(tipo = 'tradicional') {
    const erros = [];

    // Validação de e-mail (comum a ambos os tipos)
    if (!this.email || !this.email.includes('@')) {
      erros.push('E-mail inválido');
    }

    if (tipo === 'tradicional') {
      // Validação para login tradicional
      if (!this.senha || this.senha.length < 6) {
        erros.push('Senha deve ter pelo menos 6 caracteres');
      }
    } else if (tipo === 'google') {
      // Validação para login com Google
      if (!this.idToken) {
        erros.push('ID Token do Google não fornecido');
      }
    }

    return erros;
  }
}

export default Login;