import {
  COMPOSED_SCENES,
  HOLOSCENE,
  LITEREALITY,
  PAPER_RESULTS,
  SIMRECON,
  VIDEOS,
  composedAsset,
  literealityAsset,
  simreconAsset,
} from "./data.js";

const header = document.querySelector("[data-header]");
const navToggle = document.querySelector("[data-nav-toggle]");
const navLinks = document.querySelector("[data-nav-links]");

function closeNavigation() {
  navToggle?.setAttribute("aria-expanded", "false");
  navLinks?.classList.remove("is-open");
  document.body.classList.remove("nav-open");
}

navToggle?.addEventListener("click", () => {
  const isOpen = navToggle.getAttribute("aria-expanded") === "true";
  navToggle.setAttribute("aria-expanded", String(!isOpen));
  navLinks.classList.toggle("is-open", !isOpen);
  document.body.classList.toggle("nav-open", !isOpen);
});

navLinks?.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", closeNavigation);
});

window.addEventListener(
  "scroll",
  () => header?.classList.toggle("is-scrolled", window.scrollY > 16),
  { passive: true },
);

document.querySelectorAll("[data-video]").forEach((video) => {
  const sources = VIDEOS[video.dataset.video].map(({ src, type }) => {
    const source = document.createElement("source");
    source.src = src;
    source.type = type;
    return source;
  });
  video.replaceChildren(...sources);
  video.load();
});

function paperCell(url, method, context) {
  const figure = document.createElement("figure");
  if (method.fire3d) {
    figure.classList.add("is-fire3d");
  }

  const media = document.createElement("div");
  media.className = "result-media";

  const image = document.createElement("img");
  image.src = url;
  image.alt = `${method.label} result for ${context}`;
  image.loading = "lazy";
  image.decoding = "async";
  image.draggable = false;

  const caption = document.createElement("figcaption");
  caption.textContent = method.label;
  media.append(image);
  figure.append(media, caption);
  return figure;
}

function renderPairedPaperResult(root, config) {
  const grid = root.querySelector("[data-paper-grid]");
  const groups = config.scenes.map((scene) => {
    const group = document.createElement("div");
    group.className = "native-pair";
    const title = document.createElement("strong");
    title.textContent = scene.label;
    group.append(title);
    for (const method of config.methods) {
      group.append(
        paperCell(config.path(scene.id, method.id), method, scene.label),
      );
    }
    return group;
  });
  grid.replaceChildren(...groups);
}

function setupPaperResult(root) {
  const config = PAPER_RESULTS[root.dataset.paperResult];
  if (!config) {
    return;
  }
  if (config.paired) {
    renderPairedPaperResult(root, config);
    return;
  }

  const controls = root.querySelector("[data-paper-controls]");
  const grid = root.querySelector("[data-paper-grid]");
  const state = { scene: config.scenes[0], view: config.views?.[0] };
  grid.style.setProperty("--panel-count", config.methods.length);
  grid.setAttribute("aria-live", "polite");

  const sceneLabel = document.createElement("label");
  const sceneSelect = document.createElement("select");
  sceneLabel.textContent = "Scene";
  sceneSelect.setAttribute("aria-label", "Result scene");
  for (const scene of config.scenes) {
    const option = document.createElement("option");
    option.value = scene.id;
    option.textContent = scene.label;
    sceneSelect.append(option);
  }
  controls.append(sceneLabel, sceneSelect);

  const nextSceneButton = document.createElement("button");
  nextSceneButton.type = "button";
  nextSceneButton.className = "next-scene-button";
  nextSceneButton.setAttribute("aria-label", "Show next scene");
  nextSceneButton.append("Next scene ");
  const nextSceneArrow = document.createElement("span");
  nextSceneArrow.setAttribute("aria-hidden", "true");
  nextSceneArrow.textContent = "→";
  nextSceneButton.append(nextSceneArrow);
  controls.append(nextSceneButton);

  const viewButtons = [];
  if (config.views && !config.showAllViews) {
    for (const view of config.views) {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = `View ${view}`;
      button.classList.toggle("is-active", view === state.view);
      button.setAttribute("aria-pressed", String(view === state.view));
      button.addEventListener("click", () => {
        state.view = view;
        for (const candidate of viewButtons) {
          const active = candidate === button;
          candidate.classList.toggle("is-active", active);
          candidate.setAttribute("aria-pressed", String(active));
        }
        render();
      });
      viewButtons.push(button);
      controls.append(button);
    }
  }

  function render() {
    if (config.showAllViews) {
      const cells = config.views.flatMap((view) =>
        config.methods.map((method) =>
          paperCell(
            config.path(state.scene.id, method.id, view),
            { ...method, label: `${method.label} · View ${view}` },
            `${state.scene.label}, view ${view}`,
          ),
        ),
      );
      grid.replaceChildren(...cells);
      return;
    }

    const context = config.views
      ? `${state.scene.label}, view ${state.view}`
      : state.scene.label;
    const cells = config.methods.map((method) =>
      paperCell(
        config.path(state.scene.id, method.id, state.view),
        method,
        context,
      ),
    );
    grid.replaceChildren(...cells);
  }

  sceneSelect.addEventListener("change", () => {
    state.scene = config.scenes.find(({ id }) => id === sceneSelect.value);
    render();
  });
  nextSceneButton.addEventListener("click", () => {
    const currentIndex = config.scenes.findIndex(({ id }) => id === state.scene.id);
    state.scene = config.scenes[(currentIndex + 1) % config.scenes.length];
    sceneSelect.value = state.scene.id;
    render();
  });
  render();
}

document.querySelectorAll("[data-paper-result]").forEach(setupPaperResult);

function comparisonCell(url, method, context, eager = false) {
  const figure = document.createElement("figure");
  figure.className = "comparison-cell";
  const image = document.createElement("img");
  image.src = url;
  image.alt = `${method} result for ${context}`;
  image.loading = eager ? "eager" : "lazy";
  image.decoding = "async";
  image.draggable = false;
  const caption = document.createElement("figcaption");
  const name = document.createElement("strong");
  const detail = document.createElement("span");
  name.textContent = method;
  detail.textContent = context;
  caption.append(name, detail);
  figure.append(image, caption);
  return figure;
}

const tabs = [...document.querySelectorAll("[data-comparison-tab]")];
const panels = [...document.querySelectorAll("[data-comparison-panel]")];
tabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    const selected = tab.dataset.comparisonTab;
    tabs.forEach((candidate) => {
      const active = candidate === tab;
      candidate.classList.toggle("is-active", active);
      candidate.setAttribute("aria-selected", String(active));
    });
    panels.forEach((panel) => {
      const active = panel.dataset.comparisonPanel === selected;
      panel.classList.toggle("is-active", active);
      panel.hidden = !active;
    });
  });
});

const holosceneGrid = document.querySelector("[data-holoscene-grid]");
const holosceneDataset = document.querySelector("[data-holoscene-dataset]");
const holosceneIndex = document.querySelector("[data-holoscene-index]");
let holosceneView = 0;

function renderHoloScene() {
  const group = HOLOSCENE[holosceneDataset.value];
  holosceneView = (holosceneView + group.frames.length) % group.frames.length;
  const frame = group.frames[holosceneView];
  const context = `${group.label} · frame ${String(frame).padStart(4, "0")}`;
  holosceneGrid.replaceChildren(
    comparisonCell(group.path(frame, "input"), "Input", context, true),
    comparisonCell(group.path(frame, "holoscene"), "HoloScene", context, true),
    comparisonCell(group.path(frame, "ours"), "Ours", context, true),
  );
  holosceneIndex.textContent = `View ${holosceneView + 1} / ${group.frames.length}`;
}

document.querySelector("[data-holoscene-prev]")?.addEventListener("click", () => {
  holosceneView -= 1;
  renderHoloScene();
});

document.querySelector("[data-holoscene-next]")?.addEventListener("click", () => {
  holosceneView += 1;
  renderHoloScene();
});

holosceneDataset?.addEventListener("change", () => {
  holosceneView = 0;
  renderHoloScene();
});

renderHoloScene();

const simreconGrid = document.querySelector("[data-simrecon-grid]");
for (const sample of SIMRECON) {
  const context = `${sample.scene} · source ${sample.view}`;
  simreconGrid.append(
    comparisonCell(simreconAsset(sample.prefix, "gt"), "Ground truth", context),
    comparisonCell(simreconAsset(sample.prefix, "simrecon"), "SimRecon", context),
    comparisonCell(simreconAsset(sample.prefix, "ours"), "Ours", context),
  );
}

const literealityGrid = document.querySelector("[data-litereality-grid]");
for (const sample of LITEREALITY) {
  const context = `${sample.scene} · ${sample.view}`;
  literealityGrid.append(
    comparisonCell(literealityAsset(sample.prefix, "gt"), "Ground truth", context),
    comparisonCell(
      literealityAsset(sample.prefix, "litereality_gtobb"),
      "LiteReality",
      context,
    ),
    comparisonCell(literealityAsset(sample.prefix, "ours"), "Ours", context),
  );
}

const composedSelect = document.querySelector("[data-composed-scene]");
const composedGrid = document.querySelector("[data-composed-grid]");
for (const sample of COMPOSED_SCENES) {
  const option = document.createElement("option");
  option.value = sample.id;
  option.textContent = sample.label;
  composedSelect.append(option);
}

function renderComposed() {
  const sample = COMPOSED_SCENES.find(({ id }) => id === composedSelect.value);
  const cells = [];
  for (const view of [1, 2]) {
    const context = `${sample.label} · view ${view}`;
    cells.push(
      comparisonCell(composedAsset(sample.id, "gt", view), "Ground truth", context),
      comparisonCell(
        composedAsset(sample.id, "boxer_sam2_trellis2", view),
        "Boxer + SAM2 + TRELLIS.2",
        context,
      ),
      comparisonCell(composedAsset(sample.id, "ours", view), "Ours", context),
    );
  }
  composedGrid.replaceChildren(...cells);
}

composedSelect?.addEventListener("change", renderComposed);
renderComposed();

document.querySelectorAll("main img").forEach((image) => {
  image.draggable = false;
});

const copyButton = document.querySelector("[data-copy-citation]");
copyButton?.addEventListener("click", async () => {
  const citation = document.querySelector(".citation-box code").textContent.trim();
  await navigator.clipboard.writeText(citation);
  copyButton.textContent = "Copied";
  window.setTimeout(() => {
    copyButton.textContent = "Copy BibTeX";
  }, 1600);
});
