import { useEffect, useMemo, useRef, useState } from "react";
import type { KeymapData } from "../types";
import { findPracticeCandidates, type PracticeCandidate } from "../practiceSearch";

type TypingPracticeProps = {
  data: KeymapData;
  onQueryChange: (characters: string[]) => void;
  onPickCandidate: (candidate: PracticeCandidate) => void;
};

const promptSets = {
  japanese: {
    label: "日本語",
    prompts: [
      { display: "こんにちは、Cornix。", kana: "こんにちは、cornix。" },
      { display: "日本語入力も練習できます。", kana: "にほんごにゅうりょくもれんしゅうできます。" },
      { display: "今日はキー配列を覚えます。", kana: "きょうはきーはいれつをおぼえます。" },
    ],
  },
  english: {
    label: "英語",
    prompts: [
      { display: "Hello, Cornix!", input: "Hello, Cornix!" },
      { display: "Keep your rhythm.", input: "Keep your rhythm." },
      { display: "Type fast and stay relaxed.", input: "Type fast and stay relaxed." },
    ],
  },
  code: {
    label: "コード",
    prompts: [
      { display: "const x = 42;", input: "const x = 42;" },
      { display: "if (ok) return true;", input: "if (ok) return true;" },
      { display: "items.map(v => v + 1);", input: "items.map(v => v + 1);" },
    ],
  },
  symbols: {
    label: "記号",
    prompts: [
      { display: "- _ + = { } [ ]", input: "- _ + = { } [ ]" },
      { display: "!?;:,. / \\ |", input: "!?;:,. / \\ |" },
      { display: "A-Z 0-9", input: "A-Z 0-9" },
    ],
  },
} as const;

type PromptMode = keyof typeof promptSets;
type Feedback = "idle" | "clear" | "miss";
type Prompt = (typeof promptSets)[PromptMode]["prompts"][number];
type GamePhase = "ready" | "countdown" | "playing" | "result";

const roundSeconds = 45;

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

  function activateCharacters(nextCharacters: string[]) {
    onQueryChange(nextCharacters);

    const firstCandidate = nextCharacters.flatMap((next) => findPracticeCandidates(data, next))[0];
    if (firstCandidate) {
      onPickCandidate(firstCandidate);
    }
  }

  function playTone(kind: "tap" | "miss" | "clear") {
    const audioWindow = window as Window & typeof globalThis & { webkitAudioContext?: typeof AudioContext };
    const AudioContextClass = audioWindow.AudioContext ?? audioWindow.webkitAudioContext;
    if (!AudioContextClass) {
      return;
    }

    const context = audioContextRef.current ?? new AudioContextClass();
    audioContextRef.current = context;
    const now = context.currentTime;
    const gain = context.createGain();
    gain.connect(context.destination);

    if (kind === "clear") {
      [523.25, 659.25, 783.99].forEach((frequency, index) => {
        const oscillator = context.createOscillator();
        oscillator.type = "sine";
        oscillator.frequency.value = frequency;
        oscillator.connect(gain);
        oscillator.start(now + index * 0.045);
        oscillator.stop(now + index * 0.045 + 0.12);
      });
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.11, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.32);
      return;
    }

    const oscillator = context.createOscillator();
    oscillator.type = kind === "tap" ? "triangle" : "sawtooth";
    oscillator.frequency.value = kind === "tap" ? 880 : 180;
    oscillator.connect(gain);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(kind === "tap" ? 0.055 : 0.08, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + (kind === "tap" ? 0.07 : 0.16));
    oscillator.start(now);
    oscillator.stop(now + (kind === "tap" ? 0.08 : 0.18));
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
      playTone("miss");
      window.setTimeout(() => setFeedback("idle"), 180);
      return;
    }

    setTypedText(nextTyped);
    setFeedback("idle");
    if (nextTyped.length > typedText.length) {
      playTone("tap");
    }

    if (nextState.complete) {
      setCompletedCount((count) => count + 1);
      setComboCount((count) => count + 1);
      setFeedback("clear");
      playTone("clear");
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
            <div>クリア {completedCount}</div>
            <div>ミス {mistakeCount}</div>
            <div>コンボ {comboCount}</div>
          </div>
          {phase === "ready" ? (
            <div className="game-overlay">
              <button type="button" className="start-button" onClick={startGame}>
                スタート
              </button>
            </div>
          ) : null}
          {phase === "countdown" ? <div className="countdown-display">{countdown || "GO"}</div> : null}
          {phase === "result" ? (
            <div className="game-overlay result-panel">
              <div className="result-title">結果</div>
              <div className="result-score">クリア {completedCount} / ミス {mistakeCount}</div>
              <button type="button" className="start-button" onClick={startGame}>
                もう一度
              </button>
            </div>
          ) : null}
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
          {phase === "playing" ? <div className="game-status">{nextGuide}</div> : null}
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
