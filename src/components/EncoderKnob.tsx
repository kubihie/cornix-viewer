import { getKeycodePresentation } from "../keycodeLabels";

type EncoderKnobProps = {
  id: string;
  raw: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
  selected: boolean;
  onSelect: (id: string) => void;
};

export function EncoderKnob({ id, raw, x, y, width, height, rotation = 0, selected, onSelect }: EncoderKnobProps) {
  const centerX = width / 2;
  const centerY = height / 2;
  const presentation = getKeycodePresentation(raw);
  const label = presentation.label || "Knob";

  return (
    <g
      className={selected ? "encoder-knob selected" : "encoder-knob"}
      transform={`translate(${x} ${y}) rotate(${rotation} ${centerX} ${centerY})`}
      role="button"
      tabIndex={0}
      aria-label={`${id}: ${label}`}
      onClick={() => onSelect(id)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onSelect(id);
        }
      }}
    >
      <rect width={width} height={height} rx="7" ry="7" />
      <line className="encoder-notch" x1={centerX} y1={10} x2={centerX} y2={18} />
      <text x={centerX} y={centerY}>
        {label}
      </text>
    </g>
  );
}
