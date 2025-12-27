# 📘 SA-MP INFO API - Documentação Oficial Completa

**Versão:** 2.0.0  
**URL Base:** `https://api.sampinfo.qzz.io`  
**Hospedagem:** AWS App Runner  
**Linguagem:** Node.js + Express  

---

## 📋 Índice

1. [Visão Geral](#1-visão-geral)
2. [Arquitetura e Funcionamento](#2-arquitetura-e-funcionamento)
3. [Recursos e Características](#3-recursos-e-características)
4. [Endpoints Detalhados](#4-endpoints-detalhados)
5. [Guia de Uso](#5-guia-de-uso)
6. [Integração em Projetos](#6-integração-em-projetos)
7. [Sistema de Cache](#7-sistema-de-cache)
8. [Rate Limiting e Segurança](#8-rate-limiting-e-segurança)
9. [Monitoramento e Health Check](#9-monitoramento-e-health-check)
10. [Casos de Uso Reais](#10-casos-de-uso-reais)
11. [Performance e Otimização](#11-performance-e-otimização)
12. [Troubleshooting](#12-troubleshooting)
13. [Melhores Práticas](#13-melhores-práticas)
14. [FAQ](#14-faq)

---

## 1. Visão Geral

### O que é a SA-MP INFO API?

A **SA-MP INFO API** é uma solução profissional e completa para consultar informações de servidores **SA-MP (San Andreas Multiplayer)** em tempo real. A API utiliza o protocolo UDP nativo do SA-MP para extrair dados detalhados de qualquer servidor público.

### Para que serve?

A API permite que desenvolvedores, administradores de servidores e membros da comunidade SA-MP:

- 🔍 **Consultem** informações de servidores (nome, gamemode, jogadores, etc.)
- 📊 **Monitorem** status e disponibilidade de servidores
- 🎮 **Integrem** dados de SA-MP em websites, bots e aplicações
- 📈 **Criem** dashboards e painéis de monitoramento
- 🤖 **Automatizem** processos de verificação de servidores

### Principais Benefícios

✅ **Gratuita e Pública** - Sem custo de uso  
✅ **Alta Disponibilidade** - Hospedada na AWS com 99.9% uptime  
✅ **Cache Inteligente** - Respostas rápidas com cache de 10 segundos  
✅ **Documentação Completa** - Exemplos em múltiplas linguagens  
✅ **Rate Limiting Profissional** - Proteção contra abuso  
✅ **Dados Completos** - Extrai TODAS as informações disponíveis via protocolo SA-MP  

---

## 2. Arquitetura e Funcionamento

### Como a API Funciona?

A API segue uma arquitetura simples e eficiente:

```
Cliente (Você)
    ↓
  [HTTPS Request]
    ↓
SA-MP INFO API
    ↓
  [UDP Query]
    ↓
Servidor SA-MP
    ↓
  [UDP Response]
    ↓
SA-MP INFO API
    ↓
  [JSON Response]
    ↓
Cliente (Você)
```

### Protocolo SA-MP

A API utiliza o **protocolo de query UDP** do SA-MP, enviando pacotes específicos para três operações:

1. **Opcode 'i' (Info)** - Informações básicas do servidor
2. **Opcode 'r' (Rules)** - Regras e configurações customizadas
3. **Opcode 'd' (Detailed Players)** - Lista completa de jogadores

### Componentes Principais

#### 1. **Camada de Entrada (API Gateway)**
- Recebe requisições HTTPS
- Valida parâmetros (IP e Porta)
- Aplica rate limiting
- Roteia para controladores

#### 2. **Camada de Cache**
- Armazena resultados em memória (RAM)
- TTL configurável de 10 segundos
- Reduz latência e carga no servidor
- Limpeza automática de entradas antigas

#### 3. **Camada de Query (UDP)**
- Cria sockets UDP para comunicação
- Envia pacotes formatados para o servidor SA-MP
- Aguarda resposta com timeout de 3 segundos
- Parseia dados binários do protocolo SA-MP

#### 4. **Camada de Processamento**
- Combina dados de múltiplas queries
- Calcula métricas (ping, qualidade, percentual de jogadores)
- Formata resposta JSON padronizada
- Adiciona metadados da API

#### 5. **Sistema de Segurança**
- Rate limiting por IP (5 requisições/minuto)
- Bloqueio automático de abuso (20+ req/min = bloqueio de 5 min)
- Validação rigorosa de entrada
- Proteção contra ataques DDoS

---

## 3. Recursos e Características

### Dados Extraídos

A API coleta **todas** as informações disponíveis via protocolo SA-MP:

#### 📊 Informações Básicas
- Nome do servidor (hostname)
- Gamemode atual
- Mapa/Mapname
- Versão do SA-MP
- Idioma do servidor

#### 👥 Jogadores
- Quantidade online/máximo
- Percentual de ocupação
- Lista completa com ID, nome e score de cada jogador

#### 🔒 Segurança
- Password habilitado (sim/não)
- Lagcomp ativo (sim/não)

#### ⚙️ Rules (Regras Customizadas)
- Website
- Discord
- Clima (weather)
- Hora do mundo (worldtime)
- Todas as rules customizadas definidas pelo servidor

#### 📈 Métricas e Status
- Online/Offline
- Ping e latência em ms
- Qualidade da conexão (excellent, good, fair, poor, critical)
- Timestamp da consulta
- Tempo de resposta

#### 💾 Cache
- Indicador se a resposta veio do cache
- TTL do cache (10 segundos)

### Recursos Técnicos

#### Cache Inteligente
- **TTL:** 10 segundos
- **Armazenamento:** Em memória (RAM)
- **Limpeza:** Automática a cada minuto
- **Limite:** 200 entradas máximo

#### Rate Limiting Avançado
- **Janela:** 60 segundos
- **Limite:** 5 requisições por IP
- **Bloqueio:** 5 minutos após 20+ requisições
- **Headers:** `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`

#### Timeouts Configurados
- **Query UDP:** 3 segundos
- **Respostas HTTP:** Instantâneas (cache) ou até 3s (query novo)

#### Health Monitoring
- Métricas de CPU em tempo real
- Uso de memória (processo e sistema)
- Uptime do servidor
- Informações de rede e localização AWS
- Load average do sistema

---

## 4. Endpoints Detalhados

### 4.1. GET `/query` - Consultar Servidor SA-MP

**Descrição:** Retorna informações completas de um servidor SA-MP.

**URL:** `https://api.sampinfo.qzz.io/query`

**Método:** `GET`

**Parâmetros:**

| Parâmetro | Tipo | Obrigatório | Descrição |
|-----------|------|-------------|-----------|
| `ip` | string | ✅ Sim | Endereço IPv4 do servidor (ex: `127.0.0.1`) |
| `port` | number | ✅ Sim | Porta do servidor (1-65535, geralmente 7777) |

**Exemplo de Requisição:**

```http
GET https://api.sampinfo.qzz.io/query?ip=54.39.111.93&port=7777
```

**Resposta de Sucesso (Servidor Online):**

```json
{
  "success": true,
  "online": true,
  "server": {
    "ip": "54.39.111.93",
    "port": 7777,
    "address": "54.39.111.93:7777"
  },
  "status": {
    "state": "online",
    "ping": 45,
    "latency_ms": 45,
    "quality": "excellent"
  },
  "info": {
    "hostname": "Brasil Vida Real Roleplay",
    "gamemode": "BVRRP v3.0",
    "mapname": "San Andreas",
    "language": "Português",
    "version": "0.3.7-R2",
    "weather": "10",
    "worldtime": "12:00",
    "weburl": "www.brasilvidareal.com",
    "discord": "discord.gg/bvrp"
  },
  "players": {
    "online": 342,
    "max": 500,
    "percentage": 68,
    "list": [
      {
        "id": 0,
        "name": "Player_One",
        "score": 1250
      }
    ]
  },
  "security": {
    "password": false,
    "lagcomp": true
  },
  "rules": {
    "version": "0.3.7-R2",
    "weather": "10",
    "worldtime": "12:00"
  },
  "cache": {
    "from_cache": false,
    "cache_ttl_seconds": 10
  },
  "meta": {
    "queried_at": "2025-12-27T12:30:45.123Z",
    "response_time_ms": 45,
    "query_success": true
  },
  "api_info": {
    "name": "SA-MP INFO API",
    "url": "https://api.sampinfo.qzz.io",
    "version": "2.0.0"
  }
}
```

**Resposta de Erro (Servidor Offline):**

```json
{
  "success": false,
  "online": false,
  "server": {
    "ip": "127.0.0.1",
    "port": 7777,
    "address": "127.0.0.1:7777"
  },
  "status": {
    "state": "offline",
    "ping": 3002,
    "latency_ms": 3002,
    "quality": "unavailable"
  },
  "error": {
    "code": "SERVER_OFFLINE",
    "message": "Servidor não respondeu",
    "details": "Timeout: servidor não respondeu",
    "possible_causes": [
      "Servidor está offline",
      "Servidor não está respondendo a queries",
      "Firewall bloqueando queries UDP"
    ]
  },
  "meta": {
    "queried_at": "2025-12-27T12:30:45.123Z",
    "response_time_ms": 3002,
    "query_success": false
  }
}
```

**Resposta de Erro (Parâmetros Inválidos):**

```json
{
  "success": false,
  "error": "Parâmetros inválidos",
  "message": "IP inválido. Use o formato IPv4: 0.0.0.0 a 255.255.255.255",
  "details": {
    "errors": ["IP inválido..."],
    "warnings": []
  },
  "example": {
    "url": "https://api.sampinfo.qzz.io/query?ip=127.0.0.1&port=7777"
  }
}
```

**Códigos de Status HTTP:**

- `200 OK` - Requisição processada (servidor pode estar online ou offline)
- `400 Bad Request` - Parâmetros inválidos
- `429 Too Many Requests` - Rate limit excedido
- `403 Forbidden` - IP bloqueado por abuso
- `500 Internal Server Error` - Erro interno da API

---

### 4.2. GET `/health` - Health Check da API

**Descrição:** Retorna métricas completas de saúde e performance da API.

**URL:** `https://api.sampinfo.qzz.io/health`

**Método:** `GET`

**Parâmetros:** Nenhum

**Exemplo de Requisição:**

```http
GET https://api.sampinfo.qzz.io/health
```

**Resposta de Sucesso:**

```json
{
  "status": "healthy",
  "api_info": {
    "name": "SA-MP INFO API",
    "url": "https://api.sampinfo.qzz.io",
    "version": "2.0.0"
  },
  "process": {
    "pid": 12345,
    "uptime_seconds": 86400,
    "uptime_human": "1d 0h 0m",
    "node_version": "v18.17.0"
  },
  "cpu": {
    "usage": {
      "percentage": 2.5,
      "user_ms": 1200,
      "system_ms": 300
    },
    "info": {
      "count": 2,
      "model": "Intel(R) Xeon(R) CPU @ 2.50GHz",
      "speed_mhz": 2500,
      "architecture": "x64"
    }
  },
  "memory": {
    "process": {
      "rss_mb": 45,
      "heap_used_mb": 20,
      "heap_total_mb": 35,
      "heap_percentage": 57
    },
    "system": {
      "total_mb": 4096,
      "free_mb": 2048,
      "used_mb": 2048,
      "percentage": 50
    }
  },
  "cloud": {
    "provider": "AWS App Runner",
    "region": "us-east-1",
    "environment": "production"
  },
  "rate_limit": {
    "activeClients": 23,
    "blockedClients": 2,
    "windowSeconds": 60,
    "maxRequests": 5
  },
  "timestamp": "2025-12-27T12:30:45.123Z"
}
```

**Métricas Disponíveis:**

- ✅ Status geral da API
- ✅ Uptime do servidor
- ✅ Uso de CPU (% e detalhes por core)
- ✅ Uso de memória (processo e sistema)
- ✅ Região AWS e provider
- ✅ Estatísticas de rate limiting
- ✅ Versão do Node.js
- ✅ Interfaces de rede
- ✅ Load average do sistema

---

### 4.3. GET `/` - Dashboard Web

**Descrição:** Interface web interativa com dashboard de monitoramento.

**URL:** `https://api.sampinfo.qzz.io/`

**Método:** `GET`

**Features do Dashboard:**

- 📊 Visualização em tempo real das métricas
- 📈 Gráficos de uso de CPU e memória
- 🌍 Informações de localização e infraestrutura
- 🧪 Testador de API integrado
- 🔄 Auto-refresh a cada 10 segundos
- 📱 Design responsivo para mobile

---

## 5. Guia de Uso

### 5.1. Consulta Básica

**JavaScript (Frontend):**

```javascript
async function consultarServidor(ip, porta) {
  try {
    const response = await fetch(
      `https://api.sampinfo.qzz.io/query?ip=${ip}&port=${porta}`
    );
    const data = await response.json();
    
    if (data.success && data.online) {
      console.log('✅ Servidor Online!');
      console.log(`Nome: ${data.info.hostname}`);
      console.log(`Jogadores: ${data.players.online}/${data.players.max}`);
      console.log(`Gamemode: ${data.info.gamemode}`);
    } else {
      console.log('❌ Servidor Offline');
    }
  } catch (error) {
    console.error('Erro:', error);
  }
}

// Exemplo de uso
consultarServidor('54.39.111.93', 7777);
```

**Node.js (Backend):**

```javascript
const axios = require('axios');

async function getServerInfo(ip, port) {
  try {
    const { data } = await axios.get(
      'https://api.sampinfo.qzz.io/query',
      { params: { ip, port } }
    );
    return data;
  } catch (error) {
    console.error('Erro:', error.message);
    throw error;
  }
}

// Uso
getServerInfo('54.39.111.93', 7777)
  .then(info => console.log(info))
  .catch(err => console.error(err));
```

**Python:**

```python
import requests

def consultar_servidor(ip: str, porta: int):
    url = "https://api.sampinfo.qzz.io/query"
    params = {"ip": ip, "port": porta}
    
    try:
        response = requests.get(url, params=params)
        data = response.json()
        
        if data.get('success') and data.get('online'):
            print(f"✅ {data['info']['hostname']}")
            print(f"Jogadores: {data['players']['online']}/{data['players']['max']}")
        else:
            print("❌ Servidor offline")
    except Exception as e:
        print(f"Erro: {e}")

# Uso
consultar_servidor("54.39.111.93", 7777)
```

**PHP:**

```php
<?php
function consultarServidor($ip, $porta) {
    $url = "https://api.sampinfo.qzz.io/query?ip=" 
           . urlencode($ip) . "&port=" . $porta;
    
    $response = file_get_contents($url);
    $data = json_decode($response, true);
    
    if ($data['success'] && $data['online']) {
        echo "✅ " . $data['info']['hostname'] . "\n";
        echo "Jogadores: " . $data['players']['online'] 
             . "/" . $data['players']['max'] . "\n";
    } else {
        echo "❌ Servidor offline\n";
    }
}

consultarServidor("54.39.111.93", 7777);
?>
```

### 5.2. Tratamento de Rate Limit

```javascript
async function consultarComRetry(ip, porta, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(
        `https://api.sampinfo.qzz.io/query?ip=${ip}&port=${porta}`
      );
      
      if (response.status === 429) {
        const data = await response.json();
        const retryAfter = data.retry_after_seconds || 60;
        
        console.log(`Rate limit atingido. Aguardando ${retryAfter}s...`);
        await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
        continue;
      }
      
      return await response.json();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
}
```

### 5.3. Cache Local (Opcional)

```javascript
class ServerCache {
  constructor(ttl = 30000) {
    this.cache = new Map();
    this.ttl = ttl;
  }
  
  async get(ip, port) {
    const key = `${ip}:${port}`;
    const cached = this.cache.get(key);
    
    if (cached && Date.now() - cached.timestamp < this.ttl) {
      return cached.data;
    }
    
    const response = await fetch(
      `https://api.sampinfo.qzz.io/query?ip=${ip}&port=${port}`
    );
    const data = await response.json();
    
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
    
    return data;
  }
}

// Uso
const cache = new ServerCache(30000); // 30 segundos
const info = await cache.get('54.39.111.93', 7777);
```

---

## 6. Integração em Projetos

### 6.1. Website de Lista de Servidores

```html
<!DOCTYPE html>
<html>
<head>
  <title>Lista de Servidores SA-MP</title>
</head>
<body>
  <div id="servers"></div>
  
  <script>
    const servidores = [
      { ip: '54.39.111.93', port: 7777 },
      { ip: '192.168.1.1', port: 7777 }
    ];
    
    async function carregarServidores() {
      const container = document.getElementById('servers');
      
      for (const server of servidores) {
        const data = await fetch(
          `https://api.sampinfo.qzz.io/query?ip=${server.ip}&port=${server.port}`
        ).then(r => r.json());
        
        if (data.success && data.online) {
          container.innerHTML += `
            <div class="server-card">
              <h3>${data.info.hostname}</h3>
              <p>👥 ${data.players.online}/${data.players.max} jogadores</p>
              <p>🎮 ${data.info.gamemode}</p>
              <p>📡 ${data.status.ping}ms</p>
            </div>
          `;
        }
      }
    }
    
    carregarServidores();
  </script>
</body>
</html>
```

### 6.2. Bot Discord

```javascript
const { Client, EmbedBuilder } = require('discord.js');
const axios = require('axios');

const client = new Client({ intents: ['Guilds', 'GuildMessages'] });

client.on('messageCreate', async (message) => {
  if (message.content.startsWith('!servidor')) {
    const args = message.content.split(' ');
    const [ip, port] = args[1]?.split(':') || [];
    
    if (!ip || !port) {
      return message.reply('Uso: !servidor IP:PORTA');
    }
    
    try {
      const { data } = await axios.get('https://api.sampinfo.qzz.io/query', {
        params: { ip, port }
      });
      
      if (data.success && data.online) {
        const embed = new EmbedBuilder()
          .setColor('#00ff00')
          .setTitle(data.info.hostname)
          .addFields(
            { name: '🎮 Gamemode', value: data.info.gamemode, inline: true },
            { name: '👥 Jogadores', value: `${data.players.online}/${data.players.max}`, inline: true },
            { name: '📡 Ping', value: `${data.status.ping}ms`, inline: true }
          )
          .setTimestamp();
        
        message.reply({ embeds: [embed] });
      } else {
        message.reply('❌ Servidor offline');
      }
    } catch (error) {
      message.reply('Erro ao consultar servidor');
    }
  }
});

client.login('YOUR_BOT_TOKEN');
```

### 6.3. Monitoramento Contínuo

```javascript
class ServerMonitor {
  constructor(servers, checkInterval = 60000) {
    this.servers = servers;
    this.interval = checkInterval;
    this.results = new Map();
  }
  
  async checkServer(ip, port) {
    try {
      const response = await fetch(
        `https://api.sampinfo.qzz.io/query?ip=${ip}&port=${port}`
      );
      return await response.json();
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
  
  async start() {
    console.log('🔍 Iniciando monitoramento...');
    
    setInterval(async () => {
      for (const server of this.servers) {
        const result = await this.checkServer(server.ip, server.port);
        const key = `${server.ip}:${server.port}`;
        
        const previous = this.results.get(key);
        this.results.set(key, result);
        
        // Detecta mudanças de status
        if (previous && previous.online !== result.online) {
          this.onStatusChange(server, result);
        }
      }
    }, this.interval);
  }
  
  onStatusChange(server, result) {
    if (result.online) {
      console.log(`✅ ${server.ip}:${server.port} voltou online!`);
    } else {
      console.log(`❌ ${server.ip}:${server.port} caiu!`);
    }
  }
}

// Uso
const monitor = new ServerMonitor([
  { ip: '54.39.111.93', port: 7777 },
  { ip: '192.168.1.1', port: 7777 }
], 60000);

monitor.start();
```

---

## 7. Sistema de Cache

### Como Funciona?

A API implementa um sistema de cache em memória que armazena os resultados das consultas por **10 segundos**. Isso significa:

1. **Primeira consulta:** Query enviado ao servidor SA-MP (latência normal)
2. **Consultas subsequentes (< 10s):** Resposta instantânea do cache

### Vantagens do Cache

- ⚡ **Respostas instantâneas** (< 5ms)
- 🔋 **Reduz carga** no servidor SA-MP
- 📉 **Melhora performance** para múltiplos usuários
- 💾 **Economia de recursos** da API

### Identificando Respostas do Cache

```json
{
  "cache": {
    "from_cache": true,  // ← Veio do cache
    "cache_ttl_seconds": 10
  }
}
```

### Quando o Cache é Útil?

- **Websites com muitos visitantes** consultando o mesmo servidor
- **Dashboards com auto-refresh** frequente
- **Listas de servidores** sendo recarregadas constantemente

---

## 8. Rate Limiting e Segurança

### Limites de Requisições

| Tipo | Limite | Janela | Ação |
|------|--------|--------|------|
| **Normal** | 5 requisições | 60 segundos | Requisição bloqueada (429) |
| **Abuso** | 20+ requisições | 60 segundos | IP bloqueado por 5 minutos (403) |

### Headers de Rate Limit

Toda resposta inclui headers informativos:

```http
X-RateLimit-Limit: 5
X-RateLimit-Remaining: 3
X-RateLimit-Reset: 1703595045000
```

### Resposta de Rate Limit Excedido

**Status:** `429 Too Many Requests`

```json
{
  "error": "Rate limit excedido",
  "message": "Você excedeu o limite de 5 requisições por 60 segundos",
  "retry_after_seconds": 45,
  "retry_after_human": "45 segundos",
  "limit": {
    "max_requests": 5,
    "window_seconds": 60,
    "remaining": 0
  }
}
```

### IP Bloqueado por Abuso

**Status:** `403 Forbidden`

```json
{
  "error": "IP bloqueado por abuso",
  "message": "Seu IP foi temporariamente bloqueado",
  "reason": "Tentativa de ataque DDoS/Flood",
  "retry_after_seconds": 300,
  "retry_after_human": "5 minutos"
}
```

### Como Evitar Bloqueios

✅ **Respeite o limite** de 5 requisições por minuto  
✅ **Implemente delays** entre requisições  
✅ **Use cache local** para armazenar resultados  
✅ **Trate erros 429** com retry automático  
✅ **Não faça requisições** em loop sem delay  

---

## 9. Monitoramento e Health Check

### Endpoint `/health`

O endpoint `/health` fornece métricas completas e em tempo real da API, incluindo:

#### 🖥️ CPU
- Percentual de uso atual
- Número de cores disponíveis
- Modelo e velocidade do processador
- Tempo de CPU (user/system)

#### 💾 Memória
- **Processo Node.js:** RSS, Heap usado/total
- **Sistema:** RAM total, livre, usada, percentual

#### 🌍 Infraestrutura
- Região AWS detectada automaticamente
- Hostname do servidor
- Interfaces de rede
- Endereços IP

#### 📊 Sistema Operacional
- Plataforma (Linux, Windows)
- Versão do Node.js
- Process ID
- Load average

#### 🛡️ Rate Limiting
- Clientes ativos no momento
- IPs bloqueados
- Configurações de limite

### Uso para Monitoramento Externo

```javascript
// Verificar saúde da API a cada minuto
setInterval(async () => {
  const health = await fetch('https://api.sampinfo.qzz.io/health')
    .then(r => r.json());
  
  if (health.status !== 'healthy') {
    alert('⚠️ API com problemas!');
  }
  
  // Verificar uso de recursos
  if (health.memory.system.percentage > 80) {
    console.warn('🔴 Memória alta:', health.memory.system.percentage + '%');
  }
  
  if (health.cpu.usage.percentage > 80) {
    console.warn('🔴 CPU alta:', health.cpu.usage.percentage + '%');
  }
}, 60000);
```

---

## 10. Casos de Uso Reais

### 10.1. Status Widget para Website

Crie um widget de status para seu site:

```html
<div id="server-status"></div>

<script>
async function updateStatus() {
  const data = await fetch(
    'https://api.sampinfo.qzz.io/query?ip=SEU_IP&port=7777'
  ).then(r => r.json());
  
  document.getElementById('server-status').innerHTML = data.online
    ? `🟢 ONLINE | ${data.players.online}/${data.players.max} jogadores`
    : '🔴 OFFLINE';
}

updateStatus();
setInterval(updateStatus, 30000);
</script>
```

### 10.2. Sistema de Rankings

Liste servidores por número de jogadores:

```javascript
async function getTopServers(servers) {
  const results = await Promise.all(
    servers.map(s => 
      fetch(`https://api.sampinfo.qzz.io/query?ip=${s.ip}&port=${s.port}`)
        .then(r => r.json())
    )
  );
  
  return results
    .filter(r => r.success && r.online)
    .sort((a, b) => b.players.online - a.players.online)
    .slice(0, 10);
}
```

### 10.3. Notificações de Servidor Online/Offline

```javascript
class ServerNotifier {
  constructor(ip, port) {
    this.ip = ip;
    this.port = port;
    this.lastStatus = null;
  }
  
  async check() {
    const data = await fetch(
      `https://api.sampinfo.qzz.io/query?ip=${this.ip}&port=${this.port}`
    ).then(r => r.json());
    
    if (this.lastStatus !== null && this.lastStatus !== data.online) {
      this.notify(data.online);
    }
    
    this.lastStatus = data.online;
  }
  
  notify(isOnline) {
    if (isOnline) {
      new Notification('✅ Servidor Online!', {
        body: `${this.ip}:${this.port} está online novamente`
      });
    } else {
      new Notification('❌ Servidor Offline!', {
        body: `${this.ip}:${this.port} caiu`
      });
    }
  }
  
  start(interval = 60000) {
    setInterval(() => this.check(), interval);
  }
}
```

### 10.4. API Wrapper Personalizada

Crie sua própria camada de abstração:

```javascript
class SAMPClient {
  constructor(baseURL = 'https://api.sampinfo.qzz.io') {
    this.baseURL = baseURL;
  }
  
  async getServer(ip, port) {
    const response = await fetch(
      `${this.baseURL}/query?ip=${ip}&port=${port}`
    );
    return response.json();
  }
  
  async getPlayers(ip, port) {
    const data = await this.getServer(ip, port);
    return data.success ? data.players.list : [];
  }
  
  async isOnline(ip, port) {
    const data = await this.getServer(ip, port);
    return data.success && data.online;
  }
  
  async getPlayerCount(ip, port) {
    const data = await this.getServer(ip, port);
    return data.success ? data.players.online : 0;
  }
}

// Uso
const client = new SAMPClient();
const online = await client.isOnline('54.39.111.93', 7777);
const players = await client.getPlayers('54.39.111.93', 7777);
```

---

## 11. Performance e Otimização

### Latência Típica

| Cenário | Latência |
|---------|----------|
| **Resposta do cache** | 5-15 ms |
| **Query novo (servidor próximo)** | 50-150 ms |
| **Query novo (servidor distante)** | 150-500 ms |
| **Servidor offline (timeout)** | 3000 ms |

### Melhores Práticas de Performance

#### 1. Use Cache Local
```javascript
// ❌ Ruim - consulta repetida
for (let i = 0; i < 100; i++) {
  await getServer(ip, port);
}

// ✅ Bom - cache local
const cache = await getServer(ip, port);
for (let i = 0; i < 100; i++) {
  processData(cache);
}
```

#### 2. Consultas Paralelas
```javascript
// ❌ Ruim - consultas sequenciais
for (const server of servers) {
  await getServer(server.ip, server.port);
}

// ✅ Bom - consultas paralelas
await Promise.all(
  servers.map(s => getServer(s.ip, s.port))
);
```

#### 3. Timeout Apropriado
```javascript
const controller = new AbortController();
const timeout = setTimeout(() => controller.abort(), 5000);

try {
  const response = await fetch(url, { signal: controller.signal });
  clearTimeout(timeout);
} catch (error) {
  if (error.name === 'AbortError') {
    console.log('Timeout');
  }
}
```

---

## 12. Troubleshooting

### Problema: Servidor sempre aparece offline

**Possíveis causas:**
- Firewall bloqueando queries UDP
- Servidor configurado com `query 0` no `server.cfg`
- IP ou porta incorretos
- Servidor realmente offline

**Solução:**
1. Verifique se o servidor aceita queries: `query 1` no `server.cfg`
2. Teste o IP/porta com SA-MP client
3. Verifique firewall do servidor

### Problema: Rate limit constantemente

**Possíveis causas:**
- Requisições em loop sem delay
- Múltiplos usuários no mesmo IP (NAT)
- Script mal configurado

**Solução:**
```javascript
// Adicione delay entre requisições
await new Promise(resolve => setTimeout(resolve, 15000)); // 15s
```

### Problema: Respostas lentas

**Possíveis causas:**
- Servidor SA-MP distante geograficamente
- Servidor SA-MP sobrecarregado
- Rede lenta

**Solução:**
- Use cache local (TTL 30-60s)
- Implemente timeout de 5 segundos
- Consulte servidores próximos geograficamente

### Problema: CORS Error no navegador

**Solução:**
A API já tem CORS habilitado. Se persistir:
```javascript
// Use proxy CORS
const proxyUrl = 'https://cors-anywhere.herokuapp.com/';
const apiUrl = 'https://api.sampinfo.qzz.io/query?ip=...';
fetch(proxyUrl + apiUrl);
```

---

## 13. Melhores Práticas

### ✅ DO (Faça)

1. **Respeite o rate limit** (5 req/min)
2. **Implemente cache local** (30-60 segundos)
3. **Trate erros adequadamente** (timeout, rate limit, offline)
4. **Valide IP e porta** antes de consultar
5. **Use timeouts** (5 segundos recomendado)
6. **Verifique campo `success`** antes de usar dados
7. **Implemente retry** com backoff exponencial

### ❌ DON'T (Não Faça)

1. **Não faça loops** sem delay entre requisições
2. **Não ignore rate limit** (429/403)
3. **Não assuma** que servidor está online sem verificar
4. **Não exponha** a API em scripts públicos sem limitação
5. **Não faça** requisições desnecessárias
6. **Não ignore** erros de timeout
7. **Não dependa** apenas da API sem fallback

### Exemplo de Implementação Ideal

```javascript
class SAMPServerManager {
  constructor() {
    this.cache = new Map();
    this.cacheTTL = 30000; // 30s
    this.requestDelay = 15000; // 15s entre requests
    this.lastRequest = 0;
  }
  
  async getServer(ip, port, options = {}) {
    // 1. Verifica cache local
    const cached = this.getFromCache(ip, port);
    if (cached) return cached;
    
    // 2. Respeita delay mínimo
    await this.waitForDelay();
    
    // 3. Faz requisição com timeout
    try {
      const data = await this.fetchWithTimeout(ip, port, 5000);
      
      // 4. Armazena em cache
      this.setCache(ip, port, data);
      
      return data;
    } catch (error) {
      // 5. Trata erros específicos
      if (error.name === 'AbortError') {
        return { success: false, error: 'Timeout' };
      }
      throw error;
    }
  }
  
  getFromCache(ip, port) {
    const key = `${ip}:${port}`;
    const cached = this.cache.get(key);
    
    if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
      return cached.data;
    }
    return null;
  }
  
  setCache(ip, port, data) {
    const key = `${ip}:${port}`;
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }
  
  async waitForDelay() {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequest;
    
    if (timeSinceLastRequest < this.requestDelay) {
      const delay = this.requestDelay - timeSinceLastRequest;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    
    this.lastRequest = Date.now();
  }
  
  async fetchWithTimeout(ip, port, timeout) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    try {
      const response = await fetch(
        `https://api.sampinfo.qzz.io/query?ip=${ip}&port=${port}`,
        { signal: controller.signal }
      );
      
      clearTimeout(timeoutId);
      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }
}

// Uso
const manager = new SAMPServerManager();
const server = await manager.getServer('54.39.111.93', 7777);
```

---

## 14. FAQ

### P: A API é gratuita?
**R:** Sim, 100% gratuita e sem necessidade de chave de API.

### P: Preciso de autenticação?
**R:** Não, a API é pública e não requer autenticação.

### P: Qual o limite de requisições?
**R:** 5 requisições por minuto por IP. Após 20 requisições em 1 minuto, o IP é bloqueado por 5 minutos.

### P: Como funciona o cache?
**R:** A API armazena resultados por 10 segundos em memória. Consultas subsequentes no mesmo servidor retornam dados do cache instantaneamente.

### P: A API funciona para servidores com senha?
**R:** Sim, a API consegue detectar se o servidor tem senha, mas não consegue listar jogadores em servidores com senha.

### P: Quais versões do SA-MP são suportadas?
**R:** Todas as versões do SA-MP (0.3.7, 0.3.DL, 0.3.7-R2, etc.) que suportam o protocolo de query UDP padrão.

### P: A API funciona com open.mp?
**R:** Sim, desde que o servidor open.mp tenha o protocolo de query SA-MP habilitado.

### P: Posso usar em aplicações comerciais?
**R:** Sim, pode usar livremente respeitando o rate limit.

### P: Como reportar problemas?
**R:** Entre em contato através do GitHub ou Discord da comunidade.

### P: A API armazena histórico?
**R:** Não, a API apenas consulta em tempo real e mantém cache de 10 segundos.

### P: Posso hospedar minha própria instância?
**R:** Sim, o código é open source e pode ser hospedado em qualquer servidor Node.js.

---

## 📞 Suporte e Contato

- **Website:** [sampinfo.qzz.io](https://sampinfo.qzz.io)
- **API:** [api.sampinfo.qzz.io](https://api.sampinfo.qzz.io)
- **Dashboard:** [api.sampinfo.qzz.io/](https://api.sampinfo.qzz.io/)
- **Health Check:** [api.sampinfo.qzz.io/health](https://api.sampinfo.qzz.io/health)

---

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo LICENSE para mais detalhes.

---

## 🤝 Contribuindo

Contribuições são bem-vindas! Sinta-se à vontade para:
- Reportar bugs
- Sugerir melhorias
- Criar pull requests
- Compartilhar casos de uso

---

<div align="center">

**Desenvolvido com ❤️ para a comunidade SA-MP**

**Powered by SA-MP INFO API v2.0.0**

</div>