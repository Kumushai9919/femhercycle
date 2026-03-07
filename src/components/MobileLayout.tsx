import { ReactNode } from "react";

interface MobileLayoutProps {
  children: ReactNode;
  className?: string;
}

export default function MobileLayout({ children, className = "" }: MobileLayoutProps) {
  return (
    <div className="flex min-h-screen justify-center bg-muted/40">
      <div className={`relative w-full max-w-[430px] min-h-screen bg-background shadow-xl ${className}`}>
        {children}
      </div>
    </div>
  );
}
