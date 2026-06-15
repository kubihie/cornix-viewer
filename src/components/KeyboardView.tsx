import type { KeyGeometry, KeymapData } from "../types";
import { EncoderKnob } from "./EncoderKnob";
import { Keycap } from "./Keycap";

type KeyboardViewProps = {
  data: KeymapData;
  layerIndex: number;
  selectedKeyId?: string;
  showBaseForTransparent: boolean;
  onSelectKey: (id: string) => void;
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
  };
}

function getBounds(keys: KeyGeometry[], units: Units) {
  const geometries = keys.map((key) => getPixelGeometry(key, units));
  const minX = Math.min(...geometries.map((key) => key.x), 0);
  const minY = Math.min(...geometries.map((key) => key.y), 0);
  const maxX = Math.max(...geometries.map((key) => key.x + key.width), units.keyWidth);
  const maxY = Math.max(...geometries.map((key) => key.y + key.height), units.keyHeight);

  return { minX, minY, width: maxX - minX, height: maxY - minY };
}

function getHandOffset(
  hand: KeyGeometry["hand"],
  leftBounds: ReturnType<typeof getBounds>,
  rightBounds: ReturnType<typeof getBounds>,
  units: Units,
) {
  if (hand === "left") {
    return { x: -leftBounds.minX, y: -Math.min(leftBounds.minY, rightBounds.minY) };
  }

  const centerGap = units.keyWidth * 1.18;
  return {
    x: leftBounds.width + centerGap - rightBounds.minX,
    y: -Math.min(leftBounds.minY, rightBounds.minY),
  };
}

function KeyboardItem({
  keyGeometry,
  pixelGeometry,
  data,
  layerIndex,
  selectedKeyId,
  showBaseForTransparent,
  onSelectKey,
}: {
  keyGeometry: KeyGeometry;
  pixelGeometry: PixelGeometry;
  data: KeymapData;
  layerIndex: number;
  selectedKeyId?: string;
  showBaseForTransparent: boolean;
  onSelectKey: (id: string) => void;
}) {
  const layer = data.layers[layerIndex];
  const baseLayer = data.layers[0];
  const raw = layer.keys[keyGeometry.id] ?? "KC_NO";

  if (keyGeometry.kind === "encoder") {
    return (
      <EncoderKnob
        id={keyGeometry.id}
        raw={raw}
        selected={selectedKeyId === keyGeometry.id}
        onSelect={onSelectKey}
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
      selected={selectedKeyId === keyGeometry.id}
      showBaseForTransparent={showBaseForTransparent}
      onSelect={onSelectKey}
      rotation={keyGeometry.r}
      {...pixelGeometry}
    />
  );
}

function CombinedKeyboardSvg({
  keys,
  data,
  layerIndex,
  selectedKeyId,
  showBaseForTransparent,
  onSelectKey,
}: {
  keys: KeyGeometry[];
  data: KeymapData;
  layerIndex: number;
  selectedKeyId?: string;
  showBaseForTransparent: boolean;
  onSelectKey: (id: string) => void;
}) {
  const units = getUnits(data);
  const leftKeys = keys.filter((key) => key.hand === "left");
  const rightKeys = keys.filter((key) => key.hand === "right");
  const leftBounds = getBounds(leftKeys, units);
  const rightBounds = getBounds(rightKeys, units);
  const minY = Math.min(leftBounds.minY, rightBounds.minY);
  const height = Math.max(leftBounds.minY + leftBounds.height, rightBounds.minY + rightBounds.height) - minY;
  const centerGap = units.keyWidth * 1.18;
  const width = leftBounds.width + centerGap + rightBounds.width;

  return (
    <section className="keyboard-section" aria-label="Cornix LP keyboard">
      <svg
        className="keyboard-svg"
        viewBox={`0 0 ${width} ${height}`}
        role="group"
        aria-label="Keyboard keys"
      >
        {keys.map((key) => {
          const offset = getHandOffset(key.hand, leftBounds, rightBounds, units);
          const geometry = getPixelGeometry(key, units);
          const translatedGeometry = {
            ...geometry,
            x: geometry.x + offset.x,
            y: geometry.y + offset.y,
          };

          return (
            <KeyboardItem
              key={key.id}
              keyGeometry={key}
              pixelGeometry={translatedGeometry}
              data={data}
              layerIndex={layerIndex}
              selectedKeyId={selectedKeyId}
              showBaseForTransparent={showBaseForTransparent}
              onSelectKey={onSelectKey}
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
  selectedKeyId,
  showBaseForTransparent,
  onSelectKey,
}: KeyboardViewProps) {
  return (
    <div className="keyboard-scroll" aria-label="Keyboard layout">
      <div className="keyboard-stage">
        <CombinedKeyboardSvg
          keys={data.layout.keys}
          data={data}
          layerIndex={layerIndex}
          selectedKeyId={selectedKeyId}
          showBaseForTransparent={showBaseForTransparent}
          onSelectKey={onSelectKey}
        />
      </div>
    </div>
  );
}
