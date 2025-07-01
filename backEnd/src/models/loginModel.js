// src/models/loginModel.js
class Login {
  constructor({ email, senha }) {
    this.email = email;
    this.senha = senha;
  }

  validar() {
    const erros = [];
    
    if (!this.email || !this.email.includes('@')) {
      erros.push('E-mail inválido');
    }
    
    if (!this.senha || this.senha.length < 6) {
      erros.push('Senha deve ter pelo menos 6 caracteres');
    }
    
    return erros;
  }
}

export default Login;