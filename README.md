

# 📦 Rastreador de Veículos

Aplicativo desenvolvido em **React Native com Expo** para rastrear veículos em tempo real.  
Cada motorista instala o app em seu celular, informa sua **placa**, e o sistema envia automaticamente a localização, status e precisão para um **webhook do n8n**, que organiza os dados em uma planilha centralizada.

---

## 🚀 Funcionalidades

- Registro de **placa individual** por motorista.  
- Rastreamento contínuo via **GPS** usando `expo-location`.  
- Envio automático de dados para **webhook n8n**.  
- Informações enviadas:
  - 📍 Latitude e longitude  
  - 🎯 Precisão do GPS  
  - 🚗 Status do veículo (ex.: ANDANDO, PARADO)  
  - ⏰ Último horário de envio  
- Estrutura de pastas organizada (`app/` para rotas, `src/` para lógica e estilos).  

---

## 🛠️ Tecnologias utilizadas

- [Expo](https://expo.dev/) – framework para React Native  
- [React Native](https://reactnative.dev/) – desenvolvimento mobile  
- [Expo Router](https://expo.github.io/router/docs) – navegação baseada em arquivos  
- [n8n](https://n8n.io/) – automação e integração com planilhas  
- [TypeScript](https://www.typescriptlang.org/) – tipagem estática  

---

## 📂 Estrutura de pastas

```
app/                  # Telas e rotas
  index.tsx           # Tela inicial
  modal.tsx           # Exemplo de modal
src/                  # Código compartilhado
  components/         # Componentes reutilizáveis
  hooks/              # Custom hooks
  services/           # Integrações externas (webhook, API)
  styles/             # Estilos globais
  utils/              # Funções utilitárias
assets/               # Imagens, fontes, ícones
types/                # Tipos TypeScript globais
```

---

## ⚙️ Instalação e uso

1. Clone o repositório:
   ```bash
   git clone https://github.com/seu-usuario/rastreio-apk.git
   cd rastreio-apk
   ```

2. Instale as dependências:
   ```bash
   npm install
   ```

3. Inicie o projeto:
   ```bash
   npx expo start
   ```

4. Escaneie o QR Code com o **Expo Go** no celular ou rode no emulador Android:
   ```bash
   npx expo start --android
   ```

---

## 📡 Configuração do Webhook

- Defina a URL do webhook n8n em `WEBHOOK_URL` no código.  
- O n8n deve estar configurado para receber os dados e gravar em uma planilha (Google Sheets, Excel, etc).  

---

## 👨‍💻 Contribuição

1. Crie uma branch a partir de `develop`:
   ```bash
   git checkout develop
   git checkout -b feature/nome-da-feature
   ```
2. Faça commits claros:
   ```bash
   feat: adicionar rastreamento de múltiplos veículos
   fix: corrigir precisão do GPS
   ```
3. Abra um Pull Request para `develop`.

---

## 📜 Licença

Este projeto é de uso interno e não possui licença pública definida.  

---

📌 Esse README já está pronto para ser usado no seu repositório.  

👉 Quer que eu te prepare também um **exemplo de workflow no n8n** (em Markdown com diagrama simples) para mostrar no README como os dados chegam e são gravados na planilha?
