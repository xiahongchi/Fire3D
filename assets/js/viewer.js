import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { PLYLoader } from "three/addons/loaders/PLYLoader.js";

import { SCENES } from "./data.js";

const canvas = document.querySelector("#scene-canvas");
const stage = document.querySelector("[data-viewer-stage]");

if (!canvas || !stage) {
  throw new Error("Fire3D viewer mount is missing");
}

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.AgXToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.setClearColor(0xd9ded9, 1);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(43, 16 / 9, 0.01, 1000);
camera.up.set(0, 0, 1);

const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.dampingFactor = 0.07;
controls.screenSpacePanning = true;
controls.rotateSpeed = 0.55;
controls.zoomSpeed = 0.72;
controls.panSpeed = 0.55;
controls.autoRotate = true;
controls.autoRotateSpeed = 0.34;

scene.add(new THREE.HemisphereLight(0xffffff, 0xaeb8b3, 2.15));
const keyLight = new THREE.DirectionalLight(0xffffff, 2.4);
keyLight.position.set(-4, -5, 8);
scene.add(keyLight);
const fillLight = new THREE.DirectionalLight(0xdce9e4, 1.1);
fillLight.position.set(6, 4, 3);
scene.add(fillLight);

const grid = new THREE.GridHelper(10, 20, 0x8e9994, 0xcbd2cd);
grid.rotation.x = Math.PI / 2;
grid.material.transparent = true;
grid.material.opacity = 0.62;
grid.material.depthWrite = false;
scene.add(grid);

const plyLoader = new PLYLoader();
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath(
  new URL("../vendor/three/addons/libs/draco/gltf/", import.meta.url).href,
);
dracoLoader.setDecoderConfig({ type: "wasm" });
const gltfLoader = new GLTFLoader();
gltfLoader.setDRACOLoader(dracoLoader);

const datasetButtons = [...document.querySelectorAll("[data-dataset]")];
const modeButtons = [...document.querySelectorAll("[data-mode]")];
const layerInputs = [...document.querySelectorAll("[data-layer]")];
const sceneSelect = document.querySelector("[data-scene-select]");
const frameGrid = document.querySelector("[data-frame-grid]");
const sceneLabel = document.querySelector("[data-viewer-scene]");
const modeLabel = document.querySelector("[data-viewer-mode]");
const status = document.querySelector("[data-viewer-status]");
const statusCopy = document.querySelector("[data-status-copy]");
const progressBar = document.querySelector("[data-load-progress]");
const autoRotateInput = document.querySelector("[data-auto-rotate]");

const MODE_PRESETS = {
  input: {
    label: "RGB input point cloud",
    layers: ["rgb"],
  },
  perception: {
    label: "Predicted instances and oriented boxes",
    layers: ["instances", "obbs"],
  },
  reconstruction: {
    label: "Complete textured object assets",
    layers: ["foreground"],
  },
};

const sceneCache = new Map();
let activeDataset = "ithor";
let activeScene = SCENES.ithor[0];
let activeEntry = null;
let activeMode = "input";
let requestGeneration = 0;
let interactionPauseUntil = 0;

function setStatus(copy, progress = null) {
  statusCopy.textContent = copy;
  progressBar.style.width = progress === null ? "24%" : `${Math.max(4, progress)}%`;
  status.classList.remove("is-hidden");
}

function hideStatus() {
  status.classList.add("is-hidden");
}

function loadWith(loader, url, label) {
  return new Promise((resolve, reject) => {
    setStatus(`Loading ${label}`);
    loader.load(
      url,
      resolve,
      (event) => {
        const progress = event.lengthComputable && event.total > 0
          ? (event.loaded / event.total) * 100
          : null;
        setStatus(`Loading ${label}`, progress);
      },
      reject,
    );
  });
}

function normalizePlyAttributes(geometry) {
  for (const [name, attribute] of Object.entries(geometry.attributes)) {
    if (attribute.array instanceof Float64Array) {
      geometry.setAttribute(
        name,
        new THREE.Float32BufferAttribute(attribute.array, attribute.itemSize, attribute.normalized),
      );
    }
  }
  return geometry;
}

function pointCloudFromGeometry(geometry, layer) {
  normalizePlyAttributes(geometry);
  geometry.computeBoundingSphere();
  const material = new THREE.PointsMaterial({
    size: layer === "instances" ? 0.034 : 0.029,
    sizeAttenuation: true,
    vertexColors: geometry.hasAttribute("color"),
    color: geometry.hasAttribute("color") ? 0xffffff : 0xdceae5,
    transparent: true,
    opacity: 0.98,
    depthWrite: true,
  });
  const points = new THREE.Points(geometry, material);
  points.name = layer;
  points.frustumCulled = true;
  return points;
}

function boxesFromGeometry(geometry) {
  normalizePlyAttributes(geometry);
  geometry.computeVertexNormals();
  const material = new THREE.MeshBasicMaterial({
    vertexColors: geometry.hasAttribute("color"),
    color: geometry.hasAttribute("color") ? 0xffffff : 0xff6a4d,
    transparent: true,
    opacity: 0.92,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const boxes = new THREE.Mesh(geometry, material);
  boxes.name = "obbs";
  boxes.renderOrder = 3;
  return boxes;
}

function prepareGltf(root, layer) {
  root.name = layer;
  root.traverse((object) => {
    if (!object.isMesh) return;
    object.castShadow = false;
    object.receiveShadow = false;
    const materials = Array.isArray(object.material) ? object.material : [object.material];
    for (const material of materials) {
      material.side = THREE.DoubleSide;
      material.needsUpdate = true;
      for (const key of ["map", "normalMap", "roughnessMap", "metalnessMap"]) {
        if (material[key]) {
          material[key].anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
        }
      }
    }
  });
  return root;
}

async function loadLayer(entry, layer) {
  if (entry.layers.has(layer)) return entry.layers.get(layer);
  if (entry.promises.has(layer)) return entry.promises.get(layer);

  const promise = (async () => {
    const url = entry.definition.assets[layer];
    let object;
    if (layer === "rgb" || layer === "instances") {
      const geometry = await loadWith(plyLoader, url, layer === "rgb" ? "RGB observations" : "instances");
      object = pointCloudFromGeometry(geometry, layer);
    } else if (layer === "obbs") {
      const geometry = await loadWith(plyLoader, url, "oriented boxes");
      object = boxesFromGeometry(geometry);
    } else {
      const gltf = await loadWith(
        gltfLoader,
        url,
        layer === "background" ? "background asset" : "foreground assets",
      );
      object = prepareGltf(gltf.scene, layer);
    }
    object.visible = false;
    entry.group.add(object);
    entry.layers.set(layer, object);
    return object;
  })();

  entry.promises.set(layer, promise);
  try {
    return await promise;
  } finally {
    entry.promises.delete(layer);
  }
}

function entryFor(definition) {
  if (sceneCache.has(definition.id)) return sceneCache.get(definition.id);
  const group = new THREE.Group();
  group.name = definition.id;
  const entry = {
    definition,
    group,
    layers: new Map(),
    promises: new Map(),
    fitted: false,
  };
  sceneCache.set(definition.id, entry);
  return entry;
}

function selectedLayers() {
  return layerInputs.filter((input) => input.checked).map((input) => input.dataset.layer);
}

async function syncLayers({ fit = false } = {}) {
  const generation = requestGeneration;
  const wanted = new Set(selectedLayers());
  for (const [layer, object] of activeEntry.layers) {
    object.visible = wanted.has(layer);
  }

  try {
    await Promise.all([...wanted].map((layer) => loadLayer(activeEntry, layer)));
    if (generation !== requestGeneration) return;
    for (const [layer, object] of activeEntry.layers) {
      object.visible = wanted.has(layer);
    }
    hideStatus();
    if (fit || !activeEntry.fitted) {
      fitCamera();
      activeEntry.fitted = true;
    }
  } catch (error) {
    console.error("Fire3D viewer asset failed", error);
    if (generation === requestGeneration) {
      setStatus("Scene asset could not be loaded", 100);
    }
  }
}

function fitCamera() {
  const visible = [...activeEntry.layers.values()].filter((object) => object.visible);
  if (!visible.length) return;
  const bounds = new THREE.Box3();
  for (const object of visible) bounds.expandByObject(object, true);
  if (bounds.isEmpty()) return;

  const center = bounds.getCenter(new THREE.Vector3());
  const size = bounds.getSize(new THREE.Vector3());
  const maxDimension = Math.max(size.x, size.y, size.z, 0.5);
  const direction = new THREE.Vector3(...activeScene.viewDirection).normalize();
  const verticalFov = THREE.MathUtils.degToRad(camera.fov);
  const distance = (maxDimension / (2 * Math.tan(verticalFov / 2))) * 1.18;

  camera.position.copy(center).addScaledVector(direction, distance);
  camera.near = Math.max(0.01, distance / 250);
  camera.far = Math.max(100, distance * 18);
  camera.updateProjectionMatrix();
  controls.target.copy(center);
  controls.minDistance = maxDimension * 0.18;
  controls.maxDistance = maxDimension * 6;
  controls.update();

  grid.position.set(center.x, center.y, bounds.min.z - maxDimension * 0.012);
  grid.scale.setScalar(Math.max(maxDimension / 10, 0.1));
}

function renderFrames() {
  const figures = activeScene.frames.map(({ frame, url }) => {
    const figure = document.createElement("figure");
    const image = document.createElement("img");
    image.src = url;
    image.alt = `${activeScene.label}, RGB frame ${frame}`;
    image.loading = "lazy";
    image.decoding = "async";
    const caption = document.createElement("figcaption");
    caption.textContent = `frame ${String(frame).padStart(2, "0")}`;
    figure.append(image, caption);
    return figure;
  });
  frameGrid.replaceChildren(...figures);
}

function populateSceneSelect() {
  sceneSelect.replaceChildren();
  for (const definition of SCENES[activeDataset]) {
    const option = document.createElement("option");
    option.value = definition.id;
    option.textContent = definition.label;
    sceneSelect.append(option);
  }
}

function activateScene(definition) {
  requestGeneration += 1;
  if (activeEntry) scene.remove(activeEntry.group);
  activeScene = definition;
  activeEntry = entryFor(definition);
  scene.add(activeEntry.group);
  sceneLabel.textContent = definition.label;
  renderFrames();
  syncLayers({ fit: true });
}

function setDataset(dataset) {
  activeDataset = dataset;
  datasetButtons.forEach((button) => {
    const active = button.dataset.dataset === dataset;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-pressed", String(active));
  });
  populateSceneSelect();
  activateScene(SCENES[dataset][0]);
}

function setMode(mode) {
  activeMode = mode;
  const preset = MODE_PRESETS[mode];
  modeButtons.forEach((button) => {
    const active = button.dataset.mode === mode;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-pressed", String(active));
  });
  for (const input of layerInputs) {
    input.checked = preset.layers.includes(input.dataset.layer);
  }
  modeLabel.textContent = preset.label;
  syncLayers({ fit: true });
}

datasetButtons.forEach((button) => {
  button.addEventListener("click", () => setDataset(button.dataset.dataset));
});

modeButtons.forEach((button) => {
  button.addEventListener("click", () => setMode(button.dataset.mode));
});

sceneSelect.addEventListener("change", () => {
  const definition = SCENES[activeDataset].find(({ id }) => id === sceneSelect.value);
  activateScene(definition);
});

layerInputs.forEach((input) => {
  input.addEventListener("change", () => {
    modeButtons.forEach((button) => {
      button.classList.remove("is-active");
      button.setAttribute("aria-pressed", "false");
    });
    modeLabel.textContent = "Custom layer view";
    syncLayers({ fit: false });
  });
});

document.querySelector("[data-layer-clear]")?.addEventListener("click", () => {
  layerInputs.forEach((input) => {
    input.checked = false;
  });
  modeLabel.textContent = "No layers selected";
  syncLayers();
});

document.querySelector("[data-viewer-reset]")?.addEventListener("click", fitCamera);

autoRotateInput?.addEventListener("change", () => {
  controls.autoRotate = autoRotateInput.checked;
});

controls.addEventListener("start", () => {
  controls.autoRotate = false;
});

controls.addEventListener("end", () => {
  interactionPauseUntil = performance.now() + 1400;
});

const resizeObserver = new ResizeObserver(() => {
  const { width, height } = stage.getBoundingClientRect();
  if (!width || !height) return;
  renderer.setSize(width, height, false);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
});
resizeObserver.observe(stage);

renderer.setAnimationLoop((time) => {
  if (autoRotateInput?.checked && time > interactionPauseUntil) {
    controls.autoRotate = true;
  }
  controls.update();
  renderer.render(scene, camera);
});

populateSceneSelect();
activateScene(activeScene);

window.__fire3dViewer = {
  camera,
  controls,
  renderer,
  scene,
  get activeScene() {
    return activeScene.id;
  },
  get loadedLayers() {
    return [...activeEntry.layers.keys()];
  },
  fitCamera,
  setDataset,
  setMode,
};
