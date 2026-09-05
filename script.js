// ==========================================
// CARREGAR DADOS DO INDEXEDDB
// ==========================================

async function carregarDadosDoDB() {
  try {
    // Aguardar o banco ficar pronto
    if (!db.isReady) {
      await new Promise(resolve => {
        const checkReady = setInterval(() => {
          if (db.isReady) {
            clearInterval(checkReady);
            resolve();
          }
        }, 100);
      });
    }

    // Carregar produtos
    const produtosDB = await db.getAllProdutos();
    if (produtosDB && produtosDB.length > 0) {
      produtos = produtosDB;
    }

    // Carregar pedidos
    const pedidosDB = await db.getAllPedidos();
    if (pedidosDB && pedidosDB.length > 0) {
      pedidos = pedidosDB;
    }

    // Carregar comandas
    const comandasDB = await db.getAllComandas();
    if (comandasDB && comandasDB.length > 0) {
      comandas = comandasDB;
    }

    // Carregar movimentações
    const movDB = await db.getAllMovimentacoes();
    if (movDB && movDB.length > 0) {
      movimentacoesCaixa = movDB;
    }

    // Carregar configurações
    const configDB = await db.getConfiguracao('estabelecimento');
    if (configDB) {
      CONFIG_ESTABELECIMENTO = configDB.valor;
    }

    // Carregar último fechamento
    const fechamentos = await db.getAllFechamentos();
    if (fechamentos && fechamentos.length > 0) {
      ultimoFechamentoCego = fechamentos[fechamentos.length - 1];
    }

    console.log('✅ Dados carregados do IndexedDB');
    return true;
  } catch (error) {
    console.error('❌ Erro ao carregar dados:', error);
    return false;
  }
}

// Sobrescrever função salvarLocal para usar IndexedDB
async function salvarLocal() {
  try {
    // Salvar produtos
    for (const prod of produtos) {
      await db.saveProduto(prod);
    }
    
    // Salvar pedidos
    for (const ped of pedidos) {
      await db.savePedido(ped);
    }
    
    // Salvar comandas
    for (const com of comandas) {
      await db.saveComanda(com);
    }
    
    // Salvar movimentações
    for (const mov of movimentacoesCaixa) {
      await db.saveMovimentacao(mov);
    }
    
    // Salvar configurações
    await db.saveConfiguracao('estabelecimento', CONFIG_ESTABELECIMENTO);
    
    // Salvar último fechamento
    if (ultimoFechamentoCego) {
      await db.saveFechamento(ultimoFechamentoCego);
    }
    
    console.log('💾 Dados salvos no IndexedDB');
  } catch (error) {
    console.error('❌ Erro ao salvar dados:', error);
    // Fallback para LocalStorage
    localStorage.setItem('pdv_produtos', JSON.stringify(produtos));
    localStorage.setItem('pdv_pedidos', JSON.stringify(pedidos));
    localStorage.setItem('pdv_comandas', JSON.stringify(comandas));
    localStorage.setItem('pdv_movimentacoes', JSON.stringify(movimentacoesCaixa));
    localStorage.setItem('pdv_config_estabelecimento', JSON.stringify(CONFIG_ESTABELECIMENTO));
    if (ultimoFechamentoCego) {
      localStorage.setItem('pdv_ultimo_fechamento', JSON.stringify(ultimoFechamentoCego));
    }
  }
}

// ==========================================
// CONFIGURAÇÃO DE CAPACIDADE DO ESTABELECIMENTO
// ==========================================
let CONFIG_ESTABELECIMENTO = {
  totalMesas: 10,
  totalComandas: 30
};

// Carregar configurações salvas
function carregarConfiguracoes() {
  const saved = localStorage.getItem("pdv_config_estabelecimento");
  if (saved) {
    const config = JSON.parse(saved);
    CONFIG_ESTABELECIMENTO.totalMesas = config.totalMesas || 10;
    CONFIG_ESTABELECIMENTO.totalComandas = config.totalComandas || 30;
  }
}

// Salvar configurações
function salvarConfiguracoesLocal() {
  localStorage.setItem("pdv_config_estabelecimento", JSON.stringify(CONFIG_ESTABELECIMENTO));
}

// ==========================================
// USUÁRIOS E AUTENTICAÇÃO
// ==========================================
const usuarios = [
  { usuario: "caixa", senha: "123", nome: "Operador de Caixa", cargo: "caixa" },
  { usuario: "gerente", senha: "123", nome: "Carlos Gerente", cargo: "gerente" }
];

let usuarioLogado = null;

// ==========================================
// BASE DE DADOS
// ==========================================
let produtos = [
  { id: 1, nome: "Whisky Red Label 1L", categoria: "Bebidas", custo: 55.00, preco: 89.90, estoque: 10, imagem: "https://images.unsplash.com/photo-1527281400683-1aae777175f8?w=150&auto=format&fit=crop&q=60" },
  { id: 2, nome: "Whisky Jack Daniel's 1L", categoria: "Bebidas", custo: 100.00, preco: 149.90, estoque: 8, imagem: "https://images.unsplash.com/photo-1527281400683-1aae777175f8?w=150&auto=format&fit=crop&q=60" },
  { id: 3, nome: "Cerveja Heineken Long Neck 330ml", categoria: "Bebidas", custo: 4.50, preco: 8.50, estoque: 60, imagem: "https://images.unsplash.com/photo-1608270586620-248524c67de9?w=150&auto=format&fit=crop&q=60" },
  { id: 4, nome: "Red Bull Energy Drink 250ml", categoria: "Energéticos/Sucos", custo: 6.50, preco: 12.00, estoque: 48, imagem: "https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=150&auto=format&fit=crop&q=60" },
  { id: 5, nome: "Gelo de Coco Coco Leve 200ml", categoria: "Gelo/Acompanhamentos", custo: 1.50, preco: 4.00, estoque: 50, imagem: "https://images.unsplash.com/photo-1511018556340-d16986a1c194?w=150&auto=format&fit=crop&q=60" },
  { id: 6, nome: "Essência Zomo Mint", categoria: "Essências", custo: 6.00, preco: 12.00, estoque: 25, imagem: "https://images.unsplash.com/photo-1511018556340-d16986a1c194?w=150&auto=format&fit=crop&q=60" },
  { id: 7, nome: "Aluguel Narguilé Completo", categoria: "Essências", custo: 5.00, preco: 35.00, estoque: 8, imagem: "https://images.unsplash.com/photo-1511018556340-d16986a1c194?w=150&auto=format&fit=crop&q=60" }
];

let carrinho = [];
let comandas = [];
let pedidos = [];
let totalPedido = 0;
let categoriaAtual = "Todos";
let produtoEmEdicaoId = null;
let movimentacoesCaixa = [];
let tipoMovimentacaoAtual = null;
let ultimoFechamentoCego = null;
let periodoGerenciaAtual = 'todos';

// ==========================================
// CARREGAR DADOS DO LOCALSTORAGE
// ==========================================
function carregarLocal() {
  const p = localStorage.getItem("pdv_produtos");
  const ped = localStorage.getItem("pdv_pedidos");
  const com = localStorage.getItem("pdv_comandas");
  const mov = localStorage.getItem("pdv_movimentacoes");
  const fech = localStorage.getItem("pdv_ultimo_fechamento");

  if (p) produtos = JSON.parse(p);
  if (ped) pedidos = JSON.parse(ped);
  if (com) comandas = JSON.parse(com);
  if (mov) movimentacoesCaixa = JSON.parse(mov);
  if (fech) ultimoFechamentoCego = JSON.parse(fech);
  
  carregarConfiguracoes();
}

function salvarLocal() {
  localStorage.setItem("pdv_produtos", JSON.stringify(produtos));
  localStorage.setItem("pdv_pedidos", JSON.stringify(pedidos));
  localStorage.setItem("pdv_comandas", JSON.stringify(comandas));
  localStorage.setItem("pdv_movimentacoes", JSON.stringify(movimentacoesCaixa));
  if (ultimoFechamentoCego) {
    localStorage.setItem("pdv_ultimo_fechamento", JSON.stringify(ultimoFechamentoCego));
  }
}

// ==========================================
// CRONÔMETRO AUTOMÁTICO DE NARGUILÉ
// ==========================================
setInterval(() => {
  let mudou = false;
  comandas.forEach(c => {
    if (c.narguile && c.tempoRestante > 0) {
      c.tempoRestante--;
      mudou = true;
    }
  });
  if (mudou && !document.getElementById("aba-comandas").classList.contains("hidden")) {
    renderizarComandas();
  }
}, 1000);

// ==========================================
// LOGIN & NAVEGAÇÃO
// ==========================================
function realizarLogin(e) {
  e.preventDefault();
  const usuInput = document.getElementById("login-usuario").value.trim();
  const senhaInput = document.getElementById("login-senha").value.trim();

  const usuarioEncontrado = usuarios.find(u => u.usuario === usuInput && u.senha === senhaInput);

  if (!usuarioEncontrado) {
    alert("Usuário ou senha incorretos!");
    return;
  }

  usuarioLogado = usuarioEncontrado;
  document.getElementById("tela-login").classList.add("hidden");
  document.getElementById("sistema-principal").classList.remove("hidden");

  document.getElementById("nome-usuario-logado").innerText = usuarioLogado.nome;
  document.getElementById("cargo-usuario-logado").innerText = usuarioLogado.cargo;

  const btnGerencia = document.getElementById("btn-aba-gerencia");
  if (usuarioLogado.cargo === "gerente") {
    btnGerencia.classList.remove("hidden");
  } else {
    btnGerencia.classList.add("hidden");
  }

  renderizarProdutos();
  renderizarCarrinho();
  renderizarTabelaEstoque();
  renderizarHistoricoPedidos();
  renderizarDashboardGerencia();
  renderizarComandas();
  atualizarPainelDisponibilidade();
}

function logout() {
  usuarioLogado = null;
  document.getElementById("form-login").reset();
  document.getElementById("sistema-principal").classList.add("hidden");
  document.getElementById("tela-login").classList.remove("hidden");
}

function mudarAba(aba) {
  if (aba === "gerencia" && usuarioLogado.cargo !== "gerente") {
    alert("Acesso restrito apenas para Gerentes!");
    return;
  }

  document.getElementById("aba-pdv").classList.add("hidden");
  document.getElementById("aba-comandas").classList.add("hidden");
  document.getElementById("aba-estoque").classList.add("hidden");
  document.getElementById("aba-pedidos").classList.add("hidden");
  document.getElementById("aba-gerencia").classList.add("hidden");

  document.getElementById(`aba-${aba}`).classList.remove("hidden");

  if (aba === "gerencia") renderizarDashboardGerencia();
  if (aba === "comandas") renderizarComandas();
  if (aba === "pdv") atualizarPainelDisponibilidade();
}

// ==========================================
// PAINEL DE DISPONIBILIDADE EM TEMPO REAL
// ==========================================
function atualizarPainelDisponibilidade() {
  // Mesas
  const mesasOcupadas = comandas.filter(c => c.numMesa !== null && c.numMesa !== undefined).length;
  const mesasDisponiveis = Math.max(0, CONFIG_ESTABELECIMENTO.totalMesas - mesasOcupadas);

  const elMesas = document.getElementById("info-mesas-disponiveis");
  const badgeMesas = document.getElementById("badge-status-mesas");
  if (elMesas && badgeMesas) {
    elMesas.innerText = `${mesasDisponiveis} livres / ${CONFIG_ESTABELECIMENTO.totalMesas} total (${mesasOcupadas} em uso)`;
    if (mesasDisponiveis === 0) {
      badgeMesas.innerText = "LOTADO";
      badgeMesas.className = "text-[10px] font-black px-2 py-1 rounded bg-red-950 text-red-400 border border-red-800";
    } else {
      badgeMesas.innerText = "LIVRE";
      badgeMesas.className = "text-[10px] font-black px-2 py-1 rounded bg-emerald-950 text-emerald-400 border border-emerald-800";
    }
  }

  // Comandas
  const comandasAbertas = comandas.length;
  const comandasDisponiveis = Math.max(0, CONFIG_ESTABELECIMENTO.totalComandas - comandasAbertas);

  const elComandas = document.getElementById("info-comandas-disponiveis");
  const badgeComandas = document.getElementById("badge-status-comandas");
  if (elComandas && badgeComandas) {
    elComandas.innerText = `${comandasDisponiveis} fichas livres / ${CONFIG_ESTABELECIMENTO.totalComandas} total`;
    if (comandasDisponiveis === 0) {
      badgeComandas.innerText = "ESGOTADO";
      badgeComandas.className = "text-[10px] font-black px-2 py-1 rounded bg-red-950 text-red-400 border border-red-800";
    } else {
      badgeComandas.innerText = "LIVRE";
      badgeComandas.className = "text-[10px] font-black px-2 py-1 rounded bg-emerald-950 text-emerald-400 border border-emerald-800";
    }
  }

  // Narguilés
  const prodNarguile = produtos.find(p => p.nome.toLowerCase().includes("aluguel narguilé") || p.nome.toLowerCase().includes("narguilé"));
  const narguilesEmUso = comandas.filter(c => c.narguile).length;
  const narguilesTotalEstoque = prodNarguile ? prodNarguile.estoque : 0;
  const narguilesLivres = Math.max(0, narguilesTotalEstoque - narguilesEmUso);

  const elNarguiles = document.getElementById("info-narguiles-disponiveis");
  const badgeNarguiles = document.getElementById("badge-status-narguiles");
  if (elNarguiles && badgeNarguiles) {
    elNarguiles.innerText = `${narguilesLivres} livres / ${narguilesTotalEstoque} em acervo (${narguilesEmUso} rodando)`;
    if (narguilesLivres === 0) {
      badgeNarguiles.innerText = "SEM ACERVO";
      badgeNarguiles.className = "text-[10px] font-black px-2 py-1 rounded bg-red-950 text-red-400 border border-red-800";
    } else {
      badgeNarguiles.innerText = "DISPONÍVEL";
      badgeNarguiles.className = "text-[10px] font-black px-2 py-1 rounded bg-emerald-950 text-emerald-400 border border-emerald-800";
    }
  }
}

// ==========================================
// CONFIGURAÇÕES DO ESTABELECIMENTO
// ==========================================
function abrirModalConfiguracoes() {
  document.getElementById("config-total-mesas").value = CONFIG_ESTABELECIMENTO.totalMesas;
  document.getElementById("config-total-comandas").value = CONFIG_ESTABELECIMENTO.totalComandas;
  atualizarStatusConfiguracoes();
  document.getElementById("modal-configuracoes").classList.remove("hidden");
}

function fecharModalConfiguracoes() {
  document.getElementById("modal-configuracoes").classList.add("hidden");
}

function atualizarStatusConfiguracoes() {
  const mesasEmUso = comandas.filter(c => c.numMesa !== null && c.numMesa !== undefined).length;
  const comandasEmUso = comandas.length;
  document.getElementById("config-status-mesas").innerText = `${mesasEmUso} em uso / ${CONFIG_ESTABELECIMENTO.totalMesas} total`;
  document.getElementById("config-status-comandas").innerText = `${comandasEmUso} em uso / ${CONFIG_ESTABELECIMENTO.totalComandas} total`;
}

function salvarConfiguracoes(e) {
  e.preventDefault();
  
  const totalMesas = parseInt(document.getElementById("config-total-mesas").value) || 0;
  const totalComandas = parseInt(document.getElementById("config-total-comandas").value) || 0;
  
  if (totalMesas < 0 || totalComandas < 0) {
    alert("Os valores devem ser maiores ou iguais a zero!");
    return;
  }
  
  const mesasEmUso = comandas.filter(c => c.numMesa !== null && c.numMesa !== undefined).length;
  const comandasEmUso = comandas.length;
  
  if (totalMesas < mesasEmUso) {
    alert(`❌ Não é possível reduzir para ${totalMesas} mesas pois ${mesasEmUso} estão ocupadas!`);
    return;
  }
  
  if (totalComandas < comandasEmUso) {
    alert(`❌ Não é possível reduzir para ${totalComandas} comandas pois ${comandasEmUso} estão abertas!`);
    return;
  }
  
  CONFIG_ESTABELECIMENTO.totalMesas = totalMesas;
  CONFIG_ESTABELECIMENTO.totalComandas = totalComandas;
  salvarConfiguracoesLocal();
  
  atualizarPainelDisponibilidade();
  atualizarStatusConfiguracoes();
  
  alert(`✅ Configurações salvas!\n\n🪑 Mesas: ${totalMesas}\n📋 Comandas: ${totalComandas}`);
  fecharModalConfiguracoes();
}

// ==========================================
// COMANDAS E CONSUMO NO LOCAL
// ==========================================
function abrirModalNovaComanda() {
  document.getElementById("comanda-numero").value = "";
  document.getElementById("comanda-mesa").value = "";
  document.getElementById("comanda-cliente").value = "";
  document.getElementById("comanda-tem-narguile").checked = false;
  document.getElementById("box-tempo-carvao").classList.add("hidden");
  document.getElementById("modal-nova-comanda").classList.remove("hidden");
}

function fecharModalNovaComanda() {
  document.getElementById("modal-nova-comanda").classList.add("hidden");
}

function alternarOpcoesNarguile() {
  const marcado = document.getElementById("comanda-tem-narguile").checked;
  const boxTempo = document.getElementById("box-tempo-carvao");
  if (marcado) boxTempo.classList.remove("hidden");
  else boxTempo.classList.add("hidden");
}

function confirmarCriarComanda(e) {
  e.preventDefault();

  const numComandaRaw = document.getElementById("comanda-numero").value.trim();
  const numMesaRaw = document.getElementById("comanda-mesa").value.trim();
  const nomeCliente = document.getElementById("comanda-cliente").value.trim();
  const temNarguile = document.getElementById("comanda-tem-narguile").checked;
  const minutosCarvao = parseInt(document.getElementById("comanda-minutos-carvao").value) || 30;

  const numComanda = parseInt(numComandaRaw);
  const numMesa = numMesaRaw !== "" ? parseInt(numMesaRaw) : null;

  // Validações
  const comandaJaExiste = comandas.some(c => c.numComanda === numComanda);
  if (comandaJaExiste) {
    alert(`❌ Comanda ${numComanda} já está em uso!`);
    return;
  }

  if (comandas.length >= CONFIG_ESTABELECIMENTO.totalComandas) {
    alert(`❌ Limite máximo de ${CONFIG_ESTABELECIMENTO.totalComandas} comandas atingido!`);
    return;
  }

  if (numMesa !== null) {
    if (numMesa > CONFIG_ESTABELECIMENTO.totalMesas) {
      alert(`❌ Mesa ${numMesa} não existe! O estabelecimento possui apenas ${CONFIG_ESTABELECIMENTO.totalMesas} mesas.`);
      return;
    }
    const mesaJaExiste = comandas.some(c => c.numMesa === numMesa);
    if (mesaJaExiste) {
      alert(`❌ Mesa ${numMesa} já está ocupada!`);
      return;
    }
  }

  const strComanda = `Comanda ${numComanda < 10 ? '0' + numComanda : numComanda}`;
  const strMesa = numMesa !== null ? ` na Mesa ${numMesa < 10 ? '0' + numMesa : numMesa}` : '';
  const strCliente = nomeCliente !== "" ? ` (${nomeCliente})` : '';

  const novaComanda = {
    id: Date.now(),
    numComanda: numComanda,
    numMesa: numMesa,
    identificacao: `${strComanda}${strMesa}${strCliente}`,
    itens: carrinho.length > 0 ? [...carrinho] : [],
    narguile: temNarguile,
    tempoTotalMinutos: minutosCarvao,
    tempoRestante: minutosCarvao * 60
  };

  comandas.push(novaComanda);
  carrinho = [];
  renderizarCarrinho();
  renderizarComandas();
  atualizarPainelDisponibilidade();
  fecharModalNovaComanda();
  mudarAba("comandas");
}

function renderizarComandas() {
  const grid = document.getElementById("grid-comandas");
  const badge = document.getElementById("badge-comandas");
  if (badge) badge.innerText = comandas.length;
  if (!grid) return;

  grid.innerHTML = "";

  if (comandas.length === 0) {
    grid.innerHTML = `<div class="col-span-full text-center py-12 text-gray-500">Nenhuma comanda aberta no momento.</div>`;
    return;
  }

  comandas.forEach(c => {
    let totalComanda = c.itens.reduce((acc, i) => acc + (i.preco * i.qtd), 0);
    let minRestantes = Math.floor(c.tempoRestante / 60);
    let segRestantes = c.tempoRestante % 60;
    let tempoFormatado = `${minRestantes.toString().padStart(2, '0')}:${segRestantes.toString().padStart(2, '0')}`;
    let alerteCarvao = c.narguile && c.tempoRestante <= 300;

    grid.innerHTML += `
      <div class="bg-gray-800 border ${alerteCarvao ? 'border-red-500 animate-pulse' : 'border-amber-500/40'} p-5 rounded-xl shadow-xl space-y-3 flex flex-col justify-between">
        <div>
          <div class="flex justify-between items-start border-b border-gray-700 pb-2">
            <div>
              <h3 class="font-extrabold text-white text-base">${c.identificacao}</h3>
              <span class="text-[10px] text-amber-400 font-bold uppercase">Comanda Aberta</span>
            </div>
            <span class="text-xs font-mono font-bold text-emerald-400 bg-emerald-950 px-2 py-1 rounded border border-emerald-800">R$ ${totalComanda.toFixed(2)}</span>
          </div>

          ${c.narguile ? `
            <div class="my-2 p-2.5 rounded-lg ${alerteCarvao ? 'bg-red-950/80 border border-red-700' : 'bg-gray-900 border border-gray-700'} flex justify-between items-center">
              <div>
                <p class="text-[10px] uppercase font-bold text-amber-400">🔥 Troca de Carvão</p>
                <p class="text-xs ${alerteCarvao ? 'text-red-200 font-bold' : 'text-gray-300'}">${alerteCarvao ? 'TROCAR CARVÃO AGORA!' : 'Tempo da sessão'}</p>
              </div>
              <span class="font-mono text-base font-black ${alerteCarvao ? 'text-red-400' : 'text-amber-400'}">${tempoFormatado}</span>
            </div>
          ` : ''}

          <div class="mt-3 space-y-1 max-h-40 overflow-y-auto pr-1">
            <p class="text-[11px] font-bold text-gray-400 uppercase">Consumo:</p>
            ${c.itens.length === 0 ? '<p class="text-xs text-gray-500 italic">Nenhum item adicionado</p>' : ''}
            ${c.itens.map(i => `
              <div class="flex justify-between text-xs py-0.5 border-b border-gray-800">
                <span class="text-gray-300">${i.qtd}x ${i.nome}</span>
                <span class="font-mono text-gray-400">R$ ${(i.preco * i.qtd).toFixed(2)}</span>
              </div>
            `).join('')}
          </div>
        </div>

        <div class="space-y-1.5 pt-2 border-t border-gray-700">
          <button onclick="carregarComandaParaCarrinho(${c.id})" class="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-bold text-xs shadow transition-colors">
            📥 Puxar para o Caixa e Fechar
          </button>
          ${c.narguile ? `
            <button onclick="renovarCarvao(${c.id})" class="w-full py-1.5 bg-amber-700 hover:bg-amber-600 text-white rounded font-bold text-xs transition-colors">
              🔥 Renovar Tempo do Carvão (+30m)
            </button>
          ` : ''}
        </div>
      </div>
    `;
  });
}

function renovarCarvao(idComanda) {
  const c = comandas.find(x => x.id === idComanda);
  if (c) {
    c.tempoRestante += 30 * 60;
    renderizarComandas();
  }
}

function carregarComandaParaCarrinho(idComanda) {
  const c = comandas.find(x => x.id === idComanda);
  if (!c) return;

  if (carrinho.length > 0) {
    if (!confirm("Seu carrinho atual não está vazio. Deseja substituir o carrinho atual com os itens desta comanda?")) {
      return;
    }
  }

  carrinho = [...c.itens];
  comandas = comandas.filter(x => x.id !== idComanda);
  document.getElementById("tipo-consumo").value = "LOCAL";
  renderizarCarrinho();
  renderizarComandas();
  atualizarPainelDisponibilidade();
  mudarAba("pdv");
}

// ==========================================
// FRENTE DE CAIXA (PDV)
// ==========================================
function filtrarCategoria(categoria) {
  categoriaAtual = categoria;
  document.querySelectorAll(".btn-filtro").forEach(btn => {
    if (btn.getAttribute("data-categoria") === categoria) {
      btn.className = "btn-filtro bg-emerald-600 text-white border border-emerald-500 font-bold px-4 py-2 rounded-lg text-xs transition-all";
    } else {
      btn.className = "btn-filtro bg-gray-900 text-gray-300 hover:bg-gray-700 border border-gray-700 font-bold px-4 py-2 rounded-lg text-xs transition-all";
    }
  });
  renderizarProdutos();
}

function renderizarProdutos() {
  const grid = document.getElementById("grid-produtos");
  if (!grid) return;
  grid.innerHTML = "";

  const produtosFiltrados = categoriaAtual === "Todos" 
    ? produtos 
    : produtos.filter(p => p.categoria.toLowerCase() === categoriaAtual.toLowerCase());

  if (produtosFiltrados.length === 0) {
    grid.innerHTML = `<div class="col-span-full text-center py-8 text-gray-500 text-xs">Nenhum produto cadastrado nessa categoria.</div>`;
    return;
  }

  produtosFiltrados.forEach((prod) => {
    const ehBebida = prod.categoria === "Bebidas";
    grid.innerHTML += `
      <div class="bg-gray-900 border border-gray-700/80 p-3 rounded-lg flex flex-col justify-between hover:border-emerald-500/50 transition-all">
        <div class="w-full h-36 bg-gray-950 rounded mb-2 overflow-hidden flex items-center justify-center p-2 border border-gray-800">
          <img src="${prod.imagem}" alt="${prod.nome}" class="max-h-full max-w-full object-contain">
        </div>
        <div class="flex-1 flex flex-col justify-between">
          <div>
            <span class="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">${prod.categoria}</span>
            <h3 class="font-bold text-sm text-white leading-tight mb-1">${prod.nome}</h3>
            <p class="text-xs text-gray-400">Estoque: <span class="font-bold text-gray-200">${prod.estoque} un</span></p>
          </div>
          <p class="text-emerald-400 font-bold font-mono text-lg my-2">R$ ${prod.preco.toFixed(2).replace('.', ',')}</p>
        </div>
        
        <div class="space-y-1">
          <button 
            onclick="adicionarAoCarrinho(${prod.id}, false)" 
            ${prod.estoque <= 0 ? 'disabled' : ''}
            class="w-full py-1.5 rounded text-xs font-bold transition-colors ${prod.estoque > 0 ? 'bg-emerald-600 hover:bg-emerald-500 text-white' : 'bg-gray-700 text-gray-500 cursor-not-allowed'}"
          >
            ${prod.estoque > 0 ? (ehBebida ? 'Adicionar (Quente)' : 'Adicionar ao Carrinho') : 'Sem Estoque'}
          </button>
          ${ehBebida ? `
            <button 
              onclick="adicionarAoCarrinho(${prod.id}, true)" 
              ${prod.estoque <= 0 ? 'disabled' : ''}
              class="w-full py-1.5 rounded text-xs font-bold bg-cyan-700 hover:bg-cyan-600 text-white transition-colors flex items-center justify-center gap-1"
            >
              ❄️ Adicionar Gelada (+R$ 1,00)
            </button>
          ` : ''}
        </div>
      </div>
    `;
  });
}

// ==========================================
// MONTAR COMBO
// ==========================================
function abrirModalMontarCombo() {
  const selectGarrafa = document.getElementById("combo-garrafa");
  const selectEnergetico = document.getElementById("combo-energetico");
  const selectGelo = document.getElementById("combo-gelo");

  selectGarrafa.innerHTML = "";
  selectEnergetico.innerHTML = "";
  selectGelo.innerHTML = "";

  const garrafas = produtos.filter(p => p.categoria === "Bebidas");
  const energeticos = produtos.filter(p => p.categoria === "Energéticos/Sucos");
  const gelos = produtos.filter(p => p.categoria === "Gelo/Acompanhamentos");

  garrafas.forEach(g => { selectGarrafa.innerHTML += `<option value="${g.id}">${g.nome} (R$ ${g.preco.toFixed(2)})</option>`; });
  energeticos.forEach(e => { selectEnergetico.innerHTML += `<option value="${e.id}">${e.nome} (R$ ${e.preco.toFixed(2)})</option>`; });
  gelos.forEach(gl => { selectGelo.innerHTML += `<option value="${gl.id}">${gl.nome} (R$ ${gl.preco.toFixed(2)})</option>`; });

  document.getElementById("modal-montar-combo").classList.remove("hidden");
  atualizarResumoCombo();
}

function fecharModalMontarCombo() {
  document.getElementById("modal-montar-combo").classList.add("hidden");
}

function atualizarResumoCombo() {
  const idGarrafa = parseInt(document.getElementById("combo-garrafa").value);
  const idEnergetico = parseInt(document.getElementById("combo-energetico").value);
  const idGelo = parseInt(document.getElementById("combo-gelo").value);
  const qtdEnergetico = parseInt(document.getElementById("combo-qtd-energetico").value) || 0;
  const qtdGelo = parseInt(document.getElementById("combo-qtd-gelo").value) || 0;
  const desconto = parseFloat(document.getElementById("combo-desconto").value) || 0;

  const garrafa = produtos.find(p => p.id === idGarrafa);
  const energetico = produtos.find(p => p.id === idEnergetico);
  const gelo = produtos.find(p => p.id === idGelo);

  let somaSemDesconto = 0;
  if (garrafa) somaSemDesconto += garrafa.preco;
  if (energetico) somaSemDesconto += (energetico.preco * qtdEnergetico);
  if (gelo) somaSemDesconto += (gelo.preco * qtdGelo);

  const precoFinal = Math.max(0, somaSemDesconto - desconto);
  document.getElementById("combo-preco-final").innerText = `R$ ${precoFinal.toFixed(2).replace('.', ',')}`;
}

function confirmarAdicionarCombo() {
  const idGarrafa = parseInt(document.getElementById("combo-garrafa").value);
  const idEnergetico = parseInt(document.getElementById("combo-energetico").value);
  const idGelo = parseInt(document.getElementById("combo-gelo").value);
  const qtdEnergetico = parseInt(document.getElementById("combo-qtd-energetico").value) || 0;
  const qtdGelo = parseInt(document.getElementById("combo-qtd-gelo").value) || 0;
  const desconto = parseFloat(document.getElementById("combo-desconto").value) || 0;

  const garrafa = produtos.find(p => p.id === idGarrafa);
  const energetico = produtos.find(p => p.id === idEnergetico);
  const gelo = produtos.find(p => p.id === idGelo);

  if (!garrafa || garrafa.estoque < 1) {
    alert("Garrafa selecionada indisponível no estoque!");
    return;
  }

  let precoOriginal = garrafa.preco + (energetico ? energetico.preco * qtdEnergetico : 0) + (gelo ? gelo.preco * qtdGelo : 0);
  let precoFinalCombo = Math.max(0, precoOriginal - desconto);
  let custoTotalCombo = garrafa.custo + (energetico ? energetico.custo * qtdEnergetico : 0) + (gelo ? gelo.custo * qtdGelo : 0);

  const comboItem = {
    id: Date.now(),
    isCombo: true,
    nome: `Combo: ${garrafa.nome}`,
    detalhes: `1x ${garrafa.nome} + ${qtdEnergetico}x ${energetico ? energetico.nome : ''} + ${qtdGelo}x ${gelo ? gelo.nome : ''}`,
    componentes: [
      { id: garrafa.id, qtd: 1 },
      { id: energetico.id, qtd: qtdEnergetico },
      { id: gelo.id, qtd: qtdGelo }
    ],
    preco: precoFinalCombo,
    custo: custoTotalCombo,
    qtd: 1
  };

  carrinho.push(comboItem);
  renderizarCarrinho();
  fecharModalMontarCombo();
}

// ==========================================
// CARRINHO
// ==========================================
function adicionarAoCarrinho(idProduto, gelada = false) {
  const produto = produtos.find(p => p.id === idProduto);
  if (!produto || produto.estoque <= 0) {
    alert("Produto indisponível em estoque!");
    return;
  }

  const acrescimoGelada = gelada ? 1.00 : 0.00;
  const nomeItem = gelada ? `${produto.nome} (Gelada)` : produto.nome;

  const itemNoCarrinho = carrinho.find(item => item.idOriginal === idProduto && item.gelada === gelada && !item.isCombo);

  if (itemNoCarrinho) {
    if (itemNoCarrinho.qtd >= produto.estoque) {
      alert("Quantidade limite do estoque atingida!");
      return;
    }
    itemNoCarrinho.qtd++;
  } else {
    carrinho.push({
      id: Date.now(),
      idOriginal: produto.id,
      nome: nomeItem,
      categoria: produto.categoria,
      custo: produto.custo,
      preco: produto.preco + acrescimoGelada,
      qtd: 1,
      gelada: gelada,
      isCombo: false
    });
  }

  renderizarCarrinho();
}

function alterarQuantidadeCarrinho(idItem, delta) {
  const item = carrinho.find(p => p.id === idItem);
  if (item) {
    if (!item.isCombo) {
      const prodOriginal = produtos.find(p => p.id === item.idOriginal);
      if (delta > 0 && item.qtd >= prodOriginal.estoque) {
        alert("Quantidade máxima em estoque atingida!");
        return;
      }
    }
    item.qtd += delta;
    if (item.qtd <= 0) {
      removerDoCarrinho(idItem);
      return;
    }
  }
  renderizarCarrinho();
}

function removerDoCarrinho(idItem) {
  carrinho = carrinho.filter(item => item.id !== idItem);
  renderizarCarrinho();
}

function renderizarCarrinho() {
  const lista = document.getElementById("lista-carrinho");
  if (!lista) return;
  lista.innerHTML = "";
  totalPedido = 0;

  if (carrinho.length === 0) {
    lista.innerHTML = `<p class="text-xs text-gray-500 text-center py-4">Nenhum item no carrinho.</p>`;
  } else {
    carrinho.forEach((item) => {
      const subtotal = item.preco * item.qtd;
      totalPedido += subtotal;

      lista.innerHTML += `
        <div class="bg-gray-900 p-2.5 rounded-lg border ${item.isCombo ? 'border-amber-500/40 bg-amber-950/10' : 'border-gray-700/50'} text-xs space-y-1">
          <div class="flex justify-between items-start">
            <div>
              <p class="font-bold text-white flex items-center gap-1">
                ${item.isCombo ? '⚡ ' : ''}${item.nome}
              </p>
              ${item.isCombo ? `<p class="text-[10px] text-amber-400 font-semibold leading-tight">${item.detalhes}</p>` : ''}
              <p class="text-gray-400 text-[11px] mt-0.5">R$ ${item.preco.toFixed(2)} x ${item.qtd} = <strong class="text-emerald-400">R$ ${subtotal.toFixed(2)}</strong></p>
            </div>
            <div class="flex items-center gap-1">
              <button onclick="alterarQuantidadeCarrinho(${item.id}, -1)" class="px-2 py-0.5 bg-gray-800 border border-gray-700 text-white rounded font-bold">-</button>
              <span class="px-1 text-white font-mono">${item.qtd}</span>
              <button onclick="alterarQuantidadeCarrinho(${item.id}, 1)" class="px-2 py-0.5 bg-gray-800 border border-gray-700 text-white rounded font-bold">+</button>
              <button onclick="removerDoCarrinho(${item.id})" class="text-red-400 hover:text-red-300 font-bold ml-1">X</button>
            </div>
          </div>
        </div>
      `;
    });
  }

  document.getElementById("total-valor").innerText = `R$ ${totalPedido.toFixed(2).replace('.', ',')}`;
  calcularTroco();
}

function calcularTroco() {
  const formaPagamento = document.getElementById("forma-pagamento").value;
  const statusPagamento = document.getElementById("status-pagamento").value;
  const inputRecebido = document.getElementById("valor-recebido");
  const spanTroco = document.getElementById("valor-troco");

  if (statusPagamento === "PENDENTE" || formaPagamento !== "DINHEIRO") {
    inputRecebido.value = "";
    inputRecebido.disabled = true;
    spanTroco.innerText = "R$ 0,00";
    spanTroco.className = "text-base font-extrabold font-mono text-gray-500";
    return;
  }

  inputRecebido.disabled = false;
  const valorRecebido = parseFloat(inputRecebido.value) || 0;
  const troco = valorRecebido - totalPedido;

  if (valorRecebido === 0 && totalPedido === 0) {
    spanTroco.innerText = "R$ 0,00";
    spanTroco.className = "text-base font-extrabold font-mono text-emerald-400";
  } else if (troco >= 0) {
    spanTroco.innerText = `R$ ${troco.toFixed(2).replace('.', ',')}`;
    spanTroco.className = "text-base font-extrabold font-mono text-emerald-400";
  } else {
    spanTroco.innerText = "Valor Insuficiente";
    spanTroco.className = "text-xs font-bold text-red-400";
  }
}

function alternarCamposPagamento() {
  const status = document.getElementById("status-pagamento").value;
  const boxForma = document.getElementById("box-forma-pagamento");
  const boxTroco = document.getElementById("box-troco");

  if (status === "PENDENTE") {
    boxForma.style.display = "none";
    boxTroco.style.display = "none";
  } else {
    boxForma.style.display = "block";
    boxTroco.style.display = "block";
  }
  calcularTroco();
}

function concluirPedido() {
  if (carrinho.length === 0) {
    alert("Adicione ao menos um produto no carrinho!");
    return;
  }

  const tipoConsumo = document.getElementById("tipo-consumo").value;
  const status = document.getElementById("status-pagamento").value;
  const forma = status === "PENDENTE" ? "FIADO / A PAGAR" : document.getElementById("forma-pagamento").value;
  const valorRecebido = parseFloat(document.getElementById("valor-recebido").value) || 0;
  const trocoCalculado = forma === "DINHEIRO" ? Math.max(0, valorRecebido - totalPedido) : 0;

  if (status === "PAGO" && forma === "DINHEIRO" && valorRecebido < totalPedido) {
    alert("O valor recebido em dinheiro é menor que o total!");
    return;
  }

  const novoPedido = {
    id: Date.now(),
    data: new Date().toLocaleString('pt-BR'),
    operador: usuarioLogado ? usuarioLogado.nome : "Caixa",
    tipoConsumo: tipoConsumo,
    itens: [...carrinho],
    total: totalPedido,
    statusPagamento: status,
    formaPagamento: forma,
    valorRecebido: forma === "DINHEIRO" ? valorRecebido : totalPedido,
    troco: trocoCalculado
  };

  pedidos.unshift(novoPedido);

  // Baixa no estoque
  carrinho.forEach(itemCarrinho => {
    if (itemCarrinho.isCombo) {
      itemCarrinho.componentes.forEach(comp => {
        const prod = produtos.find(p => p.id === comp.id);
        if (prod) prod.estoque -= (comp.qtd * itemCarrinho.qtd);
      });
    } else {
      const prodOriginal = produtos.find(p => p.id === itemCarrinho.idOriginal);
      if (prodOriginal) {
        prodOriginal.estoque -= itemCarrinho.qtd;
      }
    }
  });

  alert("Pedido efetuado com sucesso!");

  carrinho = [];
  document.getElementById("valor-recebido").value = "";
  document.getElementById("tipo-consumo").value = "VIAGEM";

  renderizarProdutos();
  renderizarCarrinho();
  renderizarTabelaEstoque();
  renderizarHistoricoPedidos();
  renderizarDashboardGerencia();
  atualizarPainelDisponibilidade();
  salvarLocal();
}

// ==========================================
// ESTOQUE
// ==========================================
function renderizarTabelaEstoque() {
  const tabela = document.getElementById("tabela-estoque");
  if (!tabela) return;
  tabela.innerHTML = "";

  produtos.forEach(p => {
    tabela.innerHTML += `
      <tr class="border-b border-gray-700/50 hover:bg-gray-800/50">
        <td class="p-3 flex items-center gap-2">
          <img src="${p.imagem}" class="w-8 h-8 object-cover rounded bg-gray-900">
          <span class="font-bold text-white">${p.nome}</span>
        </td>
        <td class="p-3 text-xs text-emerald-400 font-semibold">${p.categoria}</td>
        <td class="p-3 font-mono text-gray-400">R$ ${p.custo.toFixed(2)}</td>
        <td class="p-3 font-mono font-bold text-white">R$ ${p.preco.toFixed(2)}</td>
        <td class="p-3 font-mono ${p.estoque < 5 ? 'text-red-400 font-bold' : 'text-gray-300'}">${p.estoque} un</td>
        <td class="p-3 text-right space-x-1">
          <button onclick="abrirModalProduto(${p.id})" class="bg-emerald-700 hover:bg-emerald-600 px-2 py-1 rounded text-xs text-white font-bold">Editar</button>
          <button onclick="excluirProduto(${p.id})" class="bg-red-700 hover:bg-red-600 px-2 py-1 rounded text-xs text-white font-bold">Excluir</button>
        </td>
      </tr>
    `;
  });
}

function abrirModalProduto(id = null) {
  const modal = document.getElementById("modal-produto");
  const titulo = document.getElementById("modal-titulo");

  if (id) {
    produtoEmEdicaoId = id;
    const prod = produtos.find(p => p.id === id);
    if (prod) {
      titulo.innerText = "Editar Produto";
      document.getElementById("novo-nome").value = prod.nome;
      document.getElementById("nova-categoria").value = prod.categoria;
      document.getElementById("novo-custo").value = prod.custo;
      document.getElementById("novo-preco").value = prod.preco;
      document.getElementById("novo-estoque").value = prod.estoque;
      document.getElementById("nova-imagem").value = prod.imagem;
    }
  } else {
    produtoEmEdicaoId = null;
    titulo.innerText = "Novo Produto";
    document.getElementById("form-novo-produto").reset();
    document.getElementById("nova-imagem").value = "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=150&auto=format&fit=crop&q=60";
  }

  modal.classList.remove("hidden");
}

function fecharModalProduto() {
  document.getElementById("modal-produto").classList.add("hidden");
  document.getElementById("form-novo-produto").reset();
  produtoEmEdicaoId = null;
}

function cadastrarProduto(e) {
  e.preventDefault();

  const nomeInput = document.getElementById("novo-nome").value.trim();
  const categoriaInput = document.getElementById("nova-categoria").value;
  const custoInput = parseFloat(document.getElementById("novo-custo").value) || 0;
  const precoInput = parseFloat(document.getElementById("novo-preco").value) || 0;
  const estoqueInput = parseInt(document.getElementById("novo-estoque").value) || 0;
  const imagemInput = document.getElementById("nova-imagem").value.trim();

  if (!nomeInput) {
    alert("O nome do produto é obrigatório!");
    return;
  }

  const imagem = imagemInput !== "" 
    ? imagemInput 
    : "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=150&auto=format&fit=crop&q=60";

  if (produtoEmEdicaoId) {
    const index = produtos.findIndex(p => p.id === produtoEmEdicaoId);
    if (index !== -1) {
      produtos[index] = {
        ...produtos[index],
        nome: nomeInput,
        categoria: categoriaInput,
        custo: custoInput,
        preco: precoInput,
        estoque: estoqueInput,
        imagem: imagem
      };
    }
  } else {
    produtos.push({
      id: Date.now(),
      nome: nomeInput,
      categoria: categoriaInput,
      custo: custoInput,
      preco: precoInput,
      estoque: estoqueInput,
      imagem: imagem
    });
  }

  renderizarProdutos();
  renderizarTabelaEstoque();
  renderizarDashboardGerencia();
  atualizarPainelDisponibilidade();
  fecharModalProduto();
  salvarLocal();
}

function excluirProduto(id) {
  const prod = produtos.find(p => p.id === id);
  if (confirm(`Tem certeza que deseja excluir "${prod.nome}"?`)) {
    produtos = produtos.filter(p => p.id !== id);
    renderizarProdutos();
    renderizarTabelaEstoque();
    renderizarDashboardGerencia();
    atualizarPainelDisponibilidade();
    salvarLocal();
  }
}

// ==========================================
// DASHBOARD DE GERÊNCIA
// ==========================================
function pedidoPertenceAoPeriodo(dataStr, periodo) {
  if (periodo === 'todos') return true;

  const partes = dataStr.split(', ');
  const dataPartes = partes[0].split('/');
  const dataPedido = new Date(dataPartes[2], dataPartes[1] - 1, dataPartes[0]);
  const hoje = new Date();

  dataPedido.setHours(0,0,0,0);
  const dataHoje = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());

  if (periodo === 'hoje') {
    return dataPedido.getTime() === dataHoje.getTime();
  }
  if (periodo === 'semana') {
    const umDia = 24 * 60 * 60 * 1000;
    const diffDias = Math.round((dataHoje - dataPedido) / umDia);
    return diffDias >= 0 && diffDias <= 7;
  }
  if (periodo === 'mes') {
    return dataPedido.getMonth() === hoje.getMonth() && dataPedido.getFullYear() === hoje.getFullYear();
  }
  if (periodo === 'ano') {
    return dataPedido.getFullYear() === hoje.getFullYear();
  }
  return true;
}

function renderizarDashboardGerencia() {
  let faturamentoTotal = 0;
  let lucroTotal = 0;
  let quantidadeItensVendidos = 0;

  const pedidosFiltrados = pedidos.filter(p => pedidoPertenceAoPeriodo(p.data, periodoGerenciaAtual));

  pedidosFiltrados.forEach(pedido => {
    faturamentoTotal += pedido.total;
    if (pedido.itens) {
      pedido.itens.forEach(item => {
        quantidadeItensVendidos += item.qtd;
        const custoOriginal = item.custo || 0;
        const lucroItem = (item.preco - custoOriginal) * item.qtd;
        lucroTotal += lucroItem;
      });
    }
  });

  const valorEstoque = produtos.reduce((acc, p) => acc + ((p.custo || 0) * p.estoque), 0);

  document.getElementById("metrica-faturamento").innerText = `R$ ${faturamentoTotal.toFixed(2).replace('.', ',')}`;
  document.getElementById("metrica-lucro").innerText = `R$ ${lucroTotal.toFixed(2).replace('.', ',')}`;
  document.getElementById("metrica-itens-vendidos").innerText = `${quantidadeItensVendidos} un`;
  document.getElementById("metrica-valor-estoque").innerText = `R$ ${valorEstoque.toFixed(2).replace('.', ',')}`;

  renderizarAuditoriaCaixa();

  const containerCritico = document.getElementById("lista-estoque-critico");
  if (!containerCritico) return;
  containerCritico.innerHTML = "";

  const itensCriticos = produtos.filter(p => p.estoque < 5);

  if (itensCriticos.length === 0) {
    containerCritico.innerHTML = `<p class="text-xs text-gray-500 col-span-full">Nenhum produto em nível crítico de estoque.</p>`;
  } else {
    itensCriticos.forEach(p => {
      containerCritico.innerHTML += `
        <div class="bg-gray-900 border border-red-900/50 p-3 rounded-lg flex items-center justify-between">
          <div>
            <p class="text-xs font-bold text-white">${p.nome}</p>
            <p class="text-[10px] text-gray-400">${p.categoria}</p>
          </div>
          <span class="text-xs font-bold bg-red-950 text-red-400 px-2 py-1 rounded border border-red-800">${p.estoque} un</span>
        </div>
      `;
    });
  }
}

function filtrarPeriodoGerencia(periodo) {
  periodoGerenciaAtual = periodo;

  document.querySelectorAll(".btn-periodo").forEach(btn => {
    btn.className = "btn-periodo px-3 py-1.5 rounded text-xs font-bold text-gray-300 hover:text-white";
  });

  const btnAtivo = document.getElementById(`btn-periodo-${periodo}`);
  if (btnAtivo) {
    btnAtivo.className = "btn-periodo px-3 py-1.5 rounded text-xs font-bold bg-amber-600 text-white";
  }

  renderizarDashboardGerencia();
}

function aplicarFiltroDataPersonalizada() {
  renderizarDashboardGerencia();
}

function limparFiltroData() {
  document.getElementById("filtro-data-inicio").value = "";
  document.getElementById("filtro-data-fim").value = "";
  filtrarPeriodoGerencia('todos');
}

// ==========================================
// AUDITORIA DE CAIXA
// ==========================================
function renderizarAuditoriaCaixa() {
  const containerAuditoria = document.getElementById("painel-auditoria-caixa");
  const containerMovimentacoes = document.getElementById("lista-movimentacoes-gerencia");
  if (!containerAuditoria) return;

  const vendasDinheiro = pedidos
    .filter(p => p.statusPagamento === "PAGO" && p.formaPagamento === "DINHEIRO")
    .reduce((acc, p) => acc + p.total, 0);

  const totalSuprimentos = movimentacoesCaixa
    .filter(m => m.tipo === "SUPRIMENTO")
    .reduce((acc, m) => acc + m.valor, 0);

  const totalSangrias = movimentacoesCaixa
    .filter(m => m.tipo === "SANGRIA")
    .reduce((acc, m) => acc + m.valor, 0);

  const saldoCalculadoSistema = vendasDinheiro + totalSuprimentos - totalSangrias;

  if (!ultimoFechamentoCego) {
    containerAuditoria.innerHTML = `
      <div class="text-center py-4 space-y-2">
        <span class="text-amber-400 font-bold text-xs">⏳ Aguardando Fechamento do Caixa pelo Operador</span>
        <div class="grid grid-cols-3 gap-2 text-left pt-2 border-t border-gray-800 text-xs">
          <div><p class="text-gray-400">Vendas Em Dinheiro:</p><p class="font-bold font-mono text-white">R$ ${vendasDinheiro.toFixed(2)}</p></div>
          <div><p class="text-blue-400">(+) Suprimentos:</p><p class="font-bold font-mono text-blue-400">R$ ${totalSuprimentos.toFixed(2)}</p></div>
          <div><p class="text-red-400">(-) Sangrias:</p><p class="font-bold font-mono text-red-400">R$ ${totalSangrias.toFixed(2)}</p></div>
        </div>
        <div class="pt-2 text-right">
          <span class="text-xs text-gray-400">Esperado Gaveteiro: </span>
          <strong class="font-mono text-emerald-400 text-sm">R$ ${saldoCalculadoSistema.toFixed(2)}</strong>
        </div>
      </div>
    `;
  } else {
    const contado = ultimoFechamentoCego.valorContado;
    const diferenca = contado - saldoCalculadoSistema;
    
    let statusBadge = "";
    if (diferenca === 0) {
      statusBadge = `<span class="bg-emerald-950 text-emerald-400 border border-emerald-700 px-3 py-1 rounded text-xs font-black">✅ CAIXA BATENDO PERFEITAMENTE</span>`;
    } else if (diferenca > 0) {
      statusBadge = `<span class="bg-amber-950 text-amber-400 border border-amber-700 px-3 py-1 rounded text-xs font-black">⚠️ SOBRANDO R$ ${diferenca.toFixed(2)}</span>`;
    } else {
      statusBadge = `<span class="bg-red-950 text-red-400 border border-red-700 px-3 py-1 rounded text-xs font-black">🚨 FALTANDO R$ ${Math.abs(diferenca).toFixed(2)}</span>`;
    }

    containerAuditoria.innerHTML = `
      <div class="space-y-3">
        <div class="flex justify-between items-center border-b border-gray-800 pb-2">
          <div>
            <p class="text-xs font-bold text-white">Último Fechamento Enviado por: <span class="text-amber-400">${ultimoFechamentoCego.operador}</span></p>
            <p class="text-[10px] text-gray-400">${ultimoFechamentoCego.data}</p>
          </div>
          ${statusBadge}
        </div>

        <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          <div class="bg-gray-950 p-2 rounded border border-gray-800">
            <span class="text-gray-400 text-[10px]">Contado (Caixa Cego):</span>
            <p class="font-bold font-mono text-white text-sm">R$ ${contado.toFixed(2)}</p>
          </div>
          <div class="bg-gray-950 p-2 rounded border border-gray-800">
            <span class="text-gray-400 text-[10px]">Calculado pelo Sistema:</span>
            <p class="font-bold font-mono text-emerald-400 text-sm">R$ ${saldoCalculadoSistema.toFixed(2)}</p>
          </div>
          <div class="bg-gray-950 p-2 rounded border border-gray-800">
            <span class="text-blue-400 text-[10px]">Total Suprimentos:</span>
            <p class="font-bold font-mono text-blue-400 text-sm">R$ ${totalSuprimentos.toFixed(2)}</p>
          </div>
          <div class="bg-gray-950 p-2 rounded border border-gray-800">
            <span class="text-red-400 text-[10px]">Total Sangrias:</span>
            <p class="font-bold font-mono text-red-400 text-sm">R$ ${totalSangrias.toFixed(2)}</p>
          </div>
        </div>
      </div>
    `;
  }

  if (containerMovimentacoes) {
    containerMovimentacoes.innerHTML = "";
    if (movimentacoesCaixa.length === 0) {
      containerMovimentacoes.innerHTML = `<p class="text-xs text-gray-500 italic">Nenhuma sangria ou suprimento registrado neste turno.</p>`;
    } else {
      movimentacoesCaixa.forEach(m => {
        const ehSangria = m.tipo === "SANGRIA";
        containerMovimentacoes.innerHTML += `
          <div class="flex justify-between items-center bg-gray-900 border ${ehSangria ? 'border-red-900/40' : 'border-blue-900/40'} p-2 rounded text-xs">
            <div>
              <span class="font-bold ${ehSangria ? 'text-red-400' : 'text-blue-400'}">${ehSangria ? '🔻 SANGRIA' : '🔹 SUPRIMENTO'}</span>
              <span class="text-gray-300 ml-2">${m.motivo}</span>
              <p class="text-[10px] text-gray-500">${m.data} por ${m.operador}</p>
            </div>
            <span class="font-mono font-bold ${ehSangria ? 'text-red-400' : 'text-blue-400'}">R$ ${m.valor.toFixed(2)}</span>
          </div>
        `;
      });
    }
  }
}

// ==========================================
// HISTÓRICO DE PEDIDOS
// ==========================================
function renderizarHistoricoPedidos() {
  const container = document.getElementById("lista-pedidos-historico");
  if (!container) return;
  container.innerHTML = "";

  if (pedidos.length === 0) {
    container.innerHTML = `<p class="text-xs text-gray-500 text-center py-6">Nenhum pedido registrado.</p>`;
    return;
  }

  pedidos.forEach(p => {
    let itensHtml = p.itens.map(i => `<span class="bg-gray-900 px-2 py-1 rounded text-[11px]">${i.qtd}x ${i.nome}</span>`).join(" ");
    
    const ehLocal = p.tipoConsumo === "LOCAL";
    const badgeConsumo = ehLocal
      ? `<span class="bg-blue-950 text-blue-400 border border-blue-800 font-extrabold px-2 py-0.5 rounded text-[10px] uppercase">🍹 Consumo no Local</span>`
      : `<span class="bg-purple-950 text-purple-400 border border-purple-800 font-extrabold px-2 py-0.5 rounded text-[10px] uppercase">🛍️ Para Viagem</span>`;

    container.innerHTML += `
      <div class="bg-gray-900 border border-gray-700 p-4 rounded-lg space-y-2">
        <div class="flex flex-wrap justify-between items-center text-xs border-b border-gray-800 pb-2 gap-2">
          <div class="flex items-center gap-2">
            <span class="font-mono text-gray-400">#${p.id.toString().slice(-6)} - ${p.data} (Op: ${p.operador})</span>
            ${badgeConsumo}
          </div>
          <span class="font-bold px-2 py-0.5 rounded ${p.statusPagamento === 'PAGO' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-red-950 text-red-400 border border-red-800'}">${p.statusPagamento}</span>
        </div>
        <div class="flex flex-wrap gap-1">${itensHtml}</div>
        <div class="flex justify-between items-center pt-2 text-xs border-t border-gray-800 font-mono">
          <span class="text-gray-400">Forma: ${p.formaPagamento} ${p.troco > 0 ? `(Troco: R$ ${p.troco.toFixed(2)})` : ''}</span>
          <span class="text-emerald-400 font-bold text-sm">Total: R$ ${p.total.toFixed(2)}</span>
        </div>
      </div>
    `;
  });
}

// ==========================================
// SANGRIA / SUPRIMENTO
// ==========================================
function abrirModalMovimentacao(tipo) {
  tipoMovimentacaoAtual = tipo;
  const titulo = document.getElementById("titulo-modal-movimentacao");
  titulo.innerText = tipo === "SANGRIA" ? "🔻 Registrar Sangria (Retirada)" : "🔹 Registrar Suprimento (Entrada de Troco)";
  document.getElementById("movimentacao-valor").value = "";
  document.getElementById("movimentacao-motivo").value = "";
  document.getElementById("modal-movimentacao").classList.remove("hidden");
}

function fecharModalMovimentacao() {
  document.getElementById("modal-movimentacao").classList.add("hidden");
}

function confirmarMovimentacaoCaixa(e) {
  e.preventDefault();
  const valor = parseFloat(document.getElementById("movimentacao-valor").value) || 0;
  const motivo = document.getElementById("movimentacao-motivo").value.trim();

  if (valor <= 0) {
    alert("Informe um valor válido!");
    return;
  }

  const movimentacao = {
    id: Date.now(),
    data: new Date().toLocaleString('pt-BR'),
    tipo: tipoMovimentacaoAtual,
    valor: valor,
    motivo: motivo,
    operador: usuarioLogado ? usuarioLogado.nome : "Caixa"
  };

  movimentacoesCaixa.push(movimentacao);
  salvarLocal();
  alert(`${tipoMovimentacaoAtual} de R$ ${valor.toFixed(2)} registrada com sucesso!`);
  fecharModalMovimentacao();
}

// ==========================================
// FECHAMENTO CEGO
// ==========================================
function abrirModalFechamentoCego() {
  document.getElementById("fechamento-dinheiro-contado").value = "";
  document.getElementById("modal-fechamento-cego").classList.remove("hidden");
}

function fecharModalFechamentoCego() {
  document.getElementById("modal-fechamento-cego").classList.add("hidden");
}

function processarFechamentoCego(e) {
  e.preventDefault();
  const contado = parseFloat(document.getElementById("fechamento-dinheiro-contado").value) || 0;

  ultimoFechamentoCego = {
    data: new Date().toLocaleString('pt-BR'),
    operador: usuarioLogado ? usuarioLogado.nome : 'Caixa',
    valorContado: contado
  };

  salvarLocal();
  alert("Fechamento enviado ao gerente com sucesso!");
  fecharModalFechamentoCego();
  renderizarDashboardGerencia();
}

// ==========================================
// ATALHOS DE TECLADO
// ==========================================
document.addEventListener("keydown", (e) => {
  const tag = document.activeElement.tagName;
  const emModal = document.querySelector(".fixed:not(.hidden)");

  if (e.key === "F2") {
    e.preventDefault();
    const buscaInput = document.getElementById("busca-produto");
    if (buscaInput) buscaInput.focus();
  }

  if (e.key === "F4") {
    e.preventDefault();
    const selectForma = document.getElementById("forma-pagamento");
    if (selectForma) {
      selectForma.value = "PIX";
      calcularTroco();
    }
  }

  if (e.key === "F6") {
    e.preventDefault();
    abrirModalMovimentacao('SANGRIA');
  }

  if (e.key === "F7") {
    e.preventDefault();
    abrirModalMovimentacao('SUPRIMENTO');
  }

  if (e.key === "F8") {
    e.preventDefault();
    abrirModalFechamentoCego();
  }

  if (e.code === "Space" && tag !== "INPUT" && tag !== "TEXTAREA" && !emModal) {
    e.preventDefault();
    concluirPedido();
  }
});

// ==========================================
// EVENTOS DE CONEXÃO
// ==========================================
window.addEventListener("online", () => {
  console.log("Conexão reestabelecida. Dados em sincronia local.");
});
window.addEventListener("offline", () => {
  alert("⚠️ Você está offline. O sistema continuará salvando as vendas localmente!");
});

// ==========================================
// INICIALIZAÇÃO
// ==========================================
carregarLocal();

window.abrirModal = abrirModalProduto;
window.fecharModal = fecharModalProduto;

// ==========================================
// LOGIN MULTI-TENANT (VERSÃO CORRIGIDA)
// ==========================================

async function realizarLoginMulti(e) {
  e.preventDefault();
  
  const email = document.getElementById("login-email").value.trim();
  const senha = document.getElementById("login-senha-multi").value.trim();

  if (!email || !senha) {
    alert("Preencha todos os campos!");
    return;
  }

  const resultado = tenantManager.login(email, senha);

  if (!resultado.success) {
    alert(resultado.message);
    return;
  }

  const { usuario, estabelecimento, isSuperAdmin } = resultado;

  usuarioLogado = {
    usuario: usuario.email.split('@')[0],
    senha: usuario.senha,
    nome: usuario.nome,
    cargo: usuario.cargo,
    estabelecimentoId: estabelecimento.id,
    estabelecimentoNome: estabelecimento.nome,
    isSuperAdmin: isSuperAdmin || false
  };

  CONFIG_ESTABELECIMENTO = estabelecimento.configuracao;

  document.getElementById("tela-login").classList.add("hidden");
  document.getElementById("sistema-principal").classList.remove("hidden");

  document.getElementById("nome-usuario-logado").innerText = usuarioLogado.nome;
  document.getElementById("cargo-usuario-logado").innerText = usuarioLogado.cargo;
  
  const elEstabelecimento = document.getElementById("estabelecimento-nome");
  if (elEstabelecimento) {
    if (isSuperAdmin) {
      elEstabelecimento.innerText = "👑 SUPER ADMIN - Controle Total";
      elEstabelecimento.className = "font-bold text-purple-400";
    } else {
      elEstabelecimento.innerText = estabelecimento.nome;
      elEstabelecimento.className = "font-bold text-amber-400";
    }
  }

  const btnGerencia = document.getElementById("btn-aba-gerencia");
  if (usuarioLogado.cargo === "gerente" || usuarioLogado.cargo === "admin" || isSuperAdmin) {
    btnGerencia.classList.remove("hidden");
  } else {
    btnGerencia.classList.add("hidden");
  }

  await carregarDadosDoEstabelecimento();

  renderizarProdutos();
  renderizarCarrinho();
  renderizarTabelaEstoque();
  renderizarHistoricoPedidos();
  renderizarDashboardGerencia();
  renderizarComandas();
  atualizarPainelDisponibilidade();
}

// ==========================================
// CARREGAR DADOS DO ESTABELECIMENTO
// ==========================================

async function carregarDadosDoEstabelecimento() {
  try {
    const prefixo = tenantManager.getPrefixoDB();
    console.log(`📂 Carregando dados do estabelecimento: ${prefixo}`);
    
    const produtosDB = await db.getAllProdutos();
    if (produtosDB && produtosDB.length > 0) {
      produtos = produtosDB;
    }
    
    const pedidosDB = await db.getAllPedidos();
    if (pedidosDB && pedidosDB.length > 0) {
      pedidos = pedidosDB;
    }
    
    const comandasDB = await db.getAllComandas();
    if (comandasDB && comandasDB.length > 0) {
      comandas = comandasDB;
    }
    
    const movDB = await db.getAllMovimentacoes();
    if (movDB && movDB.length > 0) {
      movimentacoesCaixa = movDB;
    }
    
    console.log(`✅ Dados carregados para: ${tenantManager.getEstabelecimentoAtual()?.nome}`);
  } catch (error) {
    console.error('❌ Erro ao carregar dados:', error);
    carregarLocal();
  }
}

// ==========================================
// LOGOUT MULTI-TENANT
// ==========================================

function logoutMulti() {
  tenantManager.logout();
  usuarioLogado = null;
  carrinho = [];
  
  const formLogin = document.getElementById("form-login");
  if (formLogin) formLogin.reset();
  
  document.getElementById("sistema-principal").classList.add("hidden");
  document.getElementById("tela-login").classList.remove("hidden");
  
  document.getElementById("nome-usuario-logado").innerText = "";
  document.getElementById("cargo-usuario-logado").innerText = "";
  document.getElementById("estabelecimento-nome").innerText = "Carregando...";
  
  console.log("👋 Usuário desconectado com sucesso!");
}

// ==========================================
// SOBRE
// ==========================================

function abrirModalSobre() {
  document.getElementById("modal-sobre").classList.remove("hidden");
}

function fecharModalSobre() {
  document.getElementById("modal-sobre").classList.add("hidden");
}

document.addEventListener("keydown", function(e) {
  if (e.key === "Escape") {
    const modalSobre = document.getElementById("modal-sobre");
    if (modalSobre && !modalSobre.classList.contains("hidden")) {
      fecharModalSobre();
    }
  }
});

// ==========================================
// 🔥 TELA DE CADASTRO
// ==========================================

function mostrarTelaCadastro() {
  document.getElementById("tela-login").classList.add("hidden");
  document.getElementById("tela-cadastro").classList.remove("hidden");
}

function mostrarTelaLogin() {
  document.getElementById("tela-cadastro").classList.add("hidden");
  document.getElementById("tela-login").classList.remove("hidden");
}

async function realizarCadastro(e) {
  e.preventDefault();

  const nome = document.getElementById('cadastro-nome').value.trim();
  const email = document.getElementById('cadastro-email').value.trim();
  const senha = document.getElementById('cadastro-senha').value;
  const senhaConfirm = document.getElementById('cadastro-senha-confirm').value;

  if (!nome || !email || !senha) {
    alert('❌ Preencha todos os campos!');
    return;
  }

  if (senha !== senhaConfirm) {
    alert('❌ As senhas não coincidem!');
    return;
  }

  if (senha.length < 4) {
    alert('❌ A senha deve ter pelo menos 4 caracteres!');
    return;
  }

  const usuarios = JSON.parse(localStorage.getItem('mt_usuarios')) || [];
  const usuariosPendentes = JSON.parse(localStorage.getItem('mt_usuarios_pendentes')) || [];

  if (usuarios.some(u => u.email === email) || usuariosPendentes.some(u => u.email === email)) {
    alert('❌ Este email já está cadastrado ou pendente de aprovação!');
    return;
  }

  const novoCadastro = {
    id: Date.now(),
    nome: nome,
    email: email,
    senha: senha,
    estabelecimentoId: null,
    cargo: null,
    ativo: false,
    pendente: true,
    dataCadastro: new Date().toISOString(),
    aprovado: false
  };

  usuariosPendentes.push(novoCadastro);
  localStorage.setItem('mt_usuarios_pendentes', JSON.stringify(usuariosPendentes));

  alert(`✅ Cadastro realizado com sucesso!\n\n📧 Email: ${email}\n\n⏳ Aguarde a aprovação do administrador.\n\nVocê será notificado quando sua conta for ativada.`);

  document.getElementById('form-cadastro').reset();
  mostrarTelaLogin();
}