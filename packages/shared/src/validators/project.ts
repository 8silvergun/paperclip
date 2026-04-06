import { z } from "zod";
import { GOAL_LEVELS, GOAL_STATUSES, PROJECT_STATUSES } from "../constants.js";

const projectWorkspaceFields = {
  name: z.string().min(1).optional(),
  cwd: z.string().min(1).optional().nullable(),
  repoUrl: z.string().url().optional().nullable(),
  repoRef: z.string().optional().nullable(),
  metadata: z.record(z.unknown()).optional().nullable(),
};

export const createProjectWorkspaceSchema = z.object({
  ...projectWorkspaceFields,
  isPrimary: z.boolean().optional().default(false),
}).superRefine((value, ctx) => {
  const hasCwd = typeof value.cwd === "string" && value.cwd.trim().length > 0;
  const hasRepo = typeof value.repoUrl === "string" && value.repoUrl.trim().length > 0;
  if (!hasCwd && !hasRepo) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Workspace requires at least one of cwd or repoUrl.",
      path: ["cwd"],
    });
  }
});

export type CreateProjectWorkspace = z.infer<typeof createProjectWorkspaceSchema>;

export const updateProjectWorkspaceSchema = z.object({
  ...projectWorkspaceFields,
  isPrimary: z.boolean().optional(),
}).partial();

export type UpdateProjectWorkspace = z.infer<typeof updateProjectWorkspaceSchema>;

export const PROJECT_BOOTSTRAP_TEMPLATE_IDS = [
  "project_with_goal_and_workspace",
  "project_with_goal",
  "project_with_workspaces",
] as const;

export const projectBootstrapGoalSchema = z
  .object({
    title: z.string().min(1).optional(),
    titleSuffix: z.string().min(1).optional(),
    useProjectNameAsTitle: z.boolean().optional().default(true),
    description: z.string().optional().nullable(),
    level: z.enum(GOAL_LEVELS).optional().default("company"),
    status: z.enum(GOAL_STATUSES).optional().default("active"),
    parentId: z.string().uuid().optional().nullable(),
    ownerAgentId: z.string().uuid().optional().nullable(),
  })
  .superRefine((value, ctx) => {
    if (value.useProjectNameAsTitle === false && !value.title) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Goal bootstrap requires title when useProjectNameAsTitle is false.",
        path: ["title"],
      });
    }
  });

export const projectBootstrapSchema = z
  .object({
    templateId: z.enum(PROJECT_BOOTSTRAP_TEMPLATE_IDS),
    goal: projectBootstrapGoalSchema.optional(),
    workspaces: z.array(createProjectWorkspaceSchema).optional(),
  })
  .superRefine((value, ctx) => {
    const hasGoal = Boolean(value.goal);
    const hasWorkspaces = Array.isArray(value.workspaces) && value.workspaces.length > 0;
    if (!hasGoal && !hasWorkspaces) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Bootstrap requires at least one of goal or workspaces.",
        path: ["goal"],
      });
    }

    if (value.templateId === "project_with_goal_and_workspace") {
      if (!hasGoal) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Template project_with_goal_and_workspace requires goal.",
          path: ["goal"],
        });
      }
      if (!hasWorkspaces) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Template project_with_goal_and_workspace requires at least one workspace.",
          path: ["workspaces"],
        });
      }
    }

    if (value.templateId === "project_with_goal") {
      if (!hasGoal) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Template project_with_goal requires goal.",
          path: ["goal"],
        });
      }
      if (hasWorkspaces) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Template project_with_goal does not allow workspaces.",
          path: ["workspaces"],
        });
      }
    }

    if (value.templateId === "project_with_workspaces") {
      if (!hasWorkspaces) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Template project_with_workspaces requires at least one workspace.",
          path: ["workspaces"],
        });
      }
      if (hasGoal) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Template project_with_workspaces does not allow goal.",
          path: ["goal"],
        });
      }
    }

    const primaryWorkspaceCount = (value.workspaces ?? []).filter((workspace) => workspace.isPrimary === true).length;
    if (primaryWorkspaceCount > 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Bootstrap workspaces can declare at most one primary workspace.",
        path: ["workspaces"],
      });
    }
  });

export type ProjectBootstrap = z.infer<typeof projectBootstrapSchema>;

const projectFields = {
  /** @deprecated Use goalIds instead */
  goalId: z.string().uuid().optional().nullable(),
  goalIds: z.array(z.string().uuid()).optional(),
  name: z.string().min(1),
  description: z.string().optional().nullable(),
  status: z.enum(PROJECT_STATUSES).optional().default("backlog"),
  leadAgentId: z.string().uuid().optional().nullable(),
  targetDate: z.string().optional().nullable(),
  color: z.string().optional().nullable(),
  archivedAt: z.string().datetime().optional().nullable(),
};

export const createProjectSchema = z.object({
  ...projectFields,
  workspace: createProjectWorkspaceSchema.optional(),
  bootstrap: projectBootstrapSchema.optional(),
});

export type CreateProject = z.infer<typeof createProjectSchema>;

export const updateProjectSchema = z.object(projectFields).partial();

export type UpdateProject = z.infer<typeof updateProjectSchema>;
