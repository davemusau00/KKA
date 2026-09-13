export type WorkspaceRoute = {
  workspace: string;
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

export function parseWorkspaceLocation(pathname: string, search = ""): WorkspaceRoute {
  const normalized = pathname.replace(/\/+$/, "") || "/";
  const matterMatch = normalized.match(/^\/matters\/([^/]+)$/);
  const params = new URLSearchParams(search);
  if (matterMatch) {
    return {
      workspace: "matters",
      matterId: decodeURIComponent(matterMatch[1]),
      matterTab: params.get("tab") || "overview"
    };
  }
  return { workspace: WORKSPACE_BY_PATH[normalized] || "dashboard" };
}

export function serializeWorkspaceRoute(route: WorkspaceRoute): string {
  if (route.workspace === "matters" && route.matterId) {
    const tab = route.matterTab && route.matterTab !== "overview" ? `?tab=${encodeURIComponent(route.matterTab)}` : "";
    return `/matters/${encodeURIComponent(route.matterId)}${tab}`;
  }
  return WORKSPACE_PATHS[route.workspace] || "/";
}
