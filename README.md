# 🏗️ Portal Marmoraria

### Sistema Web de Gestão de Documentos para Marmorarias

O **Portal Marmoraria** é um sistema web desenvolvido para facilitar a criação, organização e gerenciamento de documentos comerciais de empresas do setor de mármores e granitos.

O projeto surgiu da necessidade de digitalizar processos administrativos, reduzir tarefas manuais e centralizar documentos em um ambiente acessível pela internet.

Atualmente, o portal contempla duas empresas: **MS Marmoraria** e **JD Marmoraria**, permitindo utilizar suas respectivas identidades visuais.

🌐 **[Acessar o Portal Marmoraria](https://portalmarmoraria.github.io/)**

---

## 🚀 Funcionalidades

### 📄 Gestão de documentos

O sistema permite trabalhar com três tipos de documentos:

- **Contratos:** formalização de serviços, valores, condições de pagamento e prazos.
- **Orçamentos:** elaboração de propostas comerciais para clientes.
- **Recibos:** registro e comprovação de pagamentos recebidos.

Entre as funcionalidades implementadas estão:

- Formulários para preenchimento de documentos.
- Geração de arquivos PDF.
- Seleção da empresa responsável.
- Identidade visual específica para cada marmoraria.
- Integração com banco de dados na nuvem.
- Histórico de documentos com filtros de pesquisa.
- Visualização e recuperação de documentos armazenados.
- Controle de acesso por usuário.

### 🔐 Autenticação e usuários

O portal utiliza o **Supabase Authentication** para autenticação por e-mail e senha.

O sistema possui uma estrutura de gerenciamento de usuários com perfis e permissões específicas, incluindo controle de empresas autorizadas.

| Perfil | Finalidade |
|---|---|
| Administrador principal | Administração geral do portal e gerenciamento de contas |
| Administrador | Gerenciamento de documentos e operações administrativas autorizadas |
| Colaborador | Criação de documentos e acesso conforme as permissões atribuídas |
| Comercial | Operações comerciais relacionadas a contratos e orçamentos |
| Financeiro | Operações financeiras relacionadas a recibos e documentos autorizados |

**Nota:** os perfis Comercial e Financeiro estão previstos no frontend. A aplicação completa das permissões depende das políticas e migrações correspondentes no Supabase.

---

## 🛠️ Tecnologias utilizadas

| Tecnologia | Utilização |
|---|---|
| HTML5 | Estrutura das páginas |
| CSS3 | Estilização e interface |
| JavaScript | Lógica e interatividade |
| Supabase | Backend como serviço |
| PostgreSQL | Banco de dados relacional |
| Supabase Auth | Autenticação dos usuários |
| Supabase Storage | Armazenamento dos PDFs |
| Supabase Edge Functions | Operações administrativas do servidor |
| Git e GitHub | Versionamento do projeto |
| GitHub Pages | Hospedagem do frontend |
| Quill.js | Edição de conteúdo |
| html2pdf.js | Geração de documentos PDF |

---

## 🏛️ Arquitetura do sistema

O projeto utiliza uma arquitetura com frontend estático e serviços gerenciados na nuvem.

```text
           USUÁRIO
              |
              v
       GITHUB PAGES
      HTML / CSS / JS
              |
              | HTTPS
              v
           SUPABASE
              |
       +------+------+
       |      |      |
      Auth  Database Storage
       |      |      |
       |      |     PDFs
       |   PostgreSQL
       |
    Usuários
```

O GitHub Pages é responsável por disponibilizar a interface web. O Supabase fornece autenticação, persistência dos dados, armazenamento de arquivos e funções administrativas.

---

## 📁 Estrutura do projeto

```text
PortalMarmoraria.github.io/
├── index.html                 Início (empresas, perfil, documentos recentes)
├── principal.html             Redireciona para index.html
├── README.md
├── docs/                      Auditoria, design, alterações e relatório de testes
├── img/
│   ├── MS.png · JD.png        Logos das empresas (usados também no PDF)
│   ├── portal-logo.png        Logo oficial completo
│   └── portal-simbolo.png     Símbolo do logo (sidebar e favicon)
└── site/
    ├── login.html · tipo.html · contrato.html · recibo.html · orcamento.html
    ├── historico.html · usuarios.html · usuario-detalhes.html
    ├── css/
    │   ├── tokens.css         Design tokens (cores, tipografia, espaço, movimento)
    │   ├── base.css · layout.css · components.css · pages.css · login.css
    │   ├── documento-form.css Formulários e prévia
    │   └── documento-pdf.css  Regras do documento/PDF (não editar sem revisar o PDF)
    └── js/
        ├── config.js · banco.js · proteger.js · gestao-api.js   Dados e acesso
        ├── empresas.js · portal.js · nuvem.js                   PDF e salvamento
        ├── contrato.js · recibo.js · orcamento.js               Documentos
        ├── ui.js                                                Sidebar e interface compartilhada
        ├── documento-ui.js                                      Estados visuais dos formulários
        ├── correcao-logo-pdf.js                                 Correção proposta (não ativada)
        └── login.js · index.js · tipo.js · historico.js · usuarios.js · usuarios-ui.js · usuario-detalhes.js
```

---

## 🎨 Interface

O redesign transforma as páginas em um único produto: sidebar fixa à esquerda em todas as telas administrativas, topbar com o usuário autenticado, superfícies em granito escuro, ação primária em branco Carrara e acento petróleo extraído do logo. As cores MS e JD aparecem somente onde identificam a empresa.

- Desktop: sidebar completa · Tablet: trilho de ícones · Celular: menu sobreposto acessível.
- Acessibilidade: HTML semântico, rótulos associados, navegação por teclado, foco visível, modais nativos com foco, contraste AA e respeito a `prefers-reduced-motion`.
- Detalhes em [`docs/DESIGN.md`](docs/DESIGN.md).

**Regra de manutenção:** o conteúdo e o estilo do PDF ficam em `site/css/documento-pdf.css` e nos templates de `contrato.js`, `recibo.js` e `orcamento.js`. Mudanças de interface não devem tocar nesses pontos.

---

## 💻 Executar localmente

O projeto é estático e não tem etapa de build.

```bash
python3 -m http.server 8080
```

Abra `http://localhost:8080/site/login.html`. O login usa o Supabase configurado em `site/js/config.js`. Abrir os arquivos com `file://` não funciona por causa dos caminhos e do Supabase.

---

## 🔒 Segurança

O projeto contempla mecanismos de segurança como:

- Autenticação de usuários pelo Supabase.
- Separação de perfis e empresas autorizadas.
- Políticas Row Level Security (RLS) no PostgreSQL.
- Armazenamento privado dos documentos PDF.
- URLs temporárias para acesso aos arquivos.
- Validações no banco de dados.
- Operações administrativas por funções do servidor.

**Atenção:** as permissões de banco e Storage estão em processo de revisão e validação. As regras de acesso não devem depender exclusivamente das restrições implementadas na interface JavaScript.

Chaves secretas, credenciais administrativas e senhas não devem ser armazenadas no repositório público.

---

## ⚙️ Implantação

### GitHub Pages

1. Envie todos os arquivos para a branch `main`, mantendo `index.html` na raiz.
2. Em `Settings → Pages → Build and deployment`, escolha **Deploy from a branch**, branch `main`, pasta `/ (root)`.
3. Aguarde a publicação e acesse `https://<usuario>.github.io/`.
4. Remova do repositório os CSS e JS antigos listados em [`docs/ALTERACOES.md`](docs/ALTERACOES.md), caso ainda existam.
5. Depois de publicar, force a atualização do navegador (Ctrl+F5) para não usar CSS antigo do cache.

Todos os caminhos são relativos; o site funciona tanto na raiz de um domínio quanto em subpasta.

### Supabase

O projeto requer:

1. Um projeto Supabase configurado.
2. As tabelas e políticas SQL necessárias.
3. Autenticação por e-mail e senha.
4. Bucket privado para documentos.
5. Edge Functions utilizadas pelas operações administrativas.
6. URL pública e chave publishable configuradas no frontend.

A implantação do GitHub Pages não cria automaticamente a infraestrutura de banco de dados.

---

## ✅ Testes

O relatório completo, com o que foi e o que não foi testado, está em [`docs/RELATORIO-TESTES.md`](docs/RELATORIO-TESTES.md).

---

## 📈 Evolução do projeto

O Portal Marmoraria está em desenvolvimento contínuo.

Entre os pontos de evolução estão a revisão das permissões de cada perfil, o aprimoramento da gestão de usuários, a validação completa das operações de documentos e as melhorias de usabilidade.

O objetivo é oferecer uma solução cada vez mais segura, organizada e prática para a rotina administrativa das marmorarias.

---

## 👨‍💻 Desenvolvimento

**Eduardo Mathias**

Estudante de Engenharia de Software, com interesse em desenvolvimento web, bancos de dados, automação de processos e segurança da informação.

O Portal Marmoraria é um projeto desenvolvido para aplicar conhecimentos de engenharia de software na resolução de necessidades reais de empresas.

---

**Portal Marmoraria | Tecnologia aplicada à gestão de documentos.**
