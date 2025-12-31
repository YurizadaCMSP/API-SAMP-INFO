// src/services/cache.service.js - Sistema de Cache Avançado v2.0.1

/**
 * 🚀 Sistema de Cache Multi-Layer Avançado
 * 
 * Features:
 * - TTL dinâmico baseado em status do servidor
 * - Limpeza automática inteligente
 * - Priorização por popularidade (LFU - Least Frequently Used)
 * - Estatísticas detalhadas
 * - Pré-aquecimento opcional
 * - Limite de memória configurável
 */

class AdvancedCache {
  constructor() {
    // Configurações
    this.DEFAULT_TTL = parseInt(process.env.CACHE_TTL_SECONDS) || 10;
    this.MAX_ENTRIES = parseInt(process.env.CACHE_MAX_ENTRIES) || 1000;
    this.CLEANUP_INTERVAL = parseInt(process.env.CACHE_CLEANUP_INTERVAL_MS) || 60000; // 1 minuto
    
    // Armazenamento principal
    this.cache = new Map();
    
    // Estatísticas
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      evictions: 0,
      totalRequests: 0,
      startTime: Date.now()
    };
    
    // Popularidade (contador de acessos)
    this.popularity = new Map();
    
    // Inicia limpeza automática
    this.startCleanupTimer();
    
    console.log('✅ Cache avançado iniciado com TTL de', this.DEFAULT_TTL, 'segundos');
  }

  /**
   * 🔍 Busca item no cache
   */
  get(key) {
    this.stats.totalRequests++;
    
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.stats.misses++;
      return null;
    }
    
    // Verifica se expirou
    if (this.isExpired(entry)) {
      this.cache.delete(key);
      this.popularity.delete(key);
      this.stats.misses++;
      return null;
    }
    
    // Incrementa popularidade
    this.incrementPopularity(key);
    
    // Atualiza último acesso
    entry.lastAccess = Date.now();
    entry.accessCount++;
    
    this.stats.hits++;
    return entry.data;
  }

  /**
   * 💾 Armazena item no cache com TTL dinâmico
   */
  set(key, data) {
    this.stats.sets++;
    
    // Verifica limite de memória
    if (this.cache.size >= this.MAX_ENTRIES) {
      this.evictLeastPopular();
    }
    
    // TTL dinâmico baseado no status do servidor
    const ttl = this.calculateDynamicTTL(data);
    
    const entry = {
      data: data,
      timestamp: Date.now(),
      ttl: ttl,
      expiresAt: Date.now() + (ttl * 1000),
      lastAccess: Date.now(),
      accessCount: 1,
      size: this.estimateSize(data)
    };
    
    this.cache.set(key, entry);
    this.incrementPopularity(key);
    
    return true;
  }

  /**
   * 🧮 Calcula TTL dinâmico baseado no status do servidor
   */
  calculateDynamicTTL(data) {
    // Servidores offline: cache mais longo (30s)
    if (!data || data.players === undefined) {
      return 30;
    }
    
    // Servidores vazios: cache médio (20s)
    if (data.players === 0) {
      return 20;
    }
    
    // Servidores com poucos jogadores: cache padrão (10s)
    if (data.players < 10) {
      return this.DEFAULT_TTL;
    }
    
    // Servidores populares (muitos jogadores): cache curto (5s)
    // Para dados mais atualizados
    if (data.players > 100) {
      return 5;
    }
    
    return this.DEFAULT_TTL;
  }

  /**
   * ⏰ Verifica se entrada expirou
   */
  isExpired(entry) {
    return Date.now() > entry.expiresAt;
  }

  /**
   * 📊 Incrementa popularidade
   */
  incrementPopularity(key) {
    const current = this.popularity.get(key) || 0;
    this.popularity.set(key, current + 1);
  }

  /**
   * 🗑️ Remove item menos popular (LFU - Least Frequently Used)
   */
  evictLeastPopular() {
    let leastPopularKey = null;
    let leastPopularCount = Infinity;
    let oldestAccess = Infinity;
    
    // Encontra o item menos popular OU mais antigo
    for (const [key, entry] of this.cache.entries()) {
      const popularity = this.popularity.get(key) || 0;
      
      // Prioriza por popularidade, depois por idade
      if (popularity < leastPopularCount || 
          (popularity === leastPopularCount && entry.lastAccess < oldestAccess)) {
        leastPopularKey = key;
        leastPopularCount = popularity;
        oldestAccess = entry.lastAccess;
      }
    }
    
    if (leastPopularKey) {
      this.cache.delete(leastPopularKey);
      this.popularity.delete(leastPopularKey);
      this.stats.evictions++;
      console.log(`♻️ Cache eviction: ${leastPopularKey} (popularidade: ${leastPopularCount})`);
    }
  }

  /**
   * 🧹 Limpeza automática de entradas expiradas
   */
  cleanup() {
    let cleaned = 0;
    const now = Date.now();
    
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
        this.popularity.delete(key);
        cleaned++;
      }
    }
    
    if (cleaned > 0) {
      console.log(`🧹 Cache cleanup: ${cleaned} entradas removidas`);
    }
  }

  /**
   * ⏲️ Inicia timer de limpeza
   */
  startCleanupTimer() {
    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, this.CLEANUP_INTERVAL);
  }

  /**
   * 🛑 Para timer de limpeza
   */
  stopCleanupTimer() {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }
  }

  /**
   * 📈 Estima tamanho em bytes de um objeto
   */
  estimateSize(obj) {
    try {
      return JSON.stringify(obj).length;
    } catch {
      return 0;
    }
  }

  /**
   * 📊 Retorna estatísticas detalhadas
   */
  getStats() {
    const uptime = Date.now() - this.stats.startTime;
    const hitRate = this.stats.totalRequests > 0 
      ? ((this.stats.hits / this.stats.totalRequests) * 100).toFixed(2)
      : 0;
    
    // Calcula uso de memória estimado
    let totalSize = 0;
    for (const entry of this.cache.values()) {
      totalSize += entry.size;
    }
    
    // Top 10 servidores mais populares
    const topServers = Array.from(this.popularity.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([key, count]) => ({ server: key, requests: count }));
    
    return {
      entries: this.cache.size,
      maxEntries: this.MAX_ENTRIES,
      usage: {
        percentage: ((this.cache.size / this.MAX_ENTRIES) * 100).toFixed(2),
        estimatedMemoryBytes: totalSize,
        estimatedMemoryKB: (totalSize / 1024).toFixed(2),
        estimatedMemoryMB: (totalSize / 1024 / 1024).toFixed(2)
      },
      performance: {
        hits: this.stats.hits,
        misses: this.stats.misses,
        hitRate: `${hitRate}%`,
        totalRequests: this.stats.totalRequests,
        sets: this.stats.sets,
        evictions: this.stats.evictions
      },
      configuration: {
        defaultTTL: this.DEFAULT_TTL,
        cleanupInterval: this.CLEANUP_INTERVAL,
        maxEntries: this.MAX_ENTRIES
      },
      topServers: topServers,
      uptime: {
        milliseconds: uptime,
        seconds: Math.floor(uptime / 1000),
        minutes: Math.floor(uptime / 1000 / 60),
        hours: Math.floor(uptime / 1000 / 60 / 60)
      }
    };
  }

  /**
   * 🗑️ Limpa todo o cache
   */
  clear() {
    const size = this.cache.size;
    this.cache.clear();
    this.popularity.clear();
    
    // Reseta estatísticas parcialmente
    this.stats.evictions += size;
    
    console.log(`🗑️ Cache completamente limpo (${size} entradas removidas)`);
    return size;
  }

  /**
   * 🔥 Pré-aquece o cache com servidores populares
   */
  async warmup(servers) {
    console.log(`🔥 Iniciando pré-aquecimento do cache com ${servers.length} servidores...`);
    
    let warmed = 0;
    for (const server of servers) {
      try {
        // Aqui você poderia chamar o serviço de query
        // Por enquanto, apenas cria entradas vazias
        this.incrementPopularity(`${server.host}:${server.port}`);
        warmed++;
      } catch (error) {
        console.warn(`⚠️ Falha no warmup: ${server.host}:${server.port}`);
      }
    }
    
    console.log(`✅ Cache pré-aquecido: ${warmed}/${servers.length} servidores`);
  }

  /**
   * 🔍 Busca servidores no cache por padrão
   */
  search(pattern) {
    const results = [];
    const regex = new RegExp(pattern, 'i');
    
    for (const [key, entry] of this.cache.entries()) {
      if (!this.isExpired(entry) && regex.test(key)) {
        results.push({
          key: key,
          data: entry.data,
          popularity: this.popularity.get(key) || 0,
          accessCount: entry.accessCount
        });
      }
    }
    
    return results.sort((a, b) => b.popularity - a.popularity);
  }

  /**
   * 📋 Lista todas as chaves no cache
   */
  keys() {
    const keys = [];
    
    for (const [key, entry] of this.cache.entries()) {
      if (!this.isExpired(entry)) {
        keys.push({
          key: key,
          expiresIn: Math.floor((entry.expiresAt - Date.now()) / 1000),
          popularity: this.popularity.get(key) || 0,
          accessCount: entry.accessCount
        });
      }
    }
    
    return keys.sort((a, b) => b.popularity - a.popularity);
  }
}

// Cria instância singleton
const cacheInstance = new AdvancedCache();

// Exporta instância
module.exports = cacheInstance;
