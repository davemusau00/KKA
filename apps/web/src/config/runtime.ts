const production = import.meta.env.PROD;

/** Explicit runtime endpoints keep the static SPA independent from the API host. */
export const runtimeConfig = {
  apiBaseUrl: (import.meta.env.VITE_API_URL || (production ? 'https://api.kariukikagunda.com/api/v1' : '/api/v1')).replace(/\/+$/, ''),
  webOrigin: import.meta.env.VITE_WEB_ORIGIN || (production ? 'https://os.kariukikagunda.com' : window.location.origin),
  enableDemoMode: !production && import.meta.env.VITE_ENABLE_DEMO_MODE === 'true',
};

export const apiUrl = (path: string) => `${runtimeConfig.apiBaseUrl}${path.startsWith('/') ? path : `/${path}`}`;
