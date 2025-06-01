# GDFinances

Sistema de gerenciamento financeiro pessoal com interface moderna e funcionalidades completas.

## Funcionalidades

- ✨ Interface moderna e responsiva
- 🔐 Sistema de autenticação seguro
- 💰 Gerenciamento de múltiplas contas
- 📊 Visualização de fluxo de caixa
- 💳 Controle de transações
- 📅 Orçamentos mensais
- 🎯 Metas financeiras
- 🌓 Tema claro/escuro

## Tecnologias Utilizadas

- Frontend:
  - HTML5
  - CSS3 (com variáveis CSS e flexbox/grid)
  - JavaScript (ES6+)
  - Chart.js para gráficos
  
- Backend:
  - Node.js
  - Express
  - SQLite3
  - JWT para autenticação
  - Bcrypt para criptografia

## Instalação

1. Clone o repositório:
```bash
git clone https://github.com/seu-usuario/gdfinances.git
cd gdfinances
```

2. Instale as dependências:
```bash
npm install
```

3. Inicie o servidor:
```bash
npm start
```

4. Acesse o sistema em `http://localhost:3000`

## Desenvolvimento

Para rodar em modo desenvolvimento com hot-reload:
```bash
npm run dev
```

## Estrutura do Projeto

```
gdfinances/
├── public/           # Arquivos estáticos
│   ├── index.html   # Página principal
│   ├── styles.css   # Estilos
│   ├── script.js    # JavaScript frontend
│   └── lib/         # Bibliotecas de terceiros
├── server.js        # Servidor Express
├── database.sqlite  # Banco de dados SQLite
└── package.json     # Dependências e scripts
```

## Contribuição

1. Faça o fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/nova-feature`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova feature'`)
4. Push para a branch (`git push origin feature/nova-feature`)
5. Abra um Pull Request

## Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.