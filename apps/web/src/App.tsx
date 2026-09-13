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
import { OnboardingWizard } from './components/onboarding/OnboardingWizard';
import { parseWorkspaceLocation, serializeWorkspaceRoute, type WorkspaceRoute } from './lib/routing/workspaceRoutes';
import { InviteAcceptancePage } from './components/auth/InviteAcceptancePage';
import { authApi, type OnboardingState } from './lib/api/auth.api';

const MainWorkspaceRouter: React.FC = () => {
  const {
    activeWorkspace,
    setActiveWorkspace,
    selectedMatterId,
    setSelectedMatterId,
    selectedMatterTab,
    setSelectedMatterTab,
    currentUser,
    effectivePermissions,
  } = useApp();
  const [routeReady, setRouteReady] = useState(false);
  const [resourceRoute, setResourceRoute] = useState<Pick<WorkspaceRoute, 'workspace' | 'resourceType' | 'resourceId'> | null>(null);
  const currentLocation = useRef('');
  const [onboarding, setOnboarding] = useState<OnboardingState | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    if (!currentUser.id) return;
    let active = true;
    void authApi.onboarding().then((state) => {
      if (!active) return;
      setOnboarding(state);
      const postponed = state.dismissedUntil && new Date(state.dismissedUntil).getTime() > Date.now();
      setShowOnboarding(state.status !== 'COMPLETED' && !postponed);
    }).catch(() => {
      // Do not show a pseudo-onboarding flow when the authoritative API is unavailable.
    });
    return () => { active = false; };
  }, [currentUser.id]);

  const applyLocation = useCallback((pathname: string, search: string) => {
    const route = parseWorkspaceLocation(pathname, search);
    setActiveWorkspace(route.workspace);
    setSelectedMatterId(route.matterId ?? null);
    setSelectedMatterTab(route.matterTab ?? 'overview');
    setResourceRoute(route.resourceType && route.resourceId ? { workspace: route.workspace, resourceType: route.resourceType, resourceId: route.resourceId } : null);
    currentLocation.current = `${pathname}${search}`;
  }, [setActiveWorkspace, setSelectedMatterId, setSelectedMatterTab]);

  useLayoutEffect(() => {
    applyLocation(window.location.pathname, window.location.search);
    setRouteReady(true);
  }, [applyLocation]);

  useEffect(() => {
    if (!routeReady) return;
    const target = serializeWorkspaceRoute({ workspace: activeWorkspace, matterId: selectedMatterId ?? undefined, matterTab: selectedMatterTab, ...(resourceRoute?.workspace === activeWorkspace ? resourceRoute : {}) });
    const current = `${window.location.pathname}${window.location.search}`;
    if (target !== current && currentLocation.current !== current) {
      window.history.pushState({}, '', target);
      currentLocation.current = target;
    }
  }, [activeWorkspace, resourceRoute, routeReady, selectedMatterId, selectedMatterTab]);

  useEffect(() => {
    const onPopState = () => applyLocation(window.location.pathname, window.location.search);
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [applyLocation]);

  return (
    <><AppShell>
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
    {onboarding && onboarding.status !== 'COMPLETED' && !showOnboarding && <button type="button" onClick={() => setShowOnboarding(true)} className="fixed bottom-4 right-4 z-50 rounded-full border border-amber-700/60 bg-slate-900 px-4 py-2 text-sm font-semibold text-amber-300 shadow-xl hover:bg-slate-800">Finish setup</button>}
    {onboarding && showOnboarding && <OnboardingWizard user={{ fullName: currentUser.fullName, email: currentUser.email, homeBranchId: currentUser.homeBranchId, roleKeys: currentUser.roles, permissions: Array.from(effectivePermissions) }} state={onboarding} onStateChange={(state) => { setOnboarding(state); setShowOnboarding(state.status !== 'COMPLETED'); }} onDismiss={() => setShowOnboarding(false)} onOpenWorkspace={setActiveWorkspace} />}
    </>
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
