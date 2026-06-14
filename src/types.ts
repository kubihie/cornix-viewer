export type KeyGeometry = {
  id: string;
  hand: "left" | "right";
  kind?: "key" | "encoder";
  x: number;
  y: number;
  r?: number;
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
