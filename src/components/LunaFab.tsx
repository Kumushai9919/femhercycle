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
          className="pointer-events-auto w-14 h-14 rounded-full bg-gradient-to-br from-primary to-accent shadow-lg flex items-center justify-center hover:scale-105 active:scale-95 transition-transform"
          aria-label="루나 챗봇 열기"
        >
          <img src={lunaMascot} alt="루나" className="w-9 h-9" />
        </button>
      </div>
      <AiChatDialog open={open} onOpenChange={setOpen} />
    </>
  );
}
