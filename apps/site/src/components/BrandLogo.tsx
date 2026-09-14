import type { SiteSettings } from '../types';

interface BrandLogoProps {
  settings: SiteSettings;
  tone?: 'dark' | 'light' | 'mark' | 'auto';
  className?: string;
}

export function BrandLogo({ settings, tone = 'dark', className = 'brand-logo' }: BrandLogoProps) {
  const logos = settings.logos || {};
  let src = '/assets/logo-reference.png';
  let alt = settings.firmName || 'Kariuki Kagunda & Co. Advocates';

  if (tone === 'dark') {
    src = logos.dark?.url || logos.default?.url || '/assets/logo-reference.png';
    alt = logos.dark?.alt || logos.default?.alt || alt;
  } else if (tone === 'light') {
    src = logos.light?.url || logos.default?.url || '/assets/logo-reference.png';
    alt = logos.light?.alt || logos.default?.alt || alt;
  } else if (tone === 'mark') {
    src = logos.mark?.url || logos.dark?.url || logos.default?.url || '/assets/logo-reference.png';
    alt = logos.mark?.alt || logos.dark?.alt || alt;
  } else {
    src = logos.default?.url || logos.dark?.url || '/assets/logo-reference.png';
    alt = logos.default?.alt || alt;
  }

  return (
    <img
      className={`${className} brand-logo--${tone}`}
      src={src}
      alt={alt}
      loading="eager"
      decoding="async"
    />
  );
}
