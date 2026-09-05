// ==========================================
// MULTI-TENANT - SISTEMA PARA VÁRIAS ADEGAS
// ==========================================

class MultiTenantManager {
  constructor() {
    this.estabelecimentoAtual = null;
    this.usuarios = [];
    this.estabelecimentos = [];
    this.carregarDados();
  }

  carregarDados() {
    const usuariosSalvos = localStorage.getItem('mt_usuarios');
    const estabelecimentosSalvos = localStorage.getItem('mt_estabelecimentos');
    
    if (usuariosSalvos) {
      this.usuarios = JSON.parse(usuariosSalvos);
    } else {
      // DADOS INICIAIS
      this.usuarios = [
        // 👑 SUPER ADMIN (VOCÊ)
        { 
          id: 1, 
          nome: "Super Admin", 
          email: "super@admin.com", 
          senha: "admin123", 
          estabelecimentoId: null, 
          cargo: "super_admin", 
          ativo: true,
          criadoPor: null
        },
        // 🏢 ADMIN DA ADEGA DO JOÃO
        { 
          id: 2, 
          nome: "João Silva", 
          email: "joao@adegaa.com", 
          senha: "123", 
          estabelecimentoId: 1, 
          cargo: "admin", 
          ativo: true,
          criadoPor: 1
        },
        // 👤 CAIXA DA ADEGA DO JOÃO
        { 
          id: 3, 
          nome: "Carlos Oliveira", 
          email: "carlos@adegaa.com", 
          senha: "123", 
          estabelecimentoId: 1, 
          cargo: "caixa", 
          ativo: true,
          criadoPor: 2
        },
        // 🏢 ADMIN DA TABACARIA DA MARIA
        { 
          id: 4, 
          nome: "Maria Santos", 
          email: "maria@adegab.com", 
          senha: "123", 
          estabelecimentoId: 2, 
          cargo: "admin", 
          ativo: true,
          criadoPor: 1
        }
      ];
      this.salvarUsuarios();
    }

    if (estabelecimentosSalvos) {
      this.estabelecimentos = JSON.parse(estabelecimentosSalvos);
    } else {
      this.estabelecimentos = [
        {
          id: 1,
          nome: "Adega do João",
          cnpj: "12.345.678/0001-90",
          endereco: "Rua das Adegas, 123",
          telefone: "(11) 99999-9999",
          plano: "premium",
          ativo: true,
          dataCadastro: new Date().toISOString(),
          configuracao: { totalMesas: 10, totalComandas: 30, corTema: "emerald" }
        },
        {
          id: 2,
          nome: "Tabacaria da Maria",
          cnpj: "98.765.432/0001-10",
          endereco: "Av. Tabacaria, 456",
          telefone: "(11) 88888-8888",
          plano: "basico",
          ativo: true,
          dataCadastro: new Date().toISOString(),
          configuracao: { totalMesas: 5, totalComandas: 15, corTema: "amber" }
        }
      ];
      this.salvarEstabelecimentos();
    }
  }

  salvarUsuarios() {
    localStorage.setItem('mt_usuarios', JSON.stringify(this.usuarios));
  }

  salvarEstabelecimentos() {
    localStorage.setItem('mt_estabelecimentos', JSON.stringify(this.estabelecimentos));
  }

  // ==========================================
  // LOGIN
  // ==========================================
  login(email, senha) {
    const usuario = this.usuarios.find(u => u.email === email && u.senha === senha && u.ativo);
    
    if (!usuario) {
      return { success: false, message: "Email ou senha incorretos!" };
    }

    // SUPER ADMIN
    if (usuario.cargo === 'super_admin') {
      const estabelecimentoVirtual = {
        id: 999,
        nome: "👑 SUPER ADMIN - Controle Total",
        plano: "enterprise",
        ativo: true,
        configuracao: { totalMesas: 999, totalComandas: 999, corTema: "purple" },
        isVirtual: true
      };
      
      this.estabelecimentoAtual = estabelecimentoVirtual;
      this.salvarSessao(usuario, estabelecimentoVirtual);
      
      return {
        success: true,
        usuario: usuario,
        estabelecimento: estabelecimentoVirtual,
        isSuperAdmin: true,
        nivelAcesso: 'super_admin'
      };
    }

    // ADMIN ou CAIXA
    const estabelecimento = this.estabelecimentos.find(e => e.id === usuario.estabelecimentoId);
    
    if (!estabelecimento || !estabelecimento.ativo) {
      return { success: false, message: "Estabelecimento inativo ou não encontrado!" };
    }

    if (usuario.cargo === 'admin' && usuario.estabelecimentoId !== estabelecimento.id) {
      return { success: false, message: "Acesso negado!" };
    }

    this.estabelecimentoAtual = estabelecimento;
    this.salvarSessao(usuario, estabelecimento);

    return {
      success: true,
      usuario: usuario,
      estabelecimento: estabelecimento,
      isSuperAdmin: false,
      nivelAcesso: usuario.cargo
    };
  }

  salvarSessao(usuario, estabelecimento) {
    const sessao = {
      usuarioId: usuario.id,
      estabelecimentoId: estabelecimento.id,
      estabelecimentoNome: estabelecimento.nome,
      isSuperAdmin: usuario.cargo === 'super_admin',
      cargo: usuario.cargo,
      login: new Date().toISOString()
    };
    localStorage.setItem('mt_sessao_atual', JSON.stringify(sessao));
  }

  getSessaoAtual() {
    const sessao = localStorage.getItem('mt_sessao_atual');
    if (!sessao) return null;
    return JSON.parse(sessao);
  }

  getUsuarioAtual() {
    const sessao = this.getSessaoAtual();
    if (!sessao) return null;
    return this.usuarios.find(u => u.id === sessao.usuarioId);
  }

  getEstabelecimentoAtual() {
    if (this.estabelecimentoAtual) return this.estabelecimentoAtual;
    
    const sessao = this.getSessaoAtual();
    if (!sessao) return null;
    
    if (sessao.isSuperAdmin) {
      const virtual = {
        id: 999,
        nome: "👑 SUPER ADMIN - Controle Total",
        plano: "enterprise",
        ativo: true,
        configuracao: { totalMesas: 999, totalComandas: 999, corTema: "purple" },
        isVirtual: true
      };
      this.estabelecimentoAtual = virtual;
      return virtual;
    }
    
    const estabelecimento = this.estabelecimentos.find(e => e.id === sessao.estabelecimentoId);
    this.estabelecimentoAtual = estabelecimento;
    return estabelecimento;
  }

  getPrefixoDB() {
    const estabelecimento = this.getEstabelecimentoAtual();
    if (!estabelecimento) return 'pdv_';
    if (estabelecimento.id === 999) return 'pdv_super_admin_';
    return `pdv_${estabelecimento.id}_`;
  }

  logout() {
    this.estabelecimentoAtual = null;
    localStorage.removeItem('mt_sessao_atual');
    
    // Remove a classe super-admin-mode
    document.body.classList.remove('super-admin-mode');
    
    // Restaura todos os botões
    document.querySelectorAll('nav button').forEach(btn => {
      btn.style.display = '';
    });
  }

  // ==========================================
  // GERENCIAMENTO DE USUÁRIOS
  // ==========================================

  getCargosPermitidos() {
    const usuario = this.getUsuarioAtual();
    if (!usuario) return [];
    
    if (usuario.cargo === 'super_admin') {
      return ['admin', 'gerente', 'caixa'];
    }
    
    if (usuario.cargo === 'admin') {
      return ['gerente', 'caixa'];
    }
    
    return [];
  }

  criarUsuario(dados) {
    const usuarioAtual = this.getUsuarioAtual();
    const cargosPermitidos = this.getCargosPermitidos();
    
    if (!cargosPermitidos.includes(dados.cargo)) {
      return { 
        success: false, 
        message: `Você não pode criar usuários com cargo "${dados.cargo}". Cargos permitidos: ${cargosPermitidos.join(', ')}` 
      };
    }

    let estabelecimentoId = dados.estabelecimentoId;
    if (usuarioAtual.cargo === 'admin') {
      estabelecimentoId = usuarioAtual.estabelecimentoId;
    }

    if (estabelecimentoId) {
      const estabelecimento = this.estabelecimentos.find(e => e.id === estabelecimentoId);
      if (!estabelecimento) {
        return { success: false, message: "Estabelecimento não encontrado!" };
      }
    }

    if (this.usuarios.some(u => u.email === dados.email)) {
      return { success: false, message: "Este email já está cadastrado!" };
    }

    const novoUsuario = {
      id: Date.now(),
      nome: dados.nome,
      email: dados.email,
      senha: dados.senha || "123456",
      estabelecimentoId: estabelecimentoId,
      cargo: dados.cargo,
      ativo: true,
      criadoPor: usuarioAtual.id,
      criadoEm: new Date().toISOString()
    };

    this.usuarios.push(novoUsuario);
    this.salvarUsuarios();
    
    return { 
      success: true, 
      usuario: novoUsuario,
      message: `✅ Usuário "${dados.nome}" (${dados.cargo}) criado com sucesso!` 
    };
  }

  listarUsuarios() {
    const usuarioAtual = this.getUsuarioAtual();
    if (!usuarioAtual) return [];

    if (usuarioAtual.cargo === 'super_admin') {
      return this.usuarios;
    }

    if (usuarioAtual.cargo === 'admin') {
      return this.usuarios.filter(u => u.estabelecimentoId === usuarioAtual.estabelecimentoId);
    }

    return [usuarioAtual];
  }

  editarUsuario(id, dados) {
    const usuarioAtual = this.getUsuarioAtual();
    const usuario = this.usuarios.find(u => u.id === id);
    
    if (!usuario) {
      return { success: false, message: "Usuário não encontrado!" };
    }

    if (usuarioAtual.cargo !== 'super_admin') {
      if (usuarioAtual.estabelecimentoId !== usuario.estabelecimentoId) {
        return { success: false, message: "Acesso negado!" };
      }
      
      if (usuario.cargo === 'admin' && usuarioAtual.id !== usuario.id) {
        return { success: false, message: "Acesso negado! Não pode editar outro administrador." };
      }
    }

    if (dados.nome) usuario.nome = dados.nome;
    if (dados.senha) usuario.senha = dados.senha;
    if (dados.ativo !== undefined) usuario.ativo = dados.ativo;
    if (dados.cargo && usuarioAtual.cargo === 'super_admin') {
      usuario.cargo = dados.cargo;
    }

    this.salvarUsuarios();
    return { success: true, message: "✅ Usuário atualizado com sucesso!" };
  }

  toggleUsuarioStatus(id) {
    const usuarioAtual = this.getUsuarioAtual();
    const usuario = this.usuarios.find(u => u.id === id);
    
    if (!usuario) {
      return { success: false, message: "Usuário não encontrado!" };
    }

    if (usuarioAtual.id === id) {
      return { success: false, message: "Você não pode desativar a si mesmo!" };
    }

    if (usuarioAtual.cargo !== 'super_admin') {
      if (usuarioAtual.estabelecimentoId !== usuario.estabelecimentoId) {
        return { success: false, message: "Acesso negado!" };
      }
      
      if (usuario.cargo === 'admin') {
        return { success: false, message: "Acesso negado! Não pode desativar outro administrador." };
      }
    }

    usuario.ativo = !usuario.ativo;
    this.salvarUsuarios();
    
    const status = usuario.ativo ? 'ativado' : 'desativado';
    return { success: true, message: `✅ Usuário ${status} com sucesso!` };
  }

  // ==========================================
  // GERENCIAMENTO DE ESTABELECIMENTOS
  // ==========================================

  criarEstabelecimento(dados) {
    const usuarioAtual = this.getUsuarioAtual();
    
    if (usuarioAtual.cargo !== 'super_admin') {
      return { success: false, message: "Apenas o Super Admin pode criar estabelecimentos!" };
    }

    const novo = {
      id: Date.now(),
      nome: dados.nome,
      cnpj: dados.cnpj || "",
      endereco: dados.endereco || "",
      telefone: dados.telefone || "",
      plano: dados.plano || "basico",
      ativo: true,
      dataCadastro: new Date().toISOString(),
      configuracao: {
        totalMesas: dados.totalMesas || 10,
        totalComandas: dados.totalComandas || 30,
        corTema: dados.corTema || "emerald"
      }
    };
    
    this.estabelecimentos.push(novo);
    this.salvarEstabelecimentos();

    const resultadoUsuario = this.criarUsuario({
      nome: dados.nomeAdmin,
      email: dados.emailAdmin,
      senha: dados.senhaAdmin || "123456",
      estabelecimentoId: novo.id,
      cargo: 'admin'
    });

    return { 
      success: true, 
      estabelecimento: novo,
      usuario: resultadoUsuario.usuario,
      message: `✅ Estabelecimento "${dados.nome}" criado com sucesso!` 
    };
  }

  listarEstabelecimentos() {
    const usuarioAtual = this.getUsuarioAtual();
    
    if (usuarioAtual.cargo === 'super_admin') {
      return this.estabelecimentos;
    }
    
    if (usuarioAtual.cargo === 'admin') {
      return this.estabelecimentos.filter(e => e.id === usuarioAtual.estabelecimentoId);
    }
    
    return [];
  }

  // ==========================================
  // PAINEL DE ADMINISTRAÇÃO (SUPER ADMIN)
  // ==========================================

  abrirPainelAdmin() {
    const usuario = this.getUsuarioAtual();
    if (!usuario || usuario.cargo !== 'super_admin') {
      alert('❌ Acesso restrito ao Super Administrador!');
      return;
    }

    // Adiciona classe para esconder o PDV
    document.body.classList.add('super-admin-mode');

    // Esconde os botões de navegação (exceto Admin e Sair)
    const botoesParaEsconder = ['btn-pdv', 'btn-comandas', 'btn-estoque', 'btn-pedidos', 'btn-configurar', 'btn-aba-gerencia'];
    botoesParaEsconder.forEach(id => {
      const btn = document.getElementById(id);
      if (btn) btn.style.display = 'none';
    });

    // Mostra o botão Admin e Sair
    const btnAdmin = document.getElementById('btn-admin');
    const btnSair = document.getElementById('btn-sair');
    if (btnAdmin) btnAdmin.style.display = '';
    if (btnSair) btnSair.style.display = '';

    document.getElementById('modal-painel-admin').classList.remove('hidden');
    this.atualizarPainelAdmin();
  }

  fecharPainelAdmin() {
    const modal = document.getElementById('modal-painel-admin');
    if (modal) modal.classList.add('hidden');
    
    // Remove a classe super-admin-mode
    document.body.classList.remove('super-admin-mode');
    
    // Restaura os botões de navegação
    const botoesParaRestaurar = ['btn-pdv', 'btn-comandas', 'btn-estoque', 'btn-pedidos', 'btn-configurar', 'btn-aba-gerencia'];
    botoesParaRestaurar.forEach(id => {
      const btn = document.getElementById(id);
      if (btn) btn.style.display = '';
    });
  }

  atualizarPainelAdmin() {
    // Atualizar estatísticas
    const totalEstabelecimentos = this.estabelecimentos.length;
    const totalUsuarios = this.usuarios.length;
    const totalAtivos = this.estabelecimentos.filter(e => e.ativo).length;
    const totalPremium = this.estabelecimentos.filter(e => e.plano === 'premium').length;

    const elTotalEstab = document.getElementById('admin-total-estabelecimentos');
    const elTotalUsers = document.getElementById('admin-total-usuarios');
    const elTotalAtivos = document.getElementById('admin-total-ativos');
    const elTotalPremium = document.getElementById('admin-total-premium');

    if (elTotalEstab) elTotalEstab.innerText = totalEstabelecimentos;
    if (elTotalUsers) elTotalUsers.innerText = totalUsuarios;
    if (elTotalAtivos) elTotalAtivos.innerText = totalAtivos;
    if (elTotalPremium) elTotalPremium.innerText = totalPremium;

    // Renderizar estabelecimentos
    const tbodyEstab = document.getElementById('admin-lista-estabelecimentos');
    if (tbodyEstab) {
      tbodyEstab.innerHTML = this.estabelecimentos.map(e => `
        <tr class="border-b border-gray-700/50 hover:bg-gray-800/30">
          <td class="p-2 text-gray-400">${e.id}</td>
          <td class="p-2 font-bold text-white">${e.nome}</td>
          <td class="p-2">
            <span class="px-2 py-0.5 rounded text-[10px] font-bold ${e.plano === 'enterprise' ? 'bg-purple-950 text-purple-400 border border-purple-800' : e.plano === 'premium' ? 'bg-amber-950 text-amber-400 border border-amber-800' : 'bg-gray-800 text-gray-400 border border-gray-700'}">
              ${e.plano.toUpperCase()}
            </span>
          </td>
          <td class="p-2 text-gray-400">${this.usuarios.filter(u => u.estabelecimentoId === e.id).length}</td>
          <td class="p-2">
            <span class="px-2 py-0.5 rounded text-[10px] font-bold ${e.ativo ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-red-950 text-red-400 border border-red-800'}">
              ${e.ativo ? '🟢 Ativo' : '🔴 Inativo'}
            </span>
          </td>
          <td class="p-2 text-right space-x-1">
            <button onclick="tenantManager.toggleEstabelecimentoStatus(${e.id})" class="${e.ativo ? 'bg-red-700 hover:bg-red-600' : 'bg-emerald-700 hover:bg-emerald-600'} px-2 py-0.5 rounded text-[10px] text-white">
              ${e.ativo ? 'Desativar' : 'Ativar'}
            </button>
          </td>
        </tr>
      `).join('');
    }

    // Renderizar usuários
    const tbodyUser = document.getElementById('admin-lista-usuarios');
    if (tbodyUser) {
      tbodyUser.innerHTML = this.usuarios.map(u => {
        const cargoLabel = {
          'super_admin': '👑 Super Admin',
          'admin': '🏢 Admin',
          'gerente': '📋 Gerente',
          'caixa': '💰 Caixa'
        }[u.cargo] || u.cargo;
        
        const estabelecimentoNome = u.estabelecimentoId ? 
          this.estabelecimentos.find(e => e.id === u.estabelecimentoId)?.nome || 'N/A' : 
          'Sistema';

        const isSuperAdmin = u.cargo === 'super_admin';
        
        return `
          <tr class="border-b border-gray-700/50 hover:bg-gray-800/30">
            <td class="p-2 text-gray-400">${u.id}</td>
            <td class="p-2 font-bold text-white">${u.nome}</td>
            <td class="p-2 text-gray-300">${u.email}</td>
            <td class="p-2">
              <span class="text-[10px] font-bold ${u.cargo === 'super_admin' ? 'text-purple-400' : u.cargo === 'admin' ? 'text-amber-400' : u.cargo === 'gerente' ? 'text-blue-400' : 'text-gray-400'}">
                ${cargoLabel}
              </span>
            </td>
            <td class="p-2 text-gray-400 text-[10px]">${estabelecimentoNome}</td>
            <td class="p-2">
              <span class="px-2 py-0.5 rounded text-[10px] font-bold ${u.ativo ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-red-950 text-red-400 border border-red-800'}">
                ${u.ativo ? '🟢 Ativo' : '🔴 Inativo'}
              </span>
            </td>
            <td class="p-2 text-right space-x-1">
              ${!isSuperAdmin ? `
                <button onclick="tenantManager.abrirModalEditarUsuario(${u.id})" class="bg-blue-700 hover:bg-blue-600 px-2 py-0.5 rounded text-[10px] text-white">✏️</button>
                <button onclick="tenantManager.toggleUsuarioStatus(${u.id})" class="${u.ativo ? 'bg-red-700 hover:bg-red-600' : 'bg-emerald-700 hover:bg-emerald-600'} px-2 py-0.5 rounded text-[10px] text-white">
                  ${u.ativo ? '🔴' : '🟢'}
                </button>
              ` : '<span class="text-gray-500 text-[10px]">👑</span>'}
            </td>
          </tr>
        `;
      }).join('');
    }
  }

  // ==========================================
  // TOGGLE ESTABELECIMENTO
  // ==========================================

  toggleEstabelecimentoStatus(id) {
    const estabelecimento = this.estabelecimentos.find(e => e.id === id);
    if (!estabelecimento) return;

    const novoStatus = !estabelecimento.ativo;
    const acao = novoStatus ? 'ativar' : 'desativar';
    
    if (confirm(`Tem certeza que deseja ${acao} o estabelecimento "${estabelecimento.nome}"?`)) {
      estabelecimento.ativo = novoStatus;
      this.salvarEstabelecimentos();
      this.atualizarPainelAdmin();
      alert(`✅ Estabelecimento ${novoStatus ? 'ativado' : 'desativado'} com sucesso!`);
    }
  }

  // ==========================================
  // MODAL: EDITAR USUÁRIO (SUPER ADMIN)
  // ==========================================

  abrirModalEditarUsuario(id) {
    const usuario = this.usuarios.find(u => u.id === id);
    if (!usuario) {
      alert('Usuário não encontrado!');
      return;
    }

    const usuarioAtual = this.getUsuarioAtual();
    if (usuario.cargo === 'super_admin' && usuarioAtual.id === usuario.id) {
      alert('❌ Você não pode editar a si mesmo!');
      return;
    }

    const modalHTML = `
      <div id="modal-editar-usuario" class="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-[300]">
        <div class="bg-gray-800 border border-gray-700 p-6 rounded-xl w-full max-w-md space-y-4 shadow-2xl">
          
          <div class="flex justify-between items-center border-b border-gray-700 pb-3">
            <h3 class="font-bold text-white text-lg">✏️ Editar Usuário</h3>
            <button onclick="fecharModalEditarUsuario()" class="text-gray-400 hover:text-white text-xl font-bold">×</button>
          </div>

          <form id="form-editar-usuario" onsubmit="salvarEdicaoUsuario(event)" class="space-y-3">
            
            <div>
              <label class="block text-xs font-semibold text-gray-400 mb-1">Nome</label>
              <input type="text" id="edit-nome" value="${usuario.nome}" required 
                     class="w-full bg-gray-900 border border-gray-700 p-2.5 rounded text-sm text-white focus:outline-none focus:border-emerald-500">
            </div>

            <div>
              <label class="block text-xs font-semibold text-gray-400 mb-1">Email</label>
              <input type="email" id="edit-email" value="${usuario.email}" required 
                     class="w-full bg-gray-900 border border-gray-700 p-2.5 rounded text-sm text-white focus:outline-none focus:border-emerald-500">
            </div>

            <div>
              <label class="block text-xs font-semibold text-gray-400 mb-1">Cargo</label>
              <select id="edit-cargo" class="w-full bg-gray-900 border border-gray-700 p-2.5 rounded text-sm text-white focus:outline-none focus:border-emerald-500">
                <option value="admin" ${usuario.cargo === 'admin' ? 'selected' : ''}>Admin (Dono da Adega)</option>
                <option value="gerente" ${usuario.cargo === 'gerente' ? 'selected' : ''}>Gerente</option>
                <option value="caixa" ${usuario.cargo === 'caixa' ? 'selected' : ''}>Caixa</option>
              </select>
            </div>

            <div>
              <label class="block text-xs font-semibold text-gray-400 mb-1">Nova Senha (deixe em branco para manter)</label>
              <input type="text" id="edit-senha" placeholder="Digite a nova senha" 
                     class="w-full bg-gray-900 border border-gray-700 p-2.5 rounded text-sm text-white font-mono focus:outline-none focus:border-emerald-500">
            </div>

            <div>
              <label class="block text-xs font-semibold text-gray-400 mb-1">Estabelecimento</label>
              <select id="edit-estabelecimento" class="w-full bg-gray-900 border border-gray-700 p-2.5 rounded text-sm text-white focus:outline-none focus:border-emerald-500">
                ${this.estabelecimentos.map(e => `
                  <option value="${e.id}" ${usuario.estabelecimentoId === e.id ? 'selected' : ''}>${e.nome}</option>
                `).join('')}
              </select>
            </div>

            <div class="flex items-center gap-2 pt-2">
              <input type="checkbox" id="edit-ativo" ${usuario.ativo ? 'checked' : ''} class="w-4 h-4 accent-emerald-500">
              <label for="edit-ativo" class="text-xs text-gray-300 cursor-pointer">Usuário ativo</label>
            </div>

            <div class="flex justify-end gap-2 pt-3 border-t border-gray-700">
              <button type="button" onclick="fecharModalEditarUsuario()" 
                      class="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded text-xs font-bold text-gray-300 transition-colors">
                Cancelar
              </button>
              <button type="submit" 
                      class="bg-emerald-600 hover:bg-emerald-500 px-4 py-2 rounded text-xs font-bold text-white shadow-lg transition-colors">
                💾 Salvar Alterações
              </button>
            </div>
          </form>
        </div>
      </div>
    `;

    const oldModal = document.getElementById('modal-editar-usuario');
    if (oldModal) oldModal.remove();
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    window.usuarioEditandoId = id;
  }

  fecharModalEditarUsuario() {
    const modal = document.getElementById('modal-editar-usuario');
    if (modal) modal.remove();
    window.usuarioEditandoId = null;
  }

  salvarEdicaoUsuario(e) {
    e.preventDefault();
    
    const id = window.usuarioEditandoId;
    if (!id) {
      alert('Erro: Usuário não identificado!');
      return;
    }

    const dados = {
      nome: document.getElementById('edit-nome').value.trim(),
      email: document.getElementById('edit-email').value.trim(),
      cargo: document.getElementById('edit-cargo').value,
      senha: document.getElementById('edit-senha').value.trim() || undefined,
      estabelecimentoId: parseInt(document.getElementById('edit-estabelecimento').value),
      ativo: document.getElementById('edit-ativo').checked
    };

    if (!dados.nome || !dados.email) {
      alert('❌ Nome e email são obrigatórios!');
      return;
    }

    const emailExiste = this.usuarios.some(u => u.email === dados.email && u.id !== id);
    if (emailExiste) {
      alert('❌ Este email já está em uso por outro usuário!');
      return;
    }

    const usuario = this.usuarios.find(u => u.id === id);
    if (!usuario) {
      alert('Usuário não encontrado!');
      return;
    }

    usuario.nome = dados.nome;
    usuario.email = dados.email;
    usuario.cargo = dados.cargo;
    usuario.estabelecimentoId = dados.estabelecimentoId;
    usuario.ativo = dados.ativo;
    if (dados.senha) {
      usuario.senha = dados.senha;
    }

    this.salvarUsuarios();
    this.fecharModalEditarUsuario();
    this.atualizarPainelAdmin();
    
    alert('✅ Usuário atualizado com sucesso!');
  }

  // ==========================================
  // MODAL: NOVO ESTABELECIMENTO
  // ==========================================

  abrirModalNovoEstabelecimento() {
    const modalHTML = `
      <div id="modal-novo-estabelecimento" class="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-[100]">
        <div class="bg-gray-800 border border-gray-700 p-6 rounded-xl w-full max-w-lg space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
          
          <div class="flex justify-between items-center border-b border-gray-700 pb-3">
            <h3 class="font-bold text-white text-lg">🏢 Novo Estabelecimento</h3>
            <button onclick="fecharModalNovoEstabelecimento()" class="text-gray-400 hover:text-white text-xl font-bold">×</button>
          </div>

          <form id="form-novo-estabelecimento" onsubmit="salvarNovoEstabelecimento(event)" class="space-y-3">
            
            <div>
              <label class="block text-xs font-semibold text-gray-400 mb-1">Nome do Estabelecimento *</label>
              <input type="text" id="ne-nome" required placeholder="Ex: Adega do Zé" 
                     class="w-full bg-gray-900 border border-gray-700 p-2.5 rounded text-sm text-white focus:outline-none focus:border-emerald-500">
            </div>

            <div>
              <label class="block text-xs font-semibold text-gray-400 mb-1">CNPJ</label>
              <input type="text" id="ne-cnpj" placeholder="12.345.678/0001-90" 
                     class="w-full bg-gray-900 border border-gray-700 p-2.5 rounded text-sm text-white focus:outline-none focus:border-emerald-500">
            </div>

            <div>
              <label class="block text-xs font-semibold text-gray-400 mb-1">Endereço</label>
              <input type="text" id="ne-endereco" placeholder="Rua das Adegas, 123" 
                     class="w-full bg-gray-900 border border-gray-700 p-2.5 rounded text-sm text-white focus:outline-none focus:border-emerald-500">
            </div>

            <div>
              <label class="block text-xs font-semibold text-gray-400 mb-1">Telefone</label>
              <input type="text" id="ne-telefone" placeholder="(11) 99999-9999" 
                     class="w-full bg-gray-900 border border-gray-700 p-2.5 rounded text-sm text-white focus:outline-none focus:border-emerald-500">
            </div>

            <div>
              <label class="block text-xs font-semibold text-gray-400 mb-1">Plano</label>
              <select id="ne-plano" class="w-full bg-gray-900 border border-gray-700 p-2.5 rounded text-sm text-white focus:outline-none focus:border-emerald-500">
                <option value="basico">Básico - R$ 49,90/mês</option>
                <option value="premium" selected>Premium - R$ 99,90/mês</option>
                <option value="enterprise">Enterprise - R$ 199,90/mês</option>
              </select>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-semibold text-gray-400 mb-1">Mesas</label>
                <input type="number" id="ne-mesas" value="10" min="1" 
                       class="w-full bg-gray-900 border border-gray-700 p-2.5 rounded text-sm text-white font-mono focus:outline-none focus:border-emerald-500">
              </div>
              <div>
                <label class="block text-xs font-semibold text-gray-400 mb-1">Comandas</label>
                <input type="number" id="ne-comandas" value="30" min="1" 
                       class="w-full bg-gray-900 border border-gray-700 p-2.5 rounded text-sm text-white font-mono focus:outline-none focus:border-emerald-500">
              </div>
            </div>

            <div class="border-t border-gray-700 pt-3 mt-2">
              <p class="text-xs font-bold text-amber-400 mb-2">👤 Usuário Administrador (Dono da Adega)</p>
              
              <div>
                <label class="block text-xs font-semibold text-gray-400 mb-1">Nome do Admin *</label>
                <input type="text" id="ne-admin-nome" required placeholder="Nome do responsável" 
                       class="w-full bg-gray-900 border border-gray-700 p-2.5 rounded text-sm text-white focus:outline-none focus:border-emerald-500">
              </div>

              <div class="mt-2">
                <label class="block text-xs font-semibold text-gray-400 mb-1">Email do Admin *</label>
                <input type="email" id="ne-admin-email" required placeholder="admin@adega.com" 
                       class="w-full bg-gray-900 border border-gray-700 p-2.5 rounded text-sm text-white focus:outline-none focus:border-emerald-500">
              </div>

              <div class="mt-2">
                <label class="block text-xs font-semibold text-gray-400 mb-1">Senha do Admin</label>
                <input type="text" id="ne-admin-senha" value="123456" 
                       class="w-full bg-gray-900 border border-gray-700 p-2.5 rounded text-sm text-white font-mono focus:outline-none focus:border-emerald-500">
                <p class="text-[10px] text-gray-500 mt-1">Deixe em branco para usar "123456"</p>
              </div>
            </div>

            <div class="flex justify-end gap-2 pt-3 border-t border-gray-700">
              <button type="button" onclick="fecharModalNovoEstabelecimento()" 
                      class="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded text-xs font-bold text-gray-300 transition-colors">
                Cancelar
              </button>
              <button type="submit" 
                      class="bg-emerald-600 hover:bg-emerald-500 px-4 py-2 rounded text-xs font-bold text-white shadow-lg transition-colors">
                ✅ Criar Estabelecimento
              </button>
            </div>
          </form>
        </div>
      </div>
    `;

    const oldModal = document.getElementById('modal-novo-estabelecimento');
    if (oldModal) oldModal.remove();
    document.body.insertAdjacentHTML('beforeend', modalHTML);
  }

  salvarNovoEstabelecimento(e) {
    e.preventDefault();

    const dados = {
      nome: document.getElementById('ne-nome').value.trim(),
      cnpj: document.getElementById('ne-cnpj').value.trim(),
      endereco: document.getElementById('ne-endereco').value.trim(),
      telefone: document.getElementById('ne-telefone').value.trim(),
      plano: document.getElementById('ne-plano').value,
      totalMesas: parseInt(document.getElementById('ne-mesas').value) || 10,
      totalComandas: parseInt(document.getElementById('ne-comandas').value) || 30,
      nomeAdmin: document.getElementById('ne-admin-nome').value.trim(),
      emailAdmin: document.getElementById('ne-admin-email').value.trim(),
      senhaAdmin: document.getElementById('ne-admin-senha').value.trim() || '123456'
    };

    if (!dados.nome) {
      alert('❌ O nome do estabelecimento é obrigatório!');
      return;
    }

    if (!dados.nomeAdmin || !dados.emailAdmin) {
      alert('❌ Os dados do administrador são obrigatórios!');
      return;
    }

    const resultado = this.criarEstabelecimento(dados);
    
    if (resultado.success) {
      alert(resultado.message + `\n\n📧 Email: ${dados.emailAdmin}\n🔑 Senha: ${dados.senhaAdmin}`);
      this.fecharModalNovoEstabelecimento();
      this.atualizarPainelAdmin();
    } else {
      alert('❌ ' + resultado.message);
    }
  }

  fecharModalNovoEstabelecimento() {
    const modal = document.getElementById('modal-novo-estabelecimento');
    if (modal) modal.remove();
  }

  // ==========================================
  // MODAL: NOVO USUÁRIO
  // ==========================================

  abrirModalNovoUsuario() {
    const usuarioAtual = this.getUsuarioAtual();
    const cargosPermitidos = this.getCargosPermitidos();
    
    if (cargosPermitidos.length === 0) {
      alert('❌ Você não tem permissão para criar usuários!');
      return;
    }

    const modalHTML = `
      <div id="modal-novo-usuario" class="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-[100]">
        <div class="bg-gray-800 border border-gray-700 p-6 rounded-xl w-full max-w-md space-y-4 shadow-2xl">
          
          <div class="flex justify-between items-center border-b border-gray-700 pb-3">
            <h3 class="font-bold text-white text-lg">👤 Novo Usuário</h3>
            <button onclick="fecharModalNovoUsuario()" class="text-gray-400 hover:text-white text-xl font-bold">×</button>
          </div>

          <form id="form-novo-usuario" onsubmit="salvarNovoUsuario(event)" class="space-y-3">
            
            <div>
              <label class="block text-xs font-semibold text-gray-400 mb-1">Nome *</label>
              <input type="text" id="nu-nome" required placeholder="Nome do usuário" 
                     class="w-full bg-gray-900 border border-gray-700 p-2.5 rounded text-sm text-white focus:outline-none focus:border-emerald-500">
            </div>

            <div>
              <label class="block text-xs font-semibold text-gray-400 mb-1">Email *</label>
              <input type="email" id="nu-email" required placeholder="usuario@adega.com" 
                     class="w-full bg-gray-900 border border-gray-700 p-2.5 rounded text-sm text-white focus:outline-none focus:border-emerald-500">
            </div>

            <div>
              <label class="block text-xs font-semibold text-gray-400 mb-1">Cargo *</label>
              <select id="nu-cargo" required class="w-full bg-gray-900 border border-gray-700 p-2.5 rounded text-sm text-white focus:outline-none focus:border-emerald-500">
                ${cargosPermitidos.map(c => `
                  <option value="${c}">${c.charAt(0).toUpperCase() + c.slice(1)}</option>
                `).join('')}
              </select>
            </div>

            <div>
              <label class="block text-xs font-semibold text-gray-400 mb-1">Senha</label>
              <input type="text" id="nu-senha" value="123456" 
                     class="w-full bg-gray-900 border border-gray-700 p-2.5 rounded text-sm text-white font-mono focus:outline-none focus:border-emerald-500">
              <p class="text-[10px] text-gray-500 mt-1">Deixe em branco para usar "123456"</p>
            </div>

            ${usuarioAtual.cargo === 'super_admin' ? `
              <div>
                <label class="block text-xs font-semibold text-gray-400 mb-1">Estabelecimento</label>
                <select id="nu-estabelecimento" class="w-full bg-gray-900 border border-gray-700 p-2.5 rounded text-sm text-white focus:outline-none focus:border-emerald-500">
                  ${this.estabelecimentos.map(e => `
                    <option value="${e.id}">${e.nome}</option>
                  `).join('')}
                </select>
              </div>
            ` : ''}

            <div class="flex justify-end gap-2 pt-3 border-t border-gray-700">
              <button type="button" onclick="fecharModalNovoUsuario()" 
                      class="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded text-xs font-bold text-gray-300 transition-colors">
                Cancelar
              </button>
              <button type="submit" 
                      class="bg-emerald-600 hover:bg-emerald-500 px-4 py-2 rounded text-xs font-bold text-white shadow-lg transition-colors">
                ✅ Criar Usuário
              </button>
            </div>
          </form>
        </div>
      </div>
    `;

    const oldModal = document.getElementById('modal-novo-usuario');
    if (oldModal) oldModal.remove();
    document.body.insertAdjacentHTML('beforeend', modalHTML);
  }

  salvarNovoUsuario(e) {
    e.preventDefault();

    const usuarioAtual = this.getUsuarioAtual();
    
    const dados = {
      nome: document.getElementById('nu-nome').value.trim(),
      email: document.getElementById('nu-email').value.trim(),
      senha: document.getElementById('nu-senha').value.trim() || '123456',
      cargo: document.getElementById('nu-cargo').value,
      estabelecimentoId: null
    };

    if (usuarioAtual.cargo === 'super_admin') {
      const estabSelect = document.getElementById('nu-estabelecimento');
      if (estabSelect) {
        dados.estabelecimentoId = parseInt(estabSelect.value);
      }
    } else {
      dados.estabelecimentoId = usuarioAtual.estabelecimentoId;
    }

    if (!dados.nome || !dados.email) {
      alert('❌ Nome e email são obrigatórios!');
      return;
    }

    const resultado = this.criarUsuario(dados);
    
    if (resultado.success) {
      alert(resultado.message);
      this.fecharModalNovoUsuario();
      this.atualizarPainelAdmin();
    } else {
      alert('❌ ' + resultado.message);
    }
  }

  fecharModalNovoUsuario() {
    const modal = document.getElementById('modal-novo-usuario');
    if (modal) modal.remove();
  }

  // ==========================================
  // CADASTRO RÁPIDO PARA CLIENTE (CELULAR)
  // ==========================================

  abrirModalCadastroCliente() {
    const usuario = this.getUsuarioAtual();
    if (!usuario || usuario.cargo !== 'super_admin') {
      alert('❌ Acesso restrito ao Super Administrador!');
      return;
    }

    const modalHTML = `
      <div id="modal-cadastro-cliente" class="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-[100]">
        <div class="bg-gray-800 border border-gray-700 p-6 rounded-xl w-full max-w-md space-y-4 shadow-2xl">
          
          <div class="flex justify-between items-center border-b border-gray-700 pb-3">
            <h3 class="font-bold text-white text-lg">📱 Cadastrar Cliente</h3>
            <button onclick="fecharModalCadastroCliente()" class="text-gray-400 hover:text-white text-xl font-bold">×</button>
          </div>

          <form id="form-cadastro-cliente" onsubmit="salvarCadastroCliente(event)" class="space-y-3">
            
            <div>
              <label class="block text-xs font-semibold text-gray-400 mb-1">Nome do Cliente *</label>
              <input type="text" id="cc-nome" required placeholder="Ex: João da Adega" 
                     class="w-full bg-gray-900 border border-gray-700 p-2.5 rounded text-sm text-white focus:outline-none focus:border-emerald-500">
            </div>

            <div>
              <label class="block text-xs font-semibold text-gray-400 mb-1">Email *</label>
              <input type="email" id="cc-email" required placeholder="cliente@email.com" 
                     class="w-full bg-gray-900 border border-gray-700 p-2.5 rounded text-sm text-white focus:outline-none focus:border-emerald-500">
            </div>

            <div>
              <label class="block text-xs font-semibold text-gray-400 mb-1">Senha *</label>
              <input type="text" id="cc-senha" required value="123456" 
                     class="w-full bg-gray-900 border border-gray-700 p-2.5 rounded text-sm text-white font-mono focus:outline-none focus:border-emerald-500">
            </div>

            <div>
              <label class="block text-xs font-semibold text-gray-400 mb-1">Estabelecimento *</label>
              <select id="cc-estabelecimento" required class="w-full bg-gray-900 border border-gray-700 p-2.5 rounded text-sm text-white focus:outline-none focus:border-emerald-500">
                ${this.estabelecimentos.map(e => `
                  <option value="${e.id}">${e.nome}</option>
                `).join('')}
              </select>
            </div>

            <div>
              <label class="block text-xs font-semibold text-gray-400 mb-1">Cargo *</label>
              <select id="cc-cargo" required class="w-full bg-gray-900 border border-gray-700 p-2.5 rounded text-sm text-white focus:outline-none focus:border-emerald-500">
                <option value="admin">Admin (Dono)</option>
                <option value="gerente">Gerente</option>
                <option value="caixa">Caixa</option>
              </select>
            </div>

            <div class="bg-amber-950/30 border border-amber-700/30 p-3 rounded-lg">
              <p class="text-[10px] text-amber-400">📋 Informe os dados e clique em criar. O cliente receberá as credenciais por email (ou você envia manualmente).</p>
            </div>

            <div class="flex justify-end gap-2 pt-3 border-t border-gray-700">
              <button type="button" onclick="fecharModalCadastroCliente()" 
                      class="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded text-xs font-bold text-gray-300 transition-colors">
                Cancelar
              </button>
              <button type="submit" 
                      class="bg-emerald-600 hover:bg-emerald-500 px-4 py-2 rounded text-xs font-bold text-white shadow-lg transition-colors">
                ✅ Criar Conta
              </button>
            </div>
          </form>
        </div>
      </div>
    `;

    const oldModal = document.getElementById('modal-cadastro-cliente');
    if (oldModal) oldModal.remove();
    document.body.insertAdjacentHTML('beforeend', modalHTML);
  }

  fecharModalCadastroCliente() {
    const modal = document.getElementById('modal-cadastro-cliente');
    if (modal) modal.remove();
  }

  salvarCadastroCliente(e) {
    e.preventDefault();

    const dados = {
      nome: document.getElementById('cc-nome').value.trim(),
      email: document.getElementById('cc-email').value.trim(),
      senha: document.getElementById('cc-senha').value.trim() || '123456',
      cargo: document.getElementById('cc-cargo').value,
      estabelecimentoId: parseInt(document.getElementById('cc-estabelecimento').value)
    };

    if (!dados.nome || !dados.email) {
      alert('❌ Nome e email são obrigatórios!');
      return;
    }

    if (this.usuarios.some(u => u.email === dados.email)) {
      alert('❌ Este email já está cadastrado!');
      return;
    }

    const resultado = this.criarUsuario({
      nome: dados.nome,
      email: dados.email,
      senha: dados.senha,
      estabelecimentoId: dados.estabelecimentoId,
      cargo: dados.cargo
    });

    if (resultado.success) {
      const mensagem = `
✅ CONTA CRIADA COM SUCESSO!

📧 Email: ${dados.email}
🔑 Senha: ${dados.senha}
👤 Nome: ${dados.nome}
🏢 Estabelecimento: ${this.estabelecimentos.find(e => e.id === dados.estabelecimentoId)?.nome}
📋 Cargo: ${dados.cargo.toUpperCase()}

🌐 Acesse: https://adegatabariapdv.netlify.app/
      `;

      alert(mensagem);
      navigator.clipboard?.writeText(mensagem);
      
      this.fecharModalCadastroCliente();
      this.atualizarPainelAdmin();
    } else {
      alert('❌ ' + resultado.message);
    }
  }

  // ==========================================
  // GERENCIAR CADASTROS PENDENTES (SERVIDOR)
  // ==========================================

  async abrirModalPendentes() {
    const usuario = this.getUsuarioAtual();
    if (!usuario || usuario.cargo !== 'super_admin') {
      alert('❌ Acesso restrito ao Super Administrador!');
      return;
    }

    try {
      const pendentes = await db.getAllPendentes() || [];
      
      const badge = document.getElementById('badge-pendentes');
      if (badge) badge.innerText = pendentes.length;

      if (pendentes.length === 0) {
        alert('✅ Nenhum cadastro pendente de aprovação!');
        return;
      }

      let listaHTML = pendentes.map((p, index) => `
        <div class="bg-gray-900 border border-gray-700 p-3 rounded-lg mb-2">
          <div class="flex justify-between items-start">
            <div>
              <p class="font-bold text-white text-sm">${p.nome}</p>
              <p class="text-xs text-gray-400">${p.email}</p>
              <p class="text-[10px] text-gray-500">Cadastro: ${new Date(p.dataCadastro).toLocaleString('pt-BR')}</p>
            </div>
            <div class="flex gap-1">
              <button onclick="tenantManager.aprovarCadastro(${index})" class="bg-emerald-600 hover:bg-emerald-500 px-2 py-1 rounded text-[10px] text-white font-bold">
                ✅ Aprovar
              </button>
              <button onclick="tenantManager.reprovarCadastro(${index})" class="bg-red-600 hover:bg-red-500 px-2 py-1 rounded text-[10px] text-white font-bold">
                ❌ Reprovar
              </button>
            </div>
          </div>
        </div>
      `).join('');

      const modalHTML = `
        <div id="modal-pendentes" class="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-[100]">
          <div class="bg-gray-800 border border-gray-700 p-6 rounded-xl w-full max-w-md space-y-4 shadow-2xl max-h-[80vh] overflow-y-auto">
            <div class="flex justify-between items-center border-b border-gray-700 pb-3">
              <h3 class="font-bold text-white text-lg">⏳ Cadastros Pendentes</h3>
              <button onclick="fecharModalPendentes()" class="text-gray-400 hover:text-white text-xl font-bold">×</button>
            </div>
            
            <div class="space-y-2">
              ${listaHTML}
            </div>

            <div class="flex justify-end pt-2 border-t border-gray-700">
              <button onclick="fecharModalPendentes()" class="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded text-xs font-bold text-white">Fechar</button>
            </div>
          </div>
        </div>
      `;

      const oldModal = document.getElementById('modal-pendentes');
      if (oldModal) oldModal.remove();
      document.body.insertAdjacentHTML('beforeend', modalHTML);
    } catch (error) {
      console.error('❌ Erro ao buscar pendentes:', error);
      alert('❌ Erro ao carregar pendentes. Tente novamente.');
    }
  }

  async aprovarCadastro(index) {
    try {
      const pendentes = await db.getAllPendentes() || [];
      const cadastro = pendentes[index];
      
      if (!cadastro) {
        alert('❌ Cadastro não encontrado!');
        return;
      }

      const estabelecimentos = this.listarEstabelecimentos();
      
      const modalHTML = `
        <div id="modal-aprovar" class="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-[150]">
          <div class="bg-gray-800 border border-gray-700 p-6 rounded-xl w-full max-w-md space-y-4 shadow-2xl">
            <h3 class="font-bold text-white text-lg">✅ Aprovar Cadastro</h3>
            <p class="text-xs text-gray-400">Defina as permissões para <strong>${cadastro.nome}</strong></p>
            
            <form id="form-aprovar" onsubmit="tenantManager.confirmarAprovacao(event, ${index})" class="space-y-3">
              <div>
                <label class="block text-xs font-semibold text-gray-400 mb-1">Estabelecimento</label>
                <select id="aprovacao-estabelecimento" class="w-full bg-gray-900 border border-gray-700 p-2.5 rounded text-sm text-white focus:outline-none focus:border-emerald-500">
                  ${estabelecimentos.map(e => `
                    <option value="${e.id}">${e.nome}</option>
                  `).join('')}
                </select>
              </div>

              <div>
                <label class="block text-xs font-semibold text-gray-400 mb-1">Cargo</label>
                <select id="aprovacao-cargo" class="w-full bg-gray-900 border border-gray-700 p-2.5 rounded text-sm text-white focus:outline-none focus:border-emerald-500">
                  <option value="admin">Admin (Dono)</option>
                  <option value="gerente">Gerente</option>
                  <option value="caixa">Caixa</option>
                </select>
              </div>

              <div class="bg-amber-950/30 border border-amber-700/30 p-3 rounded-lg">
                <p class="text-[10px] text-amber-400">⚠️ O cliente receberá as credenciais para acessar o sistema.</p>
              </div>

              <div class="flex justify-end gap-2 pt-3 border-t border-gray-700">
                <button type="button" onclick="fecharModalAprovacao()" class="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded text-xs font-bold text-gray-300">Cancelar</button>
                <button type="submit" class="bg-emerald-600 hover:bg-emerald-500 px-4 py-2 rounded text-xs font-bold text-white">✅ Aprovar</button>
              </div>
            </form>
          </div>
        </div>
      `;

      const oldAprovacao = document.getElementById('modal-aprovar');
      if (oldAprovacao) oldAprovacao.remove();
      document.body.insertAdjacentHTML('beforeend', modalHTML);
    } catch (error) {
      console.error('❌ Erro ao aprovar:', error);
      alert('❌ Erro ao aprovar cadastro. Tente novamente.');
    }
  }

  async confirmarAprovacao(e, index) {
    e.preventDefault();
    
    try {
      const pendentes = await db.getAllPendentes() || [];
      const cadastro = pendentes[index];
      
      if (!cadastro) {
        alert('❌ Cadastro não encontrado!');
        return;
      }

      const estabelecimentoId = parseInt(document.getElementById('aprovacao-estabelecimento').value);
      const cargo = document.getElementById('aprovacao-cargo').value;

      const novoUsuario = {
        id: Date.now(),
        nome: cadastro.nome,
        email: cadastro.email,
        senha: cadastro.senha,
        estabelecimentoId: estabelecimentoId,
        cargo: cargo,
        ativo: true,
        criadoPor: this.getUsuarioAtual().id,
        criadoEm: new Date().toISOString()
      };

      this.usuarios.push(novoUsuario);
      await this.salvarUsuarios();

      await db.deletePendente(cadastro.id);

      const mensagem = `
✅ CONTA APROVADA COM SUCESSO!

📧 Email: ${novoUsuario.email}
🔑 Senha: ${novoUsuario.senha}
🏢 Estabelecimento: ${this.estabelecimentos.find(e => e.id === estabelecimentoId)?.nome}
👤 Nome: ${novoUsuario.nome}
📋 Cargo: ${cargo.toUpperCase()}

🌐 Acesse: https://adegatabariapdv.netlify.app/
      `;

      alert(mensagem);
      
      try {
        navigator.clipboard?.writeText(mensagem);
      } catch (clipError) {
        console.log('📋 Copie a mensagem manualmente');
      }

      fecharModalAprovacao();
      this.fecharModalPendentes();
      this.atualizarPainelAdmin();
      
      const badge = document.getElementById('badge-pendentes');
      if (badge) {
        const restantes = await db.getAllPendentes() || [];
        badge.innerText = restantes.length;
      }
    } catch (error) {
      console.error('❌ Erro ao confirmar aprovação:', error);
      alert('❌ Erro ao aprovar cadastro. Tente novamente.');
    }
  }

  async reprovarCadastro(index) {
    try {
      const pendentes = await db.getAllPendentes() || [];
      const cadastro = pendentes[index];
      
      if (!cadastro) {
        alert('❌ Cadastro não encontrado!');
        return;
      }

      if (confirm(`❌ Tem certeza que deseja REPROVAR o cadastro de "${cadastro.nome}"?`)) {
        await db.deletePendente(cadastro.id);
        alert(`✅ Cadastro de "${cadastro.nome}" foi reprovado!`);
        this.fecharModalPendentes();
        this.atualizarPainelAdmin();
        
        const badge = document.getElementById('badge-pendentes');
        if (badge) {
          const restantes = await db.getAllPendentes() || [];
          badge.innerText = restantes.length;
        }
      }
    } catch (error) {
      console.error('❌ Erro ao reprovar:', error);
      alert('❌ Erro ao reprovar cadastro. Tente novamente.');
    }
  }

  fecharModalPendentes() {
    const modal = document.getElementById('modal-pendentes');
    if (modal) modal.remove();
  }

  fecharModalAprovacao() {
    const modal = document.getElementById('modal-aprovar');
    if (modal) modal.remove();
  }
}

// ==========================================
// INSTÂNCIA GLOBAL
// ==========================================

const tenantManager = new MultiTenantManager();

// ==========================================
// FUNÇÕES GLOBAIS
// ==========================================

window.tenantManager = tenantManager;

// ==========================================
// PAINEL ADMIN
// ==========================================

window.abrirPainelAdmin = function() {
  tenantManager.abrirPainelAdmin();
};

window.fecharPainelAdmin = function() {
  tenantManager.fecharPainelAdmin();
};

window.atualizarPainelAdmin = function() {
  tenantManager.atualizarPainelAdmin();
};

// ==========================================
// EDITAR USUÁRIO
// ==========================================

window.fecharModalEditarUsuario = function() {
  tenantManager.fecharModalEditarUsuario();
};

window.salvarEdicaoUsuario = function(e) {
  tenantManager.salvarEdicaoUsuario(e);
};

// ==========================================
// ESTABELECIMENTOS
// ==========================================

window.abrirModalNovoEstabelecimento = function() {
  tenantManager.abrirModalNovoEstabelecimento();
};

window.fecharModalNovoEstabelecimento = function() {
  const modal = document.getElementById('modal-novo-estabelecimento');
  if (modal) modal.remove();
};

window.salvarNovoEstabelecimento = function(e) {
  tenantManager.salvarNovoEstabelecimento(e);
};

// ==========================================
// USUÁRIOS
// ==========================================

window.abrirModalNovoUsuario = function() {
  tenantManager.abrirModalNovoUsuario();
};

window.fecharModalNovoUsuario = function() {
  const modal = document.getElementById('modal-novo-usuario');
  if (modal) modal.remove();
};

window.salvarNovoUsuario = function(e) {
  tenantManager.salvarNovoUsuario(e);
};

// ==========================================
// CADASTRO CLIENTE (CELULAR)
// ==========================================

window.abrirModalCadastroCliente = function() {
  tenantManager.abrirModalCadastroCliente();
};

window.fecharModalCadastroCliente = function() {
  tenantManager.fecharModalCadastroCliente();
};

window.salvarCadastroCliente = function(e) {
  tenantManager.salvarCadastroCliente(e);
};

// ==========================================
// CADASTROS PENDENTES
// ==========================================

window.abrirModalPendentes = function() {
  tenantManager.abrirModalPendentes();
};

window.aprovarCadastro = function(index) {
  tenantManager.aprovarCadastro(index);
};

window.reprovarCadastro = function(index) {
  tenantManager.reprovarCadastro(index);
};

window.confirmarAprovacao = function(e, index) {
  tenantManager.confirmarAprovacao(e, index);
};

window.fecharModalPendentes = function() {
  tenantManager.fecharModalPendentes();
};

window.fecharModalAprovacao = function() {
  tenantManager.fecharModalAprovacao();
};

// ==========================================
// LOGOUT
// ==========================================

window.logoutMulti = function() {
  tenantManager.logout();
  
  document.body.classList.remove('super-admin-mode');
  
  document.querySelectorAll('nav button').forEach(btn => {
    btn.style.display = '';
  });
  
  if (typeof usuarioLogado !== 'undefined') {
    window.usuarioLogado = null;
  }
  
  const formLogin = document.getElementById("form-login");
  if (formLogin) formLogin.reset();
  
  const sistema = document.getElementById("sistema-principal");
  const login = document.getElementById("tela-login");
  if (sistema) sistema.classList.add("hidden");
  if (login) login.classList.remove("hidden");
  
  const nome = document.getElementById("nome-usuario-logado");
  const cargo = document.getElementById("cargo-usuario-logado");
  const estab = document.getElementById("estabelecimento-nome");
  if (nome) nome.innerText = "";
  if (cargo) cargo.innerText = "";
  if (estab) estab.innerText = "Carregando...";
  
  console.log("👋 Usuário desconectado com sucesso!");
};

// ==========================================
// LOG
// ==========================================

console.log('✅ Multi-Tenant carregado com sucesso!');
console.log(`🏢 ${tenantManager.estabelecimentos.length} estabelecimentos cadastrados`);
console.log(`👤 ${tenantManager.usuarios.length} usuários cadastrados`);
console.log('📌 Contas disponíveis:');
console.log('   👑 Super Admin: super@admin.com / admin123');
console.log('   🏢 Admin Adega: joao@adegaa.com / 123');
console.log('   🏢 Admin Tabacaria: maria@adegab.com / 123');
console.log('   💰 Caixa: carlos@adegaa.com / 123');