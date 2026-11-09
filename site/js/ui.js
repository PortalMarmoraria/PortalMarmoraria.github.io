"use strict";
// Interface compartilhada do Portal Marmoraria.
// - Renderiza a sidebar única (mesma largura e posição em todas as páginas).
// - Controla o menu sobreposto no mobile (abertura, fechamento, foco e Esc).
// - Mostra o usuário autenticado na topbar a partir da sessão já carregada.
// - Oferece UI.confirmar() para confirmações acessíveis.
// Este arquivo NÃO decide permissões: a ocultação de links é apenas navegação;
// as regras continuam no Supabase (RLS, funções e Edge Functions).
const UI = (() => {
  const script = document.currentScript;
  const raiz = new URL("../../", script.src);   // pasta do index.html
  const site = new URL("../", script.src);      // pasta site/
  const rel = caminho => new URL(caminho, raiz).href;

  const icones = {
    inicio: '<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V20a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V9.5"/>',
    criar: '<path d="M14 3H6a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8z"/><path d="M14 3v5h5"/><path d="M12 11v6M9 14h6"/>',
    historico: '<path d="M4 5h16M4 12h16M4 19h10"/>',
    usuarios: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.8-3.6 3.4-5.5 6.5-5.5s5.7 1.9 6.5 5.5"/><path d="M16 4.6a3.5 3.5 0 0 1 0 6.8M18 14.8c1.9.7 3.1 2.4 3.5 5.2"/>',
    sair: '<path d="M15 4h3a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-3"/><path d="M10 16l-4-4 4-4M6 12h10"/>',
    menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
    fechar: '<path d="M6 6l12 12M18 6 6 18"/>'
  };
  const svg = (nome, extra = "") =>
    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"${extra}>${icones[nome] || ""}</svg>`;

  const atual = document.body.dataset.page || "";
  const empresaGuardada = (() => { try { return localStorage.getItem("empresaSelecionada"); } catch { return null; } })();
  const hrefCriar = ["MS", "JD"].includes(empresaGuardada)
    ? rel(`site/tipo.html?empresa=${empresaGuardada}`) : rel("index.html");

  function link(id, pagina, href, rotulo, icone) {
    const corrente = atual === pagina ? ' aria-current="page"' : "";
    return `<a class="sidebar-link"${id ? ` id="${id}"` : ""} href="${href}" data-label="${rotulo}"${corrente}>${svg(icone)}<span class="sidebar-link-label">${rotulo}</span></a>`;
  }

  // ---------- Sidebar ----------
  const sidebar = document.getElementById("sidebar");
  if (sidebar) {
    sidebar.innerHTML = `
      <div class="sidebar-inner">
        <a class="sidebar-brand" href="${rel("index.html")}" aria-label="Portal Marmoraria · Início">
          <img src="${rel("img/portal-simbolo.png")}" alt="" width="22" height="42">
          <span class="sidebar-brand-text"><strong>Portal</strong><span>Marmoraria</span></span>
        </a>
        <button class="sidebar-close" type="button" id="sidebarClose" aria-label="Fechar menu">${svg("fechar")}</button>
        <nav class="sidebar-nav" aria-label="Navegação principal">
          <p class="sidebar-section">Documentos</p>
          ${link("", "inicio", rel("index.html"), "Início", "inicio")}
          ${link("createDocLink", "criar", hrefCriar, "Criar documento", "criar")}
          ${link("", "historico", rel("site/historico.html"), "Meus documentos", "historico")}
          <div id="navUsuarios" hidden>
            <p class="sidebar-section">Administração</p>
            ${link("", "usuarios", rel("site/usuarios.html"), "Gerenciar usuários", "usuarios")}
          </div>
        </nav>
        <div class="sidebar-footer">
          <button class="sidebar-link is-danger" type="button" id="logoutBtn" data-label="Sair">${svg("sair")}<span class="sidebar-link-label">Sair</span></button>
        </div>
      </div>`;
    const fundo = document.createElement("div");
    fundo.className = "sidebar-backdrop";
    fundo.setAttribute("aria-hidden", "true");
    sidebar.after(fundo);
    fundo.addEventListener("click", () => fecharMenu());
  }

  // ---------- Topbar: botão de menu + usuário ----------
  const topbar = document.querySelector(".topbar");
  let toggle = null;
  if (topbar) {
    toggle = document.createElement("button");
    toggle.type = "button";
    toggle.className = "menu-toggle";
    toggle.id = "menuToggle";
    toggle.setAttribute("aria-label", "Abrir menu");
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-controls", "sidebar");
    toggle.innerHTML = svg("menu");
    topbar.prepend(toggle);

    const usuario = document.createElement("div");
    usuario.className = "topbar-user";
    usuario.innerHTML = `<div class="topbar-user-text"><strong id="uiUserName">Carregando…</strong><span id="uiUserRole">Validando acesso</span></div><span class="avatar" id="uiUserAvatar" aria-hidden="true">·</span>`;
    topbar.append(usuario);
  }

  // ---------- Menu mobile ----------
  const mobile = window.matchMedia("(max-width: 767px)");
  let aberto = false;
  const focaveis = () => [...sidebar.querySelectorAll("a[href],button:not([disabled])")].filter(el => el.offsetParent !== null);

  function sincronizarInert() {
    if (!sidebar) return;
    sidebar.inert = mobile.matches && !aberto;
  }
  function abrirMenu() {
    if (!sidebar) return;
    aberto = true;
    document.body.classList.add("nav-open");
    sincronizarInert();
    toggle?.setAttribute("aria-expanded", "true");
    toggle?.setAttribute("aria-label", "Fechar menu");
    const destino = sidebar.querySelector('[aria-current="page"]') || focaveis()[0];
    requestAnimationFrame(() => destino?.focus());
  }
  function fecharMenu(devolverFoco = true) {
    if (!aberto) return;
    aberto = false;
    document.body.classList.remove("nav-open");
    sincronizarInert();
    toggle?.setAttribute("aria-expanded", "false");
    toggle?.setAttribute("aria-label", "Abrir menu");
    if (devolverFoco) toggle?.focus();
  }
  toggle?.addEventListener("click", () => (aberto ? fecharMenu() : abrirMenu()));
  document.getElementById("sidebarClose")?.addEventListener("click", () => fecharMenu());
  document.addEventListener("keydown", evento => {
    if (!aberto) return;
    if (evento.key === "Escape") { evento.preventDefault(); fecharMenu(); return; }
    if (evento.key === "Tab") {
      const lista = focaveis();
      if (!lista.length) return;
      const primeiro = lista[0], ultimo = lista[lista.length - 1];
      if (evento.shiftKey && document.activeElement === primeiro) { evento.preventDefault(); ultimo.focus(); }
      else if (!evento.shiftKey && document.activeElement === ultimo) { evento.preventDefault(); primeiro.focus(); }
    }
  });
  mobile.addEventListener?.("change", () => { if (!mobile.matches) fecharMenu(false); sincronizarInert(); });
  sincronizarInert();

  // ---------- Sair ----------
  document.getElementById("logoutBtn")?.addEventListener("click", async evento => {
    const botao = evento.currentTarget;
    if (botao.disabled || typeof Banco === "undefined") return;
    botao.disabled = true;
    botao.querySelector(".sidebar-link-label").textContent = "Saindo…";
    try {
      await Banco.sair();
      location.replace(rel("site/login.html"));
    } catch (erro) {
      botao.disabled = false;
      botao.querySelector(".sidebar-link-label").textContent = "Sair";
      await confirmar({ titulo: "Não foi possível sair", mensagem: erro.message || "Tente novamente em alguns instantes.", confirmar: "Entendi", somenteAviso: true });
    }
  });

  // ---------- Usuário autenticado ----------
  // Reaproveita a sessão que cada página já carrega (sem consultas extras).
  function aplicarPerfil(perfil) {
    if (!perfil) return;
    const nome = (perfil.nome || "Usuário").trim();
    const nomeEl = document.getElementById("uiUserName");
    if (nomeEl) {
      nomeEl.textContent = nome;
      document.getElementById("uiUserRole").textContent = Banco.nomePerfil();
      document.getElementById("uiUserAvatar").textContent = (nome[0] || "U").toUpperCase();
    }
    const admin = document.getElementById("navUsuarios");
    if (admin) admin.hidden = !perfil.principal;
    const criar = document.getElementById("createDocLink");
    const empresas = Array.isArray(perfil.empresas) ? perfil.empresas : [];
    if (criar) {
      const preferida = empresas.includes(empresaGuardada) ? empresaGuardada : empresas[0];
      criar.href = preferida ? rel(`site/tipo.html?empresa=${encodeURIComponent(preferida)}`) : rel("index.html");
    }
  }
  if (typeof Banco !== "undefined" && typeof Banco.sessao === "function" && !Banco.__uiConectado) {
    const original = Banco.sessao;
    Banco.sessao = async function (...args) {
      const perfil = await original.apply(this, args);
      try { aplicarPerfil(perfil); } catch {}
      return perfil;
    };
    Banco.__uiConectado = true;
  }

  // ---------- Mensagens de status ----------
  // Classifica o tom visual (carregando, erro, sucesso) e anima a atualização.
  const erroRe = /(não foi possível|não pode|não autoriz|não está autoriz|inválid|precisam ser iguais|selecione pelo menos|deve ser anterior|não encontrad|exclusiv|somente o administrador|entre na sua conta|entre novamente|acesso não|não foi salvo|não foi confirmad|indisponível|informe )/i;
  const sucessoRe = /(criado com|redefinida|atualizado\.|excluíd|salvas\.|salvo no banco|processado|já pode entrar)/i;
  function tom(texto) {
    const t = (texto || "").trim();
    if (!t) return "";
    if (/…$/.test(t)) return "loading";
    if (erroRe.test(t)) return "error";
    if (sucessoRe.test(t)) return "success";
    return "info";
  }
  function observarStatus(el) {
    if (!el || el.__uiObservado) return;
    el.__uiObservado = true;
    let anterior = el.textContent;
    const atualizar = () => {
      const texto = el.textContent;
      if (texto === anterior) return;
      anterior = texto;
      if (!el.classList.contains("error")) el.dataset.tone = tom(texto);
      else el.dataset.tone = "error";
      el.classList.remove("is-updated");
      void el.offsetWidth;
      if (texto.trim()) el.classList.add("is-updated");
    };
    el.dataset.tone = el.classList.contains("error") ? "error" : tom(el.textContent);
    new MutationObserver(atualizar).observe(el, { childList: true, characterData: true, subtree: true, attributes: true, attributeFilter: ["class"] });
  }
  document.querySelectorAll("[data-status]").forEach(observarStatus);

  // ---------- Confirmação ----------
  let dialogo = null;
  function confirmar({ titulo = "Confirmar ação", mensagem = "", confirmar: rotulo = "Confirmar", cancelar = "Cancelar", perigo = false, somenteAviso = false } = {}) {
    if (!dialogo) {
      dialogo = document.createElement("dialog");
      dialogo.className = "dialog";
      dialogo.setAttribute("aria-labelledby", "uiConfirmTitulo");
      dialogo.setAttribute("aria-describedby", "uiConfirmTexto");
      dialogo.innerHTML = `<form method="dialog" class="dialog-body">
          <h2 class="dialog-title" id="uiConfirmTitulo"></h2>
          <p class="dialog-text" id="uiConfirmTexto"></p>
          <div class="dialog-actions">
            <button class="btn" value="cancelar" id="uiConfirmCancelar"></button>
            <button class="btn" value="ok" id="uiConfirmOk"></button>
          </div>
        </form>`;
      document.body.append(dialogo);
    }
    dialogo.querySelector("#uiConfirmTitulo").textContent = titulo;
    dialogo.querySelector("#uiConfirmTexto").textContent = mensagem;
    const ok = dialogo.querySelector("#uiConfirmOk"), cancela = dialogo.querySelector("#uiConfirmCancelar");
    ok.textContent = rotulo;
    ok.className = "btn " + (perigo ? "btn-danger-solid" : "btn-primary");
    cancela.textContent = cancelar;
    cancela.hidden = somenteAviso;
    dialogo.returnValue = "";
    return new Promise(resolve => {
      dialogo.addEventListener("close", () => resolve(dialogo.returnValue === "ok"), { once: true });
      dialogo.showModal();
      (somenteAviso ? ok : cancela).focus();
    });
  }

  const ano = document.getElementById("ano");
  if (ano && !ano.textContent) ano.textContent = new Date().getFullYear();

  return { confirmar, observarStatus, fecharMenu, icone: svg, rel, site };
})();
