# GDFinances

Sistema de gerenciamento de finanças pessoais inspirado no Mobills.

## Funcionalidades

- Sistema de Autenticação
  - Login com SQLite via sql.js
  - Hash SHA-256 para senhas
  - Usuários pré-configurados

- Interface Moderna
  - Design responsivo
  - Tema claro/escuro
  - Menu lateral com ícones
  - Dashboard com cards e gráficos
  - Layout similar ao Mobills

- Recursos
  - Gerenciamento de contas (CRUD)
  - Sistema de transações
  - Orçamentos
  - Metas financeiras
  - Gráficos com Chart.js
  - Exportação CSV

## Tecnologias

- Frontend:
  - HTML5
  - CSS3 (com variáveis CSS e Flexbox/Grid)
  - JavaScript (Vanilla)
  - Chart.js para gráficos
  - sql.js para banco local
  - Papa Parse para CSV

- Backend:
  - Python
  - Flask
  - SQLite
  - JWT para autenticação

## Instalação

1. Clone o repositório:
```bash
git clone https://github.com/seu-usuario/GDFinances.git
cd GDFinances
```

2. Instale as dependências do Python:
```bash
pip install -r requirements.txt
```

3. Execute o servidor:
```bash
python server.py
```

4. Acesse no navegador:
```
http://localhost:8000
```

## Usuários Padrão

- Administrador:
  - Email: admin
  - Senha: admin123

- Usuário:
  - Email: gabrielsilvadis@outlook.com
  - Senha: 12qw!@QW

## Estrutura do Projeto

```
GDFinances/
├── public/           # Arquivos estáticos
│   ├── index.html   # Página principal
│   ├── styles.css   # Estilos CSS
│   ├── script.js    # JavaScript principal
│   └── lib/         # Bibliotecas
├── server.py        # Servidor Flask
├── requirements.txt # Dependências Python
└── README.md        # Este arquivo
```

## Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.