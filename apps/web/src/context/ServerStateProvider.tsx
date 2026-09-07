import React, { useEffect, useMemo } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useApp } from './AppContext';

/** No persisted business cache; a different session receives a different client. */
export function ServerStateProvider({ children }: { children: React.ReactNode }) {
  const { currentUser } = useApp();
  const client = useMemo(() => new QueryClient({ defaultOptions: {
    queries: { retry: false, refetchOnWindowFocus: false },
    mutations: { retry: false, networkMode: 'always' },
  } }), [currentUser?.id]);
  useEffect(() => () => client.clear(), [client]);
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
