// ==========================================
// BANCO DE DADOS - SUPABASE
// ==========================================

// 🔥 SUBSTITUA PELAS SUAS CREDENCIAIS DO SUPABASE
const SUPABASE_URL = 'https://SEU_PROJETO.supabase.co';
const SUPABASE_KEY = 'sb_publishable_SBAwlnJPuA6Gi6uAIRNeMw_FJ6CvpXk';

class Database {
  constructor() {
    this.isReady = true;
    console.log('📦 Banco de dados Supabase pronto!');
    console.log('🌐 URL:', SUPABASE_URL);
  }

  async request(endpoint, method = 'GET', data = null) {
    const options = {
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`
      }
    };

    if (data) {
      options.body = JSON.stringify(data);
    }

    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1${endpoint}`, options);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Erro Supabase:', response.status, errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      if (method === 'DELETE') {
        return { success: true };
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
    const usuarios = await this.request('/usuarios?select=*');
    return usuarios || [];
  }

  async saveUsuario(usuario) {
    if (usuario.id) {
      return await this.request(`/usuarios?id=eq.${usuario.id}`, 'PATCH', usuario);
    } else {
      return await this.request('/usuarios', 'POST', usuario);
    }
  }

  async deleteUsuario(id) {
    return await this.request(`/usuarios?id=eq.${id}`, 'DELETE');
  }

  // ==========================================
  // ESTABELECIMENTOS (com campos separados)
  // ==========================================

  async getAllEstabelecimentos() {
    const estabelecimentos = await this.request('/estabelecimentos?select=*');
    // Converter para o formato esperado pelo sistema
    return (estabelecimentos || []).map(e => ({
      ...e,
      configuracao: {
        totalMesas: e.total_mesas || 10,
        totalComandas: e.total_comandas || 30,
        corTema: "emerald"
      }
    }));
  }

  async saveEstabelecimento(estabelecimento) {
    // Converter do formato do sistema para o formato da tabela
    const dados = {
      nome: estabelecimento.nome,
      cnpj: estabelecimento.cnpj || '',
      endereco: estabelecimento.endereco || '',
      telefone: estabelecimento.telefone || '',
      plano: estabelecimento.plano || 'basico',
      total_mesas: estabelecimento.configuracao?.totalMesas || 10,
      total_comandas: estabelecimento.configuracao?.totalComandas || 30,
      ativo: estabelecimento.ativo !== undefined ? estabelecimento.ativo : true
    };

    if (estabelecimento.id) {
      return await this.request(`/estabelecimentos?id=eq.${estabelecimento.id}`, 'PATCH', dados);
    } else {
      const result = await this.request('/estabelecimentos', 'POST', dados);
      // Retornar no formato esperado
      if (result && result.length > 0) {
        const e = result[0];
        return {
          ...e,
          configuracao: {
            totalMesas: e.total_mesas || 10,
            totalComandas: e.total_comandas || 30,
            corTema: "emerald"
          }
        };
      }
      return result;
    }
  }

  // ==========================================
  // PENDENTES
  // ==========================================

  async getAllPendentes() {
    const pendentes = await this.request('/pendentes?select=*');
    return pendentes || [];
  }

  async savePendente(pendente) {
    return await this.request('/pendentes', 'POST', pendente);
  }

  async deletePendente(id) {
    return await this.request(`/pendentes?id=eq.${id}`, 'DELETE');
  }

  // ==========================================
  // PRODUTOS
  // ==========================================

  async getAllProdutos() {
    const estabelecimentoId = this.getEstabelecimentoId();
    if (!estabelecimentoId) return [];
    
    const produtos = await this.request(`/produtos?estabelecimento_id=eq.${estabelecimentoId}&select=*`);
    return produtos || [];
  }

  async saveProduto(produto) {
    const estabelecimentoId = this.getEstabelecimentoId();
    if (!estabelecimentoId) return null;

    const dados = {
      ...produto,
      estabelecimento_id: estabelecimentoId
    };
    delete dados.estabelecimentoId;

    if (produto.id) {
      return await this.request(`/produtos?id=eq.${produto.id}`, 'PATCH', dados);
    } else {
      return await this.request('/produtos', 'POST', dados);
    }
  }

  async deleteProduto(id) {
    return await this.request(`/produtos?id=eq.${id}`, 'DELETE');
  }

  // ==========================================
  // PEDIDOS
  // ==========================================

  async getAllPedidos() {
    const estabelecimentoId = this.getEstabelecimentoId();
    if (!estabelecimentoId) return [];
    
    const pedidos = await this.request(`/pedidos?estabelecimento_id=eq.${estabelecimentoId}&select=*`);
    return pedidos || [];
  }

  async savePedido(pedido) {
    const estabelecimentoId = this.getEstabelecimentoId();
    if (!estabelecimentoId) return null;

    const dados = {
      ...pedido,
      estabelecimento_id: estabelecimentoId
    };
    delete dados.estabelecimentoId;

    if (pedido.id) {
      return await this.request(`/pedidos?id=eq.${pedido.id}`, 'PATCH', dados);
    } else {
      return await this.request('/pedidos', 'POST', dados);
    }
  }

  // ==========================================
  // COMANDAS
  // ==========================================

  async getAllComandas() {
    const estabelecimentoId = this.getEstabelecimentoId();
    if (!estabelecimentoId) return [];
    
    const comandas = await this.request(`/comandas?estabelecimento_id=eq.${estabelecimentoId}&select=*`);
    return comandas || [];
  }

  async saveComanda(comanda) {
    const estabelecimentoId = this.getEstabelecimentoId();
    if (!estabelecimentoId) return null;

    const dados = {
      ...comanda,
      estabelecimento_id: estabelecimentoId
    };
    delete dados.estabelecimentoId;

    if (comanda.id) {
      return await this.request(`/comandas?id=eq.${comanda.id}`, 'PATCH', dados);
    } else {
      return await this.request('/comandas', 'POST', dados);
    }
  }

  async deleteComanda(id) {
    return await this.request(`/comandas?id=eq.${id}`, 'DELETE');
  }

  // ==========================================
  // MOVIMENTAÇÕES
  // ==========================================

  async getAllMovimentacoes() {
    const estabelecimentoId = this.getEstabelecimentoId();
    if (!estabelecimentoId) return [];
    
    const movimentacoes = await this.request(`/movimentacoes?estabelecimento_id=eq.${estabelecimentoId}&select=*`);
    return movimentacoes || [];
  }

  async saveMovimentacao(movimentacao) {
    const estabelecimentoId = this.getEstabelecimentoId();
    if (!estabelecimentoId) return null;

    const dados = {
      ...movimentacao,
      estabelecimento_id: estabelecimentoId
    };
    delete dados.estabelecimentoId;

    if (movimentacao.id) {
      return await this.request(`/movimentacoes?id=eq.${movimentacao.id}`, 'PATCH', dados);
    } else {
      return await this.request('/movimentacoes', 'POST', dados);
    }
  }

  // ==========================================
  // CONFIGURAÇÕES
  // ==========================================

  async getConfiguracao(chave) {
    const estabelecimentoId = this.getEstabelecimentoId();
    if (!estabelecimentoId) return null;
    
    const configs = await this.request(`/configuracoes?chave=eq.${chave}&estabelecimento_id=eq.${estabelecimentoId}&select=*`);
    return configs && configs.length > 0 ? configs[0].valor : null;
  }

  async saveConfiguracao(chave, valor) {
    const estabelecimentoId = this.getEstabelecimentoId();
    if (!estabelecimentoId) return;

    const config = { chave, valor, estabelecimento_id: estabelecimentoId };
    const existentes = await this.request(`/configuracoes?chave=eq.${chave}&estabelecimento_id=eq.${estabelecimentoId}&select=*`);
    
    if (existentes && existentes.length > 0) {
      return await this.request(`/configuracoes?id=eq.${existentes[0].id}`, 'PATCH', config);
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
    
    const fechamentos = await this.request(`/fechamentos?estabelecimento_id=eq.${estabelecimentoId}&select=*`);
    return fechamentos || [];
  }

  async saveFechamento(fechamento) {
    const estabelecimentoId = this.getEstabelecimentoId();
    if (!estabelecimentoId) return null;

    const dados = {
      ...fechamento,
      estabelecimento_id: estabelecimentoId
    };
    delete dados.estabelecimentoId;

    return await this.request('/fechamentos', 'POST', dados);
  }

  // ==========================================
  // BACKUP
  // ==========================================

  async fazerBackup() {
    alert('📦 Seus dados já estão salvos no Supabase!\n\nNão precisa fazer backup manual.');
    console.log('✅ Dados já estão no Supabase!');
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
console.log('✅ db.js (Supabase) carregado com sucesso!');