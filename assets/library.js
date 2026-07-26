(() => {
  const resources = Array.isArray(window.LIFE_RESOURCES)
    ? window.LIFE_RESOURCES
    : [];
  const grid = document.querySelector("[data-library-grid]");
  const filters = document.querySelector("[data-library-filters]");
  const count = document.querySelector("[data-library-count]");
  const note = document.querySelector("[data-library-note]");
  const params = new URLSearchParams(window.location.search);
  const validCategories = new Set([
    "todos",
    "lectura",
    "movimiento",
    "finanzas",
    "video",
  ]);
  const categoryLabels = {
    todos: "Todos",
    lectura: "Libros",
    movimiento: "Movimiento",
    finanzas: "Finanzas",
    video: "Videos",
  };
  const selectedResource = params.get("recurso") || "";
  let activeCategory = validCategories.has(params.get("categoria"))
    ? params.get("categoria")
    : "todos";

  function trackEvent(name, details = {}) {
    if (window.AlphaOps?.trackEvent) {
      window.AlphaOps.trackEvent(name, details);
    }
  }

  function createElement(tag, className, text) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text) element.textContent = text;
    return element;
  }

  function buildCard(resource) {
    const article = createElement("article", "library-resource");
    article.id = `recurso-${resource.id}`;
    article.dataset.resourceCategory = resource.category;
    if (resource.id === selectedResource) {
      article.classList.add("is-selected");
    }

    const meta = createElement("div", "library-resource-meta");
    meta.append(
      createElement("span", "", categoryLabels[resource.category]),
      createElement("span", "", resource.format)
    );

    const title = createElement("h2", "", resource.title);
    const author = createElement("p", "resource-author", resource.author);
    const description = createElement(
      "p",
      "resource-description",
      resource.description
    );

    const use = createElement("div", "resource-use");
    use.append(
      createElement("span", "", "Como usarlo"),
      createElement("p", "", resource.use)
    );

    const source = createElement("p", "resource-source");
    source.append(
      createElement("span", "", "Fuente: "),
      document.createTextNode(resource.source)
    );

    const actions = createElement("div", "resource-actions");
    const open = createElement("a", "button secondary", "Abrir recurso");
    open.href = resource.url;
    open.target = "_blank";
    open.rel = "noopener";
    open.addEventListener("click", () => {
      trackEvent("library_resource_opened", {
        resource_id: resource.id,
        category: resource.category,
      });
    });

    const share = createElement("button", "ghost", "Compartir");
    share.type = "button";
    share.addEventListener("click", () => shareResource(resource));
    actions.append(open, share);

    article.append(meta, title, author, description, use, source, actions);
    return article;
  }

  function renderFilters() {
    if (!filters) return;
    filters.innerHTML = "";
    Object.entries(categoryLabels).forEach(([key, label]) => {
      const button = createElement("button", "", label);
      button.type = "button";
      button.dataset.category = key;
      button.setAttribute("aria-pressed", String(activeCategory === key));
      button.addEventListener("click", () => {
        activeCategory = key;
        const url = new URL(window.location.href);
        if (key === "todos") {
          url.searchParams.delete("categoria");
        } else {
          url.searchParams.set("categoria", key);
        }
        url.searchParams.delete("recurso");
        history.replaceState({}, "", url);
        renderAll();
        trackEvent("library_filter_changed", { category: key });
      });
      filters.appendChild(button);
    });
  }

  function renderResources() {
    if (!grid) return;
    const visible = resources.filter(
      (resource) =>
        activeCategory === "todos" || resource.category === activeCategory
    );
    grid.innerHTML = "";
    visible.forEach((resource) => grid.appendChild(buildCard(resource)));
    if (count) {
      count.textContent = `${visible.length} ${
        visible.length === 1 ? "recurso" : "recursos"
      }`;
    }
  }

  async function shareResource(resource) {
    const libraryUrl = new URL("biblioteca.html", window.location.href);
    libraryUrl.searchParams.set("recurso", resource.id);
    const payload = {
      title: `${resource.title} | Biblioteca 100 Dias`,
      text: `${resource.title}, de ${resource.author}. ${resource.description}`,
      url: libraryUrl.href,
    };
    try {
      if (navigator.share) {
        await navigator.share(payload);
        if (note) note.textContent = "Recurso compartido.";
      } else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(
          `${payload.title}\n${payload.text}\n${payload.url}`
        );
        if (note) note.textContent = "Enlace copiado para compartir.";
      } else if (note) {
        note.textContent = "Abre el recurso y usa la opcion Compartir de tu navegador.";
        return;
      }
      trackEvent("library_resource_shared", {
        resource_id: resource.id,
        category: resource.category,
      });
    } catch (error) {
      if (error?.name !== "AbortError" && note) {
        note.textContent = "No se pudo compartir desde este navegador.";
      }
    }
  }

  function renderAll() {
    renderFilters();
    renderResources();
  }

  renderAll();

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("./sw.js").catch(() => {});
  }

  if (selectedResource) {
    const resource = resources.find(({ id }) => id === selectedResource);
    if (resource) {
      activeCategory = resource.category;
      renderAll();
      window.setTimeout(() => {
        document
          .querySelector(`#recurso-${resource.id}`)
          ?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 120);
    }
  }
})();
