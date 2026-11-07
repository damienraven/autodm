# Operação da instalação Dragon 3D

## Estado e ativação

A configuração privada `wrangler.jsonc` aponta para a conta do operador. O Worker se chama `dragon3d-autodm`, o binding é `DB` e `SELF.service` deve permanecer igual ao nome do Worker. O contato público autorizado é configurado por `CONTACT_EMAIL`.

O deploy inicial usa `SEND_MODE=disabled`, sem contas sociais. Deploy não comprova OAuth, webhook, entrega ou acesso público da Meta. A ausência de licença/autorização do código original continua uma pendência; o fork não substitui essa autorização.

Antes do piloto, conferir janelas da interação original, acesso concedido pela Meta e licença. Usar uma conta testadora autorizada, um post escolhido e link confirmado pelo operador. `SEND_MODE=test` exige IDs em `TEST_IG_USER_IDS`; não preencher com nomes de usuário. Não ativar `public` sem escolha explícita do operador e acesso aplicável. Manter follow e boas-vindas desligados no primeiro piloto.

## Criar e pausar

No painel: **Nova automação**, Instagram, comentário, **Escolher posts**, palavra-chave, mensagem curta e link confirmado. Conferir antes de ativar. O testador do painel apenas procura correspondência; ignora o filtro por post e não envia mensagens.

**Pausar** interrompe novos disparos da regra e descarta seus itens de fila antes do envio. Desligar boas-vindas controla a fila adicional. Uma requisição já transmitida não pode ser recolhida. Para pausa global do Instagram, definir `SEND_MODE=disabled` na configuração privada e publicar novamente; conferir o deploy. YouTube não está habilitado nesta instalação.

Há limite compartilhado de cinco tentativas por minuto e vinte por dia UTC. Respostas públicas e DMs consomem o mesmo orçamento; tentativas malsucedidas também podem consumir. A reserva de repetição por pessoa/regra é de 24 horas, incluindo tentativas iniciais que falharam. Não apagar reservas para contornar o limite.

## Falhas e consumo

Consultar **Atividade**: erros de autorização, limite, repetição, expiração e fila são situações diferentes. Comparar o horário do teste com os eventos. Não compartilhar registros com texto ou identificadores de clientes.

Na Cloudflare, acompanhar métricas do Worker e uso do D1, além das cotas/restrições apresentadas pela Meta. Começar no plano gratuito; não aprovar upgrade ou serviços pagos automaticamente. Para diagnóstico técnico privado:

```powershell
node node_modules/wrangler/bin/wrangler.js tail --config wrangler.jsonc
node node_modules/wrangler/bin/wrangler.js secret list --config wrangler.jsonc
```

`secret list` mostra nomes, não valores. Nunca abrir ou imprimir arquivos de autenticação do Wrangler, `.dev.vars`, dumps ou cópias de segredos.

## Backup e recuperação

Antes de atualizar, registrar o commit instalado e fazer exportação privada do D1:

```powershell
New-Item -ItemType Directory -Force backups | Out-Null
node node_modules/wrangler/bin/wrangler.js d1 export autodm --remote --config wrangler.jsonc --output backups/autodm-pre-update.sql
```

O SQL contém dados pessoais e pode conter credenciais em instalações antigas. A pasta ignorada pelo Git não é uma garantia de criptografia. Guardar backup em armazenamento privado cifrado, com acesso restrito, e substituir/remover cópias em até 30 dias conforme a política. Não anexar SQL ao chat ou versioná-lo.

Manter também uma cópia privada de `wrangler.jsonc`, o commit da versão e os segredos no gerenciador de senhas. A cópia técnica `backups/technical-secrets.dpapi.json` é cifrada pelo Windows e depende do mesmo usuário/computador. Não é um backup portátil: guardar `TOKEN_ENCRYPTION_KEY` e `IG_VERIFY_TOKEN` no gerenciador de senhas por fluxo privado antes de trocar de PC. Perder a chave exige reconectar a plataforma; não tentar decifrar com uma chave nova.

Na recuperação, primeiro deixar envios desativados. Conferir conta e banco, preservar o banco atual, restaurar o dump em banco de recuperação separado e revisar os dados antes de apontar o Worker para ele. Reaplicar pedidos de exclusão posteriores ao backup. Cadastrar os mesmos segredos, publicar o commit registrado e testar login e regras antes de reconectar plataformas. Rollback do código no Cloudflare não desfaz migrações do banco.

## Atualizar

Preservar alterações locais e configuração privada. Revisar o diff da versão, fazer backup, executar `npm ci`, `npm test`, `npm run typecheck` e `git diff --check`. Aplicar novas migrações somente depois da conferência de conta/banco. Publicar a versão revisada e verificar o painel HTTPS, conexões e atividade. Não usar force-push ou `git reset --hard` como rotina de atualização.

O ambiente desta instalação reutiliza o npm em `../Ferramentas/video-analyzer/npm/package/bin/npm-cli.js`. Enquanto não houver npm no PATH, substituir `npm <comando>` por `node ../Ferramentas/video-analyzer/npm/package/bin/npm-cli.js <comando>`. Não reinstalar Node compatível sem necessidade.

## Pedidos de exclusão

O operador recebe solicitações pelo contato da política, confirma proporcionalmente a identidade e registra o andamento em local privado. Nunca pedir senha ou token da pessoa.

Pausar a automação envolvida, identificar o usuário e revisar os registros correspondentes. Excluir desse usuário os contatos, eventos, fila, reservas de repetição e identificadores de deduplicação associados às referências, respeitando eventual obrigação de retenção. Os IDs de deduplicação não guardam diretamente o usuário: levantar referências antes de apagar eventos. A execução requer consulta parametrizada e revisão de contagens, sem exportar dados de outros usuários. Não existe botão completo de exclusão no painel.

Registrar apenas a comprovação mínima da solicitação atendida. Tratar backups conforme a retenção de até 30 dias e reaplicar a exclusão antes de restaurar. Desconectar a conta do operador remove suas configurações locais; também revogar o aplicativo na plataforma quando necessário. Esses procedimentos precisam ser cumpridos pelo operador; os testes não certificam conformidade legal ou com a Meta.
