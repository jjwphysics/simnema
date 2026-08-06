(function () {
  "use strict";

  const films = Array.isArray(window.SIMNEMA_FILMS)
    ? window.SIMNEMA_FILMS
    : [];

  document.body.insertAdjacentHTML(
    "beforeend",
    `
      <main class="site-shell">
        <div class="ambient-reel" aria-hidden="true">
          <video id="ambient-video" autoplay muted loop playsinline hidden></video>
        </div>
        <div class="ambient-shade" aria-hidden="true"></div>

        <header class="masthead">
          <a class="mini-wordmark" href="#top" aria-label="Simnema 처음으로">
            SIMNEMA
          </a>
          <button class="text-control js-open-search" type="button">
            작품 찾기
          </button>
        </header>

        <section class="hero" id="top">
          <p class="hero-kicker">
            KOREAN MODERN FICTION · SHORT FILM ARCHIVE
          </p>
          <h1 class="hero-wordmark" aria-label="Simnema">SIMNEMA</h1>
          <div class="hero-footer">
            <p class="hero-statement">
              읽던 장면이,<br />
              눈앞의 영화가 되는 곳.
            </p>
            <a class="enter-archive" href="#archive">
              상영작 보기 <span class="arrow" aria-hidden="true">↓</span>
            </a>
          </div>
        </section>

        <section class="archive-intro" id="archive">
          <p class="section-label">NOW SCREENING / 상영 목록</p>
        </section>

        <section class="film-index" id="main-film-index" aria-label="작품 목록">
        </section>

        <button class="red-search-cta js-open-search" type="button">
          <span class="red-search-label">SEARCH THE ARCHIVE</span>
          <strong>원하는 작품을 바로 찾으세요.</strong>
          <span class="red-search-action">
            작품 찾기
            <span class="arrow arrow-diagonal" aria-hidden="true">↗</span>
          </span>
        </button>

        <footer class="footer">
          <p>SIMNEMA</p>
          <p>
            수능 현대소설<br />
            초단편 영화 상영관
          </p>
          <button class="text-control js-open-search" type="button">
            작품 찾기
            <span class="arrow arrow-diagonal" aria-hidden="true">↗</span>
          </button>
          <p class="footer-credit">
            © 2026 공감연구소. All Rights Reserved.
          </p>
        </footer>

        <section
          class="search-overlay"
          id="search-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="작품 찾기"
          hidden
        >
          <div class="overlay-topline">
            <span>SEARCH THE ARCHIVE</span>
            <button class="text-control" id="close-search" type="button">
              닫기 ESC
            </button>
          </div>
          <label class="search-label" for="film-search">
            작품명, 작가명 또는 출제 연도
          </label>
          <input
            class="search-input"
            id="film-search"
            type="search"
            placeholder="예: 미스터 방"
            autocomplete="off"
          />
          <p class="search-count" id="search-count"></p>
          <div class="search-results" id="search-results"></div>
        </section>

        <section
          class="screening-overlay"
          id="screening-overlay"
          role="dialog"
          aria-modal="true"
          hidden
        ></section>
      </main>
    `,
  );

  const ambientVideo = document.querySelector("#ambient-video");
  const searchOverlay = document.querySelector("#search-overlay");
  const searchInput = document.querySelector("#film-search");
  const searchCount = document.querySelector("#search-count");
  const searchResults = document.querySelector("#search-results");
  const screeningOverlay = document.querySelector("#screening-overlay");
  const mainFilmIndex = document.querySelector("#main-film-index");

  function createArrow(diagonal) {
    const arrow = document.createElement("span");
    arrow.className = diagonal ? "arrow arrow-diagonal" : "arrow";
    arrow.setAttribute("aria-hidden", "true");
    arrow.textContent = diagonal ? "↗" : "↓";
    return arrow;
  }

  function createFilmRow(film, index, currentId) {
    const isCurrent = film.id === currentId;
    const button = document.createElement("button");
    button.type = "button";
    button.className = "film-row";
    button.style.setProperty("--row-index", String(index));

    if (!film.video) button.classList.add("is-pending");
    if (isCurrent) {
      button.classList.add("is-current");
      button.setAttribute("aria-current", "true");
    }

    const number = document.createElement("span");
    number.className = "film-index-number";
    number.textContent = String(index + 1).padStart(2, "0");

    const main = document.createElement("span");
    main.className = "film-main";

    const meta = document.createElement("span");
    meta.className = "film-meta";
    meta.textContent = `${film.author} · ${film.examShort}`;

    const title = document.createElement("span");
    title.className = "film-title";
    title.textContent = film.title;

    const excerpt = document.createElement("span");
    excerpt.className = "film-excerpt";
    excerpt.textContent = film.excerpt;

    const status = document.createElement("span");
    status.className = "film-status";
    status.append(
      document.createTextNode(
        `${isCurrent ? "NOW" : film.video ? "PLAY" : "SOON"} `,
      ),
      createArrow(true),
    );

    main.append(meta, title, excerpt);
    button.append(number, main, status);
    button.addEventListener("click", () => openFilm(film));
    return button;
  }

  function renderFilmRows(container, currentId) {
    const fragment = document.createDocumentFragment();
    films.forEach((film, index) => {
      fragment.append(createFilmRow(film, index, currentId));
    });
    container.replaceChildren(fragment);
  }

  function updateBodyLock() {
    document.body.classList.toggle(
      "overlay-open",
      !searchOverlay.hidden || !screeningOverlay.hidden,
    );
  }

  function openSearch() {
    searchOverlay.hidden = false;
    updateBodyLock();
    renderSearchResults();
    window.requestAnimationFrame(() => searchInput.focus());
  }

  function closeSearch() {
    searchOverlay.hidden = true;
    updateBodyLock();
  }

  function renderSearchResults() {
    const normalized = searchInput.value.trim().toLocaleLowerCase("ko-KR");
    const results = normalized
      ? films.filter((film) =>
          `${film.title} ${film.author} ${film.examLabel}`
            .toLocaleLowerCase("ko-KR")
            .includes(normalized),
        )
      : films;

    searchCount.textContent = `${results.length}개의 작품`;
    searchResults.replaceChildren();

    if (results.length === 0) {
      const empty = document.createElement("p");
      empty.className = "empty-search";
      empty.textContent = "일치하는 작품이 없습니다.";
      searchResults.append(empty);
      return;
    }

    const fragment = document.createDocumentFragment();
    results.forEach((film, index) => {
      const button = document.createElement("button");
      button.type = "button";

      const number = document.createElement("span");
      number.textContent = String(index + 1).padStart(2, "0");

      const title = document.createElement("strong");
      title.textContent = film.title;

      const author = document.createElement("span");
      author.textContent = film.author;

      const exam = document.createElement("span");
      exam.textContent = film.examShort;

      button.append(number, title, author, exam);
      button.addEventListener("click", () => openFilm(film));
      fragment.append(button);
    });
    searchResults.append(fragment);
  }

  function appendTextElement(parent, tag, className, text) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    element.textContent = text;
    parent.append(element);
    return element;
  }

  function renderScreening(film) {
    screeningOverlay.replaceChildren();
    screeningOverlay.setAttribute("aria-label", `${film.title} 상영`);

    const topline = document.createElement("div");
    topline.className = "screening-topline";
    appendTextElement(
      topline,
      "span",
      "",
      `${film.author} · ${film.examLabel}`,
    );
    const closeButton = appendTextElement(
      topline,
      "button",
      "text-control",
      "상영관 나가기 ESC",
    );
    closeButton.type = "button";
    closeButton.addEventListener("click", closeScreening);

    const frame = document.createElement("div");
    frame.className = "screen-frame";
    if (film.video) {
      const video = document.createElement("video");
      video.src = film.video;
      video.controls = true;
      video.autoplay = true;
      video.playsInline = true;
      frame.append(video);
      window.requestAnimationFrame(() => {
        video.play().catch(() => {});
      });
    } else {
      const pending = document.createElement("div");
      pending.className = "pending-screen";
      appendTextElement(pending, "span", "", "SCREENING SOON");
      appendTextElement(
        pending,
        "p",
        "",
        "영상이 완성되면 이곳에서 바로 상영됩니다.",
      );
      frame.append(pending);
    }

    const copyright = document.createElement("p");
    copyright.className = "screening-copyright";
    copyright.textContent =
      "본 사이트에 수록된 영상 콘텐츠의 저작권은 ㈜공감연구소에 있으며, 사전 허가 없는 복제·배포·수정 및 영리적 이용을 금합니다.";

    const titleBlock = document.createElement("div");
    titleBlock.className = "screening-title";
    appendTextElement(titleBlock, "p", "", film.durationLabel);
    appendTextElement(titleBlock, "h2", "", film.title);
    appendTextElement(titleBlock, "span", "", film.author);

    const information = document.createElement("section");
    information.className = "film-information";
    information.setAttribute("aria-label", "영상 정보");
    appendTextElement(information, "p", "film-information-label", "정보");
    appendTextElement(
      information,
      "p",
      "film-information-body",
      film.info || "영상 정보가 준비되어 있지 않습니다.",
    );

    const transcript = document.createElement("article");
    transcript.className = "transcript";
    const transcriptHeading = document.createElement("div");
    transcriptHeading.className = "transcript-heading";
    appendTextElement(transcriptHeading, "p", "", "ORIGINAL PASSAGE");
    appendTextElement(transcriptHeading, "h3", "", "기출 지문");
    appendTextElement(transcriptHeading, "span", "", film.examLabel);
    appendTextElement(
      transcript,
      "p",
      film.transcript ? "transcript-body" : "transcript-empty",
      film.transcript || "기출 지문을 준비하고 있습니다.",
    );
    transcript.prepend(transcriptHeading);

    const catalog = document.createElement("section");
    catalog.className = "screening-catalog";
    catalog.setAttribute("aria-label", "이어 보기 상영 목록");
    const catalogHeading = document.createElement("div");
    catalogHeading.className = "screening-catalog-heading";
    appendTextElement(
      catalogHeading,
      "p",
      "section-label",
      "CONTINUE SCREENING / 상영 목록",
    );
    appendTextElement(
      catalogHeading,
      "span",
      "",
      "현재 상영작은 붉게 표시됩니다.",
    );
    const catalogRows = document.createElement("div");
    catalogRows.className = "screening-film-index";
    renderFilmRows(catalogRows, film.id);
    catalog.append(catalogHeading, catalogRows);

    screeningOverlay.append(
      topline,
      frame,
      copyright,
      titleBlock,
      information,
      transcript,
      catalog,
    );
  }

  function openFilm(film) {
    closeSearch();
    renderScreening(film);
    screeningOverlay.hidden = false;
    updateBodyLock();
    window.requestAnimationFrame(() => {
      screeningOverlay.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  function closeScreening() {
    const video = screeningOverlay.querySelector("video");
    if (video) video.pause();
    screeningOverlay.hidden = true;
    updateBodyLock();
  }

  renderFilmRows(mainFilmIndex, null);
  document
    .querySelectorAll(".js-open-search")
    .forEach((button) => button.addEventListener("click", openSearch));
  document
    .querySelector("#close-search")
    .addEventListener("click", closeSearch);
  searchInput.addEventListener("input", renderSearchResults);

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    if (!screeningOverlay.hidden) closeScreening();
    else if (!searchOverlay.hidden) closeSearch();
  });

  const heroFilm =
    films.find((film) => film.title === "나룻배 이야기" && film.video) ||
    films.find((film) => film.video);

  if (heroFilm) {
    const enforceAmbientMute = () => {
      ambientVideo.defaultMuted = true;
      if (!ambientVideo.muted) ambientVideo.muted = true;
      if (ambientVideo.volume !== 0) ambientVideo.volume = 0;
    };

    ambientVideo.src = heroFilm.video;
    ambientVideo.hidden = false;
    enforceAmbientMute();
    ambientVideo.addEventListener("loadedmetadata", enforceAmbientMute);
    ambientVideo.addEventListener("volumechange", enforceAmbientMute);
    ambientVideo.play().catch(() => {});
  }
})();
