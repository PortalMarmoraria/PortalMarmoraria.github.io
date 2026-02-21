// ===== PÁGINAS QUE NÃO DEVEM TER FOOTER =====
const paginasSemFooter = new Set(["contrato.html", "orcamento.html", "recibo.html"]);

// pega nome da página atual (robusto)
let paginaAtual = window.location.pathname.split("/").pop();
if (!paginaAtual) paginaAtual = "index.html"; // caso seja "/site/" etc

// se não estiver na lista proibida → cria footer
if (!paginasSemFooter.has(paginaAtual)) {
  // ===== CSS PREMIUM (injeta automático) =====
  const style = document.createElement("style");
  style.textContent = `
    body{ padding-bottom: 84px; }

    .footer{
      position: fixed;
      left: 0;
      bottom: 0;
      width: 100%;
      z-index: 9999;
      padding: 14px 18px;

      background: linear-gradient(
        90deg,
        rgba(2,6,23,.78),
        rgba(15,23,42,.72),
        rgba(2,6,23,.78)
      );
      border-top: 1px solid rgba(255,255,255,.10);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);

      animation: footerIn .55s ease-out both;
    }

    @keyframes footerIn{
      from{ transform: translateY(18px); opacity: 0; }
      to{ transform: translateY(0); opacity: 1; }
    }

    .footer::before{
      content:"";
      position:absolute;
      inset:0;
      pointer-events:none;
      background: radial-gradient(700px 60px at 50% 0%,
        rgba(255,255,255,.16),
        transparent 60%);
      opacity:.55;
    }

    .footer-container{
      position: relative;
      max-width: 1100px;
      margin: 0 auto;

      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 14px;
    }

    .footer-left{
      color: rgba(226,232,240,.85);
      font-size: 13px;
      display:flex;
      align-items:center;
      gap:8px;
      white-space: nowrap;
    }

    .footer-left strong{
      color:#fff;
      font-weight: 800;
    }

    .footer-right{
      display:flex;
      gap: 10px;
      align-items:center;
      flex-wrap: wrap;
    }

    .footer-btn{
      position: relative;
      display: inline-flex;
      align-items: center;
      gap: 8px;

      padding: 10px 14px;
      border-radius: 999px;

      color: rgba(226,232,240,.92);
      text-decoration: none;
      font-weight: 800;
      font-size: 13px;

      background: rgba(255,255,255,.06);
      border: 1px solid rgba(255,255,255,.16);

      transition: transform .18s ease, background .18s ease, border-color .18s ease, box-shadow .18s ease;
      will-change: transform;
    }

    .footer-btn:hover{
      transform: translateY(-2px);
      background: rgba(255,255,255,.10);
      border-color: rgba(255,255,255,.28);
      box-shadow: 0 12px 26px rgba(0,0,0,.25);
    }

    .footer-btn:active{
      transform: translateY(0px) scale(.98);
    }

    .footer-btn.primary{
      background: linear-gradient(135deg, rgba(34,197,94,.92), rgba(16,185,129,.82));
      border: 1px solid rgba(34,197,94,.35);
      color: #07120b;
      box-shadow: 0 14px 30px rgba(34,197,94,.18);
    }

    .footer-btn.primary:hover{
      box-shadow: 0 18px 34px rgba(34,197,94,.24);
      filter: brightness(1.02);
    }

    .footer-btn.primary::after{
      content:"";
      position:absolute;
      inset:-1px;
      border-radius: 999px;
      background: linear-gradient(90deg,
        transparent,
        rgba(255,255,255,.45),
        transparent
      );
      opacity: .0;
      transition: opacity .2s ease;
    }

    .footer-btn.primary:hover::after{
      opacity: .55;
      animation: shine 1.25s linear infinite;
    }

    @keyframes shine{
      from{ transform: translateX(-40%); }
      to{ transform: translateX(40%); }
    }

    @media (max-width: 720px){
      body{ padding-bottom: 110px; }
      .footer-container{
        flex-direction: column;
        align-items: flex-start;
      }
      .footer-left{
        white-space: normal;
        line-height: 1.2;
      }
    }
  `;
  document.head.appendChild(style);

  // ===== HTML (links absolutos, não quebra em nenhuma pasta) =====
  const footer = `
    <footer class="footer">
      <div class="footer-container">
        <div class="footer-left">
          © 2026 • Desenvolvido por <strong>Eduardo Mathias</strong>
        </div>

        <div class="footer-right">
          <a href="/site/index.html" class="footer-btn">🏢 Escolher Empresa</a>
        </div>
      </div>
    </footer>
  `;

  document.body.insertAdjacentHTML("beforeend", footer);
}
