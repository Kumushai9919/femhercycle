import { useState } from "react";
import AiChatDialog from "@/components/AiChatDialog";
import lunaMascot from "@/assets/luna-mascot.png";

export default function LunaFab() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="fixed bottom-24 z-50 flex justify-end pointer-events-none" style={{ left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: '430px', paddingRight: '1rem' }}>
        <button
          onClick={() => setOpen(true)}
          className="pointer-events-auto w-24 h-24 rounded-full flex items-center justify-center hover:scale-110 active:scale-95 transition-transform"
          style={{ filter: "drop-shadow(0 4px 14px rgba(140, 80, 160, 0.35))" }}
          aria-label="루나 챗봇 열기"
        >
          <img src={lunaMascot} alt="루나" className="w-24 h-24" />
        </button>
      </div>
      <AiChatDialog open={open} onOpenChange={setOpen} />
    </>
  );
}
