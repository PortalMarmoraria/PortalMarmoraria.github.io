# Portal Marmoraria

Portal para contratos, recibos e orçamentos de MS Marmoraria e JD Marmoraria, com login Supabase, salvamento automático de dados/PDFs e histórico conforme as permissões da conta.

## Ativar esta atualização

Siga [ATIVAR-PERMISSOES.md](ATIVAR-PERMISSOES.md): aplicar o SQL com seu UUID principal, atualizar a função dynamic-responder e publicar/abrir os arquivos do site.

## Permissões

A matriz aprovada e implementada está em [README-PERMISSOES.md](README-PERMISSOES.md). Há quatro perfis atribuíveis (Colaborador, Comercial, Financeiro e Administrador) e uma conta Admin principal exclusiva. Cada conta tem acesso a MS, JD ou ambas.

## Estrutura

- index.html: seleção de empresas autorizadas.
- site/: login, seleção de documentos, histórico e gestão de usuários.
- servicos/: formulários e geração de PDFs.
- banco/: schema inicial e migrações para projetos existentes.
- supabase/functions/gerenciar-usuarios/index.ts: código completo da função publicada no endereço dynamic-responder do seu projeto.
- tests/: testes de JavaScript, função administrativa e PostgreSQL local.

A configuração pública existente em site/js/config.js foi preservada. Chaves administrativas ficam apenas no Supabase. Para projetos existentes, não execute novamente banco/schema.sql.
