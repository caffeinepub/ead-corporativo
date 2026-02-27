# EAD Corporativo

## Current State
Projeto novo, sem código existente.

## Requested Changes (Diff)

### Add
- Sistema de autenticação com login/senha (e-mail + senha) com dois perfis: Aluno e Administrador
- Tela de cadastro do aluno com campos: nome completo, CPF, e-mail, telefone, empresa, senha
- Status inicial do aluno: "Aguardando aprovação administrativa"
- Painel administrativo com gestão de alunos (aprovar, bloquear, excluir) e filtros por status
- Painel administrativo com gestão de cursos: criar curso, módulos, upload de URL de vídeo, ordem obrigatória
- Área do aluno: lista de módulos e aulas, barra de progresso, percentual de conclusão
- Player de vídeo controlado: sem avanço manual, só pausa/continua, registra tempo assistido, libera próxima aula só após 100% da atual
- Logs de acesso: data, horário entrada/saída, tempo total logado, tempo assistido por aula, identificador de sessão
- Relatórios individuais no painel admin: nome, CPF, curso, datas/horários de acesso, tempo total, percentual de conclusão
- Exportação de relatório em PDF (via jsPDF no frontend)
- Certificado automático ao completar 100% do curso, com QR Code de validação
- Design responsivo em azul escuro (#0D2B55) e branco, visual corporativo profissional

### Modify
Nada (projeto novo).

### Remove
Nada (projeto novo).

## Implementation Plan
1. Backend Motoko:
   - Entidades: User (id, name, cpf, email, phone, company, passwordHash, role, status), Course, Module, Lesson, AccessLog, LessonProgress, Certificate
   - APIs: register, login, getUserProfile, listUsers (admin), approveUser, blockUser, deleteUser
   - APIs: createCourse, updateCourse, listCourses, getCourse, createModule, createLesson, reorderLessons
   - APIs: getLessonProgress, updateLessonProgress (com tempo assistido), completLesson
   - APIs: logAccess (entrada/saída), getUserReport, listReports
   - APIs: generateCertificate, validateCertificate (por QR Code)
   - Controle de permissão por role (admin/student)

2. Frontend React:
   - Rota /login: tela com e-mail, senha, botões Entrar / Cadastrar-se / Esqueci minha senha
   - Rota /register: formulário de cadastro do aluno
   - Rota /pending: tela de aguardando aprovação
   - Rota /dashboard (aluno): lista de cursos aprovados, progresso
   - Rota /course/:id: módulos e aulas com player controlado
   - Rota /certificate/:id: certificado com QR Code
   - Rota /admin: painel admin com abas: Alunos, Cursos, Relatórios
   - Player customizado: sem seekbar arrastável, barra de progresso só leitura, auto-avança quando 100%
   - Exportação PDF via jsPDF

## UX Notes
- Cores: azul escuro #0D2B55 como primária, branco como fundo/texto, accent azul médio #1E5FAD
- Tipografia limpa, espaçamentos generosos, visual corporativo
- Mobile-first, totalmente responsivo
- Mensagem clara para alunos aguardando aprovação
- Certificado imprimível com QR Code que valida autenticidade
