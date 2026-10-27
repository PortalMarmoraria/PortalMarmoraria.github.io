"use strict";
const escolha = new URLSearchParams(location.search).get("empresa");
if (["MS", "JD"].includes(escolha)) localStorage.setItem("empresaSelecionada", escolha);
const selecionada = localStorage.getItem("empresaSelecionada");
if (!["MS", "JD"].includes(selecionada)) location.replace("../index.html");
else document.getElementById("empresaNome").textContent = selecionada + " Marmoraria";
document.getElementById("ano").textContent = new Date().getFullYear();
