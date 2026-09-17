"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import {
  convertPaintNetToGpl,
  parseHexColor,
  paletteNameFromFilename,
  rgbToHex,
  type Rgb,
} from "@/lib/convert";

const DEFAULT_IGNORE = "#000000";

export default function Home() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [rawText, setRawText] = useState<string | null>(null);
  const [ignoreEnabled, setIgnoreEnabled] = useState(true);
  const [ignoreHex, setIgnoreHex] = useState(DEFAULT_IGNORE);
  const [error, setError] = useState<string | null>(null);

  const ignoreColor: Rgb | null = useMemo(() => {
    if (!ignoreEnabled) return null;
    return parseHexColor(ignoreHex);
  }, [ignoreEnabled, ignoreHex]);

  const result = useMemo(() => {
    if (!rawText || !fileName) return null;
    if (ignoreEnabled && !ignoreColor) {
      return { error: "Ignore color must be a valid hex color (e.g. #000000)" };
    }
    try {
      const converted = convertPaintNetToGpl(rawText, {
        name: paletteNameFromFilename(fileName),
        ignoreColor,
      });
      return { data: converted };
    } catch (e) {
      return {
        error: e instanceof Error ? e.message : "Failed to convert palette",
      };
    }
  }, [rawText, fileName, ignoreEnabled, ignoreColor]);

  const loadFile = useCallback((file: File) => {
    setError(null);
    const reader = new FileReader();
    reader.onload = () => {
      const text = typeof reader.result === "string" ? reader.result : "";
      setFileName(file.name);
      setRawText(text);
    };
    reader.onerror = () => {
      setError("Could not read the selected file");
      setFileName(null);
      setRawText(null);
    };
    reader.readAsText(file);
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const file = e.dataTransfer.files?.[0];
      if (file) loadFile(file);
    },
    [loadFile],
  );

  const downloadGpl = () => {
    if (!result || !("data" in result) || !result.data || !fileName) return;
    const blob = new Blob([result.data.gpl], {
      type: "application/x-gimp-palette",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${paletteNameFromFilename(fileName)}.gpl`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const displayError = error ?? (result && "error" in result ? result.error : null);
  const colors = result && "data" in result ? result.data?.colors : null;

  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-6 px-4 py-12">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          Paint.NET → GIMP
        </h1>
        <p className="text-sm text-zinc-600">
          Convert a Paint.NET palette file to a GIMP{" "}
          <code className="font-mono text-xs">.gpl</code> file. Everything runs
          in your browser — nothing is uploaded.
        </p>
      </header>

      <div
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragEnter={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          setDragging(false);
        }}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className={[
          "cursor-pointer rounded-lg border-2 border-dashed px-6 py-10 text-center transition-colors",
          dragging
            ? "border-zinc-900 bg-zinc-100"
            : "border-zinc-300 bg-white hover:border-zinc-400",
        ].join(" ")}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".txt,text/plain"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) loadFile(file);
            e.target.value = "";
          }}
        />
        <p className="text-sm font-medium text-zinc-800">
          {fileName
            ? fileName
            : "Drop a Paint.NET palette here, or click to browse"}
        </p>
        <p className="mt-1 text-xs text-zinc-500">
          Usually a <code className="font-mono">.txt</code> from Paint.NET User
          Files → Palettes
        </p>
      </div>

      <label className="flex flex-wrap items-center gap-3 rounded-lg bg-white px-4 py-3 text-sm shadow-sm ring-1 ring-zinc-200">
        <input
          type="checkbox"
          checked={ignoreEnabled}
          onChange={(e) => setIgnoreEnabled(e.target.checked)}
          className="size-4 accent-zinc-900"
        />
        <span className="font-medium">Ignore color</span>
        <input
          type="color"
          value={parseHexColor(ignoreHex) ? ignoreHex : DEFAULT_IGNORE}
          disabled={!ignoreEnabled}
          onChange={(e) => setIgnoreHex(e.target.value.toUpperCase())}
          className="h-8 w-10 cursor-pointer disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Ignore color picker"
        />
        <input
          type="text"
          value={ignoreHex}
          disabled={!ignoreEnabled}
          onChange={(e) => setIgnoreHex(e.target.value)}
          spellCheck={false}
          className="w-24 rounded border border-zinc-300 px-2 py-1 font-mono text-xs uppercase disabled:opacity-40"
          aria-label="Ignore color hex"
        />
      </label>

      {displayError && (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-200">
          {displayError}
        </p>
      )}

      {colors && colors.length > 0 && (
        <section className="space-y-3 rounded-lg bg-white p-4 shadow-sm ring-1 ring-zinc-200">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-medium">
              {colors.length} color{colors.length === 1 ? "" : "s"}
            </h2>
            <button
              type="button"
              onClick={downloadGpl}
              className="rounded-md bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-700"
            >
              Download .gpl
            </button>
          </div>
          <ul className="flex flex-wrap gap-2">
            {colors.map((c, i) => (
              <li
                key={`${rgbToHex(c)}-${i}`}
                title={rgbToHex(c)}
                className="size-8 rounded border border-zinc-300"
                style={{ backgroundColor: rgbToHex(c) }}
              />
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
