export type KeyGeometry = {
  id: string;
  hand: "left" | "right";
  kind?: "key" | "encoder";
  row?: number;
  col?: number;
  x: number;
  y: number;
  r?: number;
  rx?: number;
  ry?: number;
  w?: number;
  h?: number;
};

export type Layer = {
  name: string;
  keys: Record<string, string>;
};

export type KeymapData = {
  keyboard: string;
  layout: {
    units?: {
      keyWidth?: number;
      keyHeight?: number;
      gap?: number;
    };
    keys: KeyGeometry[];
  };
  layers: Layer[];
};

export type SelectedKey = {
  id: string;
  layerIndex: number;
};
