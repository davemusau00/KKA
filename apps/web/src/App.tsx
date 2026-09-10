import React from 'react';
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

const MainWorkspaceRouter: React.FC = () => {
  const { activeWorkspace } = useApp();

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
    </AppShell>
  );
};

export default function App() {
  return (
    <BrandingProvider><AppProvider>
      <ServerStateProvider><MainWorkspaceRouter /></ServerStateProvider>
    </AppProvider></BrandingProvider>
  );
}
