import { getKeycodePresentation, type KeycodePresentation } from "../keycodeLabels";

type KeycapProps = {
  id: string;
  raw: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
  originX?: number;
  originY?: number;
  selected: boolean;
  baseRaw?: string;
  showBaseForTransparent: boolean;
  onSelect: (id: string) => void;
};

function compactLabel(label: string) {
  if (label.length <= 13) {
    return label;
  }

  return `${label.slice(0, 12)}…`;
}

function getLines(presentation: KeycodePresentation) {
  const label = compactLabel(presentation.label);
  if (label.includes("\n")) {
    return label.split("\n");
  }

  if (label.includes(" / ")) {
    return label.split(" / ");
  }

  if (label.length > 8 && label.includes("_")) {
    const midpoint = Math.ceil(label.length / 2);
    return [label.slice(0, midpoint), label.slice(midpoint)];
  }

  return [label];
}

export function Keycap({
  id,
  raw,
  x,
  y,
  width,
  height,
  rotation = 0,
  originX,
  originY,
  selected,
  baseRaw,
  showBaseForTransparent,
  onSelect,
}: KeycapProps) {
  const presentation = getKeycodePresentation(raw);
  const basePresentation = getKeycodePresentation(baseRaw);
  const inheritsBase =
    showBaseForTransparent && presentation.kind === "transparent" && basePresentation.kind !== "empty";
  const visiblePresentation = inheritsBase ? basePresentation : presentation;
  const lines = getLines(visiblePresentation);
  const longest = lines.reduce((max, line) => Math.max(max, line.length), 0);
  const fontSize = Math.max(8.5, Math.min(14, longest > 10 ? 10 : longest > 7 ? 11.5 : 13));
  const className = [
    "keycap",
    selected ? "selected" : "",
    presentation.kind === "transparent" ? "transparent" : "",
    presentation.kind === "empty" ? "empty" : "",
    presentation.kind === "layer" ? "layer" : "",
    presentation.kind === "unknown" ? "unknown" : "",
  ]
    .filter(Boolean)
    .join(" ");
  const usesLayoutOrigin = originX !== undefined && originY !== undefined;

  return (
    <g
      className={className}
      transform={
        usesLayoutOrigin
          ? `rotate(${rotation} ${originX} ${originY})`
          : `translate(${x} ${y}) rotate(${rotation} ${width / 2} ${height / 2})`
      }
      role="button"
      tabIndex={0}
      aria-label={`${id}: ${presentation.label || presentation.raw}`}
      onClick={() => onSelect(id)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onSelect(id);
        }
      }}
    >
      <g transform={usesLayoutOrigin ? `translate(${x} ${y})` : undefined}>
        <rect width={width} height={height} rx="7" ry="7" />
        {inheritsBase ? (
          <text className="transparent-mark" x={width - 8} y={13}>
            ▽
          </text>
        ) : null}
        <text
          className="key-label"
          x={width / 2}
          y={height / 2 - ((lines.length - 1) * fontSize) / 2}
          fontSize={fontSize}
        >
          {lines.map((line, index) => (
            <tspan key={`${line}-${index}`} x={width / 2} dy={index === 0 ? 0 : fontSize + 2}>
              {line}
            </tspan>
          ))}
        </text>
      </g>
    </g>
  );
}
