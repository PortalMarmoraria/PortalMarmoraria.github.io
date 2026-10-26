# Ativar os perfis e permissões

Esta atualização implementa a divisão aprovada: Colaborador, Comercial, Financeiro, Administrador e Admin principal. A gestão de usuários continua exclusiva da conta principal. O endereço da função existente continua sendo dynamic-responder.

## 1. Atualizar o banco no Supabase

Como você já ativou a edição/exclusão de usuários, a migração anterior `atualizar-gestao-usuarios.sql` já deve estar aplicada. Para um projeto novo, a ordem é schema.sql, atualizar-gestao-usuarios.sql e atualizar-permissoes.sql. Para o seu projeto existente, execute somente a migração nova a seguir.

1. Abra `banco/atualizar-permissoes.sql` no VS Code.
2. Encontre a linha:

```sql
declare dono uuid := 'COLE_O_OWNER_ADMIN_ID'; c record;
```

3. Troque COLE_O_OWNER_ADMIN_ID pelo UUID da sua conta principal, o mesmo do secret OWNER_ADMIN_ID. Mantenha as aspas. O UUID está em Authentication > Users, no seu usuário. Não escolha outro administrador e não use o e-mail.
4. Copie o arquivo completo para uma nova consulta no SQL Editor do Supabase e clique Run.
5. O resultado esperado é Success. No rows returned. Se houver erro, não prossiga com a publicação até resolver.

O SQL é transacional e pode ser repetido com o mesmo UUID. Não apaga documentos, PDFs ou contas. As contas existentes mantêm seus perfis atuais e começam autorizadas para MS e JD. A sua conta é marcada como principal e mantém ambas empresas. Ajuste depois as empresas de cada conta na edição de usuários.

A migração substitui as políticas conhecidas deste projeto. Caso você tenha criado outras políticas de acesso a documentos/PDFs fora do pacote, revise-as para evitar permissões adicionais.

## 2. Atualizar a função

1. No Supabase, vá a Edge Functions e abra a função cujo endereço termina em /dynamic-responder.
2. Abra Code > index.ts.
3. Substitua TODO o código pelo conteúdo de `supabase/functions/gerenciar-usuarios/index.ts` deste pacote.
4. Clique Save and deploy / Deploy.
5. Mantenha Verify JWT desativado. A função valida o token pelo Supabase Auth e exige que o UUID, o perfil admin ativo e a marca de conta principal correspondam à sua conta.

OWNER_ADMIN_ID e ALLOWED_ORIGINS continuam com os mesmos valores. Nunca coloque uma chave administrativa no código do navegador.

## 3. Abrir o site atualizado

1. Abra a pasta deste pacote no VS Code e execute o Live Server no index.html.
2. Saia da conta, pressione Ctrl + F5 e entre novamente.
3. Em Gerenciar usuários, agora há quatro perfis selecionáveis e as opções de MS e JD.
4. Escolha pelo menos uma empresa ao criar ou editar uma conta.
5. A conta principal aparece com esse nome, mas não pode ser atribuída a outra conta pelo formulário.

Para publicar no GitHub Pages, atualize os arquivos do repositório com o conteúdo deste pacote. O banco e a função devem ser atualizados antes.

## 4. Validar no seu Supabase

Use contas de teste para conferir:

- Colaborador: cria os três tipos, vê apenas os próprios e não edita documentos salvos.
- Comercial: cria contratos/orçamentos, vê os contratos/orçamentos da equipe e edita somente os próprios orçamentos.
- Financeiro: cria recibos, vê contratos/recibos da equipe e edita somente os próprios recibos.
- Administrador: cria, visualiza, edita e exclui documentos, somente das empresas autorizadas; não gerencia usuários.
- Admin principal: acessa ambas empresas e mantém a gestão exclusiva de usuários.
- Uma conta autorizada somente para MS não acessa documentos/PDFs da JD, inclusive por links diretos.

## Detalhes de funcionamento

As regras são aplicadas na interface, nas políticas de documentos e nas políticas do bucket privado documentos. A função administrativa valida os perfis e empresas antes de gravar contas. Contas inativas não acessam documentos.

Mudanças de acesso valem para novas operações no banco. Atualize a página para refletir novos botões/empresas. Um PDF já baixado não pode ser recolhido; um link assinado já emitido pode continuar funcionando até sua expiração de até 5 minutos.

A exclusão de usuários continua preservando os documentos e PDFs. O Colaborador não passa a ver documentos de uma conta excluída: a autoria permanece identificada na auditoria, mas não pertence à conta atual.

A limpeza dos PDFs de documentos excluídos respeita a empresa da tarefa. Tarefas antigas sem empresa podem ser concluídas apenas por administradores com ambas empresas autorizadas.

A configuração das empresas no site ainda é mantida pelo responsável pelo código. Esta atualização não cria uma tela de configuração das empresas.

## Testes executados

- 41 testes JavaScript/servidor com respostas simuladas.
- 1.104 verificações em PostgreSQL local via PGlite: matriz de leitura/criação/edição/exclusão, RLS de documentos e PDFs, restrição por empresa, proteção da conta principal, migração repetida e exclusão preservando documentos.
- Conferência de sintaxe dos scripts.

A validação em produção ainda depende de aplicar a migração e publicar a função no seu projeto. Testes locais não usam sua conta Supabase.

Para executar novamente os testes JavaScript na pasta do projeto:

```bash
node --test tests/*.cjs tests/*.mjs
```

Para os testes PostgreSQL locais (dependência usada somente para testes):

```bash
npm install --no-save @electric-sql/pglite
node tests/sql/permissoes.mjs
```
