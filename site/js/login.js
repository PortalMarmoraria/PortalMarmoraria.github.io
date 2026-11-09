"use strict";
// Login por senha e por código, com validação do perfil já existente no Supabase.
// O usuário somente pode ser cadastrado / ter a senha redefinida pelo administrador.
(() => {
  const $ = id => document.getElementById(id);
  const form = $("loginForm");
  const email = $("email");
  const senha = $("senha");
  const codigo = $("codigoEmail");
  const status = $("status");
  const button = $("entrar");
  const submitText = $("submitText");
  const tabCode = $("tabCode");
  const tabPassword = $("tabPassword");
  const step = $("codeStep");
  const helper = $("codeHelper");
  let mode = "password";
  let awaitingCode = false;
  let emailCodeSent = "";

  const report = (message, kind = "") => {
    status.textContent = message;
    status.className = "status" + (kind ? ` ${kind}` : "");
  };
  const switchMode = newMode => {
    if (button.disabled) return;
    mode = newMode;
    awaitingCode = false;
    emailCodeSent = "";
    senha.value = "";
    codigo.value = "";
    codigo.disabled = true;
    step.classList.add("hidden");
    document.querySelectorAll(".password-mode").forEach(el => el.classList.toggle("hidden", mode !== "password"));
    tabCode.classList.toggle("active", mode === "code");
    tabPassword.classList.toggle("active", mode === "password");
    tabCode.setAttribute("aria-pressed", String(mode === "code"));
    tabPassword.setAttribute("aria-pressed", String(mode === "password"));
    senha.required = mode === "password";
    codigo.required = false;
    helper.classList.toggle("hidden", mode !== "code");
    helper.textContent = "Enviaremos um código para o e-mail cadastrado.";
    submitText.textContent = mode === "code" ? "Enviar código" : "Entrar";
    report("");
  };
  tabCode.addEventListener("click", () => switchMode("code"));
  tabPassword.addEventListener("click", () => switchMode("password"));
  $("toggleSenha").addEventListener("click", () => {
    const show = senha.type === "password";
    senha.type = show ? "text" : "password";
    $("toggleSenha").setAttribute("aria-pressed", String(show));
    $("toggleSenha").setAttribute("aria-label", show ? "Ocultar senha" : "Mostrar senha");
  });
  email.addEventListener("input", () => {
    if (mode === "code" && awaitingCode && email.value.trim().toLowerCase() !== emailCodeSent) {
      awaitingCode = false;
      codigo.value = "";
      codigo.disabled = true;
      codigo.required = false;
      step.classList.add("hidden");
      submitText.textContent = "Enviar código";
      report("O e-mail foi alterado. Solicite um novo código.");
    }
  });

  const authenticated = async () => {
    try { await Banco.sessao(); }
    catch (err) {
      try { await Banco.sair(); } catch {}
      throw err;
    }
    location.replace("../index.html");
  };

  form.addEventListener("submit", async ev => {
    ev.preventDefault();
    if (button.disabled) return;
    const account = email.value.trim().toLowerCase();
    if (!account) { report("Informe seu e-mail.", "error"); return; }
    button.disabled = true;
    report(mode === "code" ? (awaitingCode ? "Confirmando código…" : "Enviando código…") : "Entrando…");
    try {
      if (mode === "password") {
        await Banco.entrar(account, senha.value);
        location.replace("../index.html");
      } else if (!awaitingCode) {
        // shouldCreateUser false evita criar contas fora da gestão do administrador.
        const { error } = await Banco.iniciar().auth.signInWithOtp({
          email: account,
          options: { shouldCreateUser: false }
        });
        if (error) throw new Error("Não foi possível enviar o código. Verifique a conta ou tente novamente.");
        emailCodeSent = account;
        awaitingCode = true;
        codigo.disabled = false;
        codigo.required = true;
        step.classList.remove("hidden");
        submitText.textContent = "Confirmar código";
        helper.textContent = "Digite o código recebido. Para pedir outro, selecione Senha e depois Código por e-mail novamente.";
        report("Se o e-mail estiver autorizado, você receberá um código de acesso.", "success");
        codigo.focus();
      } else {
        const token = codigo.value.trim();
        if (!/^[0-9]{6,8}$/.test(token)) throw new Error("Informe o código numérico recebido por e-mail.");
        const { error } = await Banco.iniciar().auth.verifyOtp({ email: emailCodeSent, token, type: "email" });
        if (error) throw new Error("Código inválido ou expirado. Solicite outro código.");
        await authenticated();
      }
    } catch(err) {
      report(err?.message || "Não foi possível entrar. Tente novamente.", "error");
    } finally {
      senha.value = "";
      button.disabled = false;
    }
  });
})();
