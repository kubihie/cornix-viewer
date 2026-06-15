import { useEffect, useMemo, useRef, useState } from "react";
import type { KeymapData } from "../types";
import { findPracticeCandidates, type PracticeCandidate } from "../practiceSearch";

type TypingPracticeProps = {
  data: KeymapData;
  onQueryChange: (characters: string[]) => void;
  onPickCandidate: (candidate: PracticeCandidate) => void;
};

const jp = (display: string, kana: string) => ({ display, kana });
const textPrompt = (input: string) => ({ display: input, input });

const japanesePrompts = [
  jp("こんにちは、Cornix。", "こんにちは、cornix。"),
  jp("日本語入力も練習できます。", "にほんごにゅうりょくもれんしゅうできます。"),
  jp("今日はキー配列を覚えます。", "きょうはきーはいれつをおぼえます。"),
  jp("左右の親指をうまく使います。", "さゆうのおやゆびをうまくつかいます。"),
  jp("記号の場所を少しずつ覚えます。", "きごうのばしょをすこしずつおぼえます。"),
  jp("焦らず正確に入力します。", "あせらずせいかくににゅうりょくします。"),
  jp("レイヤーキーを自然に押せるようにします。", "れいやーきーをしぜんにおせるようにします。"),
  jp("短い文章からテンポを作ります。", "みじかいぶんしょうからてんぽをつくります。"),
  jp("手元を見ずに打てると楽しいです。", "てもとをみずにうてるとたのしいです。"),
  jp("小さなミスをすぐ直します。", "ちいさなみすをすぐなおします。"),
  jp("親指の動きを軽くします。", "おやゆびのうごきをかるくします。"),
  jp("次のキーを見つけてから押します。", "つぎのきーをみつけてからおします。"),
  jp("慣れるまではゆっくりで大丈夫です。", "なれるまではゆっくりでだいじょうぶです。"),
  jp("記号入力の苦手を減らします。", "きごうにゅうりょくのにがてをへらします。"),
  jp("同じ文章でも速さが変わります。", "おなじぶんしょうでもはやさがかわります。"),
  jp("ゲーム感覚で配列を覚えます。", "げーむかんかくではいれつをおぼえます。"),
  jp("一文字ずつリズムを刻みます。", "いちもじずつりずむをきざみます。"),
  jp("次のレイヤーにすばやく移ります。", "つぎのれいやーにすばやくうつります。"),
  jp("速さよりも流れを大事にします。", "はやさよりもながれをだいじにします。"),
  jp("打鍵音に合わせて進みます。", "だけんおんにあわせてすすみます。"),
  jp("今日は少しだけ上達しました。", "きょうはすこしだけじょうたつしました。"),
  jp("難しい記号も何度も練習します。", "むずかしいきごうもなんどもれんしゅうします。"),
  jp("右手の下段をしっかり覚えます。", "みぎてのげだんをしっかりおぼえます。"),
  jp("左手の親指キーを迷わず押します。", "ひだりてのおやゆびきーをまよわずおします。"),
  jp("打ち終わったら次の文へ進みます。", "うちおわったらつぎのぶんへすすみます。"),
  jp("気持ちよい連続入力を目指します。", "きもちよいれんぞくにゅうりょくをめざします。"),
  jp("小指に頼りすぎない配列です。", "こゆびにたよりすぎないはいれつです。"),
  jp("記憶と反射を少しずつつなげます。", "きおくとはんしゃをすこしずつつなげます。"),
  jp("焦ったときほど姿勢を戻します。", "あせったときほどしせいをもどします。"),
  jp("画面のヒントを見て場所を覚えます。", "がめんのひんとをみてばしょをおぼえます。"),
  jp("毎日少しだけ練習を続けます。", "まいにちすこしだけれんしゅうをつづけます。"),
  jp("反応が良いと続けたくなります。", "はんのうがよいとつづけたくなります。"),
  jp("記号の連打にも慣れていきます。", "きごうのれんだにもなれていきます。"),
  jp("新しい配列でも遊びながら覚えます。", "あたらしいはいれつでもあそびながらおぼえます。"),
  jp("上下左右のキーも正しく使います。", "じょうげさゆうのきーもただしくつかいます。"),
  jp("ミスを恐れずもう一度打ちます。", "みすをおそれずもういちどうちます。"),
  jp("文字が進むと気分も乗ってきます。", "もじがすすむときぶんものってきます。"),
  jp("指の移動距離を短くします。", "ゆびのいどうきょりをみじかくします。"),
  jp("次の候補を見ながら覚えます。", "つぎのこうほをみながらおぼえます。"),
  jp("最後まで集中して打ち切ります。", "さいごまでしゅうちゅうしてうちきります。"),
];

const englishBasePrompts = [
  "Hello, Cornix!",
  "Keep your rhythm.",
  "Type fast and stay relaxed.",
  "Small wins build speed.",
  "Layer keys need practice.",
  "Accuracy comes first.",
  "Find the key, then flow.",
  "One more clean streak!",
  "Trust the next key.",
  "Keep both thumbs ready.",
  "Symbols are part of the game.",
  "Smooth typing feels great.",
];

const englishSubjects = [
  "Layer keys",
  "Thumb keys",
  "Clean streaks",
  "Small symbols",
  "Fast fingers",
  "Good rhythm",
  "Every mistake",
  "The next prompt",
  "Your keymap",
  "Short practice",
  "Quick feedback",
  "Steady focus",
];

const englishActions = [
  "build better memory",
  "make the layout feel natural",
  "turn practice into flow",
  "keep the pace alive",
  "teach the hands to move",
  "reward careful typing",
  "help the next run",
  "make symbols less scary",
];

const englishPrompts = [
  ...englishBasePrompts.map(textPrompt),
  ...englishSubjects.flatMap((subject) => englishActions.map((action) => textPrompt(`${subject} ${action}.`))),
];

const codeBasePrompts = [
  "const x = 42;",
  "if (ok) return true;",
  "items.map(v => v + 1);",
  "user?.name ?? \"guest\"",
  "for (const item of items) {}",
  "return value.trim();",
  "type Key = string | number;",
  "console.log({ score });",
  "const done = count > 0;",
  "await save({ id, value });",
  "array.filter(Boolean);",
  "throw new Error(\"failed\");",
];

const codeNames = ["score", "combo", "layer", "keymap", "prompt", "timer", "result", "input", "cursor", "target"];
const codeMethods = ["trim", "toLowerCase", "toUpperCase", "slice", "map", "filter", "join", "split", "reduce", "some", "every", "find"];
const codePrompts = [
  ...codeBasePrompts.map(textPrompt),
  ...codeNames.flatMap((name) => [
    textPrompt(`const ${name} = state.${name};`),
    textPrompt(`set${name[0].toUpperCase()}${name.slice(1)}(${name} + 1);`),
    textPrompt(`if (!${name}) return null;`),
    textPrompt(`data.${name}?.value ?? 0`),
  ]),
  ...codeMethods.flatMap((method) => [
    textPrompt(`value.${method}();`),
    textPrompt(`items.${method}(item => item.id);`),
  ]),
];

const symbolBasePrompts = [
  "- _ + = { } [ ]",
  "!?;:,. / \\ |",
  "A-Z 0-9",
  "() => []",
  "< > \" ' ` ~",
  "$ & * # @ % ^",
  "== != <= >=",
  "{ key: \"value\" }",
  "foo_bar-baz",
  "path/to/file.ts",
  "name: value;",
  "[1, 2, 3]",
];

const symbolGroups = [
  ["-", "_", "+", "="],
  ["{", "}", "[", "]"],
  ["(", ")", "<", ">"],
  ["!", "?", ";", ":"],
  ["\"", "'", "`", "~"],
  ["$", "&", "*", "#"],
  ["/", "\\", "|", "."],
  ["==", "!=", "<=", ">="],
];

const symbolPrompts = [
  ...symbolBasePrompts.map(textPrompt),
  ...symbolGroups.flatMap((group) => [
    textPrompt(group.join(" ")),
    textPrompt(group.join("")),
    textPrompt(`${group[0]} ${group[1]} ${group[2]} ${group[3]} ${group[2]} ${group[1]} ${group[0]}`),
  ]),
  ...symbolGroups.flatMap((left) =>
    symbolGroups.map((right) => textPrompt(`${left[0]}${right[1]} ${left[1]}${right[2]} ${left[2]}${right[3]}`)),
  ),
];

const promptSets = {
  japanese: {
    label: "日本語",
    prompts: japanesePrompts,
  },
  english: {
    label: "英語",
    prompts: englishPrompts,
  },
  code: {
    label: "コード",
    prompts: codePrompts,
  },
  symbols: {
    label: "記号",
    prompts: symbolPrompts,
  },
} as const;

type PromptMode = keyof typeof promptSets;
type Feedback = "idle" | "clear" | "miss";
type Prompt = (typeof promptSets)[PromptMode]["prompts"][number];
type GamePhase = "ready" | "countdown" | "playing" | "result";
type VisualCue = { id: number; text: string; kind: "score" | "clear" | "miss" };

const roundSeconds = 45;

function playOscillator(
  context: AudioContext,
  output: AudioNode,
  frequency: number,
  type: OscillatorType,
  start: number,
  duration: number,
  volume: number,
  endFrequency = frequency,
) {
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, start);
  oscillator.frequency.exponentialRampToValueAtTime(Math.max(20, endFrequency), start + duration);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(volume, start + 0.008);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  oscillator.connect(gain);
  gain.connect(output);
  oscillator.start(start);
  oscillator.stop(start + duration + 0.02);
}

const kanaRomaji: Record<string, string[]> = {
  あ: ["a"], い: ["i"], う: ["u"], え: ["e"], お: ["o"],
  か: ["ka", "ca"], き: ["ki"], く: ["ku", "cu", "qu"], け: ["ke"], こ: ["ko", "co"],
  さ: ["sa"], し: ["shi", "si"], す: ["su"], せ: ["se"], そ: ["so"],
  た: ["ta"], ち: ["chi", "ti"], つ: ["tsu", "tu"], て: ["te"], と: ["to"],
  な: ["na"], に: ["ni"], ぬ: ["nu"], ね: ["ne"], の: ["no"],
  は: ["ha"], ひ: ["hi"], ふ: ["fu", "hu"], へ: ["he"], ほ: ["ho"],
  ま: ["ma"], み: ["mi"], む: ["mu"], め: ["me"], も: ["mo"],
  や: ["ya"], ゆ: ["yu"], よ: ["yo"],
  ら: ["ra"], り: ["ri"], る: ["ru"], れ: ["re"], ろ: ["ro"],
  わ: ["wa"], を: ["wo"], ん: ["n", "nn", "n'"],
  が: ["ga"], ぎ: ["gi"], ぐ: ["gu"], げ: ["ge"], ご: ["go"],
  ざ: ["za"], じ: ["ji", "zi"], ず: ["zu"], ぜ: ["ze"], ぞ: ["zo"],
  だ: ["da"], ぢ: ["ji", "di"], づ: ["zu", "du"], で: ["de"], ど: ["do"],
  ば: ["ba"], び: ["bi"], ぶ: ["bu"], べ: ["be"], ぼ: ["bo"],
  ぱ: ["pa"], ぴ: ["pi"], ぷ: ["pu"], ぺ: ["pe"], ぽ: ["po"],
  ぁ: ["xa", "la"], ぃ: ["xi", "li"], ぅ: ["xu", "lu"], ぇ: ["xe", "le"], ぉ: ["xo", "lo"],
  ゃ: ["xya", "lya"], ゅ: ["xyu", "lyu"], ょ: ["xyo", "lyo"], っ: ["xtu", "ltu"],
  ー: ["-"], "、": [", "], "。": ["."], "・": ["/"],
};

const kanaCombos: Record<string, string[]> = {
  きゃ: ["kya"], きゅ: ["kyu"], きょ: ["kyo"],
  しゃ: ["sha", "sya"], しゅ: ["shu", "syu"], しょ: ["sho", "syo"],
  ちゃ: ["cha", "tya", "cya"], ちゅ: ["chu", "tyu", "cyu"], ちょ: ["cho", "tyo", "cyo"],
  にゃ: ["nya"], にゅ: ["nyu"], にょ: ["nyo"],
  ひゃ: ["hya"], ひゅ: ["hyu"], ひょ: ["hyo"],
  みゃ: ["mya"], みゅ: ["myu"], みょ: ["myo"],
  りゃ: ["rya"], りゅ: ["ryu"], りょ: ["ryo"],
  ぎゃ: ["gya"], ぎゅ: ["gyu"], ぎょ: ["gyo"],
  じゃ: ["ja", "jya", "zya"], じゅ: ["ju", "jyu", "zyu"], じょ: ["jo", "jyo", "zyo"],
  びゃ: ["bya"], びゅ: ["byu"], びょ: ["byo"],
  ぴゃ: ["pya"], ぴゅ: ["pyu"], ぴょ: ["pyo"],
};

function isAscii(value: string) {
  return /^[\x20-\x7e]$/.test(value);
}

function firstConsonants(values: string[]) {
  return Array.from(new Set(values.map((value) => value[0]).filter((value) => value && !/[aiueon]/.test(value))));
}

function appendVariants(prefixes: string[], variants: string[], limit = 3000) {
  const result: string[] = [];
  for (const prefix of prefixes) {
    for (const variant of variants) {
      result.push(prefix + variant);
      if (result.length >= limit) {
        return result;
      }
    }
  }
  return result;
}

function variantsAt(chars: string[], index: number): { variants: string[]; width: number } {
  const combo = chars[index] + (chars[index + 1] ?? "");
  if (kanaCombos[combo]) {
    return { variants: kanaCombos[combo], width: 2 };
  }

  const char = chars[index];
  if (kanaRomaji[char]) {
    return { variants: kanaRomaji[char], width: 1 };
  }

  return { variants: [isAscii(char) ? char : char], width: 1 };
}

function buildJapaneseInputs(kana: string) {
  const chars = Array.from(kana);
  let outputs = [""];

  for (let index = 0; index < chars.length; index += 1) {
    if (chars[index] === "っ" && index + 1 < chars.length) {
      const next = variantsAt(chars, index + 1);
      const consonants = firstConsonants(next.variants);
      outputs = appendVariants(outputs, consonants.length > 0 ? consonants : kanaRomaji["っ"]);
      continue;
    }

    const current = variantsAt(chars, index);
    outputs = appendVariants(outputs, current.variants);
    index += current.width - 1;
  }

  return Array.from(new Set(outputs));
}

function getPromptInputs(prompt: Prompt) {
  return "kana" in prompt ? buildJapaneseInputs(prompt.kana) : [prompt.input];
}

function getTypingState(inputs: string[], typed: string) {
  const validInputs = inputs.filter((input) => input.startsWith(typed));
  const activeInput = validInputs[0] ?? inputs[0] ?? "";
  const nextCharacters = Array.from(new Set(validInputs.map((input) => input[typed.length]).filter(Boolean)));

  return {
    activeInput,
    complete: inputs.includes(typed),
    nextCharacters,
    valid: validInputs.length > 0,
  };
}

export function TypingPractice({ data, onQueryChange, onPickCandidate }: TypingPracticeProps) {
  const audioContextRef = useRef<AudioContext | null>(null);
  const [mode, setMode] = useState<PromptMode>("japanese");
  const [promptIndex, setPromptIndex] = useState(0);
  const [typedText, setTypedText] = useState("");
  const [completedCount, setCompletedCount] = useState(0);
  const [mistakeCount, setMistakeCount] = useState(0);
  const [comboCount, setComboCount] = useState(0);
  const [maxComboCount, setMaxComboCount] = useState(0);
  const [score, setScore] = useState(0);
  const [visualCue, setVisualCue] = useState<VisualCue | null>(null);
  const [feedback, setFeedback] = useState<Feedback>("idle");
  const [phase, setPhase] = useState<GamePhase>("ready");
  const [countdown, setCountdown] = useState(3);
  const [remainingSeconds, setRemainingSeconds] = useState(roundSeconds);
  const prompts = promptSets[mode].prompts;
  const prompt = prompts[promptIndex % prompts.length];
  const promptInputs = useMemo(() => getPromptInputs(prompt), [prompt]);
  const typingState = useMemo(() => getTypingState(promptInputs, typedText), [promptInputs, typedText]);
  const inputText = typingState.activeInput;
  const nextCharacter = typingState.nextCharacters[0] ?? "";
  const nextCandidates = useMemo(
    () => typingState.nextCharacters.flatMap((next) => findPracticeCandidates(data, next)),
    [data, typingState.nextCharacters],
  );
  const progress = inputText.length === 0 ? 0 : Math.round((typedText.length / inputText.length) * 100);
  const timeProgress = Math.max(0, Math.min(100, Math.round((remainingSeconds / roundSeconds) * 100)));
  const nextGuide = nextCharacter
    ? nextCandidates[0]
      ? `次: ${typingState.nextCharacters.join(" / ")} / 押す: ${nextCandidates[0].press}`
      : `次: ${typingState.nextCharacters.join(" / ")}`
    : "クリア！";

  useEffect(() => {
    if (typedText.length === 0 && nextCharacter) {
      activateCharacters(typingState.nextCharacters);
    }
  }, [mode, promptIndex]);

  useEffect(() => {
    if (phase !== "countdown") {
      return undefined;
    }

    if (countdown <= 0) {
      setPhase("playing");
      activateCharacters(typingState.nextCharacters);
      return undefined;
    }

    const timer = window.setTimeout(() => setCountdown((value) => value - 1), 780);
    return () => window.clearTimeout(timer);
  }, [countdown, phase, typingState.nextCharacters]);

  useEffect(() => {
    if (phase !== "playing") {
      return undefined;
    }

    if (remainingSeconds <= 0) {
      setPhase("result");
      onQueryChange([]);
      return undefined;
    }

    const timer = window.setTimeout(() => setRemainingSeconds((value) => value - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [onQueryChange, phase, remainingSeconds]);

  useEffect(() => {
    if (phase !== "playing") {
      return undefined;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.metaKey || event.ctrlKey || event.altKey || event.isComposing) {
        return;
      }

      if (event.key === "Backspace") {
        event.preventDefault();
        updateTypedText(typedText.slice(0, -1));
        return;
      }

      if (event.key.length !== 1) {
        return;
      }

      event.preventDefault();
      updateTypedText(typedText + event.key);
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [phase, promptInputs, typedText]);

  useEffect(() => {
    if (!visualCue) {
      return undefined;
    }

    const timer = window.setTimeout(() => setVisualCue(null), 900);
    return () => window.clearTimeout(timer);
  }, [visualCue]);

  function activateCharacters(nextCharacters: string[]) {
    onQueryChange(nextCharacters);

    const firstCandidate = nextCharacters.flatMap((next) => findPracticeCandidates(data, next))[0];
    if (firstCandidate) {
      onPickCandidate(firstCandidate);
    }
  }

  function showCue(text: string, kind: VisualCue["kind"]) {
    setVisualCue({ id: Date.now(), text, kind });
  }

  function playTone(kind: "tap" | "miss" | "clear", intensity = 0) {
    const audioWindow = window as Window & typeof globalThis & { webkitAudioContext?: typeof AudioContext };
    const AudioContextClass = audioWindow.AudioContext ?? audioWindow.webkitAudioContext;
    if (!AudioContextClass) {
      return;
    }

    const context = audioContextRef.current ?? new AudioContextClass();
    audioContextRef.current = context;
    if (context.state === "suspended") {
      void context.resume();
    }

    const now = context.currentTime;
    const master = context.createGain();
    const compressor = context.createDynamicsCompressor();
    master.connect(compressor);
    compressor.connect(context.destination);
    master.gain.setValueAtTime(0.32, now);
    master.gain.exponentialRampToValueAtTime(0.0001, now + (kind === "clear" ? 0.62 : 0.24));

    if (kind === "clear") {
      const lift = Math.min(intensity, 10) * 8;
      [523.25, 659.25, 783.99, 1046.5].forEach((frequency, index) => {
        playOscillator(context, master, frequency + lift, "sine", now + index * 0.042, 0.22, 0.12);
      });
      playOscillator(context, master, 1568 + lift, "triangle", now + 0.05, 0.34, 0.05, 2093 + lift);
      return;
    }

    if (kind === "miss") {
      playOscillator(context, master, 180, "sine", now, 0.18, 0.16, 92);
      playOscillator(context, master, 92, "sawtooth", now + 0.01, 0.16, 0.035, 70);
      return;
    }

    const comboLift = Math.min(intensity, 20) * 10;
    playOscillator(context, master, 760 + comboLift, "triangle", now, 0.07, 0.11, 1120 + comboLift);
    playOscillator(context, master, 1520 + comboLift, "sine", now + 0.006, 0.05, 0.045, 1860 + comboLift);
  }

  function advancePrompt(nextMode = mode) {
    const nextPrompts = promptSets[nextMode].prompts;
    const nextIndex = nextMode === mode ? (promptIndex + 1) % nextPrompts.length : 0;
    const nextInputs = getPromptInputs(nextPrompts[nextIndex]);
    const nextState = getTypingState(nextInputs, "");

    setPromptIndex(nextIndex);
    setTypedText("");
    activateCharacters(nextState.nextCharacters);
  }

  function updateTypedText(value: string) {
    if (phase !== "playing") {
      return;
    }

    const longestInputLength = Math.max(...promptInputs.map((input) => input.length));
    const nextTyped = value.slice(0, longestInputLength);
    const nextState = getTypingState(promptInputs, nextTyped);

    if (!nextState.valid) {
      setMistakeCount((count) => count + 1);
      setComboCount(0);
      setFeedback("miss");
      showCue("MISS", "miss");
      playTone("miss");
      window.setTimeout(() => setFeedback("idle"), 180);
      return;
    }

    setTypedText(nextTyped);
    setFeedback("idle");
    if (nextTyped.length > typedText.length) {
      const points = 10 + Math.min(comboCount, 30);
      setScore((current) => current + points);
      showCue(`+${points}`, "score");
      playTone("tap", comboCount);
    }

    if (nextState.complete) {
      setCompletedCount((count) => count + 1);
      setComboCount((count) => {
        const nextCombo = count + 1;
        setMaxComboCount((maxCombo) => Math.max(maxCombo, nextCombo));
        return nextCombo;
      });
      setScore((current) => current + 150 + comboCount * 10);
      setFeedback("clear");
      showCue("CLEAR!", "clear");
      playTone("clear", comboCount + 1);
      onQueryChange([]);
      window.setTimeout(() => {
        setFeedback("idle");
        advancePrompt();
      }, 320);
    } else {
      activateCharacters(nextState.nextCharacters);
    }
  }

  function changeMode(nextMode: PromptMode) {
    setMode(nextMode);
    setCompletedCount(0);
    setMistakeCount(0);
    setComboCount(0);
    setMaxComboCount(0);
    setScore(0);
    setVisualCue(null);
    setFeedback("idle");
    setPhase("ready");
    setRemainingSeconds(roundSeconds);
    advancePrompt(nextMode);
  }

  function startGame() {
    setTypedText("");
    setCompletedCount(0);
    setMistakeCount(0);
    setComboCount(0);
    setMaxComboCount(0);
    setScore(0);
    setVisualCue(null);
    setFeedback("idle");
    setCountdown(3);
    setRemainingSeconds(roundSeconds);
    setPhase("countdown");
    onQueryChange([]);
  }

  function resetGame() {
    setTypedText("");
    setCompletedCount(0);
    setMistakeCount(0);
    setComboCount(0);
    setMaxComboCount(0);
    setScore(0);
    setVisualCue(null);
    setFeedback("idle");
    setPhase("ready");
    setRemainingSeconds(roundSeconds);
    activateCharacters(getTypingState(promptInputs, "").nextCharacters);
  }

  const inputCharacters = Array.from(inputText);
  const typedLength = Array.from(typedText).length;

  return (
    <section className="practice-panel" aria-label="Typing practice">
      <div className={`practice-game ${feedback} phase-${phase}`} aria-label="Typing game">
        <div className="game-body">
          <div className="game-topline">
            <div className="game-label">タイピングゲーム</div>
            <div className="mode-tabs" aria-label="練習モード">
              {(Object.entries(promptSets) as Array<[PromptMode, (typeof promptSets)[PromptMode]]>).map(
                ([modeKey, modeInfo]) => (
                  <button
                    key={modeKey}
                    type="button"
                    className={modeKey === mode ? "mode-tab active" : "mode-tab"}
                    onClick={() => changeMode(modeKey)}
                  >
                    {modeInfo.label}
                  </button>
                ),
              )}
            </div>
          </div>
          <div className="game-hud">
            <div className="hud-main">{phase === "playing" ? `${remainingSeconds}s` : "45s"}</div>
            <div className="score-pill">スコア {score}</div>
            <div>クリア {completedCount}</div>
            <div>ミス {mistakeCount}</div>
            <div>コンボ {comboCount}</div>
          </div>
          {visualCue ? (
            <div key={visualCue.id} className={`visual-cue ${visualCue.kind}`}>
              {visualCue.text}
            </div>
          ) : null}
          {phase === "ready" ? (
            <div className="game-overlay">
              <button type="button" className="start-button" onClick={startGame}>
                スタート
              </button>
            </div>
          ) : null}
          {phase === "countdown" ? (
            <div key={countdown} className={countdown ? "countdown-display" : "countdown-display go"}>
              <span>{countdown || "GO"}</span>
            </div>
          ) : null}
          {phase === "result" ? (
            <div className="game-overlay result-panel">
              <div className="result-title">結果</div>
              <div className="result-score">スコア {score}</div>
              <div className="result-score">クリア {completedCount} / ミス {mistakeCount} / 最大コンボ {maxComboCount}</div>
              <button type="button" className="start-button" onClick={startGame}>
                もう一度
              </button>
            </div>
          ) : null}
          <div className={remainingSeconds <= 10 && phase === "playing" ? "time-meter danger" : "time-meter"}>
            <div style={{ width: `${timeProgress}%` }} />
          </div>
          <div className={comboCount >= 3 && phase === "playing" ? "combo-badge" : "combo-badge empty"}>
            {Math.max(comboCount, 3)} COMBO
          </div>
          <div className="sentence" aria-label="出題文">{prompt.display}</div>
          <div className="typing-track" aria-label="入力進捗">
            {inputCharacters.map((promptCharacter, index) => (
              <span
                key={`${promptCharacter}-${index}`}
                className={
                  index < typedLength ? "sentence-char done" : index === typedLength ? "sentence-char current" : "sentence-char"
                }
              >
                {promptCharacter === " " ? "\u00a0" : promptCharacter}
              </span>
            ))}
          </div>
          <div className={phase === "playing" ? "game-status" : "game-status idle"}>{phase === "playing" ? nextGuide : "\u00a0"}</div>
          <div className="combo-meter">
            <div style={{ width: `${progress}%` }} />
          </div>
          <div className="game-actions">
            <button type="button" className="game-button quiet" onClick={resetGame}>
              リセット
            </button>
          </div>
        </div>
      </div>

      {phase === "playing" ? <div className="practice-lookup game-suggest">
        <div className="suggest-title">次のキー</div>
        <div className="practice-results" aria-live="polite">
          {nextCharacter ? (
            nextCandidates.length > 0 ? (
              nextCandidates.map((candidate) => (
                <button
                  key={`${candidate.layerIndex}-${candidate.keyId}-${candidate.raw}`}
                  type="button"
                  className="practice-candidate"
                  aria-label={`レイヤー ${candidate.layerIndex} / ${candidate.layerName} / 押す: ${candidate.press} / コード: ${candidate.raw} / キー: ${candidate.keyId}`}
                  onClick={() => onPickCandidate(candidate)}
                >
                  <span className="candidate-main">
                    レイヤー {candidate.layerIndex} / {candidate.layerName}
                  </span>
                  <span className="candidate-press">押す: {candidate.press}</span>
                </button>
              ))
            ) : (
            <div className="practice-empty">候補キーがありません</div>
          )
        ) : (
          <div className="practice-empty">クリア！</div>
        )}
        </div>
      </div> : null}
    </section>
  );
}
