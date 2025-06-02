# Guia de Restore no Git

## Ver histórico de commits
```bash
# Ver os últimos 5 commits
git log --oneline -n 5

# Ver histórico completo
git log
```

## Opção 1: Reverter mantendo histórico (Recomendado)
```bash
# Reverter para um commit específico mantendo histórico
git revert --no-commit HASH_DO_COMMIT..HEAD
git commit -m "revert: Voltando ao estado do commit HASH_DO_COMMIT"
git push origin main
```

## Opção 2: Reset (Descarta histórico)
```bash
# Hard reset - CUIDADO: descarta todas as alterações
git reset --hard HASH_DO_COMMIT
git push origin main --force

# Soft reset - Mantém alterações no stage
git reset --soft HASH_DO_COMMIT
git push origin main --force
```

## Exemplo de uso
1. Ver commits disponíveis:
```bash
git log --oneline -n 5
```

2. Copiar o hash do commit desejado (exemplo: 2c60b3e)

3. Fazer revert (mantendo histórico):
```bash
git revert --no-commit 2c60b3e..HEAD
git commit -m "revert: Voltando ao estado do commit 2c60b3e"
git push origin main
```

## Dicas importantes
- Sempre faça backup antes de operações destrutivas
- Prefira usar `revert` ao invés de `reset`
- O `revert` é mais seguro pois mantém o histórico
- Use `reset` apenas se realmente precisar apagar o histórico
- Após `reset --force`, todos da equipe precisarão fazer `git pull --force`

## Desfazer alterações locais
```bash
# Desfazer alterações em um arquivo específico
git checkout -- nome-do-arquivo

# Desfazer todas as alterações locais
git checkout -- .

# Desfazer último commit (mantendo alterações)
git reset --soft HEAD~1
``` 