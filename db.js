// ==========================================
// BANCO DE DADOS INDEXEDDB - ADEGA PDV
// ==========================================

class Database {
  constructor() {
    this.dbName = 'AdegaPDVDB';
    this.dbVersion = 1;
    this.db = null;
    this.isReady = false;
    this.queue = [];
  }

  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => {
        console.error('Erro ao abrir banco:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        this.isReady = true;
        console.log('✅ Banco de dados conectado com sucesso!');
        this.processQueue();
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        
        if (!db.objectStoreNames.contains('produtos')) {
          const store = db.createObjectStore('produtos', { keyPath: 'id' });
          store.createIndex('categoria', 'categoria', { unique: false });
          console.log('📦 Store "produtos" criada');
        }

        if (!db.objectStoreNames.contains('pedidos')) {
          const store = db.createObjectStore('pedidos', { keyPath: 'id' });
          store.createIndex('data', 'data', { unique: false });
          console.log('📦 Store "pedidos" criada');
        }

        if (!db.objectStoreNames.contains('comandas')) {
          const store = db.createObjectStore('comandas', { keyPath: 'id' });
          store.createIndex('numComanda', 'numComanda', { unique: true });
          console.log('📦 Store "comandas" criada');
        }

        if (!db.objectStoreNames.contains('movimentacoes')) {
          const store = db.createObjectStore('movimentacoes', { keyPath: 'id' });
          store.createIndex('data', 'data', { unique: false });
          console.log('📦 Store "movimentacoes" criada');
        }

        if (!db.objectStoreNames.contains('configuracoes')) {
          db.createObjectStore('configuracoes', { keyPath: 'chave' });
          console.log('📦 Store "configuracoes" criada');
        }

        if (!db.objectStoreNames.contains('fechamentos')) {
          const store = db.createObjectStore('fechamentos', { keyPath: 'id', autoIncrement: true });
          store.createIndex('data', 'data', { unique: false });
          console.log('📦 Store "fechamentos" criada');
        }
      };
    });
  }

  processQueue() {
    while (this.queue.length > 0) {
      const operation = this.queue.shift();
      operation();
    }
  }

  async execute(storeName, mode, callback) {
    if (!this.isReady) {
      return new Promise((resolve, reject) => {
        this.queue.push(async () => {
          try {
            const result = await this.execute(storeName, mode, callback);
            resolve(result);
          } catch (error) {
            reject(error);
          }
        });
      });
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(storeName, mode);
      const store = transaction.objectStore(storeName);
      const request = callback(store);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getAllProdutos() {
    return this.execute('produtos', 'readonly', (store) => store.getAll());
  }

  async saveProduto(produto) {
    return this.execute('produtos', 'readwrite', (store) => store.put(produto));
  }

  async deleteProduto(id) {
    return this.execute('produtos', 'readwrite', (store) => store.delete(id));
  }

  async getAllPedidos() {
    return this.execute('pedidos', 'readonly', (store) => store.getAll());
  }

  async savePedido(pedido) {
    return this.execute('pedidos', 'readwrite', (store) => store.put(pedido));
  }

  async getAllComandas() {
    return this.execute('comandas', 'readonly', (store) => store.getAll());
  }

  async saveComanda(comanda) {
    return this.execute('comandas', 'readwrite', (store) => store.put(comanda));
  }

  async deleteComanda(id) {
    return this.execute('comandas', 'readwrite', (store) => store.delete(id));
  }

  async getAllMovimentacoes() {
    return this.execute('movimentacoes', 'readonly', (store) => store.getAll());
  }

  async saveMovimentacao(movimentacao) {
    return this.execute('movimentacoes', 'readwrite', (store) => store.put(movimentacao));
  }

  async getConfiguracao(chave) {
    return this.execute('configuracoes', 'readonly', (store) => store.get(chave));
  }

  async saveConfiguracao(chave, valor) {
    return this.execute('configuracoes', 'readwrite', (store) => store.put({ chave, valor }));
  }

  async getAllFechamentos() {
    return this.execute('fechamentos', 'readonly', (store) => store.getAll());
  }

  async saveFechamento(fechamento) {
    return this.execute('fechamentos', 'readwrite', (store) => store.put(fechamento));
  }

  async fazerBackup() {
    const dados = {
      produtos: await this.getAllProdutos(),
      pedidos: await this.getAllPedidos(),
      comandas: await this.getAllComandas(),
      movimentacoes: await this.getAllMovimentacoes(),
      configuracoes: await this.getConfiguracao('estabelecimento'),
      dataBackup: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(dados, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup-adegapdv-${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    
    URL.revokeObjectURL(url);
  }
}

const db = new Database();

db.init().then(() => {
  console.log('📦 Banco de dados pronto para uso');
});

window.db = db;
console.log('✅ db.js carregado com sucesso!');