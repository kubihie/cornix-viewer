import type { Layer } from "../types";

type LayerTabsProps = {
  layers: Layer[];
  activeIndex: number;
  onChange: (index: number) => void;
};

export function LayerTabs({ layers, activeIndex, onChange }: LayerTabsProps) {
  return (
    <div className="layer-tabs" role="tablist" aria-label="Layers">
      {layers.map((layer, index) => (
        <button
          key={`${layer.name}-${index}`}
          type="button"
          className={index === activeIndex ? "layer-tab active" : "layer-tab"}
          onClick={() => onChange(index)}
          role="tab"
          aria-selected={index === activeIndex}
        >
          {layer.name || `Layer ${index}`}
        </button>
      ))}
    </div>
  );
}
