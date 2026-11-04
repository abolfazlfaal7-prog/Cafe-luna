import type { CSSProperties } from 'react';
import { LUNA_LOGO_SRC } from '@/lib/brand';

type LunaMarkProps = {
  className?: string;
  style?: CSSProperties;
};

export default function LunaMark({ className = '', style }: LunaMarkProps) {
  return (
    <img
      src={LUNA_LOGO_SRC}
      alt="نشان کافه لونا"
      draggable={false}
      className={`rounded-full object-cover ${className}`}
      style={style}
    />
  );
}
