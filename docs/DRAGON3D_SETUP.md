# Primeiro teste da Dragon 3D

Objetivo desta etapa: abrir o painel no computador, usando somente banco local e sem conectar contas sociais.

## Codex no computador

Use uma conversa do Codex com execução local no PC. Uma sessão em nuvem não instala o projeto no Windows.

1. Confira Git, Node.js 22.12+ e npm. Reaproveite versões compatíveis.
2. Clone `https://github.com/damienraven/autodm.git` para uma pasta própria. Se já existir uma cópia, confira o remoto e o estado do Git; preserve alterações pessoais.
3. Leia `README.md` e `AGENTS.md`. Use a branch revisada `fix/expired-pending-sends` enquanto a correção não estiver incorporada à `main`.
4. Leia os scripts e instale com `npm ci`.
5. Execute `npm test` e `npm run typecheck`. Eles não enviam mensagens reais.
6. No PowerShell, crie o arquivo local apenas se não existir: `Copy-Item .dev.vars.example .dev.vars`. O operador deve preencher `ADMIN_PASSWORD` diretamente no editor, sem enviar o valor ao chat. Deixe as integrações vazias.
7. Execute `npm run db:migrate:local` e `npm run dev`.
8. Abra `http://localhost:8787/admin`. O operador entra com a senha e confere o painel. As contas sociais devem aparecer desconectadas.

Não versionar `.dev.vars`, `.wrangler`, dumps, configurações de produção ou segredos. Os processos locais param com Ctrl+C; o banco emulado fica em `.wrangler/`.

## Critério para encerrar o teste local

- Painel acessível e protegido por senha.
- Testes e verificação de tipos concluídos.
- Banco criado somente no ambiente local.
- Instagram e YouTube desconectados; nenhum envio real.

Se algo falhar, registre o comando e a mensagem de erro sem segredos. Diferencie dependências instaladas, testes concluídos e painel efetivamente aberto.

## Próximas etapas

Antes de produção, revisar as pendências de licença, autenticação do painel, proteção dos tokens e controle de volume. A correção desta branch cobre o prazo registrado na fila; não certifica todas as regras da Meta nem implementa um limitador global.

Depois do teste local:

1. Preparar a conta Cloudflare do operador, Worker, D1 e configuração própria; manter `SELF.service` igual ao nome do Worker.
2. Cadastrar segredos por entrada interativa, revisar `/privacy` e publicar a instalação preparada.
3. Configurar o app da Meta, OAuth e webhook, conforme as permissões e exigências atuais da plataforma.
4. Fazer um teste autorizado com conta testadora e uma regra restrita a um post. O uso público depende do acesso concedido pela Meta.

Publicar um fork no GitHub não publica o serviço na Cloudflare. Não executar comandos de migração remota ou deploy durante o primeiro teste local.
