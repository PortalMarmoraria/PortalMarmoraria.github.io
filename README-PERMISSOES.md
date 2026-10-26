# Perfis e permissões — Portal Marmoraria

**Estado:** implementado neste pacote; a ativação no Supabase exige o SQL e a publicação da função descritos em [ATIVAR-PERMISSOES.md](ATIVAR-PERMISSOES.md).

| Permissão | Colaborador | Comercial | Financeiro | Administrador | Admin principal |
| --- | --- | --- | --- | --- | --- |
| Criar orçamentos | Sim | Sim | Não | Sim | Sim |
| Criar contratos | Sim | Sim | Não | Sim | Sim |
| Criar recibos | Sim | Não | Sim | Sim | Sim |
| Visualizar e baixar | Apenas próprios | Contratos e orçamentos da equipe | Contratos e recibos da equipe | Todos | Todos |
| Editar salvos | Não | Apenas próprios orçamentos | Apenas próprios recibos | Todos | Todos |
| Excluir documentos | Não | Não | Não | Sim | Sim |
| Criar, editar e excluir usuários | Não | Não | Não | Não | Sim |
| Alterar perfis/empresas e redefinir senhas pela gestão | Não | Não | Não | Não | Sim |

Todas as permissões de documentos valem somente para as empresas autorizadas da conta: MS, JD ou ambas. A conta principal sempre acessa ambas. Não existe seleção de Admin principal no cadastro: ele é a identidade exclusiva definida pelo OWNER_ADMIN_ID e confirmada no banco.

A conta principal não pode ser excluída, desativada, rebaixada ou perder acesso a uma das empresas. As configurações estáticas das empresas permanecem sob controle do responsável pelo código; não foi adicionada uma tela para alterá-las.

Os documentos e PDFs são preservados quando uma conta é excluída. O ID do criador determina a autoria, mesmo que seu nome ou e-mail mude. As verificações no banco impedem acesso por URLs diretas e operações feitas fora dos botões da interface.

As contas que já existiam mantêm os perfis e começam com acesso a ambas empresas. Ajuste as empresas de cada conta na edição de usuários.
