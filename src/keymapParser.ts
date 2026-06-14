import type { KeyGeometry, KeymapData, Layer } from "./types";

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
    typeof value.x === "number" &&
    typeof value.y === "number" &&
    (value.r === undefined || typeof value.r === "number") &&
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

function looksLikeKeycode(value: unknown): value is string {
  return (
    typeof value === "string" &&
    (/^(?:KC_|MO\(|TG\(|TO\(|DF\(|LT\(|MT\(|S\(|LSFT\(|RESET$|QK_BOOT$|XXXXXXX$|_______$)/.test(value) ||
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

function normalizeVialLikeJson(value: unknown, fallback: KeymapData): KeymapData {
  const layerSources = findLayerArrays(value);
  if (!layerSources) {
    throw new Error("Vial-like keymap layers were not found.");
  }

  const keyIds = fallback.layout.keys.filter((key) => key.kind !== "encoder").map((key) => key.id);
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
    return validateKeymap(parsed);
  } catch {
    return normalizeVialLikeJson(parsed, fallback);
  }
}
