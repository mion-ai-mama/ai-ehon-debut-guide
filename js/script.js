/**
 * ============================================================
 * script.js — ページの動き（コピー機能・アニメーションなど）
 * ============================================================
 * このファイルは基本的に編集不要です。
 * 文章を変更したい場合は js/content.js を編集してください。
 * ============================================================
 */

(function () {
  "use strict";

  /* ------------------------------------------------------------
     文字のエスケープ（安全にHTMLへ差し込むための処理）
  ------------------------------------------------------------ */
  function escapeHtml(str) {
    return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  /* ------------------------------------------------------------
     SEO・OGP・favicon の反映
  ------------------------------------------------------------ */
  function applyMeta(m) {
    if (!m) return;
    document.title = m.pageTitle;
    setMetaContent('meta[name="description"]', m.description);
    setMetaContent('meta[property="og:title"]', m.pageTitle);
    setMetaContent('meta[property="og:description"]', m.description);
    setMetaContent('meta[property="og:image"]', m.ogpImage);
    setMetaContent('meta[property="og:url"]', m.siteUrl);
    const favicon = document.querySelector('link[rel="icon"]');
    if (favicon && m.faviconPath) favicon.setAttribute("href", m.faviconPath);
  }

  function setMetaContent(selector, value) {
    if (value == null) return;
    const el = document.querySelector(selector);
    if (el) el.setAttribute("content", value);
  }

  /* ------------------------------------------------------------
     セクションの表示・非表示（content.js の sections で一括制御）
  ------------------------------------------------------------ */
  function toggleSection(id, visible) {
    const root = document.getElementById(id);
    if (!root) return;
    if (visible) {
      root.style.display = "";
      root.removeAttribute("aria-hidden");
    } else {
      root.style.display = "none";
      root.setAttribute("aria-hidden", "true");
    }
  }

  /* ------------------------------------------------------------
     1. 表紙（ファーストビュー）
  ------------------------------------------------------------ */
  function renderHero(c) {
    const root = document.getElementById("hero");
    if (!root || !c) return;
    const kickerEl = root.querySelector(".hero__kicker");
    if (kickerEl) kickerEl.textContent = c.kicker || "";
    root.querySelector(".hero__label").textContent = c.label;
    root.querySelector(".hero__title").innerHTML = `${c.titleLine1}<br>${c.titleLine2}`;
    root.querySelector(".hero__subtitle").innerHTML = `${c.subtitleLine1}<br>${c.subtitleLine2}`;
    const tagEl = root.querySelector(".hero__tag");
    if (tagEl) tagEl.textContent = c.tag || "";
    root.querySelector(".hero__desc").innerHTML = c.description;
    const btn = root.querySelector(".btn");
    btn.textContent = c.buttonText;
    btn.setAttribute("href", "#" + c.buttonScrollTargetId);
  }

  /* ------------------------------------------------------------
     目次
  ------------------------------------------------------------ */
  function renderToc(c) {
    const root = document.getElementById("toc");
    if (!root || !c) return;
    root.querySelector(".section__heading").innerHTML = c.heading;
    const list = root.querySelector(".toc__list");
    list.innerHTML = (c.items || [])
      .map(
        (item, i) => `
      <li class="toc__item">
        <a class="toc__link" href="#${item.targetId}">
          <span class="toc__index">${i + 1}</span>
          <span>${item.label}</span>
        </a>
      </li>`
      )
      .join("");
  }

  /* ------------------------------------------------------------
     はじめに
  ------------------------------------------------------------ */
  function renderIntro(c) {
    const root = document.getElementById("intro");
    if (!root || !c) return;
    root.querySelector(".section__heading").innerHTML = c.heading;
    root.querySelector(".prose").innerHTML = (c.paragraphs || []).map((p) => `<p>${p}</p>`).join("");
  }

  /* ------------------------------------------------------------
     AI絵本ってどうやって作るの？
  ------------------------------------------------------------ */
  function renderHowItWorks(c) {
    const root = document.getElementById("how-it-works");
    if (!root || !c) return;
    root.querySelector(".section__heading").innerHTML = c.heading;
    root.querySelector(".section__desc").innerHTML = c.description || "";
    const prose = root.querySelector(".prose");
    const listHtml = (c.list || []).length
      ? '<ul class="check-list">' + c.list.map((li) => `<li>${li}</li>`).join("") + "</ul>"
      : "";
    const afterHtml = (c.afterParagraphs || []).map((p) => `<p>${p}</p>`).join("");
    prose.innerHTML = listHtml + afterHtml;
  }

  /* ------------------------------------------------------------
     Amazonではどんな絵本がある？
  ------------------------------------------------------------ */
  function renderAmazonExamples(c) {
    const root = document.getElementById("amazon-examples");
    if (!root || !c) return;
    root.querySelector(".section__heading").innerHTML = c.heading;
    root.querySelector(".prose").innerHTML = (c.paragraphs || []).map((p) => `<p>${p}</p>`).join("");

    const shotEl = root.querySelector(".screenshot-card");
    if (shotEl) {
      if (c.screenshot && c.screenshot.src) {
        shotEl.querySelector("img").src = c.screenshot.src;
        shotEl.querySelector("img").alt = c.screenshot.alt || "";
        shotEl.style.display = "";
      } else {
        shotEl.style.display = "none";
      }
    }
  }

  /* ------------------------------------------------------------
     AI絵本完成までの4STEP（概要カード）
  ------------------------------------------------------------ */
  function renderStepOverview(c) {
    const root = document.getElementById("step-overview");
    if (!root || !c) return;
    root.querySelector(".section__heading").innerHTML = c.heading;
    root.querySelector(".section__desc").innerHTML = c.description || "";
    const grid = root.querySelector(".card-grid");
    grid.innerHTML = (c.items || [])
      .map(
        (item) => `
      <a class="card card--link" href="#${item.targetId}">
        <span class="card__icon" aria-hidden="true">${item.icon || "✨"}</span>
        <p class="step__number step__number--card">${item.number}</p>
        <h3 class="card__title">${item.title}</h3>
      </a>`
      )
      .join("");
  }

  /* ------------------------------------------------------------
     STEP1〜4 詳細
     steps 配列の数だけ、STEPセクションをその場で組み立てます。
  ------------------------------------------------------------ */
  function renderSteps(steps) {
    const container = document.getElementById("steps-container");
    if (!container || !steps) return;

    container.innerHTML = steps
      .map((step, i) => {
        const id = "step" + (i + 1);
        const softClass = i % 2 === 1 ? " section--soft" : "";

        let prose = (step.paragraphs || []).map((p) => `<p>${p}</p>`).join("");
        if (step.list && step.list.length) {
          prose += '<ul class="check-list">' + step.list.map((li) => `<li>${li}</li>`).join("") + "</ul>";
        }
        if (step.numberedList && step.numberedList.length) {
          prose +=
            '<ol class="numbered-box">' + step.numberedList.map((li) => `<li>${li}</li>`).join("") + "</ol>";
        }
        prose += (step.afterParagraphs || []).map((p) => `<p>${p}</p>`).join("");

        const promptHtml = step.prompt
          ? `
          <div class="prompt-box step__prompt">
            <p class="prompt-box__heading">${step.prompt.heading}</p>
            <p class="prompt-box__desc">${step.prompt.description}</p>
            <pre class="prompt-box__text" id="${id}-prompt-text">${escapeHtml(step.prompt.promptText)}</pre>
            <button
              type="button"
              class="btn btn--primary copy-btn"
              data-copy-target="${id}-prompt-text"
              aria-label="${step.prompt.heading}をコピーする">
              <span class="copy-btn__label">${step.prompt.buttonText}</span>
              <span class="copy-btn__done" role="status" aria-live="polite">${step.prompt.copiedText}</span>
            </button>
          </div>`
          : "";

        const noteHtml = step.note
          ? `<div class="note-box"><p class="note-box__label">${step.note.label}</p><p>${step.note.text}</p></div>`
          : "";

        const warningHtml = step.warning
          ? `<div class="warning-box"><p class="warning-box__label">⚠️ ${step.warning.label}</p><p>${step.warning.text}</p></div>`
          : "";

        const tipHtml = step.tip ? `<div class="tip-box"><p>${step.tip.emoji || "💡"} ${step.tip.text}</p></div>` : "";

        const officialLinkHtml = step.officialLink
          ? `
          <div class="step__official-link">
            <a class="btn btn--outline" href="${step.officialLink.url}" target="_blank" rel="noopener">${step.officialLink.text}</a>
          </div>`
          : "";

        const screenshotsHtml =
          step.screenshots && step.screenshots.length
            ? `
          <div class="step__screenshots">
            ${step.screenshots
              .map(
                (shot) => `
              <figure class="screenshot-card">
                <img src="${shot.src}" alt="${escapeHtml(shot.alt || "")}" loading="lazy">
                ${shot.caption ? `<figcaption>${shot.caption}</figcaption>` : ""}
              </figure>`
              )
              .join("")}
          </div>`
            : "";

        return `
        <section class="section${softClass} step" id="${id}" aria-labelledby="${id}-heading">
          <div class="section__inner reveal">
            <p class="step__number">${step.number}</p>
            <h2 class="step__title" id="${id}-heading">${step.title}</h2>
            <div class="prose">${prose}</div>
            ${officialLinkHtml}
            ${screenshotsHtml}
            ${promptHtml}
            ${warningHtml}
            ${tipHtml}
            ${noteHtml}
          </div>
        </section>`;
      })
      .join("");
  }

  /* ------------------------------------------------------------
     完成イメージ（オリジナル絵本サンプル）
  ------------------------------------------------------------ */
  function renderCompletedExample(c) {
    const root = document.getElementById("completed-example");
    if (!root || !c) return;
    root.querySelector(".section__heading").innerHTML = c.heading;
    root.querySelector(".section__desc").innerHTML = c.description || "";

    const book = c.book || {};
    const carousel = root.querySelector(".book-carousel");
    carousel.innerHTML = (book.images || [])
      .map(
        (img) => `
      <div class="book-carousel__item">
        <img src="${img.src}" alt="${escapeHtml(img.alt || book.title || "")}" loading="lazy">
      </div>`
      )
      .join("");

    const noteEl = root.querySelector(".book-carousel__note");
    if (noteEl) noteEl.innerHTML = c.note || "";
  }

  /* ------------------------------------------------------------
     よくあるつまずきポイント
  ------------------------------------------------------------ */
  function renderStumblingPoints(c) {
    const root = document.getElementById("stumbling-points");
    if (!root || !c) return;
    root.querySelector(".section__heading").innerHTML = c.heading;
    root.querySelector(".section__desc").innerHTML = c.description || "";
    const list = root.querySelector(".faq-list");
    list.innerHTML = (c.items || [])
      .map(
        (item) => `
      <div class="card faq-card">
        <p class="faq-card__q">Q. ${item.q}</p>
        <p class="faq-card__a">${item.a}</p>
      </div>`
      )
      .join("");
  }

  /* ------------------------------------------------------------
     AI絵本を作るときの注意点
  ------------------------------------------------------------ */
  function renderCaution(c) {
    const root = document.getElementById("caution");
    if (!root || !c) return;
    root.querySelector(".section__heading").innerHTML = c.heading;
    const introEl = root.querySelector(".section__desc");
    if (introEl) introEl.innerHTML = c.intro || "";
    const list = root.querySelector(".check-list--warning");
    list.innerHTML = (c.list || []).map((li) => `<li>${li}</li>`).join("");
  }

  /* ------------------------------------------------------------
     まとめ
  ------------------------------------------------------------ */
  function renderSummary(c) {
    const root = document.getElementById("summary");
    if (!root || !c) return;
    root.querySelector(".section__heading").innerHTML = c.heading;
    const list = root.querySelector(".summary-list");
    list.innerHTML = (c.items || [])
      .map((item, i) => `<li><span class="summary-list__number">${i + 1}</span><span>${item}</span></li>`)
      .join("");
  }

  /* ------------------------------------------------------------
     AIマネタイズの教科書への案内（CTA）
  ------------------------------------------------------------ */
  function renderCta(c) {
    const root = document.getElementById("cta");
    if (!root || !c) return;
    root.querySelector(".cta-card__heading").innerHTML = c.heading;
    const [p1, p2, p3] = c.paragraphs;
    const prose = root.querySelector(".prose");
    prose.innerHTML =
      `<p>${p1}</p><p>${p2}</p>` +
      `<p>${p3}<br><strong class="cta-card__highlight">${c.highlightText}</strong><br>${c.afterHighlight}</p>`;
    const btn = document.getElementById("cta-button");
    btn.setAttribute("href", c.buttonUrl);

    if (c.bannerImage) {
      btn.classList.remove("btn", "btn--primary", "btn--large");
      btn.classList.add("cta-card__banner-link");
      btn.innerHTML = `<img src="${c.bannerImage}" alt="${escapeHtml(c.bannerAlt || c.buttonText)}" class="cta-card__banner-img">`;
      const img = btn.querySelector("img");
      img.addEventListener(
        "error",
        () => {
          // 画像が読み込めなかった場合は、安全のため通常のテキストボタンに戻す
          btn.classList.remove("cta-card__banner-link");
          btn.classList.add("btn", "btn--primary", "btn--large");
          btn.textContent = c.buttonText;
        },
        { once: true }
      );
    } else {
      btn.classList.remove("cta-card__banner-link");
      btn.classList.add("btn", "btn--primary", "btn--large");
      btn.textContent = c.buttonText;
    }
  }

  /* ------------------------------------------------------------
     フッター
  ------------------------------------------------------------ */
  function renderFooter(c) {
    const root = document.querySelector(".footer");
    if (!root || !c) return;
    root.innerHTML = `<p>${c.copyright}</p><p>${c.notice}</p>`;
  }

  /* ------------------------------------------------------------
     コピー機能（クリップボードAPI／古いブラウザ向けの代替あり）
  ------------------------------------------------------------ */
  function legacyCopy(text) {
    try {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      const successful = document.execCommand("copy");
      document.body.removeChild(textarea);
      return successful;
    } catch (e) {
      return false;
    }
  }

  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text).then(
        () => true,
        () => legacyCopy(text)
      );
    }
    return Promise.resolve(legacyCopy(text));
  }

  function bindCopyDelegation() {
    document.addEventListener("click", function (e) {
      const btn = e.target.closest(".copy-btn[data-copy-target]");
      if (!btn) return;
      const target = document.getElementById(btn.getAttribute("data-copy-target"));
      if (!target) return;
      copyText(target.textContent).then((ok) => {
        if (!ok) return;
        btn.classList.add("is-copied");
        window.clearTimeout(btn._copyTimeout);
        btn._copyTimeout = window.setTimeout(() => btn.classList.remove("is-copied"), 2200);
      });
    });
  }

  /* ------------------------------------------------------------
     スクロールで軽くフェードインする演出
  ------------------------------------------------------------ */
  function setupRevealAnimation() {
    const revealEls = document.querySelectorAll(".reveal");
    if (!("IntersectionObserver" in window)) {
      revealEls.forEach((el) => el.classList.add("is-visible"));
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
    );
    revealEls.forEach((el) => observer.observe(el));
  }

  /* ------------------------------------------------------------
     初期化
     content.js が正しく読み込めた場合のみ、内容を反映します。
     content.js が読み込めなかった場合は、index.html に書かれている
     初期文章がそのまま表示されます（ページが真っ白になりません）。
  ------------------------------------------------------------ */
  function init() {
    if (typeof CONTENT !== "undefined") {
      try {
        applyMeta(CONTENT.meta);
        renderHero(CONTENT.hero);
        renderToc(CONTENT.toc);
        renderIntro(CONTENT.intro);
        renderHowItWorks(CONTENT.howItWorks);
        renderAmazonExamples(CONTENT.amazonExamples);
        renderStepOverview(CONTENT.stepOverview);
        renderSteps(CONTENT.steps);
        renderCompletedExample(CONTENT.completedExample);
        renderStumblingPoints(CONTENT.stumblingPoints);
        renderCaution(CONTENT.caution);
        renderSummary(CONTENT.summary);
        renderCta(CONTENT.cta);
        renderFooter(CONTENT.footer);

        const s = CONTENT.sections || {};
        toggleSection("toc", s.toc !== false);
        toggleSection("intro", s.intro !== false);
        toggleSection("how-it-works", s.howItWorks !== false);
        toggleSection("amazon-examples", s.amazonExamples !== false);
        toggleSection("step-overview", s.stepOverview !== false);
        toggleSection("steps-container", s.steps !== false);
        toggleSection("completed-example", s.completedExample !== false);
        toggleSection("stumbling-points", s.stumblingPoints !== false);
        toggleSection("caution", s.caution !== false);
        toggleSection("summary", s.summary !== false);
      } catch (err) {
        // content.js の書き方に誤りがある場合はここに来ます。
        // index.html に書かれた初期文章がそのまま表示されるので、ページは壊れません。
        console.error("content.js の反映中にエラーが発生しました。index.html の初期内容を表示しています。", err);
      }
    }
    bindCopyDelegation();
    setupRevealAnimation();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
