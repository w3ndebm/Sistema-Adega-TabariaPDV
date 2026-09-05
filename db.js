// ==========================================
// BANCO DE DADOS - JSON SERVER (NUVEM)
// ==========================================

// 🔥 COLOQUE A URL DO SEU SERVIDOR NO RENDER
const API_URL = 'https://adegapdv-api.onrender.com';

class Database {
  constructor() {
    this.isReady = true;
    console.log('📦 Banco de dados JSON Server pronto!');
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

    const existentes = await this.getAllProdutos();
    const existente = existentes.find(p => p.id === produto.id);

    if (existente) {
      await this.request(`/produtos/${produto.id}`, 'PUT', produto);
    } else {
      await this.request('/produtos', 'POST', produto);
    }
    
    return produto;
  }

  async deleteProduto(id) {
    const estabelecimentoId = this.getEstabelecimentoId();
    if (!estabelecimentoId) return;

    await this.request(`/produtos/${id}`, 'DELETE');
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

    const existentes = await this.getAllPedidos();
    const existente = existentes.find(p => p.id === pedido.id);

    if (existente) {
      await this.request(`/pedidos/${pedido.id}`, 'PUT', pedido);
    } else {
      await this.request('/pedidos', 'POST', pedido);
    }
    
    return pedido;
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

    const existentes = await this.getAllComandas();
    const existente = existentes.find(c => c.id === comanda.id);

    if (existente) {
      await this.request(`/comandas/${comanda.id}`, 'PUT', comanda);
    } else {
      await this.request('/comandas', 'POST', comanda);
    }
    
    return comanda;
  }

  async deleteComanda(id) {
    const estabelecimentoId = this.getEstabelecimentoId();
    if (!estabelecimentoId) return;

    await this.request(`/comandas/${id}`, 'DELETE');
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

    const existentes = await this.getAllMovimentacoes();
    const existente = existentes.find(m => m.id === movimentacao.id);

    if (existente) {
      await this.request(`/movimentacoes/${movimentacao.id}`, 'PUT', movimentacao);
    } else {
      await this.request('/movimentacoes', 'POST', movimentacao);
    }
    
    return movimentacao;
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
      await this.request(`/configuracoes/${existentes[0].id}`, 'PUT', config);
    } else {
      await this.request('/configuracoes', 'POST', config);
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
    const result = await this.request('/fechamentos', 'POST', fechamento);
    return result;
  }

  // ==========================================
  // USUÁRIOS (para o multi-tenant)
  // ==========================================

  async getAllUsuarios() {
    const usuarios = await this.request('/usuarios');
    return usuarios || [];
  }

  async saveUsuario(usuario) {
    const existentes = await this.getAllUsuarios();
    const existente = existentes.find(u => u.id === usuario.id);

    if (existente) {
      await this.request(`/usuarios/${usuario.id}`, 'PUT', usuario);
    } else {
      await this.request('/usuarios', 'POST', usuario);
    }
    
    return usuario;
  }

  async deleteUsuario(id) {
    await this.request(`/usuarios/${id}`, 'DELETE');
  }

  // ==========================================
  // ESTABELECIMENTOS
  // ==========================================

  async getAllEstabelecimentos() {
    const estabelecimentos = await this.request('/estabelecimentos');
    return estabelecimentos || [];
  }

  async saveEstabelecimento(estabelecimento) {
    const existentes = await this.getAllEstabelecimentos();
    const existente = existentes.find(e => e.id === estabelecimento.id);

    if (existente) {
      await this.request(`/estabelecimentos/${estabelecimento.id}`, 'PUT', estabelecimento);
    } else {
      await this.request('/estabelecimentos', 'POST', estabelecimento);
    }
    
    return estabelecimento;
  }

  // ==========================================
  // BACKUP
  // ==========================================

  async fazerBackup() {
    alert('📦 Seus dados já estão salvos na nuvem!\n\nNão precisa fazer backup manual.');
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

console.log('✅ db.js (JSON Server) carregado com sucesso!');