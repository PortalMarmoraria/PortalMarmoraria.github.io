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
|
├── index.html
├── principal.html
├── README.md
|
├── img/
│   ├── JD.png
│   └── MS.png
|
├── site/
│   ├── login.html
│   ├── tipo.html
│   ├── contrato.html
│   ├── orcamento.html
│   ├── recibo.html
│   ├── historico.html
│   ├── usuarios.html
│   ├── index.css
│   ├── conta.css
│   ├── geral.css
│   └── js/
│       ├── config.js
│       ├── banco.js
│       ├── login.js
│       ├── proteger.js
│       ├── gestao-api.js
│       └── ...
|
└── servicos/
```

*A estrutura apresenta os principais arquivos do frontend, sem listar todos os módulos JavaScript.*

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

O frontend é publicado a partir da branch `main` e da raiz do repositório.

A configuração de hospedagem é feita em:

`Settings → Pages → Build and deployment`

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
