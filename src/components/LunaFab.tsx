import { useState } from "react";
import AiChatDialog from "@/components/AiChatDialog";
import lunaMascot from "@/assets/luna-mascot.png";

export default function LunaFab() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-24 right-4 z-50 w-14 h-14 rounded-full bg-gradient-to-br from-primary to-accent shadow-lg flex items-center justify-center hover:scale-105 active:scale-95 transition-transform"
        aria-label="루나 챗봇 열기"
      >
        <img src={lunaMascot} alt="루나" className="w-9 h-9" />
      </button>
      <AiChatDialog open={open} onOpenChange={setOpen} />
    </>
  );
}
