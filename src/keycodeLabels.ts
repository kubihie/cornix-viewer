export type KeycodeKind = "normal" | "transparent" | "empty" | "layer" | "unknown";

export type KeycodePresentation = {
  raw: string;
  label: string;
  description: string;
  kind: KeycodeKind;
};

const baseLabels: Record<string, string> = {
  KC_1: "1",
  KC_2: "2",
  KC_3: "3",
  KC_4: "4",
  KC_5: "5",
  KC_6: "6",
  KC_7: "7",
  KC_8: "8",
  KC_9: "9",
  KC_0: "0",
  KC_MINS: "-",
  KC_EQL: "=",
  KC_LBRC: "[",
  KC_RBRC: "]",
  KC_BSLS: "\\",
  KC_SCLN: ";",
  KC_QUOT: "'",
  KC_GRV: "`",
  KC_COMM: ",",
  KC_DOT: ".",
  KC_SLSH: "/",
  KC_SPC: "Space",
  KC_ENT: "Enter",
  KC_ESC: "Esc",
  KC_TAB: "Tab",
  KC_BSPC: "Bspc",
  KC_DEL: "Del",
  KC_LSFT: "Shift",
  KC_RSFT: "Shift",
  KC_LCTL: "Ctrl",
  KC_RCTL: "Ctrl",
  KC_LALT: "Alt",
  KC_RALT: "Alt",
  KC_LGUI: "Cmd",
  KC_RGUI: "Cmd",
  KC_LEFT: "Left",
  KC_RGHT: "Right",
  KC_UP: "Up",
  KC_DOWN: "Down",
  KC_HOME: "Home",
  KC_END: "End",
  KC_PGUP: "PgUp",
  KC_PGDN: "PgDn",
  KC_INS: "Ins",
  KC_CAPS: "Caps",
  KC_MUTE: "Mute",
  KC_MPLY: "Play",
  KC_MPRV: "Prev",
  KC_MNXT: "Next",
  KC_VOLU: "Vol+",
  KC_VOLD: "Vol-",
  KC_MS_U: "Ms Up",
  KC_MS_D: "Ms Dn",
  KC_MS_L: "Ms Left",
  KC_MS_R: "Ms Right",
  KC_BTN1: "Btn1",
  KC_BTN2: "Btn2",
  KC_F1: "F1",
  KC_F2: "F2",
  KC_F3: "F3",
  KC_F4: "F4",
  KC_F5: "F5",
  KC_F6: "F6",
  KC_F7: "F7",
  KC_F8: "F8",
  KC_F9: "F9",
  KC_F10: "F10",
  KC_F11: "F11",
  KC_F12: "F12",
  QK_BOOT: "Boot",
  RESET: "Reset",
};

const shiftedLabels: Record<string, string> = {
  KC_1: "!",
  KC_2: "@",
  KC_3: "#",
  KC_4: "$",
  KC_5: "%",
  KC_6: "^",
  KC_7: "&",
  KC_8: "*",
  KC_9: "(",
  KC_0: ")",
  KC_MINS: "_",
  KC_EQL: "+",
  KC_LBRC: "{",
  KC_RBRC: "}",
  KC_BSLS: "|",
  KC_SCLN: ":",
  KC_QUOT: "\"",
  KC_GRV: "~",
  KC_COMM: "<",
  KC_DOT: ">",
  KC_SLSH: "?",
};

const modLabels: Record<string, string> = {
  MOD_LCTL: "Ctrl",
  MOD_RCTL: "Ctrl",
  MOD_LSFT: "Shift",
  MOD_RSFT: "Shift",
  MOD_LALT: "Alt",
  MOD_RALT: "Alt",
  MOD_LGUI: "Cmd",
  MOD_RGUI: "Cmd",
  KC_LCTL: "Ctrl",
  KC_RCTL: "Ctrl",
  KC_LSFT: "Shift",
  KC_RSFT: "Shift",
  KC_LALT: "Alt",
  KC_RALT: "Alt",
  KC_LGUI: "Cmd",
  KC_RGUI: "Cmd",
};

export function getKeycodePresentation(rawKeycode?: string): KeycodePresentation {
  const raw = (rawKeycode ?? "KC_NO").trim();

  if (raw === "KC_TRNS" || raw === "_______") {
    return {
      raw,
      label: "▽",
      description: "Transparent key",
      kind: "transparent",
    };
  }

  if (raw === "KC_NO" || raw === "XXXXXXX" || raw === "") {
    return {
      raw,
      label: "",
      description: "No key",
      kind: "empty",
    };
  }

  const shifted = raw.match(/^(?:S|LSFT)\((.+)\)$/);
  if (shifted) {
    const inner = shifted[1].trim();
    const label = shiftedLabels[inner] ?? getKeycodePresentation(inner).label;
    return {
      raw,
      label,
      description: `Shift + ${getKeycodePresentation(inner).label || inner}`,
      kind: shiftedLabels[inner] ? "normal" : "unknown",
    };
  }

  const mo = raw.match(/^MO\((\d+)\)$/);
  if (mo) {
    return {
      raw,
      label: `Fn${mo[1]}`,
      description: `Hold: Layer ${mo[1]}`,
      kind: "layer",
    };
  }

  const tg = raw.match(/^TG\((\d+)\)$/);
  if (tg) {
    return {
      raw,
      label: `TG${tg[1]}`,
      description: `Toggle Layer ${tg[1]}`,
      kind: "layer",
    };
  }

  const to = raw.match(/^TO\((\d+)\)$/);
  if (to) {
    return {
      raw,
      label: to[1] === "0" ? "To Base" : `To L${to[1]}`,
      description: `Move to Layer ${to[1]}`,
      kind: "layer",
    };
  }

  const df = raw.match(/^DF\((\d+)\)$/);
  if (df) {
    return {
      raw,
      label: `Default ${df[1]}`,
      description: `Set default layer to ${df[1]}`,
      kind: "layer",
    };
  }

  const lt = raw.match(/^LT\((\d+),\s*(.+)\)$/);
  if (lt) {
    const layer = lt[1];
    const tap = getKeycodePresentation(lt[2]);
    return {
      raw,
      label: `${tap.label || lt[2]} / L${layer}`,
      description: `Tap: ${tap.label || lt[2]} / Hold: Layer ${layer}`,
      kind: "layer",
    };
  }

  const mt = raw.match(/^MT\(([^,]+),\s*(.+)\)$/);
  if (mt) {
    const mod = modLabels[mt[1].trim()] ?? mt[1].trim();
    const tap = getKeycodePresentation(mt[2]);
    return {
      raw,
      label: `${tap.label || mt[2]} / ${mod}`,
      description: `Tap: ${tap.label || mt[2]} / Hold: ${mod}`,
      kind: "layer",
    };
  }

  const letter = raw.match(/^KC_([A-Z])$/);
  if (letter) {
    return {
      raw,
      label: letter[1],
      description: letter[1],
      kind: "normal",
    };
  }

  if (baseLabels[raw]) {
    return {
      raw,
      label: baseLabels[raw],
      description: baseLabels[raw],
      kind: "normal",
    };
  }

  return {
    raw,
    label: raw,
    description: "Unknown keycode",
    kind: "unknown",
  };
}
