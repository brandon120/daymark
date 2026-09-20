export const navigation = [
  { id: "today", label: "Today", icon: "Sun" },
  { id: "projects", label: "Projects", icon: "Folder" },
  { id: "memory", label: "Memory", icon: "ShieldCheck" },
  { id: "files", label: "Files", icon: "FileText" },
  { id: "agents", label: "Agents", icon: "Robot" },
  { id: "connections", label: "Connections", icon: "ShareNetwork" },
];

export const workspaceDetails = {
  projects: {
    eyebrow: "Portfolio",
    title: "Projects",
    description: "Track state, evidence, blockers, and the next safe action across every active project.",
  },
  memory: {
    eyebrow: "Knowledge",
    title: "Memory",
    description: "Review durable facts, decisions, preferences, and source-backed working context.",
  },
  files: {
    eyebrow: "Workspace",
    title: "Files",
    description: "Manage project documents and artifacts stored outside ephemeral coding sandboxes.",
  },
  agents: {
    eyebrow: "Runtime",
    title: "Agents",
    description: "Control workers, model routes, approvals, and the tasks each agent is allowed to perform.",
  },
  connections: {
    eyebrow: "Integrations",
    title: "Connections",
    description: "Connect MCP servers and providers with explicit permissions and inspectable tool access.",
  },
};
