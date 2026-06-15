import { useEffect, useMemo, useState } from "react";
import { FileDropZone } from "./components/FileDropZone";
import { KeyboardView } from "./components/KeyboardView";
import { LayerTabs } from "./components/LayerTabs";
import { TypingPractice } from "./components/TypingPractice";
import { parseDroppedKeymap, validateKeymap } from "./keymapParser";
import { findPracticeCandidates, type PracticeCandidate } from "./practiceSearch";
import type { KeymapData } from "./types";
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

export default function App() {
  const [data, setData] = useState<KeymapData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeLayerIndex, setActiveLayerIndex] = useState(0);
  const [showBaseForTransparent, setShowBaseForTransparent] = useState(false);
  const [fileStatus, setFileStatus] = useState<string | undefined>();
  const [shareStatus, setShareStatus] = useState<string | undefined>();
  const [shareUrl, setShareUrl] = useState<string | undefined>();
  const [practiceCharacters, setPracticeCharacters] = useState<string[]>([]);

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

  const highlightedKeyIds = useMemo(() => {
    if (!data || practiceCharacters.length === 0) {
      return undefined;
    }

    const keyIds = practiceCharacters
      .flatMap((practiceCharacter) => findPracticeCandidates(data, practiceCharacter))
      .filter((candidate) => candidate.layerIndex === activeLayerIndex)
      .map((candidate) => candidate.keyId);

    return new Set(keyIds);
  }, [activeLayerIndex, data, practiceCharacters]);

  function applyDroppedFile(text: string, fileName: string) {
    if (!data) {
      return;
    }

    try {
      const dropped = parseDroppedKeymap(text, data);
      setData(dropped);
      setError(null);
      setActiveLayerIndex(0);
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
    setActiveLayerIndex(candidate.layerIndex);
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

      <LayerTabs layers={data.layers} activeIndex={activeLayerIndex} onChange={setActiveLayerIndex} />

      <FileDropZone onFileText={applyDroppedFile} status={fileStatus} />

      <TypingPractice data={data} onQueryChange={setPracticeCharacters} onPickCandidate={pickPracticeCandidate} />

      <KeyboardView
        data={data}
        layerIndex={activeLayerIndex}
        highlightedKeyIds={highlightedKeyIds}
        showBaseForTransparent={showBaseForTransparent}
      />
    </main>
  );
}
