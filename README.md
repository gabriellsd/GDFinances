# GDFinances

Sistema de gerenciamento de finanças pessoais inspirado no Mobills.

## Funcionalidades

### Sistema de Autenticação
- Login com SQLite via sqljs
- Hash SHA-256 para senhas
- Usuários pré-configurados

### Interface Moderna
- Design responsivo
- Tema claro/escuro
- Menu lateral com ícones
- Dashboard com cards e gráficos
- Layout similar ao Mobills

### Recursos
- Gerenciamento de contas (CRUD)
- Sistema de transações
- Orçamentos
- Metas financeiras
- Gráficos com Chart.js
- Exportação CSV

## Tecnologias

### Frontend:
- HTML5
- CSS3 (com variáveis CSS e Flexbox/Grid)
- JavaScript (Vanilla)
- Chart.js para gráficos
- sql.js para banco local
- Papa Parse para CSV

### Backend:
- Python
- Flask
- SQLite
- JWT para autenticação

## Instalação

1. Clone o repositório:
```bash
git clone https://github.com/gabriellsd/GDFinances.git
cd GDFinances
```

2. Instale as dependências do Python:
```bash
python -m venv venv
source venv/bin/activate  # Linux/Mac
venv\Scripts\activate     # Windows
pip install -r requirements.txt
```

3. Inicie o servidor:
```bash
python server.py
```

4. Abra o navegador e acesse:
```
http://localhost:5000
```

## Desenvolvimento

Para contribuir com o projeto:

1. Faça um fork do repositório
2. Crie uma branch para sua feature (`git checkout -b feature/MinhaFeature`)
3. Faça commit das mudanças (`git commit -m 'Adicionando nova feature'`)
4. Push para a branch (`git push origin feature/MinhaFeature`)
5. Abra um Pull Request

## Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.