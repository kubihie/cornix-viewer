import { getKeycodePresentation } from "../keycodeLabels";

type EncoderKnobProps = {
  id: string;
  raw: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
};

export function EncoderKnob({ id, raw, x, y, width, height, rotation = 0 }: EncoderKnobProps) {
  const centerX = width / 2;
  const centerY = height / 2;
  const presentation = getKeycodePresentation(raw);
  const label = presentation.label || "Knob";

  return (
    <g
      className="encoder-knob"
      transform={`translate(${x} ${y}) rotate(${rotation} ${centerX} ${centerY})`}
      aria-label={`${id}: ${label}`}
    >
      <rect width={width} height={height} rx="7" ry="7" />
      <line className="encoder-notch" x1={centerX} y1={10} x2={centerX} y2={18} />
      <text x={centerX} y={centerY}>
        {label}
      </text>
    </g>
  );
}
