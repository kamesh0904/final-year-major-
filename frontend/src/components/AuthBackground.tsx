import { ReactNode } from "react";

interface Props {
  children: ReactNode;
}

export default function AuthBackground({ children }: Props) {
  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#0b0714]">
      {/* Gradient blobs */}
      <div className="absolute -top-40 -left-40 h-[500px] w-[500px] rounded-full bg-purple-600/30 blur-[120px]" />
      <div className="absolute bottom-0 right-0 h-[500px] w-[500px] rounded-full bg-indigo-600/20 blur-[140px]" />

      {/* Subtle vignette */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/10 to-black/40" />

      {/* Content */}
      <div className="relative z-10 flex min-h-screen items-center justify-center px-4">
        {children}
      </div>
    </div>
  );
}
