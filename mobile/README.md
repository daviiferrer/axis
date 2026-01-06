# Prospecção Fria - Mobile App

Aplicativo mobile para gerenciamento de campanhas de prospecção com IA.

## 📁 Estrutura

```
mobile/
├── App.js                    # Entry point com navigation
├── src/
│   ├── config/
│   │   └── api.js           # Configurações de API
│   ├── context/
│   │   └── AuthContext.js   # Context de autenticação
│   ├── lib/
│   │   └── supabaseClient.js # Cliente Supabase
│   ├── screens/
│   │   ├── HomeScreen.js     # Tela inicial
│   │   ├── CampaignsScreen.js # Lista de campanhas
│   │   ├── ChatsScreen.js    # Lista de chats
│   │   └── auth/
│   │       └── LoginScreen.js # Tela de login
│   ├── services/
│   │   └── api.js           # Serviço de API
│   └── theme/
│       └── index.js         # Cores e estilos
```

## 🚀 Como rodar

### 1. Configurar variáveis
Edite `src/config/api.js` com suas credenciais:
```javascript
export const API_URL = 'http://SEU_IP_LOCAL:8000';
export const SUPABASE_URL = 'SUA_SUPABASE_URL';
export const SUPABASE_ANON_KEY = 'SUA_SUPABASE_KEY';
```

### 2. Instalar dependências
```bash
cd mobile
npm install
```

### 3. Iniciar projeto
```bash
npx expo start
```

### 4. Abrir no dispositivo
- Baixe o app **Expo Go** no seu celular
- Escaneie o QR Code

## 📱 Telas disponíveis

| Tela | Descrição |
|------|-----------|
| Login | Autenticação com Supabase |
| Home | Dashboard com menu e resumo |
| Campanhas | Lista de campanhas com métricas |
| Chats | Conversas do WhatsApp |
| Config | Configurações (em dev) |

## 🔗 Backend

O app usa a **mesma API** do frontend web:
- Endpoint: `http://SEU_BACKEND/api/...`
- Autenticação: Supabase Auth
- WebSocket: Socket.IO (futuro)

## 🎨 Tema

Usa o mesmo tema escuro do frontend web:
- Background: `#161717`
- Surface: `#1e1e24`
- Primary: `#2563EB`
- Success: `#10B981`
