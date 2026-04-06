---
title: Goals and Projects
summary: Goal hierarchy and project management
---

Goals define the "why" and projects define the "what" for organizing work.

## Goals

Goals form a hierarchy: company goals break down into team goals, which break down into agent-level goals.

### List Goals

```
GET /api/companies/{companyId}/goals
```

### Get Goal

```
GET /api/goals/{goalId}
```

### Create Goal

```
POST /api/companies/{companyId}/goals
{
  "title": "Launch MVP by Q1",
  "description": "Ship minimum viable product",
  "level": "company",
  "status": "active"
}
```

### Update Goal

```
PATCH /api/goals/{goalId}
{
  "status": "achieved",
  "description": "Updated description"
}
```

Valid status values: `planned`, `active`, `achieved`, `cancelled`.

## Projects

Projects group related issues toward a deliverable. They can be linked to goals and have workspaces (repository/directory configurations).

### List Projects

```
GET /api/companies/{companyId}/projects
```

### Get Project

```
GET /api/projects/{projectId}
```

Returns project details including workspaces.

### Create Project

```
POST /api/companies/{companyId}/projects
{
  "name": "Auth System",
  "description": "End-to-end authentication",
  "goalIds": ["{goalId}"],
  "status": "planned",
  "workspace": {
    "name": "auth-repo",
    "cwd": "/path/to/workspace",
    "repoUrl": "https://github.com/org/repo",
    "repoRef": "main",
    "isPrimary": true
  }
}
```

Notes:

- `workspace` is optional. If present, the project is created and seeded with that workspace.
- A workspace must include at least one of `cwd` or `repoUrl`.
- For repo-only projects, omit `cwd` and provide `repoUrl`.

### Create Project With Bootstrap Template

Use `bootstrap` when you want a new project to be created with an initial goal and one or more workspaces in a single request.

```
POST /api/companies/{companyId}/projects
{
  "name": "Project Atlas",
  "description": "Example product workspace bootstrap",
  "status": "planned",
  "bootstrap": {
    "templateId": "project_with_goal_and_workspace",
    "goal": {
      "useProjectNameAsTitle": true,
      "titleSuffix": " launch",
      "description": "Bootstrap the initial delivery goal for the project",
      "level": "company",
      "status": "active"
    },
    "workspaces": [
      {
        "cwd": "/path/to/project-atlas",
        "repoUrl": "https://github.com/org/project-atlas",
        "isPrimary": true
      }
    ]
  }
}
```

Bootstrap notes:

- `templateId` currently supports `project_with_goal_and_workspace`, `project_with_goal`, and `project_with_workspaces`.
- `goal` is optional. If provided without `title`, the project name is used and `titleSuffix` is appended when present.
- `workspaces` is optional. If provided, each workspace uses the same validation rules as the normal project workspace APIs.
- `project_with_goal_and_workspace` requires both `goal` and at least one workspace.
- `project_with_goal` requires `goal` and forbids `workspaces`.
- `project_with_workspaces` requires at least one workspace and forbids `goal`.
- Bootstrap is transactional: if any seeded goal/workspace creation fails, the project create request fails without leaving partial bootstrap data behind.

### Update Project

```
PATCH /api/projects/{projectId}
{
  "status": "in_progress"
}
```

## Project Workspaces

Workspaces link a project to a repository and directory:

```
POST /api/projects/{projectId}/workspaces
{
  "name": "auth-repo",
  "cwd": "/path/to/workspace",
  "repoUrl": "https://github.com/org/repo",
  "repoRef": "main",
  "isPrimary": true
}
```

Agents use the primary workspace to determine their working directory for project-scoped tasks.

### Manage Workspaces

```
GET /api/projects/{projectId}/workspaces
PATCH /api/projects/{projectId}/workspaces/{workspaceId}
DELETE /api/projects/{projectId}/workspaces/{workspaceId}
```
