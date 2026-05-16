import { Loader2 } from 'lucide-react';

type LoadingOverlayProps = {
  active: boolean;
  label?: string;
};

export function LoadingOverlay({ active, label = 'Loading…' }: LoadingOverlayProps) {
  if (!active) {
    return null;
  }

  return (
    <div
      className="absolute inset-0 z-20 flex items-center justify-center rounded-2xl bg-[#0a0b10]/70 backdrop-blur-sm"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-violet-400" />
        <p className="text-sm font-medium text-slate-300">{label}</p>
      </div>
    </div>
  );
}
