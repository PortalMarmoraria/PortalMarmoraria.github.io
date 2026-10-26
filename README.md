# Portal Marmoraria no GitHub Pages

Site estático de MS e JD Marmoraria pronto para publicar no GitHub Pages.

## Publicação

1. Crie um repositório no GitHub. Para o endereço `https://SEU-USUARIO.github.io/` use o nome exato `SEU-USUARIO.github.io`. Para um repositório com outro nome, a URL será `https://SEU-USUARIO.github.io/NOME-REPO/`.
2. Envie **o conteúdo desta pasta diretamente à raiz do repositório**, incluindo `index.html`, `site/`, `servicos/`, `img/` e `.nojekyll`. Não coloque uma pasta adicional envolvendo tudo.
3. No repositório, acesse **Settings > Pages > Build and deployment**, selecione **Deploy from a branch**, escolha `main` e `/ (root)`, depois salve.
4. Após a publicação, abra a URL informada pelo GitHub Pages.

## Supabase e segurança

- O GitHub Pages hospeda somente o frontend. Login, registros, PDFs e controle de permissões continuam no Supabase configurado em `site/js/config.js`.
- A chave `sb_publishable_...` é pública por projeto; **jamais** coloque uma chave `service_role` ou outra chave secreta no repositório.
- As políticas RLS, as políticas de Storage, as tabelas e a Edge Function `dynamic-responder` devem já estar implantadas e configuradas no Supabase. A publicação no GitHub não implanta funções ou SQL.
- O navegador precisa acessar o Supabase e as bibliotecas externas (CDN).
- Se configurar autenticação com links ou redirecionamentos, adicione a URL de produção em Supabase > Authentication > URL Configuration, conforme o fluxo utilizado.

## Rotas

- `/index.html`: escolha da empresa (requer sessão ativa).
- `/site/login.html`: login.
- `/site/historico.html`: histórico.
- `/site/usuarios.html`: gestão administrativa conforme as permissões.

Os links internos são relativos e funcionam tanto no domínio `usuario.github.io` quanto em repositórios publicados em subcaminhos.

**Importante:** A pasta `banco/`, a pasta `supabase/` e os testes do ZIP original não integram este pacote do frontend. Guarde o ZIP original para manutenção do banco e das funções.
