import { useEffect, useMemo, useState } from "react";
import { FileDropZone } from "./components/FileDropZone";
import { KeyboardView } from "./components/KeyboardView";
import { LayerTabs } from "./components/LayerTabs";
import { TypingPractice } from "./components/TypingPractice";
import { parseDroppedKeymap, validateKeymap } from "./keymapParser";
import { findPracticeCandidates, type PracticeCandidate } from "./practiceSearch";
import type { KeymapData } from "./types";
import type { KeyHighlightKind } from "./components/Keycap";
import { readKeymapFromCurrentUrl, writeKeymapToUrl } from "./urlKeymap";
import "./styles.css";

const storageKey = "cornix-viewer:last-layer";

function getInitialLayerIndex(maxLayer: number) {
  const params = new URLSearchParams(window.location.search);
  const queryLayer = params.get("layer");
  const savedLayer = window.localStorage.getItem(storageKey);
  const parsed = queryLayer !== null ? Number(queryLayer) : savedLayer !== null ? Number(savedLayer) : 0;

  if (!Number.isInteger(parsed)) {
    return 0;
  }

  return Math.min(Math.max(parsed, 0), Math.max(maxLayer - 1, 0));
}

function getHoldLayerIndex(rawKeycode: string) {
  const raw = rawKeycode.trim();
  const mo = raw.match(/^MO\((\d+)\)$/);
  if (mo) {
    return Number(mo[1]);
  }

  const lt = raw.match(/^LT\((\d+),\s*.+\)$/);
  if (lt) {
    return Number(lt[1]);
  }

  const lm = raw.match(/^LM\((\d+),\s*.+\)$/);
  if (lm) {
    return Number(lm[1]);
  }

  return undefined;
}

function isShiftKey(rawKeycode: string) {
  const raw = rawKeycode.trim();
  return (
    raw === "KC_LSFT" ||
    raw === "KC_LSHIFT" ||
    raw === "KC_RSFT" ||
    raw === "KC_RSHIFT" ||
    /^MT\(\s*(?:MOD_)?[LR]SFT\s*,/.test(raw) ||
    /^MT\(\s*KC_[LR]S(?:FT|HIFT)\s*,/.test(raw)
  );
}

export default function App() {
  const [data, setData] = useState<KeymapData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeLayerIndex, setActiveLayerIndex] = useState(0);
  const [showBaseForTransparent, setShowBaseForTransparent] = useState(false);
  const [fileStatus, setFileStatus] = useState<string | undefined>();
  const [shareStatus, setShareStatus] = useState<string | undefined>();
  const [shareUrl, setShareUrl] = useState<string | undefined>();
  const [practiceCharacters, setPracticeCharacters] = useState<string[]>([]);
  const [practiceDisplayLayerIndex, setPracticeDisplayLayerIndex] = useState<number | undefined>();
  const displayLayerIndex = practiceDisplayLayerIndex ?? activeLayerIndex;

  const layerAccessKeyOverrides = useMemo(() => {
    if (!data || practiceDisplayLayerIndex === undefined || practiceDisplayLayerIndex === 0) {
      return undefined;
    }

    const baseLayer = data.layers[0];
    const overrides = new Map<string, string>();
    for (const key of data.layout.keys) {
      const raw = baseLayer.keys[key.id] ?? "KC_NO";
      if (getHoldLayerIndex(raw) === practiceDisplayLayerIndex) {
        overrides.set(key.id, raw);
      }
    }

    return overrides.size > 0 ? overrides : undefined;
  }, [data, practiceDisplayLayerIndex]);

  useEffect(() => {
    let cancelled = false;

    async function loadKeymap() {
      try {
        const response = await fetch(`${import.meta.env.BASE_URL}keymap.json`, { cache: "no-cache" });
        if (!response.ok) {
          throw new Error(`Failed to load keymap.json (${response.status}).`);
        }

        const json = validateKeymap(await response.json());
        const urlKeymap = await readKeymapFromCurrentUrl(json);
        const initialData = urlKeymap ?? json;
        if (!cancelled) {
          setData(initialData);
          setActiveLayerIndex(getInitialLayerIndex(initialData.layers.length));
          if (urlKeymap) {
            setFileStatus("URL からキーマップを読み込みました");
          }
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "keymap.json の読み込みに失敗しました。");
        }
      }
    }

    loadKeymap();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    window.localStorage.setItem(storageKey, String(activeLayerIndex));
  }, [activeLayerIndex]);

  const highlightedKeys = useMemo(() => {
    if (!data || practiceCharacters.length === 0) {
      return undefined;
    }

    const candidates = practiceCharacters.flatMap((practiceCharacter) => findPracticeCandidates(data, practiceCharacter));
    const highlights = new Map<string, KeyHighlightKind>();

    for (const candidate of candidates) {
      if (candidate.layerIndex === displayLayerIndex) {
        highlights.set(candidate.keyId, "target");
      }
    }

    if (layerAccessKeyOverrides) {
      for (const keyId of layerAccessKeyOverrides.keys()) {
        if (!highlights.has(keyId)) {
          highlights.set(keyId, "layer-access");
        }
      }
    }

    if (candidates.some((candidate) => candidate.shifted)) {
      const baseLayer = data.layers[0];
      for (const key of data.layout.keys) {
        const raw = baseLayer.keys[key.id] ?? "KC_NO";
        if (isShiftKey(raw) && !highlights.has(key.id)) {
          highlights.set(key.id, "modifier");
        }
      }
    }

    return highlights;
  }, [data, displayLayerIndex, layerAccessKeyOverrides, practiceCharacters]);

  const keyRawOverrides = useMemo(() => {
    if (!data) {
      return layerAccessKeyOverrides;
    }

    const overrides = new Map(layerAccessKeyOverrides);
    const needsShift = practiceCharacters
      .flatMap((practiceCharacter) => findPracticeCandidates(data, practiceCharacter))
      .some((candidate) => candidate.shifted);

    if (needsShift) {
      const baseLayer = data.layers[0];
      for (const key of data.layout.keys) {
        const raw = baseLayer.keys[key.id] ?? "KC_NO";
        if (isShiftKey(raw) && !overrides.has(key.id)) {
          overrides.set(key.id, raw);
        }
      }
    }

    return overrides.size > 0 ? overrides : undefined;
  }, [data, layerAccessKeyOverrides, practiceCharacters]);

  function updatePracticeCharacters(characters: string[]) {
    setPracticeCharacters(characters);

    if (!data || characters.length === 0) {
      setPracticeDisplayLayerIndex(undefined);
      return;
    }

    const firstCandidate = characters.flatMap((practiceCharacter) => findPracticeCandidates(data, practiceCharacter))[0];
    setPracticeDisplayLayerIndex(firstCandidate?.layerIndex);
  }

  function applyDroppedFile(text: string, fileName: string) {
    if (!data) {
      return;
    }

    try {
      const dropped = parseDroppedKeymap(text, data);
      setData(dropped);
      setError(null);
      setActiveLayerIndex(0);
      setPracticeDisplayLayerIndex(undefined);
      setFileStatus(`${fileName} を読み込みました (${dropped.layers.length} レイヤー)`);
      setShareStatus(undefined);
      setShareUrl(undefined);
    } catch (dropError) {
      setFileStatus(dropError instanceof Error ? dropError.message : "ファイルの読み込みに失敗しました。");
    }
  }

  async function createShareUrl() {
    if (!data) {
      return;
    }

    try {
      const url = await writeKeymapToUrl(data);
      setShareUrl(url);
      try {
        await navigator.clipboard.writeText(url);
        setShareStatus("URL をコピーしました");
      } catch {
        setShareStatus("URL を更新しました。入力欄またはアドレスバーからコピーできます。");
      }
    } catch (shareError) {
      setShareStatus(shareError instanceof Error ? shareError.message : "URL の作成に失敗しました。");
    }
  }

  function pickPracticeCandidate(candidate: PracticeCandidate) {
    setPracticeCharacters([candidate.character]);
    setPracticeDisplayLayerIndex(candidate.layerIndex);
  }

  if (error) {
    return (
      <main className="app-shell">
        <section className="error-panel">
          <h1>キーマップ読み込みエラー</h1>
          <p>{error}</p>
        </section>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="app-shell">
        <section className="loading-panel">キーマップを読み込み中…</section>
      </main>
    );
  }

  return (
    <main className="app-shell">
      <header className="app-header">
        <div>
          <h1>{data.keyboard}</h1>
          <p>Vial キーマップ確認ビューア</p>
        </div>
        <div className="header-actions">
          <label className="toggle">
            <input
              type="checkbox"
              checked={showBaseForTransparent}
              onChange={(event) => setShowBaseForTransparent(event.target.checked)}
            />
            <span>ベース表示</span>
          </label>
          <button type="button" className="share-button" onClick={createShareUrl}>
            URLコピー
          </button>
        </div>
      </header>

      {shareStatus ? (
        <div className="share-panel">
          <div className="share-status">{shareStatus}</div>
          {shareUrl ? (
            <input
              className="share-url-input"
              readOnly
              value={shareUrl}
              onFocus={(event) => event.currentTarget.select()}
              aria-label="生成されたキーマップ URL"
            />
          ) : null}
        </div>
      ) : null}

      <LayerTabs
        layers={data.layers}
        activeIndex={displayLayerIndex}
        onChange={(nextLayerIndex) => {
          setActiveLayerIndex(nextLayerIndex);
          setPracticeDisplayLayerIndex(undefined);
        }}
      />

      <FileDropZone onFileText={applyDroppedFile} status={fileStatus} />

      <TypingPractice data={data} onQueryChange={updatePracticeCharacters} onPickCandidate={pickPracticeCandidate} />

      <KeyboardView
        data={data}
        layerIndex={displayLayerIndex}
        highlightedKeys={highlightedKeys}
        rawOverrides={keyRawOverrides}
        showBaseForTransparent={showBaseForTransparent}
      />
    </main>
  );
}
