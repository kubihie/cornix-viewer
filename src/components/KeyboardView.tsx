import type { KeyGeometry, KeymapData } from "../types";
import { EncoderKnob } from "./EncoderKnob";
import { Keycap } from "./Keycap";

type KeyboardViewProps = {
  data: KeymapData;
  layerIndex: number;
  highlightedKeyIds?: ReadonlySet<string>;
  rawOverrides?: ReadonlyMap<string, string>;
  showBaseForTransparent: boolean;
};

type Units = {
  keyWidth: number;
  keyHeight: number;
  gap: number;
};

type PixelGeometry = {
  x: number;
  y: number;
  width: number;
  height: number;
  originX?: number;
  originY?: number;
};

function getUnits(data: KeymapData): Units {
  return {
    keyWidth: data.layout.units?.keyWidth ?? 56,
    keyHeight: data.layout.units?.keyHeight ?? 52,
    gap: data.layout.units?.gap ?? 6,
  };
}

function getPixelGeometry(key: KeyGeometry, units: Units): PixelGeometry {
  const widthUnits = key.w ?? 1;
  const heightUnits = key.h ?? 1;

  return {
    x: key.x * (units.keyWidth + units.gap),
    y: key.y * (units.keyHeight + units.gap),
    width: widthUnits * units.keyWidth + (widthUnits - 1) * units.gap,
    height: heightUnits * units.keyHeight + (heightUnits - 1) * units.gap,
    originX: key.rx === undefined ? undefined : key.rx * (units.keyWidth + units.gap),
    originY: key.ry === undefined ? undefined : key.ry * (units.keyHeight + units.gap),
  };
}

function rotatePoint(x: number, y: number, angle: number, originX: number, originY: number) {
  const radians = (angle * Math.PI) / 180;
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);
  const dx = x - originX;
  const dy = y - originY;

  return {
    x: originX + dx * cos - dy * sin,
    y: originY + dx * sin + dy * cos,
  };
}

function getGeometryCorners(key: KeyGeometry, units: Units) {
  const geometry = getPixelGeometry(key, units);
  const corners = [
    { x: geometry.x, y: geometry.y },
    { x: geometry.x + geometry.width, y: geometry.y },
    { x: geometry.x + geometry.width, y: geometry.y + geometry.height },
    { x: geometry.x, y: geometry.y + geometry.height },
  ];

  if (!key.r) {
    return corners;
  }

  const originX = geometry.originX ?? geometry.x + geometry.width / 2;
  const originY = geometry.originY ?? geometry.y + geometry.height / 2;
  return corners.map((corner) => rotatePoint(corner.x, corner.y, key.r ?? 0, originX, originY));
}

function getBounds(keys: KeyGeometry[], units: Units) {
  const corners = keys.flatMap((key) => getGeometryCorners(key, units));
  const minX = Math.min(...corners.map((point) => point.x), 0);
  const minY = Math.min(...corners.map((point) => point.y), 0);
  const maxX = Math.max(...corners.map((point) => point.x), units.keyWidth);
  const maxY = Math.max(...corners.map((point) => point.y), units.keyHeight);

  return { minX, minY, width: maxX - minX, height: maxY - minY };
}

function KeyboardItem({
  keyGeometry,
  pixelGeometry,
  data,
  layerIndex,
  highlightedKeyIds,
  rawOverrides,
  showBaseForTransparent,
}: {
  keyGeometry: KeyGeometry;
  pixelGeometry: PixelGeometry;
  data: KeymapData;
  layerIndex: number;
  highlightedKeyIds?: ReadonlySet<string>;
  rawOverrides?: ReadonlyMap<string, string>;
  showBaseForTransparent: boolean;
}) {
  const layer = data.layers[layerIndex];
  const baseLayer = data.layers[0];
  const raw = rawOverrides?.get(keyGeometry.id) ?? layer.keys[keyGeometry.id] ?? "KC_NO";

  if (keyGeometry.kind === "encoder") {
    return (
      <EncoderKnob
        id={keyGeometry.id}
        raw={raw}
        rotation={keyGeometry.r}
        {...pixelGeometry}
      />
    );
  }

  return (
    <Keycap
      id={keyGeometry.id}
      raw={raw}
      baseRaw={baseLayer.keys[keyGeometry.id]}
      highlighted={highlightedKeyIds?.has(keyGeometry.id) ?? false}
      showBaseForTransparent={showBaseForTransparent}
      rotation={keyGeometry.r}
      {...pixelGeometry}
    />
  );
}

function CombinedKeyboardSvg({
  keys,
  data,
  layerIndex,
  highlightedKeyIds,
  rawOverrides,
  showBaseForTransparent,
}: {
  keys: KeyGeometry[];
  data: KeymapData;
  layerIndex: number;
  highlightedKeyIds?: ReadonlySet<string>;
  rawOverrides?: ReadonlyMap<string, string>;
  showBaseForTransparent: boolean;
}) {
  const units = getUnits(data);
  const bounds = getBounds(keys, units);
  const padding = units.gap * 1.6;

  return (
    <section className="keyboard-section" aria-label="Cornix LP keyboard">
      <svg
        className="keyboard-svg"
        viewBox={`${bounds.minX - padding} ${bounds.minY - padding} ${bounds.width + padding * 2} ${
          bounds.height + padding * 2
        }`}
        role="group"
        aria-label="Keyboard keys"
      >
        {keys.map((key) => {
          const geometry = getPixelGeometry(key, units);

          return (
            <KeyboardItem
              key={key.id}
              keyGeometry={key}
              pixelGeometry={geometry}
              data={data}
              layerIndex={layerIndex}
              highlightedKeyIds={highlightedKeyIds}
              rawOverrides={rawOverrides}
              showBaseForTransparent={showBaseForTransparent}
            />
          );
        })}
      </svg>
    </section>
  );
}

export function KeyboardView({
  data,
  layerIndex,
  highlightedKeyIds,
  rawOverrides,
  showBaseForTransparent,
}: KeyboardViewProps) {
  return (
    <div className="keyboard-scroll" aria-label="Keyboard layout">
      <div className="keyboard-stage">
        <CombinedKeyboardSvg
          keys={data.layout.keys}
          data={data}
          layerIndex={layerIndex}
          highlightedKeyIds={highlightedKeyIds}
          rawOverrides={rawOverrides}
          showBaseForTransparent={showBaseForTransparent}
        />
      </div>
    </div>
  );
}
