import { getKeycodePresentation, getOutputCharacterMatch, getOutputCharacterMatches } from "./keycodeLabels";
import type { KeymapData } from "./types";

export type PracticeCandidate = {
  character: string;
  layerIndex: number;
  layerName: string;
  keyId: string;
  raw: string;
  label: string;
  press: string;
  shifted: boolean;
};

export function findPracticeCandidates(data: KeymapData, character: string): PracticeCandidate[] {
  if (!character) {
    return [];
  }

  return data.layers.flatMap((layer, layerIndex) =>
    data.layout.keys.flatMap((key) => {
      const raw = layer.keys[key.id] ?? "KC_NO";
      const match = getOutputCharacterMatch(raw, character);
      if (!match) {
        return [];
      }

      return {
        character: match.character,
        layerIndex,
        layerName: layer.name,
        keyId: key.id,
        raw,
        label: getKeycodePresentation(raw).label || raw,
        press: match.press,
        shifted: match.shifted,
      };
    }),
  );
}

export function getPracticeCharacters(data: KeymapData): string[] {
  const characters = new Set<string>();

  for (const layer of data.layers) {
    for (const key of data.layout.keys) {
      const raw = layer.keys[key.id] ?? "KC_NO";
      for (const match of getOutputCharacterMatches(raw)) {
        if (match.character !== " ") {
          characters.add(match.character);
        }
      }
    }
  }

  return Array.from(characters).sort((a, b) => a.localeCompare(b));
}
