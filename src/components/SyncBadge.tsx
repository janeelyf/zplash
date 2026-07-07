"use client";

export default function SyncBadge({ storageReady }: { storageReady: boolean }) {
  return (
    <span className={`sync-badge ${storageReady ? "cloud" : "local"}`}>
      {storageReady ? "☁️ Sincronizado" : "⚠️ Sin guardado permanente"}
    </span>
  );
}
