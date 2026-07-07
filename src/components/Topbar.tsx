"use client";

import Image from "next/image";
import { useApp } from "@/context/AppContext";
import SyncBadge from "@/components/SyncBadge";

export default function Topbar({ mode, onLogout }: { mode: string; onLogout: () => void }) {
  const { storageReady } = useApp();
  return (
    <div className="topbar">
      <div className="title">
        <Image src="/logo.jpg" alt="ZPlash" width={30} height={30} className="topbar-logo" unoptimized />
        <span className="mode">{mode}</span>
      </div>
      <div className="topbar-right">
        <SyncBadge storageReady={storageReady} />
        <button className="logout-btn" onClick={onLogout}>
          Cerrar sesión
        </button>
      </div>
    </div>
  );
}
