// Shared work card and author links for result and about pages.
(function authorLinksBootstrap() {
  function create(t, options = {}) {
    const section = el("section", { className: "result-connections" });
    const worksTitleId = options.idPrefix ? options.idPrefix + "-works-title" : "result-works-title";
    const authorTitleId = options.idPrefix ? options.idPrefix + "-author-title" : "result-author-title";
    const works = el("section", { className: "result-works" });
    works.setAttribute("aria-labelledby", worksTitleId);
    const worksHeader = el("div", { className: "result-section-header" });
    worksHeader.appendChild(el("h2", { id: worksTitleId }, t.resultWorksTitle));
    const personalWebsite = makeResultLink("https://tealize-write.github.io/", t.resultPersonalWebsite, "result-utility-link", options.bindLink);
    decorateResultUtilityLink(personalWebsite, "website");
    worksHeader.appendChild(personalWebsite);
    works.appendChild(worksHeader);

    const workCard = el("article", { className: "result-work-card" });
    workCard.appendChild(el("img", { className: "result-work-cover", src: "img/cover.jpg", alt: t.resultWorkCoverAlt,
      width: 1000, height: 1429, loading: "lazy" }));
    const workText = el("div", { className: "result-work-text" });
    workText.appendChild(el("p", { className: "result-work-subtitle" }, t.resultWorkSubtitle));
    workText.appendChild(el("h3", {}, t.resultWorkTitle));
    workText.appendChild(el("p", { className: "result-work-description" }, t.resultWorkDescription));
    const readingLinks = el("nav", { className: "result-reading-links" });
    readingLinks.setAttribute("aria-label", t.resultReadingPlatforms);
    readingLinks.appendChild(el("span", { className: "result-reading-label" }, t.resultReadingPlatforms));
    const platforms = [
      ["Penana", "https://www.penana.com/story/16766/"],
      ["KadoKado", "https://www.kadokado.com.tw/book/1425"],
      ["CXC", "https://cxc.today/zh/store/ApatiteBlue/work/20217"],
    ];
    platforms.forEach(([name, href]) => {
      const link = makeResultLink(href, name, "result-reading-link", options.bindLink);
      link.setAttribute("aria-label", t.resultReadOn.replace("{platform}", name));
      readingLinks.appendChild(link);
    });
    workText.appendChild(readingLinks);
    workCard.appendChild(workText);
    works.appendChild(workCard);
    section.appendChild(works);

    const author = el("section", { className: "result-author" });
    author.setAttribute("aria-labelledby", authorTitleId);
    const authorText = el("div", {});
    authorText.appendChild(el("h3", { id: authorTitleId }, t.resultAuthorTitle));
    authorText.appendChild(el("p", { className: "result-author-name" }, t.resultAuthorName));
    author.appendChild(authorText);
    const socialNav = el("nav", { className: "result-social-links" });
    socialNav.setAttribute("aria-label", t.resultAuthorTitle);
    const socials = [
      ["facebook", "Facebook", "https://www.facebook.com/TealizeWrite/"],
      ["instagram", "Instagram", "https://www.instagram.com/tealize_write/"],
      ["threads", "Threads", "https://www.threads.com/@tealize_write"],
      ["plurk", "Plurk", "https://www.plurk.com/Tealize"],
    ];
    socials.forEach(([id, name, href]) => {
      const link = makeResultLink(href, name, "result-social-link", options.bindLink);
      link.dataset.platform = id;
      link.setAttribute("aria-label", name);
      link.title = name;
      link.textContent = "";
      link.appendChild(makeSocialIcon(id));
      socialNav.appendChild(link);
    });
    author.appendChild(socialNav);
    section.appendChild(author);

    return section;
  }

  function makeResultLink(href, label, className, bindLink) {
    const link = el("a", { href, className, target: "_blank", rel: "noopener noreferrer" }, label);
    bindLink?.(link, label);
    return link;
  }

  function decorateResultUtilityLink(link, kind) {
    const label = link.textContent;
    link.textContent = "";
    link.appendChild(makeResultUtilityIcon(kind));
    link.appendChild(el("span", { className: "result-utility-label" }, label));
    const arrow = makeResultUtilityIcon(kind === "website" ? "external" : "forward");
    arrow.classList.add("result-utility-arrow");
    link.appendChild(arrow);
  }

  function makeResultUtilityIcon(kind) {
    const ns = "http://www.w3.org/2000/svg";
    const icon = document.createElementNS(ns, "svg");
    const attributes = { viewBox: "0 0 24 24", width: 20, height: 20, fill: "none",
      stroke: "currentColor", "stroke-width": 1.5, "stroke-linecap": "round",
      "stroke-linejoin": "round", "aria-hidden": "true", focusable: "false" };
    Object.entries(attributes).forEach(([name, value]) => icon.setAttribute(name, value));
    const paths = {
      website: "M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM3 12h18M12 3c2.2 2.5 3.5 5.5 3.5 9S14.2 18.5 12 21c-2.2-2.5-3.5-5.5-3.5-9S9.8 5.5 12 3Z",
      book: "M12 6v15M12 6C9 4 6 3.5 3 4v15c3-.5 6 0 9 2 3-2 6-2.5 9-2V4c-3-.5-6 0-9 2Z",
      external: "M7 17 17 7M7 7h10v10",
      forward: "M5 12h14M13 6l6 6-6 6",
    };
    const path = document.createElementNS(ns, "path");
    path.setAttribute("d", paths[kind]);
    icon.appendChild(path);
    return icon;
  }

  function makeSocialIcon(platform) {
    const ns = "http://www.w3.org/2000/svg";
    const icon = document.createElementNS(ns, "svg");
    icon.setAttribute("viewBox", "0 0 24 24");
    icon.setAttribute("width", "22");
    icon.setAttribute("height", "22");
    icon.setAttribute("aria-hidden", "true");
    icon.setAttribute("focusable", "false");
    if (platform === "facebook") {
      const path = document.createElementNS(ns, "path");
      path.setAttribute("fill", "currentColor");
      path.setAttribute("d", "M14 22v-9h3l.5-4H14V6.5c0-1.2.4-2 2-2h1.8V1.2c-.7-.1-1.7-.2-2.9-.2C11.7 1 10 2.9 10 6.2V9H7v4h3v9z");
      icon.appendChild(path);
    } else {
      icon.setAttribute("fill", "none");
      icon.setAttribute("stroke", "currentColor");
      icon.setAttribute("stroke-width", "1.8");
      icon.setAttribute("stroke-linecap", "round");
      icon.setAttribute("stroke-linejoin", "round");
      if (platform === "instagram") {
        const frame = document.createElementNS(ns, "rect");
        for (const [attr, value] of Object.entries({ x: 3, y: 3, width: 18, height: 18, rx: 5 })) frame.setAttribute(attr, value);
        icon.appendChild(frame);
        const lens = document.createElementNS(ns, "circle");
        lens.setAttribute("cx", "12"); lens.setAttribute("cy", "12"); lens.setAttribute("r", "4");
        icon.appendChild(lens);
        const dot = document.createElementNS(ns, "circle");
        dot.setAttribute("cx", "17.5"); dot.setAttribute("cy", "6.5"); dot.setAttribute("r", "0.7");
        dot.setAttribute("fill", "currentColor"); icon.appendChild(dot);
      } else if (platform === "threads") {
        const path = document.createElementNS(ns, "path");
        path.setAttribute("d", "M18.7 7.5C18 4.2 15.8 2.5 12.1 2.5 7 2.5 4 5.9 4 12s3 9.5 8.1 9.5c4.4 0 7.9-2.6 7.9-6.2 0-3.1-2.5-5.1-6-5.1-2.8 0-4.8 1.4-4.8 3.4 0 1.5 1.2 2.5 2.9 2.5 2.6 0 4.2-2 4.2-5.1 0-3.2-1.8-5.2-4.4-5.2-1.4 0-2.6.5-3.4 1.5");
        icon.appendChild(path);
      } else {
        const path = document.createElementNS(ns, "path");
        path.setAttribute("d", "M7 22V8h6a6 6 0 0 1 0 12H7M7 4h7");
        icon.appendChild(path);
      }
    }
    return icon;
  }

  function el(tag, props, text) {
    const node = document.createElement(tag);
    if (props) Object.assign(node, props);
    if (text !== undefined) node.textContent = text;
    return node;
  }

  window.AUTHOR_LINKS = { create, decorateLink: decorateResultUtilityLink };

  const aboutMount = document.getElementById("about-connections");
  if (aboutMount) {
    const render = () => {
      const t = window.UI_TRANSLATIONS[window.currentLang] || window.UI_TRANSLATIONS["zh-TW"];
      aboutMount.replaceChildren(create(t, { idPrefix: "about" }));
    };
    document.addEventListener("langChanged", render);
    if (document.readyState !== "loading") render();
    else document.addEventListener("DOMContentLoaded", () => {
      if (!aboutMount.firstChild) render();
    });
  }

})();
