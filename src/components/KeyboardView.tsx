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

function getUnits(data: KeymapData): Units {
  return {
    keyWidth: data.layout.units?.keyWidth ?? 56,
    keyHeight: data.layout.units?.keyHeight ?? 52,
    gap: data.layout.units?.gap ?? 6,
  };
}

function getPixelGeometry(key: KeyGeometry, units: Units) {
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

function HandSvg({
  title,
  keys,
  data,
  layerIndex,
  selectedKeyId,
  showBaseForTransparent,
  onSelectKey,
}: {
  title: string;
  keys: KeyGeometry[];
  data: KeymapData;
  layerIndex: number;
  selectedKeyId?: string;
  showBaseForTransparent: boolean;
  onSelectKey: (id: string) => void;
}) {
  const units = getUnits(data);
  const bounds = getBounds(keys, units);
  const layer = data.layers[layerIndex];
  const baseLayer = data.layers[0];

  return (
    <section className="hand-section" aria-label={title}>
      <div className="hand-title">{title}</div>
      <svg
        className="keyboard-svg"
        viewBox={`${bounds.minX} ${bounds.minY} ${bounds.width} ${bounds.height}`}
        role="group"
        aria-label={`${title} keys`}
      >
        {keys.map((key) => {
          const geometry = getPixelGeometry(key, units);
          if (key.kind === "encoder") {
            return (
              <EncoderKnob
                key={key.id}
                id={key.id}
                selected={selectedKeyId === key.id}
                onSelect={onSelectKey}
                rotation={key.r}
                {...geometry}
              />
            );
          }

          const raw = layer.keys[key.id] ?? "KC_NO";

          return (
            <Keycap
              key={key.id}
              id={key.id}
              raw={raw}
              baseRaw={baseLayer.keys[key.id]}
              selected={selectedKeyId === key.id}
              showBaseForTransparent={showBaseForTransparent}
              onSelect={onSelectKey}
              rotation={key.r}
              {...geometry}
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
  const leftKeys = data.layout.keys.filter((key) => key.hand === "left");
  const rightKeys = data.layout.keys.filter((key) => key.hand === "right");

  return (
    <div className="keyboard-scroll" aria-label="Keyboard layout">
      <div className="keyboard-stage">
        <HandSvg
          title="Left"
          keys={leftKeys}
          data={data}
          layerIndex={layerIndex}
          selectedKeyId={selectedKeyId}
          showBaseForTransparent={showBaseForTransparent}
          onSelectKey={onSelectKey}
        />
        <HandSvg
          title="Right"
          keys={rightKeys}
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
