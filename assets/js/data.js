export const HF_ASSET_ROOT =
  "https://huggingface.co/datasets/hongchi/Fire3D_examples/resolve/main/website/v1";

const CAPTURE_CAMERAS = {
  iTHOR_FloorPlan312_physics: {
    fov: 60.184,
    poses: [
      [[1.5077, 2.6172, 1.9137], [2.0067, 3.1614, 0.055], [0.6282, 0.6849, 0.3691]],
      [[2.9804, 2.2674, 1.4072], [4.814, 2.7826, 2.0176], [-0.2938, -0.0826, 0.9523]],
      [[2.9582, 1.2831, 1.8482], [1.2142, 0.4938, 2.4274], [0.2638, 0.1194, 0.9571]],
      [[1.554, 1.5495, 1.143], [2.5403, 0.5866, -0.3061], [0.5185, -0.5061, 0.6892]],
    ],
  },
  iTHOR_FloorPlan24_physics: {
    fov: 56.721,
    poses: [
      [[1.6118, 1.0265, 1.7517], [2.9023, 0.056, 0.5717], [0.4716, -0.3546, 0.8074]],
      [[2.8492, 1.1061, 1.4539], [3.4863, 0.269, -0.2471], [0.515, -0.6768, 0.526]],
      [[1.8012, 1.1633, 1.0585], [0.4127, 2.1929, 2.0645], [0.4041, -0.2996, 0.8643]],
      [[1.2739, 2.0007, 1.8279], [-0.271, 2.809, 0.8482], [-0.434, 0.2271, 0.8718]],
    ],
  },
  iTHOR_FloorPlan306_physics: {
    fov: 77.364,
    poses: [
      [[1.1833, 1.0955, 2.2378], [2.801, -0.0409, 1.9349], [0.1239, -0.0871, 0.9885]],
      [[2.8218, 2.4979, 1.8192], [0.8703, 2.3723, 2.2389], [0.2094, 0.0135, 0.9777]],
      [[1.7434, 1.4256, 1.607], [3.1255, 2.8432, 1.3236], [0.0989, 0.1015, 0.9899]],
      [[4.2871, 1.4446, 1.4689], [4.9828, 3.192, 0.7888], [0.1258, 0.3159, 0.9404]],
    ],
  },
  iTHOR_FloorPlan328_physics: {
    fov: 67.308,
    poses: [
      [[1.3931, 1.0687, 1.027], [0.7986, -0.1378, 2.5071], [0.3271, 0.6638, 0.6725]],
      [[2.7957, 2.0683, 1.9689], [1.4055, 2.9986, 0.8726], [-0.4556, 0.3049, 0.8364]],
      [[2.9471, 2.0374, 1.9262], [0.9843, 2.4204, 1.9062], [-0.0098, 0.0019, 1.0]],
      [[0.888, 1.9798, 1.704], [2.6822, 1.1454, 1.4128], [0.132, -0.0614, 0.9893]],
    ],
  },
  bedroom_01: {
    fov: 78.45,
    poses: [
      [[0.4992, 4.003, 2.3859], [1.7637, 3.7805, 0.8524], [0.7552, -0.1329, 0.6419]],
      [[3.3785, 4.7393, 2.3167], [3.2715, 4.4003, 0.3486], [-0.2962, -0.9384, 0.1778]],
      [[3.2136, 2.6753, 1.3904], [1.3707, 3.2214, 0.8376], [-0.265, 0.0785, 0.961]],
      [[3.5218, 0.9621, 1.6005], [4.9043, 2.2545, 0.9536], [0.2363, 0.2209, 0.9462]],
    ],
  },
  bedroom_17: {
    fov: 79.408,
    poses: [
      [[0.67, 1.785, 2.9598], [0.6755, 2.222, 1.0082], [0.0124, 0.9758, 0.2185]],
      [[1.8731, 1.9039, 0.8352], [0.9729, 3.6208, 1.3271], [0.1142, -0.2178, 0.9693]],
      [[3.1503, 3.7516, 3.6767], [4.8647, 2.8109, 3.2576], [0.1837, -0.1008, 0.9778]],
      [[5.0983, 0.4262, 1.9336], [4.7114, 1.626, 0.381], [-0.2383, 0.7389, 0.6303]],
    ],
  },
  bedroom_35: {
    fov: 54.908,
    poses: [
      [[1.3708, 7.3554, 3.6073], [2.2188, 7.2581, 1.7986], [0.8985, -0.1031, 0.4267]],
      [[4.5983, 6.8926, 2.265], [2.8633, 7.7315, 1.7301], [-0.2408, 0.1164, 0.9636]],
      [[3.9281, 4.264, 0.9401], [3.59, 3.1788, -0.7055], [-0.2448, -0.7856, 0.5683]],
      [[2.7619, 7.1402, 1.7744], [2.1971, 5.2943, 2.2973], [0.0765, 0.25, 0.9652]],
    ],
  },
  computer_room_03: {
    fov: 59.443,
    poses: [
      [[2.2525, 1.1719, 2.0949], [2.719, 2.8052, 1.0392], [0.145, 0.5076, 0.8493]],
      [[1.4879, 3.2371, 2.2024], [-0.1078, 3.1392, 1.0008], [-0.5997, -0.0368, 0.7994]],
      [[1.1313, 2.8055, 1.9597], [2.3393, 2.9489, 0.3722], [0.7883, 0.0935, 0.6082]],
      [[3.7346, 0.9029, 0.4318], [3.7172, 2.902, 0.3746], [-0.0002, 0.0286, 0.9996]],
    ],
  },
};

function sceneAsset(dataset, scene, path) {
  return `${HF_ASSET_ROOT}/scenes/${dataset}/${scene}/${path}`;
}

function scene(dataset, id, label, viewDirection) {
  return {
    dataset,
    id,
    label,
    viewDirection,
    cameraRig: CAPTURE_CAMERAS[id],
    assets: {
      rgb: sceneAsset(dataset, id, "rgb_points.ply"),
      instances: sceneAsset(dataset, id, "instances.ply"),
      obbs: sceneAsset(dataset, id, "obbs.ply"),
      foreground: sceneAsset(dataset, id, "foreground.glb"),
      background: sceneAsset(dataset, id, "background.glb"),
    },
    frames: [0, 15, 30, 45].map((frame) => ({
      frame,
      url: sceneAsset(
        dataset,
        id,
        `views/frame_${String(frame).padStart(4, "0")}.webp`,
      ),
    })),
  };
}

export const SCENES = {
  ithor: [
    scene("ithor", "iTHOR_FloorPlan312_physics", "FloorPlan 312", [-1.35, -1.55, 1.05]),
    scene("ithor", "iTHOR_FloorPlan24_physics", "FloorPlan 24", [-1.35, -1.55, 1.05]),
    scene("ithor", "iTHOR_FloorPlan306_physics", "FloorPlan 306", [-1.4, -1.5, 1.1]),
    scene("ithor", "iTHOR_FloorPlan328_physics", "FloorPlan 328", [-1.5, -1.35, 1.05]),
  ],
  imaginarium: [
    scene("imaginarium", "bedroom_01", "Bedroom 01", [-1.4, -1.55, 1.05]),
    scene("imaginarium", "bedroom_17", "Bedroom 17", [-1.35, -1.6, 1.0]),
    scene("imaginarium", "bedroom_35", "Bedroom 35", [-1.45, -1.45, 1.15]),
    scene("imaginarium", "computer_room_03", "Computer Room 03", [-1.4, -1.55, 1.0]),
  ],
};

export const VIDEOS = {
  dynamic: [
    { src: `${HF_ASSET_ROOT}/media/fire3d_dynamic_vfx.webm`, type: "video/webm" },
    { src: `${HF_ASSET_ROOT}/media/fire3d_dynamic_vfx.mp4`, type: "video/mp4" },
  ],
  robotics: [
    { src: `${HF_ASSET_ROOT}/media/fire3d_robotics.webm`, type: "video/webm" },
    { src: `${HF_ASSET_ROOT}/media/fire3d_robotics.mp4`, type: "video/mp4" },
  ],
  gaming: [
    { src: `${HF_ASSET_ROOT}/media/fire3d_gaming.webm`, type: "video/webm" },
    { src: `${HF_ASSET_ROOT}/media/fire3d_gaming.mp4`, type: "video/mp4" },
  ],
};

const comparisonAsset = (group, path) =>
  `${HF_ASSET_ROOT}/comparisons/${group}/${path}`;

const paperAsset = (group, path) =>
  `${HF_ASSET_ROOT}/paper/${group}/${path}`;

export const PAPER_RESULTS = {
  perception: {
    group: "perception",
    scenes: [
      { id: "iTHOR_FloorPlan206_physics_0", label: "iTHOR · FloorPlan 206" },
      { id: "iTHOR_FloorPlan219_physics_0", label: "iTHOR · FloorPlan 219" },
      { id: "ima_bedroom_11_0", label: "Imaginarium · Bedroom 11" },
      { id: "ima_diningroom_17_0", label: "Imaginarium · Dining Room 17" },
      { id: "aeo_seq14_740780134182416", label: "AEO · sequence 14" },
      { id: "aeo_seq05_219801130654082", label: "AEO · sequence 05" },
    ],
    methods: [
      { id: "ground_truth", label: "Ground truth" },
      { id: "scenescript", label: "SceneScript" },
      { id: "efm3d", label: "EFM3D" },
      { id: "boxer", label: "Boxer" },
      { id: "ours", label: "Fire3D", fire3d: true },
    ],
    path(sceneId, methodId) {
      return paperAsset("perception", `${sceneId}/${methodId}.webp`);
    },
  },
  "oracle-reconstruction": {
    group: "oracle_reconstruction",
    scenes: [
      { id: "imaginarium_bedroom01", label: "Imaginarium · Bedroom 01" },
      { id: "imaginarium_bedroom17", label: "Imaginarium · Bedroom 17" },
      { id: "ithor_floorplan24", label: "iTHOR · FloorPlan 24" },
      { id: "ithor_floorplan306", label: "iTHOR · FloorPlan 306" },
    ],
    views: [1, 2],
    showAllViews: true,
    methods: [
      { id: "gt_texture", label: "Ground truth" },
      { id: "shaper_geometry", label: "ShapeR · geometry" },
      { id: "sam3d_texture", label: "SAM 3D · texture" },
      { id: "ours_gt_texture", label: "Fire3D · texture", fire3d: true },
    ],
    path(sceneId, methodId, view) {
      return paperAsset(
        "oracle_reconstruction",
        `${sceneId}/${methodId}_v${view}.webp`,
      );
    },
  },
  "end-to-end": {
    group: "end_to_end",
    scenes: [
      { id: "imaginarium_bedroom35", label: "Imaginarium · Bedroom 35" },
      { id: "imaginarium_computerroom03", label: "Imaginarium · Computer Room 03" },
      { id: "ithor_floorplan312", label: "iTHOR · FloorPlan 312" },
      { id: "ithor_floorplan328", label: "iTHOR · FloorPlan 328" },
    ],
    views: [1, 2],
    showAllViews: true,
    methods: [
      { id: "gt_texture", label: "Ground truth" },
      { id: "efm3d_shaper_geometry", label: "EFM3D + ShapeR · geometry" },
      { id: "ours_pred_texture", label: "Fire3D · predicted perception + texture", fire3d: true },
    ],
    path(sceneId, methodId, view) {
      return paperAsset("end_to_end", `${sceneId}/${methodId}_v${view}.webp`);
    },
  },
  "single-image": {
    group: "single_image",
    scenes: ["3025", "3084", "3266", "3454", "3477"].map((id) => ({
      id,
      label: `3D-FRONT · ${id}`,
    })),
    methods: [
      { id: "input", label: "Input image" },
      { id: "gen3dsr_geometry", label: "Gen3DSR" },
      { id: "midi_geometry", label: "MIDI" },
      { id: "scenegen_geometry", label: "SceneGen" },
      { id: "ours_geometry", label: "Fire3D", fire3d: true },
    ],
    path(sceneId, methodId) {
      return paperAsset("single_image", `${sceneId}/${methodId}.webp`);
    },
  },
  generalization: {
    group: "generalization",
    paired: true,
    scenes: [
      { id: "sage10k", label: "SAGE-10K" },
      { id: "procthor", label: "ProcTHOR" },
      { id: "mansionworld", label: "MansionWorld" },
      { id: "replica", label: "Replica" },
      { id: "hypersim", label: "Hypersim" },
      { id: "scannetpp", label: "ScanNet++" },
    ],
    methods: [
      { id: "gt", label: "Ground truth" },
      { id: "ours", label: "Fire3D", fire3d: true },
    ],
    path(sceneId, methodId) {
      return paperAsset("generalization", `${sceneId}/${methodId}.webp`);
    },
  },
};

export const HOLOSCENE = {
  scene: {
    label: "Scene",
    frames: [0, 14, 23, 37, 49, 60, 74, 82, 102, 115, 127, 139, 145, 159, 172, 182],
    path(frame, method) {
      return comparisonAsset(
        "holoscene/scene",
        `frame_${String(frame).padStart(6, "0")}_${method}.webp`,
      );
    },
  },
  igibson: {
    label: "iGibson",
    frames: [42, 169, 239, 349, 514, 572, 691, 818, 1004, 1143, 1248, 1358, 1470, 1596, 1689, 1822],
    path(frame, method) {
      return comparisonAsset(
        "holoscene/igibson",
        `frame_${String(frame).padStart(6, "0")}_${method}.webp`,
      );
    },
  },
};

export const SIMRECON = [
  {
    scene: "Dining room 05",
    view: "0018",
    prefix: "diningroom05_view_0018",
  },
  {
    scene: "Official 04",
    view: "0031",
    prefix: "official04_view_0031",
  },
];

export const LITEREALITY = [
  { scene: "FloorPlan 12", view: "35°", prefix: "floorplan12_az35" },
  { scene: "FloorPlan 12", view: "125°", prefix: "floorplan12_az125" },
  { scene: "FloorPlan 411", view: "35°", prefix: "floorplan411_az35" },
  { scene: "FloorPlan 411", view: "125°", prefix: "floorplan411_az125" },
];

export const COMPOSED_SCENES = [
  { id: "imaginarium_bedroom01", label: "Imaginarium · Bedroom 01" },
  { id: "imaginarium_bedroom17", label: "Imaginarium · Bedroom 17" },
  { id: "imaginarium_bedroom35", label: "Imaginarium · Bedroom 35" },
  { id: "imaginarium_computerroom03", label: "Imaginarium · Computer Room 03" },
  { id: "ithor_floorplan24", label: "iTHOR · FloorPlan 24" },
  { id: "ithor_floorplan306", label: "iTHOR · FloorPlan 306" },
  { id: "ithor_floorplan312", label: "iTHOR · FloorPlan 312" },
  { id: "ithor_floorplan328", label: "iTHOR · FloorPlan 328" },
];

export function simreconAsset(prefix, method) {
  return comparisonAsset("simrecon", `${prefix}_${method}.webp`);
}

export function literealityAsset(prefix, method) {
  return comparisonAsset("litereality", `${prefix}_${method}.webp`);
}

export function composedAsset(sceneId, method, view) {
  return comparisonAsset(
    "composed",
    `composed_${sceneId}_${method}_v${view}.webp`,
  );
}
