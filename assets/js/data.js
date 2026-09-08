export const HF_ASSET_ROOT =
  "https://huggingface.co/datasets/hongchi/Fire3D_examples/resolve/main/website/v1";

function sceneAsset(dataset, scene, path) {
  return `${HF_ASSET_ROOT}/scenes/${dataset}/${scene}/${path}`;
}

function scene(dataset, id, label, viewDirection) {
  return {
    dataset,
    id,
    label,
    viewDirection,
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
      { id: "ithor_floorplan24", label: "iTHOR · FloorPlan 24" },
      { id: "ithor_floorplan306", label: "iTHOR · FloorPlan 306" },
      { id: "imaginarium_bedroom01", label: "Imaginarium · Bedroom 01" },
      { id: "imaginarium_bedroom17", label: "Imaginarium · Bedroom 17" },
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
      { id: "ithor_floorplan312", label: "iTHOR · FloorPlan 312" },
      { id: "ithor_floorplan328", label: "iTHOR · FloorPlan 328" },
      { id: "imaginarium_bedroom35", label: "Imaginarium · Bedroom 35" },
      { id: "imaginarium_computerroom03", label: "Imaginarium · Computer Room 03" },
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
