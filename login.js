"use strict";
const loginForm = document.getElementById("loginForm");
loginForm.addEventListener("submit", async evento => {
  evento.preventDefault();
  const botao = document.getElementById("entrar"), status = document.getElementById("status");
  botao.disabled = true; status.textContent = "Entrando…";
  const senha = document.getElementById("senha");
  try {
    await Banco.entrar(document.getElementById("email").value.trim(), senha.value);
    location.replace("../index.html");
  } catch (erro) {status.textContent = erro.message;}
  finally {senha.value = ""; botao.disabled = false;}
});
