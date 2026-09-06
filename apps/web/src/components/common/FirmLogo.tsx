import React, { useEffect, useState } from 'react';
import { useBranding } from '../../context/BrandingContext';
export interface FirmLogoProps {
  variant?: 'badge' | 'seal' | 'standalone'; size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean; responsive?: boolean; textVariant?: 'default' | 'compact' | 'stacked';
  subtext?: string; className?: string; onClick?: () => void;
}
const sizes = { xs: 'h-7 w-7', sm: 'h-9 w-9', md: 'h-12 w-12', lg: 'h-16 w-16', xl: 'h-24 w-24' };
export function FirmLogo({ variant = 'badge', size = 'sm', showText = false, responsive = true, textVariant = 'default', subtext = 'Advocates OS · Kenya', className = '', onClick }: FirmLogoProps) {
  const { branding } = useBranding();
  const [src, setSrc] = useState(branding.imageUrl);
  useEffect(() => setSrc(branding.imageUrl), [branding.imageUrl]);
  const Wrapper = onClick ? 'button' : 'span';
  return <Wrapper type={onClick ? 'button' : undefined} onClick={onClick} aria-label={onClick ? 'Open firm dashboard' : undefined}
    className={`inline-flex shrink-0 gap-2 items-center ${textVariant === 'stacked' ? 'flex-col text-center' : ''} ${onClick ? 'rounded-lg focus-visible:outline-2 focus-visible:outline-amber-500' : ''} ${className}`}>
    <span className={`${sizes[size]} shrink-0 flex items-center justify-center ${variant === 'standalone' ? '' : `bg-white p-1 border border-amber-600/40 ${variant === 'seal' ? 'rounded-full' : 'rounded-xl'}`}`}>
      <img src={src} alt={showText || onClick ? '' : 'Kariuki Kagunda & Co. Advocates'} className="w-full h-full object-contain" onError={() => { if (src !== '/firm-logo.png') setSrc('/firm-logo.png'); }} />
    </span>
    {showText && <span className={`${responsive ? 'hidden sm:block' : 'block'} min-w-0`}>
      <span className="block text-xs sm:text-sm font-serif font-bold text-slate-900 dark:text-slate-100 uppercase leading-tight">{textVariant === 'compact' ? 'KKA Advocates' : 'Kariuki Kagunda & Co.'}</span>
      {textVariant !== 'compact' && <span className="block text-xs text-amber-700 dark:text-amber-400">{subtext}</span>}
    </span>}
  </Wrapper>;
}
