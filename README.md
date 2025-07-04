# Tank Battalion Multiplayer

Um jogo multiplayer de tanques inspirado no clássico Tank Battalion dos anos 80, desenvolvido com Node.js, Socket.IO e HTML5 Canvas.

## 🎮 Características

- **Multiplayer em tempo real** usando Socket.IO
- **Controles responsivos** para desktop e mobile
- **Sistema de vidas** (3 vidas por jogador)
- **Explosões animadas** quando tanques são destruídos
- **Mapa com obstáculos** e paredes estilo Tank Battalion
- **Interface mobile** com controles touch

## 🚀 Como Jogar

### Desktop
- **WASD**: Movimento do tanque
- **Espaço**: Atirar

### Mobile
- **Botões de direção**: Movimento do tanque
- **Botão vermelho**: Atirar

## 🛠️ Instalação Local

1. Clone o repositório:
```bash
git clone <seu-repositorio>
cd tankbattalion
```

2. Instale as dependências:
```bash
npm install
```

3. Execute o servidor:
```bash
npm start
```

4. Acesse `http://localhost:3000` no navegador

## 🌐 Deploy no Vercel

### Método 1: Deploy via GitHub

1. Faça push do código para o GitHub
2. Acesse [vercel.com](https://vercel.com)
3. Conecte sua conta GitHub
4. Importe o repositório
5. O Vercel detectará automaticamente a configuração

### Método 2: Deploy via CLI

1. Instale o Vercel CLI:
```bash
npm i -g vercel
```

2. Faça login:
```bash
vercel login
```

3. Deploy:
```bash
vercel
```

## 📁 Estrutura do Projeto

```
tankbattalion/
├── client/
│   ├── index.html
│   └── game.js
├── server/
│   └── index.js
├── package.json
├── vercel.json
└── README.md
```

## 🎯 Tecnologias

- **Backend**: Node.js, Express, Socket.IO
- **Frontend**: HTML5, Canvas API, JavaScript
- **Deploy**: Vercel

## 📱 Compatibilidade

- ✅ Desktop (Chrome, Firefox, Safari, Edge)
- ✅ Mobile (iOS Safari, Chrome Mobile)
- ✅ Tablet (iPad, Android)

## 🔧 Configuração

O jogo funciona automaticamente em:
- **Desktop**: Controles de teclado
- **Mobile**: Controles touch responsivos
- **Multiplayer**: Até 4 jogadores simultâneos

## 🎨 Personalização

Você pode personalizar:
- Cores dos tanques
- Velocidade de movimento
- Número de vidas
- Layout do mapa
- Efeitos visuais

## 📄 Licença

ISC License 