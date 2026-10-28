/* イナプリ 応用物理 解答解説  共通スクリプト */
document.addEventListener("DOMContentLoaded", () => {
  // ---- 数式（KaTeX）----
  if (typeof renderMathInElement === "function") {
    renderMathInElement(document.body, {
      delimiters: [
        { left: "\\[", right: "\\]", display: true },
        { left: "\\(", right: "\\)", display: false },
      ],
      throwOnError: false,
      // 式の中の単位は \unit{C} → 〔C〕（ブロック体）。例：Q_1 = 6.0\,\unit{C}，\unit{m/s²}，\unit{μF}
      // \ans{…}：解説の中で導いた答え（太字＋黄色のマーカー）。例：a = \ans{\dfrac{F}{m + M}}
      macros: { "\\unit": "\\text{〔}\\textsf{#1}\\text{〕}", "\\ans": "\\htmlClass{ans-mark}{\\boldsymbol{#1}}" },
      trust: ctx => ctx.command === "\\htmlClass",
    });
  }

  // ---- 数式をスマホ幅に収める ----
  // はみ出す別行数式は改行版（.eq-narrow，build_page.py が自動で作る）に切り替え，
  // それでもはみ出す数式・解答欄は文字を少し小さくする（最小 0.75 倍）
  const fitMath = () => {
    const MIN = window.innerWidth < 330 ? 0.62 : 0.75;  // とても狭い画面では，もう少し小さくしてでも収める
    document.querySelectorAll(".eqwrap").forEach(w => {
      const wide = w.querySelector(".eq-wide"), nar = w.querySelector(".eq-narrow");
      w.classList.remove("use-narrow");
      w.querySelectorAll(".katex-display > .katex").forEach(k => (k.style.fontSize = ""));
      if (wide && nar) {
        const kd = wide.querySelector(".katex-display");
        if (kd && kd.scrollWidth > kd.clientWidth + 1) w.classList.add("use-narrow");
      }
      const shown = w.classList.contains("use-narrow") ? nar : (wide || w);
      const kd = shown && shown.querySelector(".katex-display");
      if (kd && kd.scrollWidth > kd.clientWidth + 1) {
        const k = kd.querySelector(".katex");
        k.style.fontSize = Math.max(MIN, (kd.clientWidth - 2) / kd.scrollWidth) + "em";
      }
    });
    document.querySelectorAll(".final, .axis-eq .eq, .answer-grid .val, .answer-box .val").forEach(e => {
      e.style.fontSize = "";
      if (e.scrollWidth > e.clientWidth + 1) e.style.fontSize = Math.max(MIN, (e.clientWidth - 2) / e.scrollWidth) + "em";
    });
  };
  fitMath();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitMath);  // 数式フォントの読み込み後に測り直す
  let fitTimer;
  window.addEventListener("resize", () => { clearTimeout(fitTimer); fitTimer = setTimeout(fitMath, 150); });
  // 閉じていた解説を開いたとき・数式フォントが後から読み込まれて式の幅が変わったときに測り直す
  const refit = () => { clearTimeout(fitTimer); fitTimer = setTimeout(fitMath, 60); };
  // フォントの読み込みが遅れても追いつくよう，開いた直後と少し後に何度か測る
  const refitSoon = () => [60, 400, 1200].forEach(ms => setTimeout(fitMath, ms));
  document.querySelectorAll("details").forEach(d => d.addEventListener("toggle", () => d.open && refitSoon()));
  if (document.fonts && document.fonts.addEventListener) document.fonts.addEventListener("loadingdone", refit);

  // ---- 図：「力を描く」ボタン（解答レイヤーをもつ図に自動で付ける）----
  const figs = [...document.querySelectorAll(".figure")].filter(f => f.querySelector(".ans-layer"));
  const setFig = (fig, on) => {
    fig.classList.toggle("show-ans", on);
    const b = fig.querySelector(".fig-toggle");
    // ボタン名は図の data-draw で変える（例：data-draw="成分" → 「成分を描き込む」）。既定は「力」
    if (b) { b.setAttribute("aria-pressed", on); b.textContent = on ? "描き込みを消す" : (fig.dataset.draw || "力") + "を描き込む"; }
  };
  figs.forEach(fig => {
    const b = document.createElement("button");
    b.type = "button"; b.className = "btn fig-toggle";
    b.addEventListener("click", () => setFig(fig, !fig.classList.contains("show-ans")));
    fig.appendChild(b);
    fig.classList.add("has-toggle");
    setFig(fig, false);
  });

  // ---- 解説を開いたら同じ小問（.sub-q か .card）の図に描き込みを表示，閉じたら消す ----
  // 同じ範囲に解説が複数ある（例題のイチ・ニッ・サン）ときは，どれか1つでも開いていれば表示する
  document.querySelectorAll("details.sol").forEach(d => {
    d.addEventListener("toggle", () => {
      const scope = d.closest(".sub-q") || d.closest(".card");
      const on = [...scope.querySelectorAll("details.sol")].some(x => x.open);
      scope.querySelectorAll(".figure").forEach(f => { if (f.querySelector(".ans-layer")) setFig(f, on); });
    });
  });

  // ---- 解説者のキャラクター（<body class="guide"> のページだけ）----
  // ポーズは assets/chara/<記号>.png：a＝下を指す，b＝上を指す，c＝同じ高さ（腰に手），d＝考える（腕組み）
  // 解説の見出しの右端に立って左（解説のほう）を向く（閉じているときは d，開くと c）。
  // 補足（.note）は指さしの吹き出しにする。指す向きは data-pose で，その補足が説明しているものの位置に合わせる（省略時は b）
  if (document.body.classList.contains("guide")) {
    const js = document.querySelector('script[src*="main.js"]');
    const dir = new URL("chara/", js ? js.src : location.href).href;
    const img = (pose, cls) => `<img class="${cls}" src="${dir}${pose}.png" alt="" aria-hidden="true">`;
    document.querySelectorAll("details.sol:not(.step-sol) > summary").forEach(s => {
      s.insertAdjacentHTML("beforeend", `<span class="guide-sum"><span class="g-say g-closed">まず自分で解いてみよう</span><span class="g-say g-open">解説するよ！</span>${img("d", "g-closed")}${img("c", "g-open")}</span>`);
    });
    document.querySelectorAll(".note").forEach(n => {
      const pose = n.dataset.pose || "b";
      const row = document.createElement("div");
      row.className = "guide-row pose-" + pose;
      row.innerHTML = img(pose, "g-chara");
      n.replaceWith(row);
      row.append(n);
    });
  }

  // ---- 答えを隠す／クリックで表示 ----
  document.querySelectorAll(".hide-ans .val").forEach(v => {
    v.title = "クリックで答えを表示";
    v.addEventListener("click", () => v.classList.toggle("shown"));
  });

  // ---- ヘッダーのボタン ----
  const allBtn = document.getElementById("toggle-all");
  if (allBtn) {
    let open = false;
    allBtn.addEventListener("click", () => {
      open = !open;
      document.querySelectorAll("details.sol").forEach(d => (d.open = open));
      figs.forEach(f => setFig(f, open));
      allBtn.textContent = open ? "解説をすべて閉じる" : "解説をすべて開く";
    });
  }
  const ansBtn = document.getElementById("show-answers");
  if (ansBtn) {
    let shown = false;
    ansBtn.addEventListener("click", () => {
      shown = !shown;
      document.querySelectorAll(".hide-ans .val").forEach(v => v.classList.toggle("shown", shown));
      ansBtn.setAttribute("aria-pressed", shown);
      ansBtn.textContent = shown ? "答えを隠す" : "答えをすべて表示";
    });
  }

  // ---- ヘッダーの高さを CSS 変数 --hdr に（スマホで目次をヘッダーの下に固定するため）----
  const hdr = document.querySelector(".site-header");
  const setHdr = () => hdr && document.documentElement.style.setProperty("--hdr", hdr.offsetHeight + "px");
  setHdr();
  window.addEventListener("resize", setHdr);

  // ---- 目次のハイライト ----
  const links = [...document.querySelectorAll(".toc a")];
  const targets = links.map(a => document.querySelector(a.getAttribute("href"))).filter(Boolean);
  if (targets.length && "IntersectionObserver" in window) {
    const io = new IntersectionObserver(es => {
      es.forEach(e => {
        if (!e.isIntersecting) return;
        links.forEach(a => {
          const on = a.getAttribute("href") === "#" + e.target.id;
          a.classList.toggle("active", on);
          if (on) {  // スマホの横並び目次：選ばれた項目が見えるように横スクロール
            const ol = a.closest("ol");
            if (ol && ol.scrollWidth > ol.clientWidth) {
              ol.scrollTo({ left: a.offsetLeft - ol.offsetLeft - 16, behavior: "smooth" });
            }
          }
        });
      });
    }, { rootMargin: "-15% 0px -75% 0px" });
    targets.forEach(t => io.observe(t));
  }
});
