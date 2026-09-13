import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { BrandingProvider } from './context/BrandingContext';
import { ServerStateProvider } from './context/ServerStateProvider';
import { AppProvider, useApp } from './context/AppContext';
import { AppShell } from './components/layout/AppShell';
import { HomeDashboard } from './components/dashboard/HomeDashboard';
import { MattersWorkspace } from './components/matters/MattersWorkspace';
import { ClientsWorkspace } from './components/clients/ClientsWorkspace';
import { TasksWorkspace } from './components/tasks/TasksWorkspace';
import { CalendarWorkspace } from './components/calendar/CalendarWorkspace';
import { CourtOperationsWorkspace } from './components/court/CourtOperationsWorkspace';
import { ApprovalsWorkspace } from './components/approvals/ApprovalsWorkspace';
import { DocumentStudio as DocumentsWorkspace } from './components/documents/DocumentStudio';
import { CommunicationsWorkspace } from './components/comms/CommunicationsWorkspace';
import { FinanceWorkspace } from './components/finance/FinanceWorkspace';
import { ReportsWorkspace } from './components/reports/ReportsWorkspace';
import { AdminWorkspace } from './components/admin/AdminWorkspace';
import { IntegrationsWorkspace } from './components/integrations/IntegrationsWorkspace';
import { WebsiteGrowthWorkspace } from './components/website/WebsiteGrowthWorkspace';
import { OperationsWorkspace } from './components/operations/OperationsWorkspace';
import { KnowledgeWorkspace } from './components/knowledge/KnowledgeWorkspace';
import { HelpCenterWorkspace } from './components/help/HelpCenterWorkspace';
import { parseWorkspaceLocation, serializeWorkspaceRoute } from './lib/routing/workspaceRoutes';
import { InviteAcceptancePage } from './components/auth/InviteAcceptancePage';

const MainWorkspaceRouter: React.FC = () => {
  const {
    activeWorkspace,
    setActiveWorkspace,
    selectedMatterId,
    setSelectedMatterId,
    selectedMatterTab,
    setSelectedMatterTab,
  } = useApp();
  const [routeReady, setRouteReady] = useState(false);
  const currentLocation = useRef('');

  const applyLocation = useCallback((pathname: string, search: string) => {
    const route = parseWorkspaceLocation(pathname, search);
    setActiveWorkspace(route.workspace);
    setSelectedMatterId(route.matterId ?? null);
    setSelectedMatterTab(route.matterTab ?? 'overview');
    currentLocation.current = `${pathname}${search}`;
  }, [setActiveWorkspace, setSelectedMatterId, setSelectedMatterTab]);

  useLayoutEffect(() => {
    applyLocation(window.location.pathname, window.location.search);
    setRouteReady(true);
  }, [applyLocation]);

  useEffect(() => {
    if (!routeReady) return;
    const target = serializeWorkspaceRoute({ workspace: activeWorkspace, matterId: selectedMatterId ?? undefined, matterTab: selectedMatterTab });
    const current = `${window.location.pathname}${window.location.search}`;
    if (target !== current && currentLocation.current !== current) {
      window.history.pushState({}, '', target);
      currentLocation.current = target;
    }
  }, [activeWorkspace, routeReady, selectedMatterId, selectedMatterTab]);

  useEffect(() => {
    const onPopState = () => applyLocation(window.location.pathname, window.location.search);
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [applyLocation]);

  return (
    <AppShell>
      {activeWorkspace === 'dashboard' && <HomeDashboard />}
      {activeWorkspace === 'matters' && <MattersWorkspace />}
      {activeWorkspace === 'clients' && <ClientsWorkspace />}
      {activeWorkspace === 'tasks' && <TasksWorkspace />}
      {activeWorkspace === 'court' && <CourtOperationsWorkspace />}
      {activeWorkspace === 'approvals' && <ApprovalsWorkspace />}
      {activeWorkspace === 'calendar' && <CalendarWorkspace />}
      {activeWorkspace === 'documents' && <DocumentsWorkspace />}
      {activeWorkspace === 'comms' && <CommunicationsWorkspace />}
      {activeWorkspace === 'finance' && <FinanceWorkspace />}
      {activeWorkspace === 'reports' && <ReportsWorkspace />}
      {activeWorkspace === 'admin' && <AdminWorkspace />}
      {activeWorkspace === 'integrations' && <IntegrationsWorkspace />}
      {activeWorkspace === 'website' && <WebsiteGrowthWorkspace />}
      {activeWorkspace === 'operations' && <OperationsWorkspace />}
      {activeWorkspace === 'knowledge' && <KnowledgeWorkspace />}
      {activeWorkspace === 'help' && <HelpCenterWorkspace />}
    </AppShell>
  );
};

export default function App() {
  if (window.location.pathname === '/auth/invite') return <InviteAcceptancePage />;
  return (
    <BrandingProvider><AppProvider>
      <ServerStateProvider><MainWorkspaceRouter /></ServerStateProvider>
    </AppProvider></BrandingProvider>
  );
}
