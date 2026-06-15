import type { KeyGeometry, KeymapData, Layer } from "./types";

export function getCornixImportKeyIds(data: KeymapData) {
  return data.layout.keys.filter((key) => key.kind !== "encoder").map((key) => key.id);
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function validateKeyGeometry(value: unknown): value is KeyGeometry {
  if (!isObject(value)) {
    return false;
  }

  return (
    typeof value.id === "string" &&
    (value.hand === "left" || value.hand === "right") &&
    (value.kind === undefined || value.kind === "key" || value.kind === "encoder") &&
    (value.row === undefined || typeof value.row === "number") &&
    (value.col === undefined || typeof value.col === "number") &&
    (value.vialRow === undefined || typeof value.vialRow === "number") &&
    (value.vialCol === undefined || typeof value.vialCol === "number") &&
    typeof value.x === "number" &&
    typeof value.y === "number" &&
    (value.r === undefined || typeof value.r === "number") &&
    (value.rx === undefined || typeof value.rx === "number") &&
    (value.ry === undefined || typeof value.ry === "number") &&
    (value.w === undefined || typeof value.w === "number") &&
    (value.h === undefined || typeof value.h === "number")
  );
}

export function validateKeymap(value: unknown): KeymapData {
  if (!isObject(value)) {
    throw new Error("keymap must be an object.");
  }

  const layout = value.layout;
  const layers = value.layers;

  if (typeof value.keyboard !== "string") {
    throw new Error("keymap is missing keyboard.");
  }

  if (!isObject(layout) || !Array.isArray(layout.keys) || !layout.keys.every(validateKeyGeometry)) {
    throw new Error("keymap layout.keys is invalid.");
  }

  if (
    !Array.isArray(layers) ||
    layers.length === 0 ||
    !layers.every(
      (layer) =>
        isObject(layer) &&
        typeof layer.name === "string" &&
        isObject(layer.keys) &&
        Object.values(layer.keys).every((keycode) => typeof keycode === "string"),
    )
  ) {
    throw new Error("keymap layers is invalid.");
  }

  return value as KeymapData;
}

function isNoKey(keycode?: string) {
  return keycode === undefined || keycode === "KC_NO" || keycode === "XXXXXXX" || keycode === "";
}

function isKey(keycode: string | undefined, expected: string) {
  if (expected === "KC_RIGHT") {
    return keycode === "KC_RIGHT" || keycode === "KC_RGHT";
  }

  return keycode === expected;
}

function applyCornixLowerNavCompatibilityToLayer(layer: Layer): Layer {
  const keys = layer.keys;
  const homeTargets = ["R1C12", "R1C11", "R1C10", "R1C9"];
  const hasEmptyHomeNav = homeTargets.every((keyId) => isNoKey(keys[keyId]));
  const hasBottomNav =
    isKey(keys.R3C9, "KC_LEFT") &&
    isKey(keys.R3C8, "KC_DOWN") &&
    isKey(keys.R2C8, "KC_UP") &&
    isKey(keys.R3C7, "KC_RIGHT");

  if (!hasEmptyHomeNav || !hasBottomNav) {
    return layer;
  }

  return {
    ...layer,
    keys: {
      ...keys,
      R1C12: keys.R3C9,
      R1C11: keys.R3C8,
      R1C10: keys.R2C8,
      R1C9: keys.R3C7,
    },
  };
}

export function applyCornixCompatibility(data: KeymapData): KeymapData {
  if (data.keyboard !== "Cornix LP") {
    return data;
  }

  return {
    ...data,
    layers: data.layers.map(applyCornixLowerNavCompatibilityToLayer),
  };
}

function looksLikeKeycode(value: unknown): value is string {
  return (
    typeof value === "string" &&
    (/^(?:KC_|MO\(|TG\(|TO\(|DF\(|LT\(|MT\(|S\(|LSFT\(|M\d+$|RESET$|QK_BOOT$|XXXXXXX$|_______$)/.test(value) ||
      value === "")
  );
}

function flattenKeycodes(value: unknown): string[] {
  if (looksLikeKeycode(value)) {
    return [value];
  }

  if (Array.isArray(value)) {
    return value.flatMap(flattenKeycodes);
  }

  return [];
}

function findLayerArrays(value: unknown): unknown[] | undefined {
  if (!isObject(value)) {
    return undefined;
  }

  const directCandidates = [
    value.layers,
    value.keymap,
    value.keymaps,
    value.layout,
    value.matrix,
    value.keyboard,
  ];

  for (const candidate of directCandidates) {
    if (Array.isArray(candidate)) {
      if (candidate.some((entry) => flattenKeycodes(entry).length > 0)) {
        return candidate;
      }
    }
  }

  for (const child of Object.values(value)) {
    const found = findLayerArrays(child);
    if (found) {
      return found;
    }
  }

  return undefined;
}

function getLayerName(source: unknown, index: number) {
  if (isObject(source) && typeof source.name === "string") {
    return source.name;
  }

  const defaults = ["Base", "Lower", "Raise", "Adjust"];
  return defaults[index] ?? `Layer ${index}`;
}

function isLayerMatrix(value: unknown): value is unknown[][] {
  return Array.isArray(value) && value.every((row) => Array.isArray(row));
}

function isLayerMatrixList(value: unknown): value is unknown[][][] {
  return Array.isArray(value) && value.every(isLayerMatrix);
}

function findMatrixLayerSources(value: unknown): unknown[][][] | undefined {
  if (!isObject(value)) {
    return undefined;
  }

  if (isLayerMatrixList(value.layout)) {
    return value.layout;
  }

  if (isLayerMatrixList(value.layers)) {
    return value.layers;
  }

  return undefined;
}

function normalizeSavedKeycode(value: unknown): string {
  if (value === undefined || value === null || value === -1) {
    return "KC_NO";
  }

  if (typeof value === "string") {
    return value.trim() || "KC_NO";
  }

  if (typeof value === "number") {
    return value < 0 ? "KC_NO" : `0x${value.toString(16)}`;
  }

  return "KC_NO";
}

function hasMatrixCoordinate(layer: unknown[][], row: number, col: number) {
  return Array.isArray(layer[row]) && col in layer[row];
}

function readMatrixKeycode(layer: unknown[][], key: KeyGeometry) {
  const coordinates = [
    [key.vialRow, key.vialCol],
    [key.row, key.col],
  ];

  for (const [row, col] of coordinates) {
    if (typeof row === "number" && typeof col === "number" && hasMatrixCoordinate(layer, row, col)) {
      return normalizeSavedKeycode(layer[row]?.[col]);
    }
  }

  return "KC_NO";
}

function normalizeMatrixKeymap(value: unknown, fallback: KeymapData): KeymapData | undefined {
  const layerSources = findMatrixLayerSources(value);
  if (!layerSources) {
    return undefined;
  }

  const matrixKeys = fallback.layout.keys.filter(
    (key) =>
      (typeof key.row === "number" && typeof key.col === "number") ||
      (typeof key.vialRow === "number" && typeof key.vialCol === "number"),
  );

  if (matrixKeys.length === 0) {
    throw new Error("The bundled layout is missing matrix row/col metadata.");
  }

  const layers: Layer[] = layerSources.map((layerSource, layerIndex) => ({
    name: getLayerName(layerSource, layerIndex),
    keys: Object.fromEntries(matrixKeys.map((key) => [key.id, readMatrixKeycode(layerSource, key)])),
  }));

  return {
    keyboard: fallback.keyboard,
    layout: fallback.layout,
    layers,
  };
}

function normalizeVialLikeJson(value: unknown, fallback: KeymapData): KeymapData {
  const matrixKeymap = normalizeMatrixKeymap(value, fallback);
  if (matrixKeymap) {
    return matrixKeymap;
  }

  const layerSources = findLayerArrays(value);
  if (!layerSources) {
    throw new Error("Vial-like keymap layers were not found.");
  }

  const keyIds = getCornixImportKeyIds(fallback);
  const layers: Layer[] = layerSources
    .map((layerSource, layerIndex) => {
      const keycodes = flattenKeycodes(layerSource);
      if (keycodes.length === 0) {
        return undefined;
      }

      const keys = Object.fromEntries(keyIds.map((keyId, index) => [keyId, keycodes[index] ?? "KC_NO"]));

      return {
        name: getLayerName(layerSource, layerIndex),
        keys,
      };
    })
    .filter((layer): layer is Layer => Boolean(layer));

  if (layers.length === 0) {
    throw new Error("No keycodes were found in the dropped file.");
  }

  return {
    keyboard: fallback.keyboard,
    layout: fallback.layout,
    layers,
  };
}

export function parseDroppedKeymap(text: string, fallback: KeymapData): KeymapData {
  let parsed: unknown;

  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error("Dropped file is not JSON. This viewer currently supports normalized JSON and JSON-based .vil files.");
  }

  try {
    return applyCornixCompatibility(validateKeymap(parsed));
  } catch {
    return applyCornixCompatibility(normalizeVialLikeJson(parsed, fallback));
  }
}
