import React from 'react';

export interface FirmLogoProps {
  /**
   * Visual variant:
   * - 'badge': Emblem framed in an amber/gold gradient coin badge with subtle borders & glow (universal dark/light contrast)
   * - 'seal': Circular formal legal seal with double border and authentic relief
   * - 'standalone': Raw emblem graphic with responsive scaling
   */
  variant?: 'badge' | 'seal' | 'standalone';
  /**
   * Predefined size presets or custom Tailwind classes
   */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  /**
   * Whether to display the firm name and subhead typography
   */
  showText?: boolean;
  /**
   * Responsive text visibility: hides firm name on mobile screens (< sm) to prevent header crowding
   */
  responsive?: boolean;
  /**
   * Text layout arrangement
   */
  textVariant?: 'default' | 'compact' | 'stacked';
  /**
   * Optional custom subtext (defaults to "Advocates OS • Kenya")
   */
  subtext?: string;
  /**
   * Additional container CSS classes
   */
  className?: string;
  /**
   * Optional onClick handler (e.g. for navigating to dashboard)
   */
  onClick?: () => void;
}

const BADGE_SIZE_MAP = {
  xs: { container: 'w-7 h-7 rounded-lg p-0.5', img: 'w-5 h-5' },
  sm: { container: 'w-8 h-8 sm:w-9 sm:h-9 rounded-xl p-1', img: 'w-6 h-6 sm:w-6.5 sm:h-6.5' },
  md: { container: 'w-10 h-10 sm:w-11 sm:h-11 rounded-xl p-1.5', img: 'w-7 h-7 sm:w-8 sm:h-8' },
  lg: { container: 'w-13 h-13 sm:w-14 sm:h-14 rounded-2xl p-2', img: 'w-9 h-9 sm:w-10 sm:h-10' },
  xl: { container: 'w-16 h-16 sm:w-20 sm:h-20 rounded-3xl p-2.5', img: 'w-11 h-11 sm:w-14 sm:h-14' },
};

const SEAL_SIZE_MAP = {
  xs: { container: 'w-7 h-7', img: 'w-6 h-6' },
  sm: { container: 'w-9 h-9', img: 'w-8 h-8' },
  md: { container: 'w-12 h-12', img: 'w-10 h-10' },
  lg: { container: 'w-16 h-16', img: 'w-14 h-14' },
  xl: { container: 'w-24 h-24', img: 'w-20 h-20' },
};

const STANDALONE_SIZE_MAP = {
  xs: 'w-5 h-5',
  sm: 'w-7 h-7 sm:w-8 sm:h-8',
  md: 'w-9 h-9 sm:w-10 sm:h-10',
  lg: 'w-12 h-12 sm:w-14 sm:h-14',
  xl: 'w-16 h-16 sm:w-20 sm:h-20',
};

export const FirmLogo: React.FC<FirmLogoProps> = ({
  variant = 'badge',
  size = 'sm',
  showText = false,
  responsive = true,
  textVariant = 'default',
  subtext = 'Advocates OS • Kenya',
  className = '',
  onClick,
}) => {
  const isStacked = textVariant === 'stacked';

  // Render the logo graphic based on variant
  const renderGraphic = () => {
    if (variant === 'badge') {
      const dim = BADGE_SIZE_MAP[size];
      return (
        <div
          className={`${dim.container} bg-gradient-to-br from-amber-500 via-amber-600 to-amber-700 flex items-center justify-center shadow-md shadow-amber-950/30 border border-amber-400/50 shrink-0 transition-transform duration-200 group-hover:scale-105 select-none`}
        >
          <img
            src="/firm-favicon.png"
            alt="Kariuki Kagunda & Co. Advocates Emblem"
            className={`${dim.img} object-contain filter drop-shadow-[0_1px_1px_rgba(0,0,0,0.35)]`}
            loading="eager"
          />
        </div>
      );
    }

    if (variant === 'seal') {
      const dim = SEAL_SIZE_MAP[size];
      return (
        <div
          className={`${dim.container} rounded-full border-2 border-amber-600/70 bg-gradient-to-br from-amber-100 via-amber-50 to-amber-200 dark:from-amber-950/80 dark:via-amber-900/60 dark:to-amber-950/90 flex items-center justify-center shadow-md p-1 shrink-0 select-none ring-2 ring-amber-500/20`}
        >
          <img
            src="/firm-favicon.png"
            alt="Kariuki Kagunda & Co. Advocates Seal"
            className={`${dim.img} object-contain dark:brightness-125`}
            loading="eager"
          />
        </div>
      );
    }

    // Standalone
    const imgSize = STANDALONE_SIZE_MAP[size];
    return (
      <img
        src="/firm-favicon.png"
        alt="Kariuki Kagunda & Co. Advocates Logo"
        className={`${imgSize} object-contain shrink-0 dark:invert dark:opacity-90 select-none`}
        loading="eager"
      />
    );
  };

  if (!showText) {
    return (
      <div
        className={`inline-flex items-center justify-center shrink-0 ${onClick ? 'cursor-pointer' : ''} ${className}`}
        onClick={onClick}
      >
        {renderGraphic()}
      </div>
    );
  }

  // Text container responsive visibility
  const textVisibilityClass = responsive ? 'hidden sm:block' : 'block';

  return (
    <div
      className={`inline-flex ${isStacked ? 'flex-col items-center text-center' : 'items-center gap-2 sm:gap-2.5'} ${
        onClick ? 'cursor-pointer group' : ''
      } ${className}`}
      onClick={onClick}
    >
      {renderGraphic()}

      <div className={textVisibilityClass}>
        {textVariant === 'compact' ? (
          <div className="text-xs sm:text-sm font-serif font-bold text-slate-900 dark:text-slate-100 tracking-wide uppercase leading-tight group-hover:text-amber-600 dark:group-hover:text-amber-300 transition-colors">
            KKA Advocates
          </div>
        ) : (
          <>
            <div className="text-xs sm:text-sm font-serif font-bold text-slate-900 dark:text-slate-100 tracking-wide uppercase leading-tight group-hover:text-amber-600 dark:group-hover:text-amber-300 transition-colors">
              Kariuki Kagunda &amp; Co.
            </div>
            <div className="text-[10px] text-amber-700 dark:text-amber-400 font-semibold tracking-wider uppercase leading-none mt-0.5">
              {subtext}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
