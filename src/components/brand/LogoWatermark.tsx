import LunaMark from '@/components/brand/LunaMark';

export default function LogoWatermark() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0 flex items-center justify-center overflow-hidden">
      <LunaMark className="aspect-square opacity-[0.07]" style={{ width: 'min(92vmin, 640px)' }} />
    </div>
  );
}
