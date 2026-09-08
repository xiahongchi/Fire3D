import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { TransformControls } from "three/addons/controls/TransformControls.js";
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

const transformControls = new TransformControls(camera, canvas);
transformControls.setMode("translate");
transformControls.setSpace("local");
transformControls.setSize(0.78);
scene.add(transformControls.getHelper());

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
const selectionLabel = document.querySelector("[data-viewer-selection]");
const objectEditor = document.querySelector("[data-object-editor]");
const transformModeButtons = [...document.querySelectorAll("[data-transform-mode]")];
const transformResetButton = document.querySelector("[data-transform-reset]");

const MODE_PRESETS = {
  input: {
    label: "RGB input point cloud",
    layers: ["rgb", "cameras"],
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
let selectedInstance = null;
let selectedOriginalParent = null;
let transformPivot = null;
let selectionEdges = [];
let selectionEdgeMaterial = null;
let transformInteractionActive = false;
let pointerStart = null;

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
const selectionColor = new THREE.Color(0x00a878);

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

function cameraRigFromDefinition(definition) {
  const group = new THREE.Group();
  group.name = "cameras";

  const linePositions = [];
  const cameraPositions = [];
  const appendSegment = (start, end) => {
    linePositions.push(start.x, start.y, start.z, end.x, end.y, end.z);
  };

  for (const [eyeValues, targetValues, upValues] of definition.cameraRig.poses) {
    const eye = new THREE.Vector3(...eyeValues);
    const target = new THREE.Vector3(...targetValues);
    const up = new THREE.Vector3(...upValues).normalize();
    const forward = target.sub(eye).normalize();
    const right = new THREE.Vector3().crossVectors(forward, up).normalize();
    const vertical = new THREE.Vector3().crossVectors(right, forward).normalize();
    const depth = 0.22;
    const halfHeight = Math.tan(THREE.MathUtils.degToRad(definition.cameraRig.fov / 2)) * depth;
    const center = eye.clone().addScaledVector(forward, depth);
    const corners = [
      center.clone().addScaledVector(right, -halfHeight).addScaledVector(vertical, halfHeight),
      center.clone().addScaledVector(right, halfHeight).addScaledVector(vertical, halfHeight),
      center.clone().addScaledVector(right, halfHeight).addScaledVector(vertical, -halfHeight),
      center.clone().addScaledVector(right, -halfHeight).addScaledVector(vertical, -halfHeight),
    ];

    for (const corner of corners) appendSegment(eye, corner);
    for (let index = 0; index < corners.length; index += 1) {
      appendSegment(corners[index], corners[(index + 1) % corners.length]);
    }
    appendSegment(
      corners[0].clone().lerp(corners[1], 0.5),
      corners[0].clone().lerp(corners[1], 0.5).addScaledVector(vertical, halfHeight * 0.28),
    );
    cameraPositions.push(eye.x, eye.y, eye.z);
  }

  const lineGeometry = new THREE.BufferGeometry();
  lineGeometry.setAttribute("position", new THREE.Float32BufferAttribute(linePositions, 3));
  lineGeometry.computeBoundingSphere();
  const lines = new THREE.LineSegments(
    lineGeometry,
    new THREE.LineBasicMaterial({
      color: 0x087f65,
      transparent: true,
      opacity: 0.86,
      depthTest: false,
      depthWrite: false,
    }),
  );
  lines.renderOrder = 8;

  const pointGeometry = new THREE.BufferGeometry();
  pointGeometry.setAttribute("position", new THREE.Float32BufferAttribute(cameraPositions, 3));
  pointGeometry.computeBoundingSphere();
  const points = new THREE.Points(
    pointGeometry,
    new THREE.PointsMaterial({
      color: 0xe96343,
      size: 0.07,
      sizeAttenuation: true,
      depthTest: false,
      depthWrite: false,
    }),
  );
  points.renderOrder = 9;
  group.add(lines, points);
  return group;
}

function instanceDisplayName(instance, layer, index) {
  if (layer === "background") return "Room background";
  const match = instance.name.match(/(?:instance|background)_(\d+)/i);
  return match ? `Instance ${match[1]}` : `Instance ${String(index + 1).padStart(4, "0")}`;
}

function prepareGltf(root, layer) {
  root.name = layer;
  root.children.forEach((instance, index) => {
    instance.userData.instanceLayer = layer;
    instance.userData.instanceLabel = instanceDisplayName(instance, layer, index);
    instance.userData.initialTransform = {
      position: instance.position.clone(),
      quaternion: instance.quaternion.clone(),
      scale: instance.scale.clone(),
    };
    instance.traverse((object) => {
      if (!object.isMesh) return;
      object.userData.instanceRoot = instance;
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
  });
  return root;
}

function highlightedMaterial(material) {
  const highlighted = material.clone();
  if (highlighted.color) highlighted.color.lerp(selectionColor, 0.24);
  if (highlighted.emissive) {
    highlighted.emissive.copy(selectionColor);
    highlighted.emissiveIntensity = 0.72;
  }
  highlighted.needsUpdate = true;
  return highlighted;
}

function setTransformMode(mode) {
  if (!transformModeButtons.some((button) => button.dataset.transformMode === mode)) return;
  transformControls.setMode(mode);
  transformModeButtons.forEach((button) => {
    const active = button.dataset.transformMode === mode;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-pressed", String(active));
  });
}

function addSelectionVisuals(instance) {
  selectionEdgeMaterial = new THREE.LineBasicMaterial({
    color: selectionColor,
    transparent: true,
    opacity: 0.95,
    depthTest: false,
    depthWrite: false,
  });

  instance.traverse((object) => {
    if (!object.isMesh) return;
    object.userData.selectionOriginalMaterial = object.material;
    object.material = Array.isArray(object.material)
      ? object.material.map(highlightedMaterial)
      : highlightedMaterial(object.material);

    const lines = new THREE.LineSegments(
      new THREE.EdgesGeometry(object.geometry, 34),
      selectionEdgeMaterial,
    );
    lines.renderOrder = 10;
    object.add(lines);
    selectionEdges.push(lines);
  });
}

function createTransformPivot(instance) {
  instance.updateWorldMatrix(true, true);
  const bounds = new THREE.Box3().setFromObject(instance, true);
  const center = bounds.isEmpty()
    ? instance.getWorldPosition(new THREE.Vector3())
    : bounds.getCenter(new THREE.Vector3());
  const orientation = instance.getWorldQuaternion(new THREE.Quaternion());
  const originalParent = instance.parent;
  const pivot = new THREE.Object3D();
  pivot.name = "selected-instance-pivot";
  pivot.position.copy(center);
  pivot.quaternion.copy(orientation);

  scene.add(pivot);
  originalParent.attach(pivot);
  pivot.attach(instance);
  pivot.updateWorldMatrix(true, true);
  return { originalParent, pivot };
}

function clearSelection() {
  transformControls.detach();
  controls.enabled = true;
  transformInteractionActive = false;
  pointerStart = null;

  if (selectedInstance && transformPivot && selectedOriginalParent) {
    selectedOriginalParent.attach(selectedInstance);
    transformPivot.parent?.remove(transformPivot);
  }

  for (const lines of selectionEdges) {
    lines.parent?.remove(lines);
    lines.geometry.dispose();
  }
  selectionEdgeMaterial?.dispose();

  if (selectedInstance) {
    selectedInstance.traverse((object) => {
      if (!object.isMesh || !object.userData.selectionOriginalMaterial) return;
      const materials = Array.isArray(object.material) ? object.material : [object.material];
      materials.forEach((material) => material.dispose());
      object.material = object.userData.selectionOriginalMaterial;
      delete object.userData.selectionOriginalMaterial;
    });
  }

  selectedInstance = null;
  selectedOriginalParent = null;
  transformPivot = null;
  selectionEdges = [];
  selectionEdgeMaterial = null;
  interactionPauseUntil = performance.now() + 1400;
  selectionLabel.hidden = true;
  selectionLabel.textContent = "";
  objectEditor.hidden = true;
}

function selectInstance(instance) {
  if (instance === selectedInstance) return;
  clearSelection();
  if (!instance) return;

  selectedInstance = instance;
  ({ originalParent: selectedOriginalParent, pivot: transformPivot } = createTransformPivot(instance));
  addSelectionVisuals(instance);
  transformControls.attach(transformPivot);
  transformControls.setSpace("local");
  controls.autoRotate = false;
  interactionPauseUntil = Number.POSITIVE_INFINITY;
  selectionLabel.textContent = `Selected · ${instance.userData.instanceLabel}`;
  selectionLabel.hidden = false;
  objectEditor.hidden = false;
}

function resetSelectedTransform() {
  if (!selectedInstance) return;
  const instance = selectedInstance;
  const initial = instance.userData.initialTransform;
  clearSelection();
  instance.position.copy(initial.position);
  instance.quaternion.copy(initial.quaternion);
  instance.scale.copy(initial.scale);
  instance.updateMatrixWorld(true, true);
  selectInstance(instance);
}

async function loadLayer(entry, layer) {
  if (entry.layers.has(layer)) return entry.layers.get(layer);
  if (entry.promises.has(layer)) return entry.promises.get(layer);

  const promise = (async () => {
    const url = entry.definition.assets[layer];
    let object;
    if (layer === "cameras") {
      object = cameraRigFromDefinition(entry.definition);
    } else if (layer === "rgb" || layer === "instances") {
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
  if (selectedInstance && !wanted.has(selectedInstance.userData.instanceLayer)) {
    clearSelection();
  }
  stage.classList.toggle(
    "has-selectable-assets",
    wanted.has("foreground") || wanted.has("background"),
  );
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
    image.draggable = false;
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
  clearSelection();
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

transformModeButtons.forEach((button) => {
  button.addEventListener("click", () => setTransformMode(button.dataset.transformMode));
});

transformResetButton?.addEventListener("click", resetSelectedTransform);

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

function selectableMeshes() {
  const meshes = [];
  for (const layer of ["foreground", "background"]) {
    const root = activeEntry?.layers.get(layer);
    if (!root?.visible) continue;
    root.traverse((object) => {
      if (object.isMesh && object.userData.instanceRoot) meshes.push(object);
    });
  }
  return meshes;
}

function selectAtPointer(event) {
  if (transformInteractionActive) return;
  const bounds = canvas.getBoundingClientRect();
  pointer.set(
    ((event.clientX - bounds.left) / bounds.width) * 2 - 1,
    -((event.clientY - bounds.top) / bounds.height) * 2 + 1,
  );
  raycaster.setFromCamera(pointer, camera);
  const hit = raycaster.intersectObjects(selectableMeshes(), false)[0];
  selectInstance(hit?.object.userData.instanceRoot ?? null);
}

transformControls.addEventListener("mouseDown", () => {
  transformInteractionActive = true;
  pointerStart = null;
  controls.enabled = false;
  controls.autoRotate = false;
});

transformControls.addEventListener("mouseUp", () => {
  controls.enabled = true;
  interactionPauseUntil = selectedInstance
    ? Number.POSITIVE_INFINITY
    : performance.now() + 1400;
  requestAnimationFrame(() => {
    transformInteractionActive = false;
  });
});

canvas.addEventListener("pointerdown", (event) => {
  if (event.pointerType === "mouse" && event.button !== 0) return;
  if (transformInteractionActive || transformControls.axis) {
    pointerStart = null;
    return;
  }
  pointerStart = { id: event.pointerId, x: event.clientX, y: event.clientY };
});

canvas.addEventListener("pointerup", (event) => {
  if (transformInteractionActive) {
    pointerStart = null;
    return;
  }
  if (!pointerStart || pointerStart.id !== event.pointerId) return;
  const distance = Math.hypot(event.clientX - pointerStart.x, event.clientY - pointerStart.y);
  pointerStart = null;
  if (distance <= 5) selectAtPointer(event);
});

canvas.addEventListener("pointercancel", () => {
  pointerStart = null;
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
  controls.autoRotate = autoRotateInput.checked && !selectedInstance;
});

controls.addEventListener("start", () => {
  controls.autoRotate = false;
});

controls.addEventListener("end", () => {
  interactionPauseUntil = selectedInstance
    ? Number.POSITIVE_INFINITY
    : performance.now() + 1400;
});

window.addEventListener("keydown", (event) => {
  if (!selectedInstance) return;
  if (event.key === "Escape") {
    clearSelection();
    return;
  }
  if (event.target instanceof HTMLElement && event.target.closest("button, input, select, textarea, [contenteditable]")) {
    return;
  }
  const mode = { g: "translate", r: "rotate", s: "scale" }[event.key.toLowerCase()];
  if (!mode) return;
  event.preventDefault();
  setTransformMode(mode);
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
  if (!selectedInstance && autoRotateInput?.checked && time > interactionPauseUntil) {
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
  get selectedInstance() {
    return selectedInstance;
  },
  get transformPivot() {
    return transformPivot;
  },
  transformControls,
  clearSelection,
  fitCamera,
  resetSelectedTransform,
  setDataset,
  setMode,
  setTransformMode,
};
