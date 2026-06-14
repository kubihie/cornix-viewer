import { getKeycodePresentation } from "../keycodeLabels";
import type { KeyGeometry, Layer } from "../types";

type KeyDetailProps = {
  keyId?: string;
  geometry?: KeyGeometry;
  layer?: Layer;
  baseLayer?: Layer;
  showBaseForTransparent: boolean;
};

export function KeyDetail({
  keyId,
  geometry,
  layer,
  baseLayer,
  showBaseForTransparent,
}: KeyDetailProps) {
  if (!keyId || !layer) {
    return null;
  }

  if (geometry?.kind === "encoder") {
    return (
      <aside className="key-detail" aria-label="Key detail">
        <div>
          <div className="detail-label">Encoder knob</div>
          <div className="detail-meta">
            {layer.name} · {keyId} · {geometry.hand}
          </div>
        </div>
        <dl className="detail-list">
          <div>
            <dt>raw</dt>
            <dd>visual-only encoder</dd>
          </div>
          <div>
            <dt>description</dt>
            <dd>Rotary encoder position. Keymap layers are still read from the key entries.</dd>
          </div>
        </dl>
      </aside>
    );
  }

  const raw = layer.keys[keyId] ?? "KC_NO";
  const presentation = getKeycodePresentation(raw);
  const baseRaw = baseLayer?.keys[keyId];
  const basePresentation = getKeycodePresentation(baseRaw);
  const baseText =
    showBaseForTransparent && presentation.kind === "transparent" && basePresentation.kind !== "empty"
      ? `Base: ${basePresentation.label || basePresentation.raw}`
      : undefined;

  return (
    <aside className="key-detail" aria-label="Key detail">
      <div>
        <div className="detail-label">{presentation.label || "No key"}</div>
        <div className="detail-meta">
          {layer.name} · {keyId}
          {geometry ? ` · ${geometry.hand}` : ""}
        </div>
      </div>
      <dl className="detail-list">
        <div>
          <dt>raw</dt>
          <dd>{presentation.raw}</dd>
        </div>
        <div>
          <dt>description</dt>
          <dd>{baseText ? `${presentation.description} / ${baseText}` : presentation.description}</dd>
        </div>
      </dl>
    </aside>
  );
}
