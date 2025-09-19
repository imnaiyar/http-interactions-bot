# http-interactions-bot

A modular, TypeScript-based Discord bot with support for slash commands, context menus, and various utilities. Built with Vite and Vitest.
Runs on cloudflare workers

[![Deploy to Cloudflare Workers](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/imnaiyar/http-interactions-bot)

## Features
- Slash commands and context menu support
- Modular command and handler structure
- Manga reading services
- GitHub operations (issues, PRs, files, workflows)
- Utilities for formatting, string manipulation, and user info

## Commands

### GitHub Operations (`/github`)
Comprehensive GitHub API integration for managing repositories:

#### Issues (`/github issues`)
- `list` - List issues with filtering by state
- `get <number>` - Get detailed information about a specific issue
- `create <title> [body]` - Create a new issue
- `close <number>` - Close an existing issue

#### Pull Requests (`/github prs`)
- `list` - List pull requests with filtering by state
- `get <number>` - Get detailed information about a specific PR
- `create <title> <head> <base> [body]` - Create a new pull request
- `merge <number> [method]` - Merge a pull request

#### Files (`/github files`)
- `list [path]` - Browse repository files and directories
- `content <path>` - View file contents with syntax highlighting
- `create <path> <content> <message>` - Create a new file
- `update <path> <content> <message>` - Update an existing file

#### Workflows (`/github workflows`)
- `list` - List all workflows in the repository
- `runs <workflow>` - List runs for a specific workflow
- `trigger <workflow> <ref> [inputs]` - Trigger a workflow dispatch

**Configuration Options:**
- `repo` - Specify repository as `owner/name` (overrides default)
- `token` - Provide custom GitHub token (overrides default)
- `ref`/`branch` - Specify branch, tag, or commit reference

### Prerequisites
