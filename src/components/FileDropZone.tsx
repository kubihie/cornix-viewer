import { useRef, useState } from "react";

type FileDropZoneProps = {
  onFileText: (text: string, fileName: string) => void;
  status?: string;
};

export function FileDropZone({ onFileText, status }: FileDropZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  async function readFile(file?: File) {
    if (!file) {
      return;
    }

    onFileText(await file.text(), file.name);
  }

  return (
    <section
      className={isDragging ? "drop-zone dragging" : "drop-zone"}
      onDragOver={(event) => {
        event.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={(event) => {
        event.preventDefault();
        setIsDragging(false);
        readFile(event.dataTransfer.files[0]);
      }}
      aria-label="キーマップファイルを読み込む"
    >
      <div>
        <div className="drop-title">.vil または keymap.json をドロップ</div>
        <div className="drop-copy">ファイルはこのブラウザ内だけで読み込みます。キーボードには接続しません。</div>
        {status ? <div className="drop-status">{status}</div> : null}
      </div>
      <button type="button" className="file-button" onClick={() => inputRef.current?.click()}>
        ファイルを選択
      </button>
      <input
        ref={inputRef}
        type="file"
        accept=".json,.vil,application/json"
        className="file-input"
        onChange={(event) => readFile(event.target.files?.[0])}
      />
    </section>
  );
}
