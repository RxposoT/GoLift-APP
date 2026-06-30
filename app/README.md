# GoLift App 💪

Aplicativo de fitness desenvolvido com React Native e Expo.

## Tecnologias Utilizadas

- **React Native** (0.81.5)
- **Expo** (~54.0.31)
- **TypeScript** (~5.9.2)
- **NativeWind** (^4.2.1) - Tailwind CSS para React Native
- **Expo Router** (~6.0.21) - Navegação baseada em arquivos

## Pré-requisitos

Antes de começar, certifique-se de ter instalado:

- [Node.js](https://nodejs.org/) (versão 18 ou superior)
- [npm](https://www.npmjs.com/) ou [yarn](https://yarnpkg.com/)
- [Expo CLI](https://docs.expo.dev/get-started/installation/)
- [Expo Go](https://expo.dev/go) no seu dispositivo móvel (para testar)

## Instalação

### 1. Clone o repositório

```bash
git clone https://github.com/seu-usuario/GoLift-APP-New.git
cd GoLift-APP-New
```

### 2. Instale as dependências

```bash
npm install
```

## Dependências do Projeto

### Dependências Principais

| Pacote | Versão | Descrição |
|--------|--------|-----------|
| `expo` | ~54.0.31 | Framework para desenvolvimento React Native |
| `react` | 19.1.0 | Biblioteca principal React |
| `react-native` | 0.81.5 | Framework mobile |
| `expo-router` | ~6.0.21 | Navegação baseada em arquivos |
| `nativewind` | ^4.2.1 | Tailwind CSS para React Native |
| `tailwindcss` | ^3.4.17 | Framework CSS utilitário |
| `@react-navigation/native` | ^7.1.8 | Navegação React Native |
| `@react-navigation/bottom-tabs` | ^7.4.0 | Navegação com abas inferiores |
| `react-native-reanimated` | ~3.17.4 | Animações de alta performance |
| `react-native-gesture-handler` | ~2.28.0 | Gestos nativos |
| `react-native-safe-area-context` | ^5.4.0 | Contexto de área segura |
| `react-native-screens` | ~4.16.0 | Telas nativas otimizadas |
| `expo-status-bar` | ~3.0.9 | Barra de status |
| `expo-splash-screen` | ~31.0.13 | Tela de splash |
| `expo-font` | ~14.0.10 | Carregamento de fontes |
| `expo-image` | ~3.0.11 | Componente de imagem otimizado |
| `@expo/vector-icons` | ^15.0.3 | Ícones vetoriais |

### Dependências de Desenvolvimento

| Pacote | Versão | Descrição |
|--------|--------|-----------|
| `typescript` | ~5.9.2 | Suporte a TypeScript |
| `@types/react` | ~19.1.0 | Tipos do React |
| `eslint` | ^9.25.0 | Linting de código |
| `eslint-config-expo` | ~10.0.0 | Configuração ESLint para Expo |

## Como Executar

### Iniciar o servidor de desenvolvimento

```bash
npx expo start
```

### Executar em plataformas específicas

```bash
# Android
npm run android

# iOS
npm run ios

# Web
npm run web
```

## Opções de Desenvolvimento

Após iniciar o servidor, você pode abrir o app em:

- [Expo Go](https://expo.dev/go) - Escaneie o QR code com seu celular
- [Emulador Android](https://docs.expo.dev/workflow/android-studio-emulator/)
- [Simulador iOS](https://docs.expo.dev/workflow/ios-simulator/)
- [Development build](https://docs.expo.dev/develop/development-builds/introduction/)

## Estrutura do Projeto

```
GoLift-APP-New/
├── src/
│   ├── app/           # Rotas da aplicação (file-based routing)
│   │   ├── _layout.tsx
│   │   └── index.tsx
│   └── styles/
│       └── global.css # Estilos globais Tailwind
├── assets/
│   └── images/
├── babel.config.js    # Configuração do Babel
├── metro.config.js    # Configuração do Metro bundler
├── tailwind.config.js # Configuração do Tailwind CSS
├── tsconfig.json      # Configuração do TypeScript
└── package.json
```

## Scripts Disponíveis

| Comando | Descrição |
|---------|-----------|
| `npm start` | Inicia o servidor Expo |
| `npm run android` | Inicia no Android |
| `npm run ios` | Inicia no iOS |
| `npm run web` | Inicia na web |
| `npm run lint` | Executa o ESLint |
| `npm run reset-project` | Reseta o projeto para estado inicial |

## Recursos Adicionais

- [Documentação Expo](https://docs.expo.dev/)
- [Tutorial Expo](https://docs.expo.dev/tutorial/introduction/)
- [NativeWind Docs](https://www.nativewind.dev/)
- [React Navigation](https://reactnavigation.org/)

## Comunidade

- [Expo no GitHub](https://github.com/expo/expo)
- [Discord Expo](https://chat.expo.dev)
