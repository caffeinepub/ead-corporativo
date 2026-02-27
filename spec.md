# EAD Corporativo

## Current State

A plataforma EAD já está construída com:
- Login via Internet Identity
- Cadastro de alunos (nome, CPF, telefone, empresa)
- Aprovação manual pelo administrador
- Player de vídeo com bloqueio de avanço
- Painel administrativo completo
- Relatórios PDF e certificados com QR Code

O sistema usa `_initializeAccessControlWithSecret` para promover o primeiro usuário a admin, mas esse método **não está exposto** no `backend.d.ts` e **não é chamado** no fluxo de cadastro.

## Requested Changes (Diff)

### Add
- Chamar `_initializeAccessControlWithSecret` automaticamente no fluxo de cadastro, passando uma string vazia como token (o backend aceita qualquer valor quando não há admin ainda, desde que `adminAssigned = false`)
- Verificação silenciosa: se falhar (admin já existe), ignorar o erro e continuar o cadastro normalmente

### Modify
- `RegisterPage.tsx`: após salvar o perfil, tentar chamar `_initializeAccessControlWithSecret("")` antes de `requestApproval()`; se o usuário virar admin, redirecionar para `/admin` em vez de `/pending`
- `useQueries.ts`: adicionar hook `useInitializeAdmin` que chama `_initializeAccessControlWithSecret`

### Remove
- Nenhum

## Implementation Plan

1. Expor `_initializeAccessControlWithSecret` no `backend.d.ts` manualmente (adicionar à interface `backendInterface`)
2. Adicionar hook `useInitializeAdmin` em `useQueries.ts`
3. Modificar `RegisterPage.tsx` para chamar o hook e, se o usuário virar admin, redirecionar para `/admin`

## UX Notes

- O fluxo é transparente: o usuário não percebe a tentativa de inicialização
- Se já houver admin, o usuário segue o fluxo normal (aguarda aprovação)
- Apenas o primeiro usuário a se cadastrar vira admin automaticamente
