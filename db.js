// ==========================================
// BANCO DE DADOS - API POSTGRESQL (NUVEM)
// ==========================================

// 🔥 SUBSTITUA PELA URL DO SEU SERVIDOR NO RENDER
const API_URL = 'https://adegapdv-api.onrender.com';

class Database {
  constructor() {
    this.isReady = true;
    console.log('📦 Banco de dados PostgreSQL pronto!');
    console.log('🌐 API:', API_URL);
  }

  // ==========================================
  // REQUISIÇÕES HTTP
  // ==========================================

  async request(endpoint, method = 'GET', data = null) {
    const options = {
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (data) {
      options.body = JSON.stringify(data);
    }

    try {
      const response = await fetch(`${API_URL}${endpoint}`, options);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('❌ Erro na requisição:', error);
      return null;
    }
  }

  // ==========================================
  // USUÁRIOS
  // ==========================================

  async getAllUsuarios() {
    const usuarios = await this.request('/usuarios');
    return usuarios || [];
  }

  async saveUsuario(usuario) {
    // Se tiver ID, atualiza, senão cria
    if (usuario.id) {
      return await this.request(`/usuarios/${usuario.id}`, 'PUT', usuario);
    } else {
      return await this.request('/usuarios', 'POST', usuario);
    }
  }

  async deleteUsuario(id) {
    return await this.request(`/usuarios/${id}`, 'DELETE');
  }

  // ==========================================
  // ESTABELECIMENTOS
  // ==========================================

  async getAllEstabelecimentos() {
    const estabelecimentos = await this.request('/estabelecimentos');
    return estabelecimentos || [];
  }

  async saveEstabelecimento(estabelecimento) {
    if (estabelecimento.id) {
      return await this.request(`/estabelecimentos/${estabelecimento.id}`, 'PUT', estabelecimento);
    } else {
      return await this.request('/estabelecimentos', 'POST', estabelecimento);
    }
  }

  // ==========================================
  // PENDENTES
  // ==========================================

  async getAllPendentes() {
    const pendentes = await this.request('/pendentes');
    return pendentes || [];
  }

  async savePendente(pendente) {
    return await this.request('/pendentes', 'POST', pendente);
  }

  async deletePendente(id) {
    return await this.request(`/pendentes/${id}`, 'DELETE');
  }

  // ==========================================
  // PRODUTOS
  // ==========================================

  async getAllProdutos() {
    const estabelecimentoId = this.getEstabelecimentoId();
    if (!estabelecimentoId) return [];
    
    const produtos = await this.request(`/produtos?estabelecimentoId=${estabelecimentoId}`);
    return produtos || [];
  }

  async saveProduto(produto) {
    const estabelecimentoId = this.getEstabelecimentoId();
    if (!estabelecimentoId) return null;

    if (produto.id) {
      return await this.request(`/produtos/${produto.id}`, 'PUT', produto);
    } else {
      return await this.request('/produtos', 'POST', produto);
    }
  }

  async deleteProduto(id) {
    const estabelecimentoId = this.getEstabelecimentoId();
    if (!estabelecimentoId) return;

    return await this.request(`/produtos/${id}`, 'DELETE');
  }

  // ==========================================
  // PEDIDOS
  // ==========================================

  async getAllPedidos() {
    const estabelecimentoId = this.getEstabelecimentoId();
    if (!estabelecimentoId) return [];
    
    const pedidos = await this.request(`/pedidos?estabelecimentoId=${estabelecimentoId}`);
    return pedidos || [];
  }

  async savePedido(pedido) {
    const estabelecimentoId = this.getEstabelecimentoId();
    if (!estabelecimentoId) return null;

    if (pedido.id) {
      return await this.request(`/pedidos/${pedido.id}`, 'PUT', pedido);
    } else {
      return await this.request('/pedidos', 'POST', pedido);
    }
  }

  // ==========================================
  // COMANDAS
  // ==========================================

  async getAllComandas() {
    const estabelecimentoId = this.getEstabelecimentoId();
    if (!estabelecimentoId) return [];
    
    const comandas = await this.request(`/comandas?estabelecimentoId=${estabelecimentoId}`);
    return comandas || [];
  }

  async saveComanda(comanda) {
    const estabelecimentoId = this.getEstabelecimentoId();
    if (!estabelecimentoId) return null;

    if (comanda.id) {
      return await this.request(`/comandas/${comanda.id}`, 'PUT', comanda);
    } else {
      return await this.request('/comandas', 'POST', comanda);
    }
  }

  async deleteComanda(id) {
    const estabelecimentoId = this.getEstabelecimentoId();
    if (!estabelecimentoId) return;

    return await this.request(`/comandas/${id}`, 'DELETE');
  }

  // ==========================================
  // MOVIMENTAÇÕES
  // ==========================================

  async getAllMovimentacoes() {
    const estabelecimentoId = this.getEstabelecimentoId();
    if (!estabelecimentoId) return [];
    
    const movimentacoes = await this.request(`/movimentacoes?estabelecimentoId=${estabelecimentoId}`);
    return movimentacoes || [];
  }

  async saveMovimentacao(movimentacao) {
    const estabelecimentoId = this.getEstabelecimentoId();
    if (!estabelecimentoId) return null;

    if (movimentacao.id) {
      return await this.request(`/movimentacoes/${movimentacao.id}`, 'PUT', movimentacao);
    } else {
      return await this.request('/movimentacoes', 'POST', movimentacao);
    }
  }

  // ==========================================
  // CONFIGURAÇÕES
  // ==========================================

  async getConfiguracao(chave) {
    const estabelecimentoId = this.getEstabelecimentoId();
    if (!estabelecimentoId) return null;
    
    const configs = await this.request(`/configuracoes?chave=${chave}&estabelecimentoId=${estabelecimentoId}`);
    return configs && configs.length > 0 ? configs[0].valor : null;
  }

  async saveConfiguracao(chave, valor) {
    const estabelecimentoId = this.getEstabelecimentoId();
    if (!estabelecimentoId) return;

    const config = { chave, valor, estabelecimentoId };
    const existentes = await this.request(`/configuracoes?chave=${chave}&estabelecimentoId=${estabelecimentoId}`);
    
    if (existentes && existentes.length > 0) {
      return await this.request(`/configuracoes/${existentes[0].id}`, 'PUT', config);
    } else {
      return await this.request('/configuracoes', 'POST', config);
    }
  }

  // ==========================================
  // FECHAMENTOS
  // ==========================================

  async getAllFechamentos() {
    const estabelecimentoId = this.getEstabelecimentoId();
    if (!estabelecimentoId) return [];
    
    const fechamentos = await this.request(`/fechamentos?estabelecimentoId=${estabelecimentoId}`);
    return fechamentos || [];
  }

  async saveFechamento(fechamento) {
    const estabelecimentoId = this.getEstabelecimentoId();
    if (!estabelecimentoId) return null;

    fechamento.estabelecimentoId = estabelecimentoId;
    return await this.request('/fechamentos', 'POST', fechamento);
  }

  // ==========================================
  // BACKUP
  // ==========================================

  async fazerBackup() {
    alert('📦 Seus dados já estão salvos no banco de dados PostgreSQL!\n\nNão precisa fazer backup manual.');
    console.log('✅ Dados já estão no servidor!');
  }

  // ==========================================
  // UTILITÁRIOS
  // ==========================================

  getEstabelecimentoId() {
    const sessao = localStorage.getItem('mt_sessao_atual');
    if (!sessao) return null;
    
    const sessaoObj = JSON.parse(sessao);
    if (sessaoObj.isSuperAdmin) return null;
    
    return sessaoObj.estabelecimentoId;
  }
}

// Instância global
const db = new Database();

window.db = db;

console.log('✅ db.js (PostgreSQL) carregado com sucesso!');