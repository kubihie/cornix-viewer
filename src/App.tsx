import { useEffect, useMemo, useState } from "react";
import { FileDropZone } from "./components/FileDropZone";
import { KeyDetail } from "./components/KeyDetail";
import { KeyboardView } from "./components/KeyboardView";
import { LayerTabs } from "./components/LayerTabs";
import { parseDroppedKeymap, validateKeymap } from "./keymapParser";
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
  const [selectedKeyId, setSelectedKeyId] = useState<string | undefined>();
  const [showBaseForTransparent, setShowBaseForTransparent] = useState(false);
  const [fileStatus, setFileStatus] = useState<string | undefined>();
  const [shareStatus, setShareStatus] = useState<string | undefined>();
  const [shareUrl, setShareUrl] = useState<string | undefined>();

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
          setSelectedKeyId(initialData.layout.keys[0]?.id);
          if (urlKeymap) {
            setFileStatus("Loaded keymap from URL");
          }
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "Failed to load keymap.json.");
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

  const selectedGeometry = useMemo(
    () => data?.layout.keys.find((key) => key.id === selectedKeyId),
    [data, selectedKeyId],
  );

  function applyDroppedFile(text: string, fileName: string) {
    if (!data) {
      return;
    }

    try {
      const dropped = parseDroppedKeymap(text, data);
      setData(dropped);
      setError(null);
      setActiveLayerIndex(0);
      setSelectedKeyId(dropped.layout.keys[0]?.id);
      setFileStatus(`${fileName} loaded (${dropped.layers.length} layers)`);
      setShareStatus(undefined);
      setShareUrl(undefined);
    } catch (dropError) {
      setFileStatus(dropError instanceof Error ? dropError.message : "Failed to read dropped file.");
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
        setShareStatus("URL copied");
      } catch {
        setShareStatus("URL updated. Copy it from the field or address bar.");
      }
    } catch (shareError) {
      setShareStatus(shareError instanceof Error ? shareError.message : "Failed to create URL.");
    }
  }

  if (error) {
    return (
      <main className="app-shell">
        <section className="error-panel">
          <h1>Keymap load error</h1>
          <p>{error}</p>
        </section>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="app-shell">
        <section className="loading-panel">Loading keymap…</section>
      </main>
    );
  }

  return (
    <main className="app-shell">
      <header className="app-header">
        <div>
          <h1>{data.keyboard}</h1>
          <p>Read-only Vial keymap viewer</p>
        </div>
        <div className="header-actions">
          <label className="toggle">
            <input
              type="checkbox"
              checked={showBaseForTransparent}
              onChange={(event) => setShowBaseForTransparent(event.target.checked)}
            />
            <span>Base ghost</span>
          </label>
          <button type="button" className="share-button" onClick={createShareUrl}>
            Copy URL
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
              aria-label="Generated keymap URL"
            />
          ) : null}
        </div>
      ) : null}

      <LayerTabs layers={data.layers} activeIndex={activeLayerIndex} onChange={setActiveLayerIndex} />

      <FileDropZone onFileText={applyDroppedFile} status={fileStatus} />

      <KeyboardView
        data={data}
        layerIndex={activeLayerIndex}
        selectedKeyId={selectedKeyId}
        showBaseForTransparent={showBaseForTransparent}
        onSelectKey={setSelectedKeyId}
      />

      <KeyDetail
        keyId={selectedKeyId}
        geometry={selectedGeometry}
        layer={data.layers[activeLayerIndex]}
        baseLayer={data.layers[0]}
        showBaseForTransparent={showBaseForTransparent}
      />
    </main>
  );
}
