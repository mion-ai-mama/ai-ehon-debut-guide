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
     ※ 検索エンジンやSNSのクローラーはJavaScriptを実行しない場合があるため、
     　 description / OGP画像などは index.html の <head> 内も
     　 あわせて書き換えることをおすすめします（README参照）。
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
     1. ファーストビュー
  ------------------------------------------------------------ */
  function renderHero(c) {
    const root = document.getElementById("hero");
    if (!root || !c) return;
    root.querySelector(".hero__label").textContent = c.label;
    root.querySelector(".hero__title").innerHTML = `${c.titleLine1}<br>${c.titleLine2}`;
    root.querySelector(".hero__subtitle").innerHTML = `${c.subtitleLine1}<br>${c.subtitleLine2}`;
    root.querySelector(".hero__desc").innerHTML = c.description;
    const btn = root.querySelector(".btn");
    btn.textContent = c.buttonText;
    btn.setAttribute("href", "#" + c.buttonScrollTargetId);
  }

  /* ------------------------------------------------------------
     実例動画
  ------------------------------------------------------------ */
  function renderExampleVideo(c) {
    const root = document.getElementById("example-video");
    if (!root || !c) return;

    root.querySelector(".section__heading").innerHTML = c.heading;
    const card = root.querySelector(".video-card");

    let mediaHtml;
    if (c.mode === "youtube" && c.youtube && c.youtube.embedUrl) {
      mediaHtml = `
        <div class="video-card__embed-wrap">
          <iframe
            src="${c.youtube.embedUrl}"
            title="実際に作った動画"
            allow="accelerometer; encrypted-media; gyroscope; picture-in-picture"
            allowfullscreen
            loading="lazy"></iframe>
        </div>`;
    } else {
      const poster = c.local && c.local.poster ? c.local.poster : "";
      const src = c.local && c.local.src ? c.local.src : "";
      mediaHtml = `
        <video
          class="video-card__player"
          controls
          preload="none"
          playsinline
          poster="${poster}"
          aria-label="実際に作った動画">
          <source src="${src}" type="video/mp4">
          <p class="video-card__fallback">${c.fallbackText || ""}</p>
        </video>`;
    }

    card.innerHTML = mediaHtml + `<p class="video-card__caption">${c.caption}</p>`;
  }

  /* ------------------------------------------------------------
     4〜6. STEP
     steps 配列の数だけ、STEPセクションをその場で組み立てます。
     （HTML側は steps-container という空の入れ物があるだけなので、
     　content.js の steps を増減させれば、STEPの数も自由に変わります）
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
        prose += (step.afterParagraphs || []).map((p) => `<p>${p}</p>`).join("");

        const noteHtml = step.note
          ? `<div class="note-box"><p class="note-box__label">${step.note.label}</p><p>${step.note.text}</p></div>`
          : "";

        return `
        <section class="section${softClass} step" id="${id}" aria-labelledby="${id}-heading">
          <div class="section__inner reveal">
            <p class="step__number">${step.number}</p>
            <h2 class="step__title" id="${id}-heading">${step.title}</h2>
            <div class="prose">${prose}</div>
            ${noteHtml}
          </div>
        </section>`;
      })
      .join("");
  }

  /* ------------------------------------------------------------
     3. メインプロンプト
  ------------------------------------------------------------ */
  function renderMainPrompt(c) {
    const root = document.getElementById("main-prompt");
    if (!root || !c) return;
    root.querySelector(".section__heading").innerHTML = c.heading;
    root.querySelector(".section__desc").innerHTML = c.description;
    const textEl = document.getElementById("main-prompt-text");
    textEl.textContent = c.promptText;
    const btn = root.querySelector(".copy-btn");
    btn.setAttribute("data-copy-target", "main-prompt-text");
    btn.querySelector(".copy-btn__label").textContent = c.buttonText;
    btn.querySelector(".copy-btn__done").textContent = c.copiedText;
  }

  /* ------------------------------------------------------------
     7. 結果をよくするコツ
  ------------------------------------------------------------ */
  const TIP_ICONS = ["📝", "🙋", "💬"];

  function renderTips(c) {
    const root = document.getElementById("tips");
    if (!root || !c) return;
    root.querySelector(".section__heading").innerHTML = c.heading;
    const grid = root.querySelector(".card-grid");
    grid.innerHTML = c.cards
      .map(
        (card, i) => `
      <div class="card">
        <span class="card__icon" aria-hidden="true">${TIP_ICONS[i] || "💡"}</span>
        <h3 class="card__title">${card.title}</h3>
        <p class="card__desc">${card.description}</p>
      </div>`
      )
      .join("");
  }

  /* ------------------------------------------------------------
     8. 追加で使える質問5選
  ------------------------------------------------------------ */
  function renderExtraQuestions(c) {
    const root = document.getElementById("extra-questions");
    if (!root || !c) return;
    root.querySelector(".section__heading").innerHTML = c.heading;
    root.querySelector(".section__desc").innerHTML = c.description;
    const list = document.getElementById("extra-questions-list");
    list.innerHTML = c.questions
      .map((q, i) => {
        const id = "question-" + (i + 1);
        return `
        <div class="question-card">
          <pre class="question-card__text" id="${id}">${escapeHtml(q)}</pre>
          <button type="button" class="btn btn--outline copy-btn" data-copy-target="${id}" aria-label="追加質問${i + 1}をコピーする">
            <span class="copy-btn__label">${c.buttonText}</span>
            <span class="copy-btn__done" role="status" aria-live="polite">${c.copiedText}</span>
          </button>
        </div>`;
      })
      .join("");
  }

  /* ------------------------------------------------------------
     9. 注意点
  ------------------------------------------------------------ */
  function renderCaution(c) {
    const root = document.getElementById("caution");
    if (!root || !c) return;
    root.querySelector(".section__heading").innerHTML = c.heading;
    root.querySelector(".prose").innerHTML = c.paragraphs.map((p) => `<p>${p}</p>`).join("");
  }

  /* ------------------------------------------------------------
     10. 最後の案内（CTA）
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
     11. フッター
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
        renderExampleVideo(CONTENT.exampleVideo);
        renderMainPrompt(CONTENT.mainPrompt);
        renderSteps(CONTENT.steps);
        renderTips(CONTENT.tips);
        renderExtraQuestions(CONTENT.extraQuestions);
        renderCaution(CONTENT.caution);
        renderCta(CONTENT.cta);
        renderFooter(CONTENT.footer);

        const s = CONTENT.sections || {};
        toggleSection("example-video", s.video !== false);
        toggleSection("main-prompt", s.mainPrompt !== false);
        toggleSection("steps-container", s.steps !== false);
        toggleSection("tips", s.tips !== false);
        toggleSection("extra-questions", s.extraQuestions !== false);
        toggleSection("caution", s.caution !== false);
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
