# 🔷 SA-MP INFO - API

API para consulta de servidores SA-MP (San Andreas Multiplayer) em tempo real.

## 🚀 Funcionalidades

- ✅ Consulta de servidores SA-MP via UDP
- ✅ Rate limiting (1 requisição a cada 5 minutos por IP)
- ✅ Cache inteligente (10 segundos)
- ✅ Validação de IP e porta
- ✅ Inferência de status (online/instável/offline)
- ✅ Timeout configurável
- ✅ Resposta padronizada em JSON

## 📡 Endpoint

```
GET https://api.sampinfo.qzz.io/query?ip=<IP>&port=<PORTA>
```

### Exemplo de requisição

```bash
curl "https://api.sampinfo.qzz.io/query?ip=127.0.0.1&port=7777"
```

### Exemplo de resposta (sucesso)

```json
{
  "online": true,
  "ping": 42,
  "status": "online",
  "hostname": "Brasil RP | SA-MP",
  "gamemode": "Roleplay",
  "mapname": "San Andreas",
  "players": {
    "online": 128,
    "maxplayers": 500,
    "list": [
      {
        "name": "Player_One",
        "score": 32
      }
    ]
  },
  "rules": {
    "version": "0.3.7-R2",
    "weather": "1",
    "worldtime": "12:00",
    "lagcomp": "On",
    "weburl": "www.servidor.com"
  },
  "passworded": false,
  "from_cache": false,
  "meta": {
    "queried_at": "2025-12-25T23:10:00Z",
    "response_time_ms": 52,
    "api_version": "1.0.0"
  }
}
```

### Exemplo de resposta (servidor offline)

```json
{
  "online": false,
  "status": "offline",
  "error": "Falha na consulta",
  "message": "Não foi possível conectar ao servidor",
  "meta": {
    "queried_at": "2025-12-25T23:10:00Z",
    "response_time_ms": 2005
  }
}
```

### Exemplo de resposta (rate limit)

```json
{
  "error": "Limite de requisições excedido",
  "message": "Você pode fazer apenas 1 consulta a cada 5 minutos.",
  "retry_after_seconds": 243,
  "retry_after_human": "5 minutos"
}
```

## 📊 Status do servidor

| Status | Descrição | Ping |
|--------|-----------|------|
| 🟢 **online** | Servidor respondendo bem | < 150ms |
| 🟡 **instável** | Servidor com alta latência | > 300ms |
| 🔴 **offline** | Servidor não responde | - |

## 🛡️ Segurança

- **Rate Limiting**: 1 requisição a cada 5 minutos por IP
- **Timeout**: Requisições canceladas após 2 segundos
- **Validação**: IP e porta são validados antes da consulta
- **Cache**: Resultados são cacheados por 10 segundos

## 🔧 Instalação (Deploy no Railway)

### 1. Clone o repositório

```bash
git clone https://github.com/seu-usuario/samp-info-api.git
cd samp-info-api
```

### 2. Instale as dependências

```bash
npm install
```

### 3. Configure as variáveis de ambiente

Crie um arquivo `.env`:

```env
PORT=3000
NODE_ENV=production
RATE_LIMIT_WINDOW_MS=300000
RATE_LIMIT_MAX_REQUESTS=1
CACHE_TTL_SECONDS=10
QUERY_TIMEOUT_MS=2000
```

### 4. Deploy no Railway

1. Acesse [Railway.app](https://railway.app)
2. Clique em "New Project"
3. Selecione "Deploy from GitHub repo"
4. Escolha este repositório
5. Railway detectará automaticamente o Node.js
6. Configure as variáveis de ambiente no painel
7. Deploy automático!

## 📁 Estrutura do projeto

```
api/
├── src/
│   ├── server.js              # Inicialização do servidor
│   ├── app.js                 # Configuração do Express
│   ├── routes/
│   │   └── query.route.js     # Rotas da API
│   ├── controllers/
│   │   └── query.controller.js # Lógica de controle
│   ├── services/
│   │   └── samp.service.js    # Serviço de query SA-MP
│   ├── utils/
│   │   ├── status.util.js     # Inferência de status
│   │   └── validator.util.js  # Validação de dados
│   └── middlewares/
│       └── rateLimit.js       # Rate limiting
├── package.json
├── .env
└── README.md
```

## 🧪 Testando localmente

```bash
npm run dev
```

Acesse:
```
http://localhost:3000/query?ip=127.0.0.1&port=7777
```

## 🔌 Usando a API em outros projetos

### JavaScript (Frontend)

```javascript
async function consultarServidor(ip, porta) {
  try {
    const response = await fetch(
      `https://api.sampinfo.qzz.io/query?ip=${ip}&port=${porta}`
    );
    const data = await response.json();
    
    if (data.online) {
      console.log(`Servidor online: ${data.hostname}`);
      console.log(`Jogadores: ${data.players.online}/${data.players.maxplayers}`);
    } else {
      console.log('Servidor offline');
    }
  } catch (error) {
    console.error('Erro:', error);
  }
}
```

### Python

```python
import requests

def consultar_servidor(ip, porta):
    url = f"https://api.sampinfo.qzz.io/query?ip={ip}&port={porta}"
    response = requests.get(url)
    data = response.json()
    
    if data.get('online'):
        print(f"Servidor online: {data['hostname']}")
        print(f"Jogadores: {data['players']['online']}/{data['players']['maxplayers']}")
    else:
        print("Servidor offline")
```

### Node.js (Bot Discord)

```javascript
const axios = require('axios');

async function consultarServidor(ip, porta) {
  const { data } = await axios.get(
    `https://api.sampinfo.qzz.io/query?ip=${ip}&port=${porta}`
  );
  return data;
}
```

## 📝 Licença

MIT

## 🤝 Contribuindo

Contribuições são bem-vindas! Abra uma issue ou pull request.

## 📧 Contato

- Site: [sampinfo.qzz.io](https://sampinfo.qzz.io)
- API: [api.sampinfo.qzz.io](https://api.sampinfo.qzz.io)

---

Desenvolvido com ❤️ para a comunidade SA-MP
