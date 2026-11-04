import LunaMark from '@/components/brand/LunaMark';

type LunaLogoProps = {
  variant?: 'stacked' | 'inline';
  className?: string;
};

export default function LunaLogo({ variant = 'stacked', className = '' }: LunaLogoProps) {
  if (variant === 'inline') {
    return (
      <div className={`flex items-center gap-3 ${className}`}>
        <LunaMark className="h-11 w-11 shrink-0 drop-shadow-sm" />
        <span className="flex flex-col leading-none">
          <span className="font-bold tracking-[0.28em] text-forest-900">LUNA</span>
          <span className="mt-1 text-[10px] font-medium tracking-[0.35em] text-caramel-600">CAFÉ</span>
        </span>
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <LunaMark className="h-28 w-28 drop-shadow-xl" />
      <span className="mt-5 text-3xl font-bold tracking-[0.32em] text-forest-900">LUNA</span>
      <span className="mt-1 text-xs font-medium tracking-[0.4em] text-caramel-600">CAFÉ</span>
    </div>
  );
}
