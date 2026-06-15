export type KeycodeKind = "normal" | "transparent" | "empty" | "layer" | "unknown";

export type KeycodePresentation = {
  raw: string;
  label: string;
  description: string;
  kind: KeycodeKind;
};

export type OutputCharacterMatch = {
  character: string;
  press: string;
  shifted: boolean;
};

const baseLabels: Record<string, string> = {
  KC_1: "!\n1",
  KC_2: "@\n2",
  KC_3: "#\n3",
  KC_4: "$\n4",
  KC_5: "%\n5",
  KC_6: "^\n6",
  KC_7: "&\n7",
  KC_8: "*\n8",
  KC_9: "(\n9",
  KC_0: ")\n0",
  KC_MINS: "_\n-",
  KC_MINUS: "_\n-",
  KC_EQL: "+\n=",
  KC_EQUAL: "+\n=",
  KC_LBRC: "{\n[",
  KC_LBRACKET: "{\n[",
  KC_RBRC: "}\n]",
  KC_RBRACKET: "}\n]",
  KC_BSLS: "|\n\\",
  KC_BSLASH: "|\n\\",
  KC_SCLN: ":\n;",
  KC_SCOLON: ":\n;",
  KC_QUOT: "\"\n'",
  KC_QUOTE: "\"\n'",
  KC_GRV: "~\n`",
  KC_GRAVE: "~\n`",
  KC_COMM: "<\n,",
  KC_COMMA: "<\n,",
  KC_DOT: ">\n.",
  KC_SLSH: "?\n/",
  KC_SLASH: "?\n/",
  KC_SPC: "Space",
  KC_SPACE: "Space",
  KC_ENT: "Enter",
  KC_ENTER: "Enter",
  KC_ESC: "Esc",
  KC_ESCAPE: "Esc",
  KC_TAB: "Tab",
  KC_BSPC: "Bksp",
  KC_BSPACE: "Bksp",
  KC_DEL: "Del",
  KC_LSFT: "LShift",
  KC_LSHIFT: "LShift",
  KC_RSFT: "RShift",
  KC_RSHIFT: "RShift",
  KC_LCTL: "LCtrl",
  KC_LCTRL: "LCtrl",
  KC_RCTL: "RCtrl",
  KC_RCTRL: "RCtrl",
  KC_LALT: "LAlt",
  KC_RALT: "RAlt",
  KC_LGUI: "LGui",
  KC_RGUI: "RGui",
  KC_LEFT: "Left",
  KC_RGHT: "Right",
  KC_RIGHT: "Right",
  KC_UP: "Up",
  KC_DOWN: "Down",
  KC_HOME: "Home",
  KC_END: "End",
  KC_PGUP: "PgUp",
  KC_PGDN: "PgDn",
  KC_PGDOWN: "PgDn",
  KC_INS: "Ins",
  KC_INSERT: "Ins",
  KC_DELETE: "Del",
  KC_CAPS: "Caps",
  KC_CAPSLOCK: "Caps\nLock",
  KC_MUTE: "Mute",
  KC_MPLY: "Media\nPlay",
  KC_MPRV: "Media\nPrev",
  KC_MNXT: "Media\nNext",
  KC_VOLU: "Vol+",
  KC_VOLD: "Vol-",
  KC_MS_U: "Mouse\nUp",
  KC_MS_UP: "Mouse\nUp",
  KC_MS_D: "Mouse\nDown",
  KC_MS_DOWN: "Mouse\nDown",
  KC_MS_L: "Mouse\nLeft",
  KC_MS_LEFT: "Mouse\nLeft",
  KC_MS_R: "Mouse\nRight",
  KC_MS_RIGHT: "Mouse\nRight",
  KC_BTN1: "Mouse\n1",
  KC_MS_BTN1: "Mouse\n1",
  KC_BTN2: "Mouse\n2",
  KC_MS_BTN2: "Mouse\n2",
  KC_BTN3: "Mouse\n3",
  KC_MS_BTN3: "Mouse\n3",
  KC_WH_U: "Mouse\nWheel\nUp",
  KC_MS_WH_UP: "Mouse\nWheel\nUp",
  KC_WH_D: "Mouse\nWheel\nDown",
  KC_MS_WH_DOWN: "Mouse\nWheel\nDown",
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
  KC_MINUS: "_",
  KC_EQL: "+",
  KC_EQUAL: "+",
  KC_LBRC: "{",
  KC_LBRACKET: "{",
  KC_RBRC: "}",
  KC_RBRACKET: "}",
  KC_BSLS: "|",
  KC_BSLASH: "|",
  KC_SCLN: ":",
  KC_SCOLON: ":",
  KC_QUOT: "\"",
  KC_QUOTE: "\"",
  KC_GRV: "~",
  KC_GRAVE: "~",
  KC_COMM: "<",
  KC_COMMA: "<",
  KC_DOT: ">",
  KC_SLSH: "?",
  KC_SLASH: "?",
};

const outputCharacters: Record<string, string> = {
  KC_EXLM: "!",
  KC_EXCLAIM: "!",
  KC_AT: "@",
  KC_HASH: "#",
  KC_DLR: "$",
  KC_DOLLAR: "$",
  KC_PERC: "%",
  KC_PERCENT: "%",
  KC_CIRC: "^",
  KC_CARET: "^",
  KC_AMPR: "&",
  KC_AMPERSAND: "&",
  KC_ASTR: "*",
  KC_ASTERISK: "*",
  KC_LPRN: "(",
  KC_LEFT_PAREN: "(",
  KC_RPRN: ")",
  KC_RIGHT_PAREN: ")",
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
  KC_MINUS: "-",
  KC_UNDS: "_",
  KC_UNDERSCORE: "_",
  KC_EQL: "=",
  KC_EQUAL: "=",
  KC_PLUS: "+",
  KC_LBRC: "[",
  KC_LBRACKET: "[",
  KC_LCBR: "{",
  KC_LEFT_CURLY_BRACE: "{",
  KC_RBRC: "]",
  KC_RBRACKET: "]",
  KC_RCBR: "}",
  KC_RIGHT_CURLY_BRACE: "}",
  KC_BSLS: "\\",
  KC_BSLASH: "\\",
  KC_PIPE: "|",
  KC_SCLN: ";",
  KC_SCOLON: ";",
  KC_COLN: ":",
  KC_COLON: ":",
  KC_QUOT: "'",
  KC_QUOTE: "'",
  KC_DQUO: "\"",
  KC_DOUBLE_QUOTE: "\"",
  KC_GRV: "`",
  KC_GRAVE: "`",
  KC_TILD: "~",
  KC_TILDE: "~",
  KC_COMM: ",",
  KC_COMMA: ",",
  KC_LT: "<",
  KC_LABK: "<",
  KC_DOT: ".",
  KC_GT: ">",
  KC_RABK: ">",
  KC_SLSH: "/",
  KC_SLASH: "/",
  KC_QUES: "?",
  KC_QUESTION: "?",
  KC_SPC: " ",
  KC_SPACE: " ",
};

const modLabels: Record<string, string> = {
  MOD_LCTL: "LCtl",
  MOD_RCTL: "RCtl",
  MOD_LSFT: "LSft",
  MOD_RSFT: "RSft",
  MOD_LALT: "LAlt",
  MOD_RALT: "RAlt",
  MOD_LGUI: "LGui",
  MOD_RGUI: "RGui",
  KC_LCTL: "LCtl",
  KC_LCTRL: "LCtl",
  KC_RCTL: "RCtl",
  KC_RCTRL: "RCtl",
  KC_LSFT: "LSft",
  KC_LSHIFT: "LSft",
  KC_RSFT: "RSft",
  KC_RSHIFT: "RSft",
  KC_LALT: "LAlt",
  KC_RALT: "RAlt",
  KC_LGUI: "LGui",
  KC_RGUI: "RGui",
};

function getPressLabel(raw: string) {
  const letter = raw.match(/^KC_([A-Z])$/);
  if (letter) {
    return letter[1];
  }

  return outputCharacters[raw] ?? getKeycodePresentation(raw).label ?? raw;
}

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
      label: raw,
      description: `Momentary Layer ${mo[1]}`,
      kind: "layer",
    };
  }

  const tg = raw.match(/^TG\((\d+)\)$/);
  if (tg) {
    return {
      raw,
      label: raw,
      description: `Toggle Layer ${tg[1]}`,
      kind: "layer",
    };
  }

  const to = raw.match(/^TO\((\d+)\)$/);
  if (to) {
    return {
      raw,
      label: raw,
      description: `Move to Layer ${to[1]}`,
      kind: "layer",
    };
  }

  const df = raw.match(/^DF\((\d+)\)$/);
  if (df) {
    return {
      raw,
      label: raw,
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
      label: `LT ${layer}\n${tap.label || lt[2]}`,
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

export function getDirectOutputCharacter(rawKeycode?: string): string | undefined {
  return getOutputCharacterMatch(rawKeycode)?.character;
}

export function getOutputCharacterMatches(rawKeycode?: string): OutputCharacterMatch[] {
  const raw = (rawKeycode ?? "KC_NO").trim();

  if (raw === "KC_NO" || raw === "XXXXXXX" || raw === "" || raw === "KC_TRNS" || raw === "_______") {
    return [];
  }

  const tapHold = raw.match(/^(?:LT|MT)\([^,]+,\s*(.+)\)$/);
  if (tapHold) {
    return getOutputCharacterMatches(tapHold[1].trim());
  }

  const shifted = raw.match(/^(?:S|LSFT)\((.+)\)$/);
  if (shifted) {
    const inner = shifted[1].trim();
    const letter = inner.match(/^KC_([A-Z])$/);
    const character = letter ? letter[1] : shiftedLabels[inner];
    if (!character) {
      return [];
    }

    return [{
      character,
      press: `Shift + ${getPressLabel(inner)}`,
      shifted: true,
    }];
  }

  const letter = raw.match(/^KC_([A-Z])$/);
  if (letter) {
    const lower = letter[1].toLowerCase();
    return [
      {
        character: lower,
        press: letter[1],
        shifted: false,
      },
      {
        character: letter[1],
        press: `Shift + ${letter[1]}`,
        shifted: true,
      },
    ];
  }

  const baseCharacter = outputCharacters[raw];
  const shiftedCharacter = shiftedLabels[raw];
  const matches: OutputCharacterMatch[] = [];

  if (baseCharacter) {
    matches.push({
      character: baseCharacter,
      press: getPressLabel(raw),
      shifted: false,
    });
  }

  if (shiftedCharacter) {
    matches.push({
      character: shiftedCharacter,
      press: `Shift + ${getPressLabel(raw)}`,
      shifted: true,
    });
  }

  return matches;
}

export function getOutputCharacterMatch(rawKeycode?: string, targetCharacter?: string): OutputCharacterMatch | undefined {
  const matches = getOutputCharacterMatches(rawKeycode);
  return targetCharacter === undefined ? matches[0] : matches.find((match) => match.character === targetCharacter);
}
