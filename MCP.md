# Model Context Protocol (MCP) in Applyza

This document outlines the Model Context Protocol (MCP) servers relevant to the **Applyza** application, their names, descriptions, and setup instructions.

---

## 1. Overview of MCP

[Model Context Protocol (MCP)](https://modelcontextprotocol.io/) is an open standard that enables AI models and developer assistants (such as Antigravity, Claude, and Cursor) to securely connect to external tools, databases, and context sources.

In Applyza, MCP servers assist in:
- Interacting with Supabase databases (schema inspection, testing SQL queries).
- Managing Git and GitHub workflows directly (PRs, issues, commits).
- Accessing documentation and LLM resources.
- Verifying resume extraction pipelines and file handling.

---

## 2. Recommended MCP Servers for Applyza

| Server Name | Identifier / Package | Purpose in Applyza |
| :--- | :--- | :--- |
| **Supabase MCP** | `@modelcontextprotocol/server-supabase` | Inspects PostgreSQL schema, runs migrations, verifies Auth policies and storage buckets for resume uploads. |
| **PostgreSQL MCP** | `@modelcontextprotocol/server-postgres` | Direct read/write access to PostgreSQL connection string (`DATABASE_URL`) for testing ATS queries and analytics. |
| **GitHub MCP** | `@modelcontextprotocol/server-github` | Automates branch management, creates pull requests, reviews code diffs, and manages GitHub issues. |
| **Filesystem MCP** | `@modelcontextprotocol/server-filesystem` | Gives agents controlled access to read and validate resume test fixtures and local project assets. |
| **Fetch MCP** | `@modelcontextprotocol/server-fetch` | Fetches live web pages, ATS guidelines, job postings, and remote documentation. |
| **Memory MCP** | `@modelcontextprotocol/server-memory` | Provides a graph-based memory layer to persist user session context and custom ATS evaluation heuristics. |
| **LangChain Docs MCP** | `langchain-docs-mcp` | Quick retrieval of LangChain documentation for building AI chains and document processing pipelines. |

---

## 3. Server Configuration Reference

MCP servers can be configured in your local workspace or agent environment configuration (e.g., `mcp.json` or `.agents/mcp_config.json`).

### Example Configuration

```json
{
  "mcpServers": {
    "supabase": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-supabase"
      ],
      "env": {
        "SUPABASE_URL": "YOUR_SUPABASE_PROJECT_URL",
        "SUPABASE_SERVICE_ROLE_KEY": "YOUR_SUPABASE_SERVICE_ROLE_KEY"
      }
    },
    "github": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-github"
      ],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "YOUR_GITHUB_PAT"
      }
    },
    "postgres": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-postgres",
        "postgresql://postgres:[PASSWORD]@[HOST]:[PORT]/postgres"
      ]
    },
    "filesystem": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-filesystem",
        "/Users/subhamkumar/Documents/GitHub/ApplyZa"
      ]
    }
  }
}
```

---

## 4. Usage Guidelines & Best Practices

1. **Keep Secrets Secure**: Never commit API keys, personal access tokens, or Supabase service keys directly to version control. Always reference environment variables or `.env.local`.
2. **Read-Only Scopes When Possible**: For database MCP servers, use read-only database roles during exploratory tasks to prevent accidental data modification.
3. **Branch Testing**: Test any tool modifications or database migrations on a dedicated feature branch before requesting a merge to `main`.
