export type WorkspaceRoute = {
  workspace: string;
  resourceType?: "client" | "task" | "document" | "proceeding" | "court_event" | "filing" | "service_record" | "project" | "meeting" | "knowledge_item" | "approval" | "intake";
  resourceId?: string;
  matterId?: string;
  matterTab?: string;
};

const WORKSPACE_PATHS: Record<string, string> = {
  dashboard: "/",
  matters: "/matters",
  clients: "/clients",
  tasks: "/tasks",
  court: "/court",
  approvals: "/approvals",
  calendar: "/calendar",
  documents: "/documents",
  comms: "/communications",
  finance: "/finance",
  reports: "/reports",
  admin: "/admin",
  integrations: "/integrations",
  website: "/website",
  operations: "/operations",
  knowledge: "/knowledge",
  help: "/help"
};

const WORKSPACE_BY_PATH = Object.fromEntries(Object.entries(WORKSPACE_PATHS).map(([workspace, path]) => [path, workspace]));
const safeDecode = (value: string) => { try { return decodeURIComponent(value); } catch { return null; } };

export function parseWorkspaceLocation(pathname: string, search = ""): WorkspaceRoute {
  const normalized = pathname.replace(/\/+$/, "") || "/";
  const matterMatch = normalized.match(/^\/matters\/([^/]+)$/);
  const resourceMatch = normalized.match(/^\/(clients|tasks|documents|knowledge|approvals|intakes)\/([^/]+)$/)
    || normalized.match(/^\/court\/(proceedings|events|filings|service)\/([^/]+)$/)
    || normalized.match(/^\/operations\/(projects|meetings)\/([^/]+)$/);
  const params = new URLSearchParams(search);
  if (matterMatch) {
    const matterId = safeDecode(matterMatch[1]);
    if (!matterId) return { workspace: "dashboard" };
    return {
      workspace: "matters",
      matterId,
      matterTab: params.get("tab") || "overview"
    };
  }
  if (resourceMatch) {
    const [, scope, id] = resourceMatch;
    const resourceId = safeDecode(id);
    if (!resourceId) return { workspace: "dashboard" };
    const resourceByScope: Record<string, WorkspaceRoute["resourceType"]> = {
      clients: "client", tasks: "task", documents: "document", knowledge: "knowledge_item",
      approvals: "approval", intakes: "intake",
      proceedings: "proceeding", events: "court_event", filings: "filing", service: "service_record",
      projects: "project", meetings: "meeting"
    };
    const workspaceByScope: Record<string, string> = {
      clients: "clients", tasks: "tasks", documents: "documents", knowledge: "knowledge",
      approvals: "approvals", intakes: "matters",
      proceedings: "court", events: "court", filings: "court", service: "court", projects: "operations", meetings: "operations"
    };
    return { workspace: workspaceByScope[scope], resourceType: resourceByScope[scope], resourceId };
  }
  return { workspace: WORKSPACE_BY_PATH[normalized] || "dashboard" };
}

export function serializeWorkspaceRoute(route: WorkspaceRoute): string {
  if (route.workspace === "matters" && route.matterId) {
    const tab = route.matterTab && route.matterTab !== "overview" ? `?tab=${encodeURIComponent(route.matterTab)}` : "";
    return `/matters/${encodeURIComponent(route.matterId)}${tab}`;
  }
  if (route.resourceType && route.resourceId) {
    const resourcePaths: Record<NonNullable<WorkspaceRoute["resourceType"]>, string> = {
      client: "/clients", task: "/tasks", document: "/documents", knowledge_item: "/knowledge",
      approval: "/approvals", intake: "/intakes",
      proceeding: "/court/proceedings", court_event: "/court/events", filing: "/court/filings", service_record: "/court/service",
      project: "/operations/projects", meeting: "/operations/meetings"
    };
    return `${resourcePaths[route.resourceType]}/${encodeURIComponent(route.resourceId)}`;
  }
  return WORKSPACE_PATHS[route.workspace] || "/";
}

export function navigateToResource(route: WorkspaceRoute): void {
  const url = serializeWorkspaceRoute(route);
  if (window.location.pathname + window.location.search !== url) {
    window.history.pushState({}, '', url);
    window.dispatchEvent(new PopStateEvent('popstate'));
  }
}
