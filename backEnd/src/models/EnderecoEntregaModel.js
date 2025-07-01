// models/EnderecoEntregaModel.js
class EnderecoEntrega {
  constructor({
    destinatario,
    cep,
    rua,
    numero,
    complemento,
    bairro,
    cidade,
    estado,
    telefone,
    clienteId,
    lojaId
  }) {
    this.destinatario = destinatario;
    this.cep = cep;
    this.rua = rua;
    this.numero = numero;
    this.complemento = complemento || '';
    this.bairro = bairro;
    this.cidade = cidade;
    this.estado = estado;
    //this.telefone = telefone;
    this.clienteId = clienteId; 
    this.lojaId = lojaId;
  }

  validar() {
    const erros = [];
    const camposObrigatorios = ['destinatario', 'cep', 'rua', 'numero', 'bairro', 'cidade', 'estado'];
    
    camposObrigatorios.forEach(campo => {
      if (!this[campo]) {
        erros.push(`O campo ${campo} é obrigatório`);
      }
    });

    if (this.cep && !/^\d{5}-?\d{3}$/.test(this.cep)) {
      erros.push('CEP inválido');
    }

    return erros;
  }
}

export default EnderecoEntrega;