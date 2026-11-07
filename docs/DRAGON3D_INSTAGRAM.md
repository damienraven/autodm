# Instagram na instalação da Dragon 3D

Em 7 de novembro de 2026, a Dragon 3D validou a conexão de `@dragon3d.oficial`, o recebimento de eventos de comentários e uma resposta privada no piloto CAMADA. O piloto foi pausado após o teste. A versão publicada ao encerrar o piloto foi `eb3aaeae-7040-4237-9886-23177b88d6af`, com `SEND_MODE=disabled` e lista de destinatários de teste vazia.

## Configuração da integração

- O app próprio **Dragon 3D AutoDM** pertence ao portfólio empresarial Dragon 3D. O app Feed ficou separado.
- Em **API setup with Unified login**, a configuração **Geral** pede apenas o ativo Conta do Instagram, com `instagram_basic`, `instagram_manage_comments` e `instagram_manage_messages`. O token de usuário do sistema foi configurado para 60 dias. O modelo predefinido da Meta incluía permissões adicionais e foi descartado.
- Cadastre o callback OAuth `https://<worker>/auth/instagram/callback` na Meta. Configure `IG_LOGIN_MODE=unified`, `IG_APP_ID`, `IG_LOGIN_URL` com a URL gerada pela Meta, e `IG_EXPECTED_USERNAME` com a conta esperada. A versão publicada também usa `IG_EXPECTED_ACCOUNT_ID`, com o ID do perfil conferido no portfólio. Mantenha a configuração específica da instalação em `wrangler.jsonc` privado.
- Cadastre `IG_APP_SECRET`, `IG_VERIFY_TOKEN` e `TOKEN_ENCRYPTION_KEY` por entrada privada no Worker. Use a mesma chave de verificação no campo **Verificar token** da Meta. No app, salve `https://<worker>/webhooks/instagram` e assine `comments`, `messages` e `messaging_postbacks`. O Worker valida a assinatura dos POSTs antes de processá-los.
- Aceite o convite de testador na conta profissional quando a Meta exigir. No painel do AutoDM, conecte o Instagram e autorize somente a conta esperada. Confirme que o perfil aparece no painel e que o seletor de publicações carrega.

## Como o login foi implementado

O Worker preserva o identificador da configuração de login da Meta e valida o estado do OAuth no retorno. Troca o código por token na Graph API do Facebook (v27.0 na versão validada), confirma a identidade da conta e registra a assinatura da conta antes de salvar o token cifrado no D1. O modo unificado usa o ID do perfil nas consultas e acompanha a expiração do token. Reconecte pelo painel quando necessário.

Durante a implantação, a Meta autorizou o ativo no portfólio, mas retornou uma lista vazia em `/me/assigned_instagram_accounts`. Na versão publicada, o AutoDM consulta diretamente o ID configurado com o mesmo token nesse caso. A conexão só prossegue se a API confirmar o ID e o nome de usuário esperados. Esse ajuste estava no checkout da instalação, ainda sem commit quando este guia foi preparado. O login pelo Instagram e o carregamento de posts funcionaram com a versão publicada.

## Evidência do piloto

- Com os envios desativados, o Worker respondeu HTTP 200 a requisições assinadas logo após o comentário da própria conta e o comentário de visitante. O monitor correlacionou os eventos pelo horário, sem inspecionar o corpo das requisições.
- A regra **Piloto CAMADA — 21/09/2025** ficou restrita a [uma publicação](https://www.instagram.com/p/DO3Xw4bEjgQ/). Para o envio de teste, `SEND_MODE=test` e `TEST_IG_USER_IDS` limitaram a entrega a um único destinatário identificado pelo ID do Instagram.
- O destinatário confirmou que recebeu a mensagem de teste no Direct. O painel registrou um disparo, um Direct e zero respostas públicas. O piloto não tinha link, exigência de seguir ou mensagem adicional.
- Ao encerrar, a regra foi pausada, o Worker voltou a `SEND_MODE=disabled` e a lista temporária foi esvaziada. Consulte o [guia de operação](DRAGON3D_OPERATIONS.md) para pausar regras, acompanhar registros e planejar recuperação.

## Revisão da Meta em espera

O portfólio aparece como verificado. Na configuração básica do app foram salvas a política de privacidade, as instruções de exclusão, a categoria **Utilitários e produtividade** e o ícone. O pedido de análise ficou em rascunho, sem submissão. A seção **Uso permitido** ainda exige as evidências indicadas para cada permissão, incluindo gravação e chamadas de teste onde solicitadas.

O piloto não comprova liberação para o público. A lista de funções atual não mostrou uma atribuição direta para o perfil destinatário, mas a consulta ao Business Suite não confirmou todas as atribuições na data do teste. A autorização de uso do código original em produção também segue pendente, separadamente da revisão da Meta.

