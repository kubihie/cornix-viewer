import { getCornixImportKeyIds, validateKeymap } from "./keymapParser";
import type { KeymapData, Layer } from "./types";

const hashParam = "keymap";

type CompactKeymap = {
  v: 1 | 2;
  i?: string[];
  n: string[];
  k: string[][];
};

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getUrlKeyIds(data: KeymapData) {
  return data.layout.keys.map((key) => key.id);
}

function compactKeymap(data: KeymapData): CompactKeymap {
  const keyIds = getUrlKeyIds(data);

  return {
    v: 2,
    i: keyIds,
    n: data.layers.map((layer) => layer.name),
    k: data.layers.map((layer) => keyIds.map((keyId) => layer.keys[keyId] ?? "KC_NO")),
  };
}

function hydrateCompactKeymap(value: unknown, fallback: KeymapData): KeymapData | undefined {
  if (!isObject(value) || (value.v !== 1 && value.v !== 2) || !Array.isArray(value.n) || !Array.isArray(value.k)) {
    return undefined;
  }

  const keyIds =
    value.v === 2 && Array.isArray(value.i) && value.i.every((keyId) => typeof keyId === "string")
      ? value.i
      : getCornixImportKeyIds(fallback);
  const names = value.n;
  const keycodeLayers = value.k;

  if (
    !names.every((name) => typeof name === "string") ||
    !keycodeLayers.every((layer) => Array.isArray(layer) && layer.every((keycode) => typeof keycode === "string"))
  ) {
    return undefined;
  }

  const layers: Layer[] = keycodeLayers.map((keycodes, layerIndex) => ({
    name: names[layerIndex] ?? `Layer ${layerIndex}`,
    keys: Object.fromEntries(keyIds.map((keyId, keyIndex) => [keyId, keycodes[keyIndex] ?? "KC_NO"])),
  }));

  return {
    keyboard: fallback.keyboard,
    layout: fallback.layout,
    layers,
  };
}

function bytesToBase64Url(bytes: Uint8Array) {
  let binary = "";
  const chunkSize = 0x8000;

  for (let index = 0; index < bytes.length; index += chunkSize) {
    binary += String.fromCharCode(...bytes.slice(index, index + chunkSize));
  }

  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

function base64UrlToBytes(value: string) {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes;
}

function bytesToArrayBuffer(bytes: Uint8Array) {
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  return copy.buffer;
}

async function gzip(bytes: Uint8Array) {
  if (!("CompressionStream" in window)) {
    return undefined;
  }

  const stream = new Blob([bytesToArrayBuffer(bytes)]).stream().pipeThrough(new CompressionStream("gzip"));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

async function gunzip(bytes: Uint8Array) {
  if (!("DecompressionStream" in window)) {
    throw new Error("This browser cannot decompress keymap URLs.");
  }

  const stream = new Blob([bytesToArrayBuffer(bytes)]).stream().pipeThrough(new DecompressionStream("gzip"));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

export async function encodeKeymapForUrl(data: KeymapData) {
  const json = JSON.stringify(compactKeymap(data));
  const bytes = new TextEncoder().encode(json);
  const compressed = await gzip(bytes);

  if (compressed) {
    return `gz.${bytesToBase64Url(compressed)}`;
  }

  return `json.${bytesToBase64Url(bytes)}`;
}

export async function decodeKeymapFromUrlPayload(payload: string, fallback: KeymapData) {
  const [format, encoded] = payload.split(".", 2);
  if (!format || !encoded) {
    throw new Error("Keymap URL payload is invalid.");
  }

  const bytes = base64UrlToBytes(encoded);
  const decodedBytes = format === "gz" ? await gunzip(bytes) : bytes;
  const text = new TextDecoder().decode(decodedBytes);
  const parsed: unknown = JSON.parse(text);
  const compact = hydrateCompactKeymap(parsed, fallback);

  if (compact) {
    return compact;
  }

  const full = validateKeymap(parsed);
  return {
    keyboard: fallback.keyboard,
    layout: fallback.layout,
    layers: full.layers,
  };
}

export async function readKeymapFromCurrentUrl(fallback: KeymapData) {
  const searchPayload = new URLSearchParams(window.location.search).get(hashParam);
  const hash = window.location.hash.startsWith("#") ? window.location.hash.slice(1) : window.location.hash;
  const hashPayload = new URLSearchParams(hash).get(hashParam);
  const payload = hashPayload ?? searchPayload;

  if (!payload) {
    return undefined;
  }

  return decodeKeymapFromUrlPayload(payload, fallback);
}

export async function writeKeymapToUrl(data: KeymapData) {
  const payload = await encodeKeymapForUrl(data);
  const url = new URL(window.location.href);
  url.searchParams.delete(hashParam);
  url.hash = new URLSearchParams({ [hashParam]: payload }).toString();
  window.history.replaceState(null, "", url);
  return url.toString();
}
