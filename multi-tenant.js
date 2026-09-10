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

  // ==========================================
  // CARREGAR DADOS
  // ==========================================

  carregarDados() {
    const usuariosSalvos = localStorage.getItem('mt_usuarios');
    const estabelecimentosSalvos = localStorage.getItem('mt_estabelecimentos');
    
    if (usuariosSalvos) {
      this.usuarios = JSON.parse(usuariosSalvos);
    } else {
      this.usuarios = [
        { id: 1, nome: "Super Admin", email: "super@admin.com", senha: "admin123", estabelecimentoId: null, cargo: "super_admin", ativo: true, criadoPor: null }
      ];
      this.salvarUsuarios();
    }

    if (estabelecimentosSalvos) {
      this.estabelecimentos = JSON.parse(estabelecimentosSalvos);
    } else {
      this.estabelecimentos = [
        { id: 1, nome: "Adega do João", cnpj: "12.345.678/0001-90", endereco: "Rua das Adegas, 123", telefone: "(11) 99999-9999", plano: "premium", ativo: true, dataCadastro: new Date().toISOString(), configuracao: { totalMesas: 10, totalComandas: 30, corTema: "emerald" } }
      ];
      this.salvarEstabelecimentos();
    }

    console.log('📦 Dados carregados:');
    console.log('👤 Usuários:', this.usuarios.length);
    console.log('🏢 Estabelecimentos:', this.estabelecimentos.length);
    return this;
  }

  // ==========================================
  // SALVAR DADOS
  // ==========================================

  salvarUsuarios() {
    localStorage.setItem('mt_usuarios', JSON.stringify(this.usuarios));
  }

  salvarEstabelecimentos() {
    localStorage.setItem('mt_estabelecimentos', JSON.stringify(this.estabelecimentos));
  }

  // ==========================================
  // SESSÃO
  // ==========================================

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
  // PRIMEIRO: tenta ler da sessão salva pelo login via API
  try {
    const sessao = localStorage.getItem('mt_sessao_atual');
    if (sessao) {
      const s = JSON.parse(sessao);
      s.cargo = String(s.cargo || '').trim().toLowerCase().replace(/[\s-]+/g, '_');
      s.isSuperAdmin = s.cargo === 'super_admin';
      if (s.cargo) return s;
    }
  } catch (e) {}

  // FALLBACK: lê do localStorage antigo
  const sessao = this.getSessaoAtual();
  if (!sessao) return null;
  return this.usuarios.find(u => u.id === sessao.usuarioId);
}

  getEstabelecimentoAtual() {
    if (this.estabelecimentoAtual) return this.estabelecimentoAtual;
    const sessao = this.getSessaoAtual();
    if (!sessao) return null;
    if (sessao.isSuperAdmin) {
      const virtual = { id: 999, nome: "👑 SUPER ADMIN - Controle Total", plano: "enterprise", ativo: true, configuracao: { totalMesas: 999, totalComandas: 999, corTema: "purple" }, isVirtual: true };
      this.estabelecimentoAtual = virtual;
      return virtual;
    }
    const estabelecimento = this.estabelecimentos.find(e => e.id === sessao.estabelecimentoId);
    this.estabelecimentoAtual = estabelecimento;
    return estabelecimento;
  }

  logout() {
    this.estabelecimentoAtual = null;
    localStorage.removeItem('mt_sessao_atual');
    document.body.classList.remove('super-admin-mode');
    document.querySelectorAll('nav button').forEach(btn => {
      btn.style.display = '';
    });
  }

  // ==========================================
  // LOGIN (FUNÇÃO PRINCIPAL)
  // ==========================================

  login(email, senha) {
    console.log('🔐 Tentando login (LocalStorage):', email);
    
    this.carregarDados();

    const usuario = this.usuarios.find(u => u.email === email && u.senha === senha && u.ativo);
    
    if (!usuario) {
      console.log('❌ Usuário não encontrado');
      console.log('👤 Emails disponíveis:', this.usuarios.map(u => u.email));
      return { success: false, message: "Email ou senha incorretos!" };
    }

    console.log('✅ Usuário encontrado:', usuario.nome);

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

    // USUÁRIO NORMAL
    const estabelecimento = this.estabelecimentos.find(e => e.id === usuario.estabelecimentoId);
    if (!estabelecimento || !estabelecimento.ativo) {
      return { success: false, message: "Estabelecimento inativo ou não encontrado!" };
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

  // ==========================================
  // USUÁRIOS
  // ==========================================

  getCargosPermitidos() {
    const usuario = this.getUsuarioAtual();
    if (!usuario) return [];
    if (usuario.cargo === 'super_admin') return ['admin', 'gerente', 'caixa'];
    if (usuario.cargo === 'admin') return ['gerente', 'caixa'];
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
    if (usuarioAtual.cargo === 'super_admin') return this.usuarios;
    if (usuarioAtual.cargo === 'admin') {
      return this.usuarios.filter(u => u.estabelecimentoId === usuarioAtual.estabelecimentoId);
    }
    return [usuarioAtual];
  }

  editarUsuario(id, dados) {
    const usuario = this.usuarios.find(u => u.id === id);
    if (!usuario) {
      return { success: false, message: "Usuário não encontrado!" };
    }

    if (dados.nome) usuario.nome = dados.nome;
    if (dados.senha) usuario.senha = dados.senha;
    if (dados.ativo !== undefined) usuario.ativo = dados.ativo;
    if (dados.cargo) usuario.cargo = dados.cargo;
    if (dados.estabelecimentoId !== undefined) usuario.estabelecimentoId = dados.estabelecimentoId;
    
    this.salvarUsuarios();
    return { success: true, message: "✅ Usuário atualizado!" };
  }

  toggleUsuarioStatus(id) {
    const usuario = this.usuarios.find(u => u.id === id);
    if (!usuario) {
      return { success: false, message: "Usuário não encontrado!" };
    }
    usuario.ativo = !usuario.ativo;
    this.salvarUsuarios();
    this.atualizarPainelAdmin();
    const status = usuario.ativo ? 'ativado' : 'desativado';
    return { success: true, message: `✅ Usuário ${status}!` };
  }

  excluirUsuario(id) {
    const usuarioAtual = this.getUsuarioAtual();
    if (!usuarioAtual || usuarioAtual.cargo !== 'super_admin') {
      alert('❌ Apenas o Super Admin pode excluir contas!');
      return;
    }
    if (usuarioAtual.id === id) {
      alert('❌ Você não pode excluir sua própria conta!');
      return;
    }
    const usuario = this.usuarios.find(u => u.id === id);
    if (!usuario) {
      alert('Conta não encontrada!');
      return;
    }
    if (confirm(`⚠️ Tem certeza que deseja EXCLUIR "${usuario.nome}"?`)) {
      this.usuarios = this.usuarios.filter(u => u.id !== id);
      this.salvarUsuarios();
      this.atualizarPainelAdmin();
      alert('🗑️ Conta excluída!');
    }
  }

  // ==========================================
  // ESTABELECIMENTOS
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
    return { success: true, estabelecimento: novo };
  }

  listarEstabelecimentos() {
    const usuarioAtual = this.getUsuarioAtual();
    if (usuarioAtual.cargo === 'super_admin') return this.estabelecimentos;
    if (usuarioAtual.cargo === 'admin') {
      return this.estabelecimentos.filter(e => e.id === usuarioAtual.estabelecimentoId);
    }
    return [];
  }

  toggleEstabelecimentoStatus(id) {
    const estabelecimento = this.estabelecimentos.find(e => e.id === id);
    if (!estabelecimento) {
      alert('Estabelecimento não encontrado!');
      return;
    }

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
// EXCLUIR ESTABELECIMENTO (com confirmação)
// ==========================================

async excluirEstabelecimento(id) {
  const usuarioAtual = this.getUsuarioAtual();
  const cargo = String(usuarioAtual?.cargo || '').toLowerCase();

  if (cargo !== 'super_admin') {
    alert('❌ Apenas o Super Admin pode excluir estabelecimentos!');
    return;
  }

  const estabelecimento = this.estabelecimentos.find(e => e.id === id);
  if (!estabelecimento) {
    alert('❌ Estabelecimento não encontrado!');
    return;
  }

  // Contar usuários vinculados
  const usuariosVinculados = this.usuarios.filter(u => u.estabelecimentoId === id);

  // Primeira confirmação
  const msg1 = `⚠️ TEM CERTEZA QUE DESEJA EXCLUIR?\n\n` +
               `🏢 Estabelecimento: ${estabelecimento.nome}\n` +
               `👥 Usuários vinculados: ${usuariosVinculados.length}\n\n` +
               `🚨 ESTA AÇÃO É IRREVERSÍVEL!\n` +
               `Todos os dados (produtos, pedidos, comandas) serão apagados.`;

  if (!confirm(msg1)) return;

  // Segunda confirmação (digitando o nome)
  const confirmacao = prompt(
    `Para confirmar, digite EXATAMENTE o nome do estabelecimento:\n\n"${estabelecimento.nome}"`
  );

  if (confirmacao !== estabelecimento.nome) {
    alert('❌ Nome incorreto. Exclusão cancelada.');
    return;
  }

  try {
    // 1. Excluir no BACKEND (PostgreSQL)
    const response = await fetch(`https://adegapdv-api.onrender.com/estabelecimentos/${id}`, {
      method: 'DELETE'
    });

    if (!response.ok) {
      const erro = await response.text();
      console.warn('⚠️ Erro ao excluir no backend:', erro);
    } else {
      console.log('✅ Estabelecimento excluído no backend');
    }

    // 2. Excluir usuários vinculados no backend
    for (const u of usuariosVinculados) {
      try {
        await fetch(`https://adegapdv-api.onrender.com/usuarios/${u.id}`, {
          method: 'DELETE'
        });
      } catch (e) {}
    }

    // 3. Excluir LOCALMENTE
    this.estabelecimentos = this.estabelecimentos.filter(e => e.id !== id);
    this.salvarEstabelecimentos();

    this.usuarios = this.usuarios.filter(u => u.estabelecimentoId !== id);
    this.salvarUsuarios();

    alert(`✅ Estabelecimento "${estabelecimento.nome}" excluído com sucesso!\n\n` +
          `🗑️ ${usuariosVinculados.length} usuário(s) também foi(ram) removido(s).`);

    // 4. Atualizar painel
    this.atualizarPainelAdmin();

  } catch (error) {
    console.error('❌ Erro ao excluir:', error);
    alert(`❌ Erro ao excluir: ${error.message}`);
  }
}
  // ==========================================
  // PAINEL ADMIN
  // ==========================================

   // ==========================================
  // ABRIR PAINEL ADMIN
  // ==========================================

 abrirPainelAdmin() {
  const usuario = this.getUsuarioAtual();
  const cargo = String(usuario?.cargo || '').toLowerCase();
  const autorizado = cargo === 'super_admin' || cargo === 'admin' || usuario?.isSuperAdmin === true;

  if (!autorizado) {
    alert('❌ Acesso restrito!');
    return;
  }

  const isSuperAdmin = cargo === 'super_admin';

  this.carregarDados();
  document.body.classList.add('super-admin-mode');

  const modal = document.getElementById('modal-painel-admin');
  if (modal) {
    modal.classList.remove('hidden');
    modal.style.display = 'flex';
    modal.dataset.tipoAdmin = isSuperAdmin ? 'super' : 'admin';
    setTimeout(() => this.atualizarPainelAdmin(), 200);
  } else {
    alert('❌ Modal não encontrado!');
  }
}

  // ==========================================
  // FECHAR PAINEL ADMIN
  // ==========================================

  fecharPainelAdmin() {
    const modal = document.getElementById('modal-painel-admin');
    if (modal) {
      modal.classList.add('hidden');
      modal.style.display = 'none';
    }
    document.body.classList.remove('super-admin-mode');
    
    // Restaurar botões de navegação
    const botoesParaRestaurar = ['btn-pdv', 'btn-comandas', 'btn-estoque', 'btn-pedidos', 'btn-configurar', 'btn-aba-gerencia'];
    botoesParaRestaurar.forEach(id => {
      const btn = document.getElementById(id);
      if (btn) btn.style.display = '';
    });
    
    console.log('👋 Painel Admin fechado');
  }

    // ==========================================
  // ATUALIZAR PAINEL ADMIN
  // ==========================================

  atualizarPainelAdmin() {
    this.carregarDados();

    const usuarioAtual = this.getUsuarioAtual();
    if (!usuarioAtual) return;

    const isSuperAdmin = usuarioAtual.cargo === 'super_admin';
    const isAdmin = usuarioAtual.cargo === 'admin';

    // FILTRAR USUÁRIOS PARA ADMIN (mostra apenas do seu estabelecimento)
    let usuariosFiltrados = this.usuarios;
    if (isAdmin) {
      usuariosFiltrados = this.usuarios.filter(u => u.estabelecimentoId === usuarioAtual.estabelecimentoId);
    }

    // ==========================================
    // CONTROLE DE VISIBILIDADE DOS BOTÕES
    // ==========================================
    
    // Botões que só o Super Admin vê
    const botoesSuperAdmin = [
      'btn-novo-estabelecimento',
      'btn-gerar-convite',
      'btn-ver-convites'
    ];
    
    botoesSuperAdmin.forEach(id => {
      const btn = document.getElementById(id);
      if (btn) {
        if (isSuperAdmin) {
          btn.style.display = 'inline-flex';
        } else {
          btn.style.display = 'none';
        }
      }
    });

    // Botão "Novo Usuário" - todos veem
    const btnNovoUsuario = document.getElementById('btn-novo-usuario');
    if (btnNovoUsuario) {
      btnNovoUsuario.style.display = 'inline-flex';
    }

    // ==========================================
    // ESTATÍSTICAS
    // ==========================================

    const totalUsuarios = usuariosFiltrados.length;
    const totalAtivos = usuariosFiltrados.filter(u => u.ativo).length;
    const totalEstabelecimentos = isAdmin ? 1 : this.estabelecimentos.length;

    const elTotalUsers = document.getElementById('admin-total-usuarios');
    const elTotalAtivos = document.getElementById('admin-total-ativos');
    const elTotalEstab = document.getElementById('admin-total-estabelecimentos');

    if (elTotalUsers) elTotalUsers.innerText = totalUsuarios;
    if (elTotalAtivos) elTotalAtivos.innerText = totalAtivos;
    if (elTotalEstab) elTotalEstab.innerText = totalEstabelecimentos;

    // ==========================================
    // RENDERIZAR ESTABELECIMENTOS
    // ==========================================

 // ==========================================
// RENDERIZAR ESTABELECIMENTOS
// ==========================================

const tbodyEstab = document.getElementById('admin-lista-estabelecimentos');
if (tbodyEstab) {
  let estabelecimentosParaMostrar = this.estabelecimentos;
  if (isAdmin) {
    estabelecimentosParaMostrar = this.estabelecimentos.filter(e => e.id === usuarioAtual.estabelecimentoId);
  }
  
  if (estabelecimentosParaMostrar.length === 0) {
    tbodyEstab.innerHTML = `<tr><td colspan="6" class="text-center text-gray-500 py-4">Nenhum estabelecimento.</td></tr>`;
  } else {
    tbodyEstab.innerHTML = estabelecimentosParaMostrar.map(e => `
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
          ${isSuperAdmin ? `
            <button onclick="tenantManager.toggleEstabelecimentoStatus(${e.id})" class="${e.ativo ? 'bg-amber-700 hover:bg-amber-600' : 'bg-emerald-700 hover:bg-emerald-600'} px-2 py-0.5 rounded text-[10px] text-white">
              ${e.ativo ? 'Desativar' : 'Ativar'}
            </button>
            <button onclick="tenantManager.excluirEstabelecimento(${e.id})" class="bg-red-700 hover:bg-red-600 px-2 py-0.5 rounded text-[10px] text-white" title="Excluir">
              🗑️ Excluir
            </button>
          ` : '<span class="text-gray-500 text-[10px]">👀 Visualizar</span>'}
        </td>
      </tr>
    `).join('');
  }
}

    // ==========================================
    // RENDERIZAR USUÁRIOS
    // ==========================================

    const tbodyUser = document.getElementById('admin-lista-usuarios');
    if (tbodyUser) {
      if (usuariosFiltrados.length === 0) {
        tbodyUser.innerHTML = `<tr><td colspan="7" class="text-center text-gray-500 py-4">Nenhum usuário neste estabelecimento.</td></tr>`;
      } else {
        tbodyUser.innerHTML = usuariosFiltrados.map(u => {
          const cargoLabel = {
            'super_admin': '👑 Super Admin',
            'admin': '🏢 Admin',
            'gerente': '📋 Gerente',
            'caixa': '💰 Caixa'
          }[u.cargo] || u.cargo;
          
          const isSuperAdminUser = u.cargo === 'super_admin';
          const isCurrentUser = u.id === usuarioAtual.id;
          const estabNome = u.estabelecimentoId ? 
            this.estabelecimentos.find(e => e.id === u.estabelecimentoId)?.nome || 'N/A' : 
            'Sistema';
          
          const podeEditar = isSuperAdmin || 
                             (isAdmin && u.estabelecimentoId === usuarioAtual.estabelecimentoId && !isSuperAdminUser);
          
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
              <td class="p-2 text-gray-400 text-[10px]">${estabNome}</td>
              <td class="p-2">
                <span class="px-2 py-0.5 rounded text-[10px] font-bold ${u.ativo ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-red-950 text-red-400 border border-red-800'}">
                  ${u.ativo ? '🟢 Ativo' : '🔴 Inativo'}
                </span>
              </td>
              <td class="p-2 text-right space-x-1">
                ${!isSuperAdminUser && !isCurrentUser && podeEditar ? `
                  <button onclick="tenantManager.abrirModalEditarUsuario(${u.id})" class="bg-blue-700 hover:bg-blue-600 px-2 py-0.5 rounded text-[10px] text-white" title="Editar">✏️</button>
                  <button onclick="tenantManager.toggleUsuarioStatus(${u.id})" class="${u.ativo ? 'bg-amber-700 hover:bg-amber-600' : 'bg-emerald-700 hover:bg-emerald-600'} px-2 py-0.5 rounded text-[10px] text-white" title="Alterar Status">
                    ${u.ativo ? '⏸️' : '▶️'}
                  </button>
                  <button onclick="tenantManager.excluirUsuario(${u.id})" class="bg-red-700 hover:bg-red-600 px-2 py-0.5 rounded text-[10px] text-white" title="Excluir">🗑️</button>
                ` : (isCurrentUser ? '<span class="text-gray-500 text-[10px]">(Você)</span>' : '')}
                ${isSuperAdminUser ? '<span class="text-purple-400 text-[10px] font-bold">👑</span>' : ''}
              </td>
            </tr>
          `;
        }).join('');
      }
    }
    
    console.log('✅ Painel Admin atualizado!');
  }

  // ==========================================
  // MODAL: EDITAR USUÁRIO
  // ==========================================

  abrirModalEditarUsuario(id) {
    const usuario = this.usuarios.find(u => u.id === id);
    if (!usuario) {
      alert('Usuário não encontrado!');
      return;
    }

    const modalHTML = `
      <div id="modal-editar-usuario" class="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-[300]">
        <div class="bg-gray-800 border border-gray-700 p-6 rounded-xl w-full max-w-md space-y-4 shadow-2xl">
          <div class="flex justify-between items-center border-b border-gray-700 pb-3">
            <h3 class="font-bold text-white text-lg">✏️ Editar Usuário</h3>
            <button onclick="document.getElementById('modal-editar-usuario').remove()" class="text-gray-400 hover:text-white text-xl font-bold">×</button>
          </div>
          <form onsubmit="tenantManager.salvarEdicaoUsuario(event, ${id})" class="space-y-3">
            <div>
              <label class="block text-xs font-semibold text-gray-400 mb-1">Nome</label>
              <input type="text" id="edit-nome" value="${usuario.nome}" required class="w-full bg-gray-900 border border-gray-700 p-2.5 rounded text-sm text-white focus:outline-none focus:border-emerald-500">
            </div>
            <div>
              <label class="block text-xs font-semibold text-gray-400 mb-1">Email</label>
              <input type="email" id="edit-email" value="${usuario.email}" required class="w-full bg-gray-900 border border-gray-700 p-2.5 rounded text-sm text-white focus:outline-none focus:border-emerald-500">
            </div>
            <div>
              <label class="block text-xs font-semibold text-gray-400 mb-1">Nova Senha</label>
              <input type="text" id="edit-senha" placeholder="Digite a nova senha" class="w-full bg-gray-900 border border-gray-700 p-2.5 rounded text-sm text-white font-mono focus:outline-none focus:border-emerald-500">
            </div>
            <div>
              <label class="block text-xs font-semibold text-gray-400 mb-1">Cargo</label>
              <select id="edit-cargo" class="w-full bg-gray-900 border border-gray-700 p-2.5 rounded text-sm text-white focus:outline-none focus:border-emerald-500">
                <option value="admin" ${usuario.cargo === 'admin' ? 'selected' : ''}>Admin</option>
                <option value="gerente" ${usuario.cargo === 'gerente' ? 'selected' : ''}>Gerente</option>
                <option value="caixa" ${usuario.cargo === 'caixa' ? 'selected' : ''}>Caixa</option>
              </select>
            </div>
            <div class="flex justify-end gap-2 pt-3 border-t border-gray-700">
              <button type="button" onclick="document.getElementById('modal-editar-usuario').remove()" class="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded text-xs font-bold text-gray-300">Cancelar</button>
              <button type="submit" class="bg-emerald-600 hover:bg-emerald-500 px-4 py-2 rounded text-xs font-bold text-white">💾 Salvar</button>
            </div>
          </form>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);
  }

  salvarEdicaoUsuario(e, id) {
    e.preventDefault();
    const usuario = this.usuarios.find(u => u.id === id);
    if (!usuario) {
      alert('Usuário não encontrado!');
      return;
    }
    
    usuario.nome = document.getElementById('edit-nome').value.trim();
    usuario.email = document.getElementById('edit-email').value.trim();
    usuario.cargo = document.getElementById('edit-cargo').value;
    const senha = document.getElementById('edit-senha').value.trim();
    if (senha) usuario.senha = senha;
    
    this.salvarUsuarios();
    document.getElementById('modal-editar-usuario').remove();
    this.atualizarPainelAdmin();
    alert('✅ Usuário atualizado!');
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
            <button onclick="document.getElementById('modal-novo-usuario').remove()" class="text-gray-400 hover:text-white text-xl font-bold">×</button>
          </div>
          <form onsubmit="tenantManager.salvarNovoUsuario(event)" class="space-y-3">
            <div>
              <label class="block text-xs font-semibold text-gray-400 mb-1">Nome *</label>
              <input type="text" id="nu-nome" required placeholder="Nome do usuário" class="w-full bg-gray-900 border border-gray-700 p-2.5 rounded text-sm text-white focus:outline-none focus:border-emerald-500">
            </div>
            <div>
              <label class="block text-xs font-semibold text-gray-400 mb-1">Email *</label>
              <input type="email" id="nu-email" required placeholder="usuario@adega.com" class="w-full bg-gray-900 border border-gray-700 p-2.5 rounded text-sm text-white focus:outline-none focus:border-emerald-500">
            </div>
            <div>
              <label class="block text-xs font-semibold text-gray-400 mb-1">Cargo *</label>
              <select id="nu-cargo" required class="w-full bg-gray-900 border border-gray-700 p-2.5 rounded text-sm text-white focus:outline-none focus:border-emerald-500">
                ${cargosPermitidos.map(c => `<option value="${c}">${c.charAt(0).toUpperCase() + c.slice(1)}</option>`).join('')}
              </select>
            </div>
            <div>
              <label class="block text-xs font-semibold text-gray-400 mb-1">Senha</label>
              <input type="text" id="nu-senha" value="123456" class="w-full bg-gray-900 border border-gray-700 p-2.5 rounded text-sm text-white font-mono focus:outline-none focus:border-emerald-500">
              <p class="text-[10px] text-gray-500 mt-1">Deixe em branco para usar "123456"</p>
            </div>
            ${usuarioAtual.cargo === 'super_admin' ? `
              <div>
                <label class="block text-xs font-semibold text-gray-400 mb-1">Estabelecimento</label>
                <select id="nu-estabelecimento" class="w-full bg-gray-900 border border-gray-700 p-2.5 rounded text-sm text-white focus:outline-none focus:border-emerald-500">
                  ${this.estabelecimentos.map(e => `<option value="${e.id}">${e.nome}</option>`).join('')}
                </select>
              </div>
            ` : ''}
            <div class="flex justify-end gap-2 pt-3 border-t border-gray-700">
              <button type="button" onclick="document.getElementById('modal-novo-usuario').remove()" class="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded text-xs font-bold text-gray-300">Cancelar</button>
              <button type="submit" class="bg-emerald-600 hover:bg-emerald-500 px-4 py-2 rounded text-xs font-bold text-white shadow-lg">✅ Criar Usuário</button>
            </div>
          </form>
        </div>
      </div>
    `;
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
      document.getElementById('modal-novo-usuario').remove();
      this.atualizarPainelAdmin();
    } else {
      alert('❌ ' + resultado.message);
    }
  }

  // ==========================================
  // MODAL: NOVO ESTABELECIMENTO
  // ==========================================

  abrirModalNovoEstabelecimento() {
    const usuario = this.getUsuarioAtual();
    if (!usuario || usuario.cargo !== 'super_admin') {
      alert('❌ Apenas o Super Admin pode criar estabelecimentos!');
      return;
    }

    const modalHTML = `
      <div id="modal-novo-estabelecimento" class="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-[100]">
        <div class="bg-gray-800 border border-gray-700 p-6 rounded-xl w-full max-w-lg space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
          <div class="flex justify-between items-center border-b border-gray-700 pb-3">
            <h3 class="font-bold text-white text-lg">🏢 Novo Estabelecimento</h3>
            <button onclick="document.getElementById('modal-novo-estabelecimento').remove()" class="text-gray-400 hover:text-white text-xl font-bold">×</button>
          </div>
          <form onsubmit="tenantManager.salvarNovoEstabelecimento(event)" class="space-y-3">
            <div>
              <label class="block text-xs font-semibold text-gray-400 mb-1">Nome do Estabelecimento *</label>
              <input type="text" id="ne-nome" required placeholder="Ex: Adega do Zé" class="w-full bg-gray-900 border border-gray-700 p-2.5 rounded text-sm text-white focus:outline-none focus:border-emerald-500">
            </div>
            <div>
              <label class="block text-xs font-semibold text-gray-400 mb-1">CNPJ</label>
              <input type="text" id="ne-cnpj" placeholder="12.345.678/0001-90" class="w-full bg-gray-900 border border-gray-700 p-2.5 rounded text-sm text-white focus:outline-none focus:border-emerald-500">
            </div>
            <div>
              <label class="block text-xs font-semibold text-gray-400 mb-1">Endereço</label>
              <input type="text" id="ne-endereco" placeholder="Rua das Adegas, 123" class="w-full bg-gray-900 border border-gray-700 p-2.5 rounded text-sm text-white focus:outline-none focus:border-emerald-500">
            </div>
            <div>
              <label class="block text-xs font-semibold text-gray-400 mb-1">Telefone</label>
              <input type="text" id="ne-telefone" placeholder="(11) 99999-9999" class="w-full bg-gray-900 border border-gray-700 p-2.5 rounded text-sm text-white focus:outline-none focus:border-emerald-500">
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
                <input type="number" id="ne-mesas" value="10" min="1" class="w-full bg-gray-900 border border-gray-700 p-2.5 rounded text-sm text-white font-mono focus:outline-none focus:border-emerald-500">
              </div>
              <div>
                <label class="block text-xs font-semibold text-gray-400 mb-1">Comandas</label>
                <input type="number" id="ne-comandas" value="30" min="1" class="w-full bg-gray-900 border border-gray-700 p-2.5 rounded text-sm text-white font-mono focus:outline-none focus:border-emerald-500">
              </div>
            </div>
            <div class="border-t border-gray-700 pt-3 mt-2">
              <p class="text-xs font-bold text-amber-400 mb-2">👤 Usuário Administrador</p>
              <div>
                <label class="block text-xs font-semibold text-gray-400 mb-1">Nome do Admin *</label>
                <input type="text" id="ne-admin-nome" required placeholder="Nome do responsável" class="w-full bg-gray-900 border border-gray-700 p-2.5 rounded text-sm text-white focus:outline-none focus:border-emerald-500">
              </div>
              <div class="mt-2">
                <label class="block text-xs font-semibold text-gray-400 mb-1">Email do Admin *</label>
                <input type="email" id="ne-admin-email" required placeholder="admin@adega.com" class="w-full bg-gray-900 border border-gray-700 p-2.5 rounded text-sm text-white focus:outline-none focus:border-emerald-500">
              </div>
              <div class="mt-2">
                <label class="block text-xs font-semibold text-gray-400 mb-1">Senha do Admin</label>
                <input type="text" id="ne-admin-senha" value="123456" class="w-full bg-gray-900 border border-gray-700 p-2.5 rounded text-sm text-white font-mono focus:outline-none focus:border-emerald-500">
                <p class="text-[10px] text-gray-500 mt-1">Deixe em branco para usar "123456"</p>
              </div>
            </div>
            <div class="flex justify-end gap-2 pt-3 border-t border-gray-700">
              <button type="button" onclick="document.getElementById('modal-novo-estabelecimento').remove()" class="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded text-xs font-bold text-gray-300">Cancelar</button>
              <button type="submit" class="bg-emerald-600 hover:bg-emerald-500 px-4 py-2 rounded text-xs font-bold text-white shadow-lg">✅ Criar Estabelecimento</button>
            </div>
          </form>
        </div>
      </div>
    `;
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

    // Verificar se email já existe
    if (this.usuarios.some(u => u.email === dados.emailAdmin)) {
      alert('❌ Este email já está cadastrado!');
      return;
    }

    const resultado = this.criarEstabelecimento(dados);
    if (!resultado.success) {
      alert('❌ ' + resultado.message);
      return;
    }

    // Criar usuário admin
    const novoUsuario = {
      id: Date.now(),
      nome: dados.nomeAdmin,
      email: dados.emailAdmin,
      senha: dados.senhaAdmin,
      estabelecimentoId: resultado.estabelecimento.id,
      cargo: 'admin',
      ativo: true,
      criadoPor: this.getUsuarioAtual().id,
      criadoEm: new Date().toISOString()
    };

    this.usuarios.push(novoUsuario);
    this.salvarUsuarios();

    alert(`✅ Estabelecimento "${dados.nome}" criado com sucesso!\n\n📧 Email: ${dados.emailAdmin}\n🔑 Senha: ${dados.senhaAdmin}`);

    document.getElementById('modal-novo-estabelecimento')?.remove();
    this.atualizarPainelAdmin();
  }

  // ==========================================
  // SISTEMA DE CONVITE (CÓDIGOS DE ACESSO)
  // ==========================================

  async gerarCodigoConvite() {
  console.log('🎟️ Gerando código de convite...');

  const usuario = this.getUsuarioAtual();
  const cargo = String(usuario?.cargo || '').toLowerCase();
  const autorizado = cargo === 'super_admin' || cargo === 'admin' || usuario?.isSuperAdmin === true;

  if (!autorizado) {
    alert('❌ Apenas o Super Admin ou Admin pode gerar códigos!');
    return;
  }

  // Gera código
  const caracteres = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let codigo = '';
  for (let i = 0; i < 8; i++) {
    codigo += caracteres.charAt(Math.floor(Math.random() * caracteres.length));
  }

  // Salva no backend
  try {
    const resp = await fetch('https://adegapdv-api.onrender.com/convites', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ codigo, criadoPor: usuario.usuarioId || usuario.id || 1 })
    });
    if (!resp.ok) console.warn('⚠️ Convite não salvo no backend');
  } catch (e) {
    console.warn('⚠️ Backend offline:', e.message);
  }

  // Salva localmente
  const convites = JSON.parse(localStorage.getItem('mt_convites') || '[]');
  convites.push({
    codigo,
    criadoPor: usuario.usuarioId || usuario.id || 1,
    criadoEm: new Date().toISOString(),
    usado: false,
    usadoPor: null
  });
  localStorage.setItem('mt_convites', JSON.stringify(convites));

  // Atualiza badge
  const badge = document.getElementById('badge-convites');
  if (badge) badge.innerText = convites.filter(c => !c.usado).length;

  // Copia
  try { navigator.clipboard.writeText(codigo); } catch (e) {}

  alert(`✅ Código de convite gerado!\n\n📋 Código: ${codigo}\n\n🔑 Copiado!`);
  return codigo;
}

  validarCodigoConvite(codigo) {
    const convites = JSON.parse(localStorage.getItem('mt_convites') || '[]');
    const convite = convites.find(c => c.codigo === codigo && !c.usado);
    
    if (!convite) {
      return { 
        valido: false, 
        mensagem: '❌ Código de convite inválido ou já utilizado!' 
      };
    }

    return { 
      valido: true, 
      convite: convite,
      mensagem: '✅ Código válido!' 
    };
  }

  usarCodigoConvite(codigo, usuarioId) {
    const convites = JSON.parse(localStorage.getItem('mt_convites') || '[]');
    const index = convites.findIndex(c => c.codigo === codigo && !c.usado);
    
    if (index === -1) {
      return false;
    }

    convites[index].usado = true;
    convites[index].usadoPor = usuarioId;
    convites[index].usadoEm = new Date().toISOString();
    
    localStorage.setItem('mt_convites', JSON.stringify(convites));
    
    const badge = document.getElementById('badge-convites');
    if (badge) {
      const disponiveis = convites.filter(c => !c.usado).length;
      badge.innerText = disponiveis;
    }
    
    return true;
  }

  listarConvites() {
    const convites = JSON.parse(localStorage.getItem('mt_convites') || '[]');
    return convites;
  }

  abrirModalConvites() {
  const usuario = this.getUsuarioAtual();
  const cargo = String(usuario?.cargo || '').toLowerCase();
  const autorizado = cargo === 'super_admin' || cargo === 'admin' || usuario?.isSuperAdmin === true;

  if (!autorizado) {
    alert('❌ Acesso restrito!');
    return;
  }

  const convites = this.listarConvites();
  const disponiveis = convites.filter(c => !c.usado).length;

  const badge = document.getElementById('badge-convites');
  if (badge) badge.innerText = disponiveis;

  const lista = document.getElementById('lista-convites');
  if (!lista) {
    alert(`📋 Você tem ${disponiveis} código(s) disponível(is) e ${convites.length} no total.`);
    return;
  }

  if (convites.length === 0) {
    lista.innerHTML = `<p class="text-center text-gray-500 py-4 text-sm">Nenhum código gerado ainda.</p>`;
  } else {
    lista.innerHTML = convites.map(c => `
      <div class="flex justify-between items-center bg-gray-900 border ${c.usado ? 'border-gray-700/50 opacity-60' : 'border-emerald-800/50'} p-3 rounded-lg">
        <div>
          <p class="font-bold text-white font-mono">${c.codigo}</p>
          <p class="text-[10px] ${c.usado ? 'text-red-400' : 'text-emerald-400'}">
            ${c.usado ? '❌ Usado' : '✅ Disponível'}
          </p>
          <p class="text-[10px] text-gray-500">${new Date(c.criadoEm).toLocaleString('pt-BR')}</p>
        </div>
        ${!c.usado ? `<button onclick="navigator.clipboard.writeText('${c.codigo}');alert('Copiado!')" class="bg-blue-700 hover:bg-blue-600 px-2 py-1 rounded text-[10px] text-white">📋</button>` : ''}
      </div>
    `).join('');
  }

  const modal = document.getElementById('modal-convites');
  if (modal) modal.classList.remove('hidden');
  else alert(`📋 Convites: ${disponiveis} disponíveis / ${convites.length} total`);
}

  copiarCodigo(codigo) {
    navigator.clipboard?.writeText(codigo);
    alert(`✅ Código "${codigo}" copiado para sua área de transferência!`);
  }
}

// ==========================================
// INSTÂNCIA GLOBAL
// ==========================================

const tenantManager = new MultiTenantManager();
window.tenantManager = tenantManager;

// ==========================================
// FUNÇÕES GLOBAIS
// ==========================================

window.abrirPainelAdmin = () => tenantManager.abrirPainelAdmin();
window.fecharPainelAdmin = () => tenantManager.fecharPainelAdmin();
window.atualizarPainelAdmin = () => tenantManager.atualizarPainelAdmin();
window.excluirUsuario = (id) => tenantManager.excluirUsuario(id);
window.abrirModalNovoEstabelecimento = () => tenantManager.abrirModalNovoEstabelecimento();
window.salvarNovoEstabelecimento = (e) => tenantManager.salvarNovoEstabelecimento(e);
window.abrirModalNovoUsuario = () => tenantManager.abrirModalNovoUsuario();
window.salvarNovoUsuario = (e) => tenantManager.salvarNovoUsuario(e);
window.abrirModalPendentes = () => tenantManager.abrirModalPendentes();
window.aprovarCadastro = (index) => tenantManager.aprovarCadastro(index);
window.reprovarCadastro = (index) => tenantManager.reprovarCadastro(index);
window.confirmarAprovacao = (e, index) => tenantManager.confirmarAprovacao(e, index);

// FUNÇÕES DE CONVITE
window.gerarCodigoConvite = () => tenantManager.gerarCodigoConvite();
window.abrirModalConvites = () => tenantManager.abrirModalConvites();
window.copiarCodigo = (codigo) => tenantManager.copiarCodigo(codigo);
window.validarCodigoConvite = (codigo) => tenantManager.validarCodigoConvite(codigo);
window.listarConvites = () => tenantManager.listarConvites();

window.logoutMulti = () => {
  tenantManager.logout();
  document.getElementById('sistema-principal').classList.add('hidden');
  document.getElementById('tela-login').classList.remove('hidden');
  location.reload();
};

console.log('✅ Multi-Tenant carregado com sucesso!');
console.log(`🏢 ${tenantManager.estabelecimentos.length} estabelecimentos`);
console.log(`👤 ${tenantManager.usuarios.length} usuários`);
console.log('📌 Super Admin: super@admin.com / admin123');
console.log('🎟️ Sistema de convites disponível!');
