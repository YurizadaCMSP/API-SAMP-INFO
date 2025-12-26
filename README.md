# 🔷 SA-MP INFO API v2.0

> **API profissional para consulta de servidores SA-MP (San Andreas Multiplayer) em tempo real**

[![Status](https://img.shields.io/badge/status-online-success)](https://api.sampinfo.qzz.io)
[![Version](https://img.shields.io/badge/version-2.0.0-blue)](https://api.sampinfo.qzz.io)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)

## 📋 Índice

- [Visão Geral](#-visão-geral)
- [URL Base](#-url-base)
- [Recursos](#-recursos)
- [Endpoints](#-endpoints)
- [Exemplos de Uso](#-exemplos-de-uso)
- [Códigos de Status](#-códigos-de-status)
- [Rate Limiting](#-rate-limiting)
- [Cache](#-cache)
- [Integração](#-integração)
- [Boas Práticas](#-boas-práticas)
- [Instalação Local](#-instalação-local)

---

## 🎯 Visão Geral

A **SA-MP INFO API** é uma solução profissional e robusta para consultar informações de servidores SA-MP em tempo real. Desenvolvida com foco em performance, segurança e confiabilidade, a API oferece dados completos e precisos sobre servidores, jogadores, regras e muito mais.

### Características Principais

- ✅ **Dados Completos**: Extração total de informações via protocolo SA-MP (opcodes i, r, d)
- ✅ **Alta Performance**: Cache inteligente e consultas otimizadas
- ✅ **Segurança**: Rate limiting avançado com proteção anti-DDoS
- ✅ **Confiabilidade**: Tratamento robusto de erros e timeouts
- ✅ **Transparência**: Identificação clara da API em todas as respostas
- ✅ **Documentação**: API totalmente documentada e fácil de usar

---

## 🌐 URL Base

```
https://api.sampinfo.qzz.io
```

---

## 🚀 Recursos

### Informações Extraídas

A API consulta **todos os dados disponíveis** via protocolo SA-MP:

| Categoria | Dados |
|-----------|-------|
| **Básico** | Nome do servidor, gamemode, mapa, versão |
| **Jogadores** | Contagem online/máximo, lista completa com ID, nome e score |
| **Status** | Online/offline, ping, latência, qualidade da conexão |
| **Segurança** | Password habilitado, lagcomp |
| **Regras** | Versão, clima, hora, website, Discord, idioma, e todas as rules customizadas |
| **Análise** | Percentual de ocupação, health score do servidor |
| **Metadata** | Timestamp, tempo de resposta, informações de cache |

---

## 📡 Endpoints

### 1. Query de Servidor

Consulta informações completas de um servidor SA-MP.

**Endpoint:**
```
GET /query
```

**Parâmetros:**

| Parâmetro | Tipo | Obrigatório | Descrição |
|-----------|------|-------------|-----------|
| `ip` | string | ✅ | Endereço IPv4 do servidor |
| `port` | number | ✅ | Porta do servidor (1-65535) |

**Exemplo de Requisição:**
```bash
curl "https://api.sampinfo.qzz.io/query?ip=54.39.111.93&port=7777"
```

**Exemplo de Resposta (Servidor Online):**
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
      },
      {
        "id": 1,
        "name": "Player_Two",
        "score": 890
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
    "worldtime": "12:00",
    "weburl": "www.brasilvidareal.com",
    "lagcomp": "On",
    "mapname": "San Andreas",
    "language": "Português",
    "discord": "discord.gg/bvrp"
  },
  "cache": {
    "from_cache": false,
    "cache_ttl_seconds": 10
  },
  "meta": {
    "queried_at": "2025-12-26T12:30:45.123Z",
    "response_time_ms": 45,
    "query_success": true
  },
  "api_info": {
    "name": "SA-MP INFO API",
    "url": "https://api.sampinfo.qzz.io",
    "version": "2.0.0",
    "description": "API profissional para consulta de servidores SA-MP em tempo real"
  }
}
```

**Exemplo de Resposta (Servidor Offline):**
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
      "Firewall bloqueando queries UDP",
      "IP ou porta incorretos",
      "Servidor em manutenção"
    ]
  },
  "meta": {
    "queried_at": "2025-12-26T12:30:45.123Z",
    "response_time_ms": 3002,
    "query_success": false
  },
  "api_info": {
    "name": "SA-MP INFO API",
    "url": "https://api.sampinfo.qzz.io",
    "version": "2.0.0",
    "description": "API profissional para consulta de servidores SA-MP em tempo real"
  }
}
```

### 2. Health Check

Retorna o status de saúde da API e métricas do sistema.

**Endpoint:**
```
GET /health
```

**Exemplo de Resposta:**
```json
{
  "status": "healthy",
  "api_info": {
    "name": "SA-MP INFO API",
    "url": "https://api.sampinfo.qzz.io",
    "version": "2.0.0",
    "description": "API profissional para consulta de servidores SA-MP em tempo real"
  },
  "system": {
    "uptime_seconds": 86400,
    "uptime_human": "1d 0h 0m",
    "memory": {
      "used_mb": 45,
      "total_mb": 128,
      "percentage": 35
    },
    "environment": "production",
    "node_version": "v18.17.0"
  },
  "rate_limit": {
    "activeClients": 23,
    "blockedClients": 2,
    "windowSeconds": 60,
    "maxRequests": 5,
    "blockDurationMinutes": 5
  },
  "endpoints": {
    "query": {
      "path": "/query",
      "method": "GET",
      "parameters": {
        "ip": "string (required) - IPv4 address",
        "port": "number (required) - Port 1-65535"
      },
      "example": "https://api.sampinfo.qzz.io/query?ip=127.0.0.1&port=7777"
    }
  },
  "timestamp": "2025-12-26T12:30:45.123Z"
}
```

---

## 🔐 Rate Limiting

A API implementa rate limiting rigoroso para prevenir abuso e garantir disponibilidade para todos os usuários.

### Limites

| Limite | Valor | Descrição |
|--------|-------|-----------|
| **Requisições por minuto** | 5 | Máximo de 5 requisições a cada 60 segundos |
| **Threshold de abuso** | 20 | 20+ requisições em 60s resulta em bloqueio |
| **Duração do bloqueio** | 5 minutos | IPs bloqueados ficam inacessíveis por 5 minutos |

### Headers de Rate Limit

Toda resposta inclui headers informativos:

```
X-RateLimit-Limit: 5
X-RateLimit-Remaining: 3
X-RateLimit-Reset: 1703595045000
```

### Resposta de Rate Limit Excedido

**Status Code:** `429 Too Many Requests`

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
  },
  "api_info": {
    "name": "SA-MP INFO API",
    "url": "https://api.sampinfo.qzz.io"
  }
}
```

### Bloqueio por Abuso

Se comportamento abusivo for detectado (20+ requisições em 60s):

**Status Code:** `403 Forbidden`

```json
{
  "error": "IP bloqueado por abuso",
  "message": "Seu IP foi temporariamente bloqueado por comportamento abusivo",
  "reason": "Tentativa de ataque DDoS/Flood",
  "retry_after_seconds": 300,
  "retry_after_human": "5 minutos",
  "api_info": {
    "name": "SA-MP INFO API",
    "url": "https://api.sampinfo.qzz.io"
  }
}
```

---

## ⚡ Cache

A API utiliza cache inteligente para otimizar performance e reduzir latência.

### Configuração

- **TTL (Time To Live):** 10 segundos
- **Armazenamento:** Em memória (RAM)
- **Limpeza:** Automática de entradas antigas

### Indicador de Cache

Todas as respostas incluem informação sobre cache:

```json
{
  "cache": {
    "from_cache": true,
    "cache_ttl_seconds": 10
  }
}
```

---

## 💻 Exemplos de Uso

### JavaScript (Frontend)

```javascript
async function consultarServidor(ip, porta) {
  try {
    const response = await fetch(
      `https://api.sampinfo.qzz.io/query?ip=${ip}&port=${porta}`
    );
    
    const data = await response.json();
    
    if (data.success && data.online) {
      console.log(`✅ ${data.info.hostname}`);
      console.log(`👥 Jogadores: ${data.players.online}/${data.players.max}`);
      console.log(`📡 Ping: ${data.status.ping}ms`);
      console.log(`🎮 Gamemode: ${data.info.gamemode}`);
    } else {
      console.log('❌ Servidor offline');
    }
  } catch (error) {
    console.error('Erro:', error);
  }
}

consultarServidor('54.39.111.93', 7777);
```

### Node.js (Backend)

```javascript
const axios = require('axios');

async function getServerInfo(ip, port) {
  try {
    const { data } = await axios.get(
      `https://api.sampinfo.qzz.io/query`,
      { params: { ip, port } }
    );
    
    return data;
  } catch (error) {
    if (error.response?.status === 429) {
      console.error('Rate limit excedido');
    } else {
      console.error('Erro:', error.message);
    }
    throw error;
  }
}

getServerInfo('54.39.111.93', 7777)
  .then(data => console.log(data))
  .catch(err => console.error(err));
```

### Python

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
            print(f"👥 Jogadores: {data['players']['online']}/{data['players']['max']}")
            print(f"📡 Ping: {data['status']['ping']}ms")
        else:
            print("❌ Servidor offline")
            
        return data
    except requests.RequestException as e:
        print(f"Erro: {e}")
        return None

consultar_servidor("54.39.111.93", 7777)
```

### PHP

```php
<?php
function consultarServidor($ip, $porta) {
    $url = "https://api.sampinfo.qzz.io/query?ip=" . urlencode($ip) . "&port=" . $porta;
    
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 10);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    if ($httpCode === 200) {
        $data = json_decode($response, true);
        
        if ($data['success'] && $data['online']) {
            echo "✅ " . $data['info']['hostname'] . "\n";
            echo "👥 Jogadores: " . $data['players']['online'] . "/" . $data['players']['max'] . "\n";
            echo "📡 Ping: " . $data['status']['ping'] . "ms\n";
        } else {
            echo "❌ Servidor offline\n";
        }
        
        return $data;
    } else {
        echo "Erro HTTP: " . $httpCode . "\n";
        return null;
    }
}

consultarServidor("54.39.111.93", 7777);
?>
```

### Bot Discord (Discord.js)

```javascript
const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const axios = require('axios');

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages] });

client.on('messageCreate', async (message) => {
  if (message.content.startsWith('!servidor')) {
    const args = message.content.split(' ');
    const [ip, port] = args[1]?.split(':') || [];
    
    if (!ip || !port) {
      return message.reply('Use: !servidor IP:PORTA');
    }
    
    try {
      const { data } = await axios.get(`https://api.sampinfo.qzz.io/query`, {
        params: { ip, port }
      });
      
      if (data.success && data.online) {
        const embed = new EmbedBuilder()
          .setColor('#00ff00')
          .setTitle(data.info.hostname)
          .addFields(
            { name: '🎮 Gamemode', value: data.info.gamemode, inline: true },
            { name: '👥 Jogadores', value: `${data.players.online}/${data.players.max}`, inline: true },
            { name: '📡 Ping', value: `${data.status.ping}ms`, inline: true },
            { name: '🗺️ Mapa', value: data.info.mapname, inline: true },
            { name: '🌐 Status', value: data.status.state, inline: true }
          )
          .setFooter({ text: `Dados fornecidos por ${data.api_info.name}` })
          .setTimestamp();
        
        message.reply({ embeds: [embed] });
      } else {
        message.reply('❌ Servidor offline ou não respondeu');
      }
    } catch (error) {
      message.reply('Erro ao consultar servidor');
    }
  }
});

client.login('YOUR_BOT_TOKEN');
```

---

## 📊 Códigos de Status

### Status de Qualidade da Conexão

| Status | Ping | Emoji | Descrição |
|--------|------|-------|-----------|
| `excellent` | < 50ms | 🟢 | Excelente |
| `good` | 50-99ms | 🟢 | Boa |
| `fair` | 100-149ms | 🟡 | Razoável |
| `poor` | 150-299ms | 🟠 | Ruim |
| `very_poor` | 300-499ms | 🔴 | Muito ruim |
| `critical` | ≥ 500ms | 🔴 | Crítica |
| `unavailable` | - | ⚫ | Indisponível |

### HTTP Status Codes

| Código | Significado |
|--------|-------------|
| `200` | Requisição bem-sucedida |
| `400` | Parâmetros inválidos |
| `404` | Endpoint não encontrado |
| `429` | Rate limit excedido |
| `403` | IP bloqueado por abuso |
| `500` | Erro interno do servidor |

---

## ✅ Boas Práticas

### 1. Respeite o Rate Limit

- Não faça mais de 5 requisições por minuto
- Implemente delays entre requisições
- Use cache local quando possível
- Armazene resultados temporariamente

### 2. Tratamento de Erros

Sempre implemente tratamento adequado de erros:

```javascript
try {
  const response = await fetch(url);
  const data = await response.json();
  
  if (response.status === 429) {
    // Rate limit excedido - aguarde
    const retryAfter = data.retry_after_seconds;
    console.log(`Aguarde ${retryAfter}s antes de tentar novamente`);
  } else if (response.status === 403) {
    // IP bloqueado
    console.error('IP bloqueado por comportamento abusivo');
  } else if (!data.success) {
    // Servidor offline ou erro
    console.log('Servidor não está disponível');
  }
} catch (error) {
  console.error('Erro de rede:', error);
}
```

### 3. Cache Local

Implemente cache local para reduzir requisições:

```javascript
const cache = new Map();
const CACHE_DURATION = 30000; // 30 segundos

async function getServerWithCache(ip, port) {
  const key = `${ip}:${port}`;
  const cached = cache.get(key);
  
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }
  
  const data = await consultarServidor(ip, port);
  cache.set(key, { data, timestamp: Date.now() });
  
  return data;
}
```

### 4. Timeout

Configure timeouts apropriados:

```javascript
const controller = new AbortController();
const timeout = setTimeout(() => controller.abort(), 5000);

try {
  const response = await fetch(url, { signal: controller.signal });
  clearTimeout(timeout);
  return await response.json();
} catch (error) {
  if (error.name === 'AbortError') {
    console.log('Timeout: requisição cancelada');
  }
}
```

### 5. Validação de Entrada

Valide IP e porta antes de fazer requisições:

```javascript
function validarIpPorta(ip, porta) {
  const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  const portaNum = parseInt(porta);
  
  if (!ipRegex.test(ip)) {
    throw new Error('IP inválido');
  }
  
  if (isNaN(portaNum) || portaNum < 1 || portaNum > 65535) {
    throw new Error('Porta inválida');
  }
  
  return true;
}
```

---

## 🔧 Instalação Local

Para rodar a API localmente ou fazer deploy próprio:

### Pré-requisitos

- Node.js >= 18.x
- npm ou yarn

### Passos

1. **Clone o repositório:**
```bash
git clone https://github.com/seu-usuario/samp-info-api.git
cd samp-info-api
```

2. **Instale as dependências:**
```bash
npm install
```

3. **Configure as variáveis de ambiente:**
```bash
cp .env.example .env
# Edite o arquivo .env conforme necessário
```

4. **Inicie o servidor:**

**Desenvolvimento:**
```bash
npm run dev
```

**Produção:**
```bash
npm start
```

5. **Acesse:**
```
http://localhost:3000
```

### Deploy no Render

1. Faça fork do repositório
2. Crie uma conta no [Render.com](https://render.com)
3. Clique em "New +" → "Web Service"
4. Conecte seu repositório GitHub
5. Configure:
   - **Environment:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
6. Adicione as variáveis de ambiente
7. Deploy!

---

## 📞 Suporte

- **Website:** [sampinfo.qzz.io](https://sampinfo.qzz.io)
- **API:** [api.sampinfo.qzz.io](https://api.sampinfo.qzz.io)
- **GitHub:** [Issues](https://github.com/seu-usuario/samp-info-api/issues)

---

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

---

## 🤝 Contribuindo

Contribuições são bem-vindas! Por favor, abra uma issue ou pull request.

---

<div align="center">

**Desenvolvido com ❤️ para a comunidade SA-MP**

**Powered by SA-MP INFO API**

[Website](https://sampinfo.qzz.io) • [API](https://api.sampinfo.qzz.io) • [GitHub](https://github.com/seu-usuario/samp-info-api)

</div>
