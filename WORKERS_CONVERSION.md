# Cloudflare Workers Conversion Guide

This document explains the conversion of the HTTP Interactions Bot from a Node.js/Express.js application to Cloudflare Workers.

## Summary of Changes

### 🏗️ Architecture Changes
- **Runtime**: Node.js/Bun → Cloudflare Workers
- **Package Manager**: npm → pnpm
- **Server Framework**: Express.js → Cloudflare Workers fetch handler
- **Application Structure**: Singleton App class → Bot class with Workers integration

### 📦 Dependencies Updated
- **Removed**: `express`, `dotenv`, `node-fetch`, `puppeteer`
- **Added**: `@cloudflare/workers-types`, `wrangler`
- **Updated**: All Discord.js libraries remain compatible

### 🔧 Key Technical Changes

#### 1. Entry Point (`src/index.ts`)
- Implements Cloudflare Workers `fetch` handler for HTTP interactions
- Handles Discord signature verification using Workers Request/Response
- Routes Discord interactions to the Bot class methods

#### 2. Bot Class (`src/bot.ts`)
- Replaces the old Express-based App singleton
- Extends EventEmitter for compatibility with existing collectors
- Handles all Discord interaction types (commands, autocomplete, components, modals)
- Integrates with Workers environment variables

#### 3. Command Loading (`src/handlers/loadCommands.ts`)
- Converted from dynamic file system scanning to static imports
- All commands are explicitly imported and registered
- Maintains separation between regular commands and autocomplete-enabled commands

#### 4. Utilities Updated
- `postToHaste.ts`: Uses fetch API instead of undici
- `collector.ts`: Uses setTimeout/clearTimeout instead of Node.js Timer
- `UserUtils.ts` & `userInfo.ts`: Updated to use Bot class instead of App

#### 5. Configuration (`wrangler.toml`)
```toml
name = "http-interactions-bot"
main = "dist/index.js"
compatibility_date = "2024-12-18"
compatibility_flags = ["nodejs_compat"]
```

## 🚀 Deployment Instructions

### Prerequisites
1. Install pnpm: `npm install -g pnpm`
2. Install Wrangler: `pnpm install` (already included in devDependencies)
3. Cloudflare account with Workers enabled

### Environment Variables
Set these secrets in Cloudflare Workers:

```bash
# Using Wrangler CLI
pnpm wrangler secret put DISCORD_TOKEN
pnpm wrangler secret put DISCORD_PUBLIC_KEY  
pnpm wrangler secret put DISCORD_CLIENT_ID
```

Or set via Cloudflare Dashboard under Workers > Environment Variables.

### Build and Deploy

```bash
# Install dependencies
pnpm install

# Build the project
pnpm build

# Deploy to Cloudflare Workers
pnpm deploy

# Or deploy to staging
wrangler deploy --env development
```

### Register Discord Commands

```bash
# Set environment variables locally for command registration
export DISCORD_TOKEN="your_bot_token"
export DISCORD_CLIENT_ID="your_client_id"

# Register commands with Discord
pnpm commands
```

## ⚠️ Current Limitations

### 1. Screenshot Command Disabled
The `/snap` command is temporarily disabled because Puppeteer is not compatible with Cloudflare Workers. 

**Possible solutions:**
- Use a third-party screenshot service (Browserless, Playwright on Workers)
- Implement using Cloudflare Browser Rendering API (when available)

### 2. Reminders Feature Needs KV Storage
Reminders currently use file system storage, which isn't available in Workers.

**To implement:**
1. Enable KV namespace in `wrangler.toml`:
```toml
[[kv_namespaces]]
binding = "REMINDERS"
id = "your_kv_namespace_id"
```

2. Uncomment the KV implementation in `src/handlers/handleReminders.ts`

### 3. Eval Command Security
The `/eval` command may have limitations in Workers runtime due to eval restrictions.

## 🧪 Local Development

```bash
# Start local development server
pnpm dev

# The worker will be available at http://localhost:8787
# Set your Discord webhook URL to: http://localhost:8787/interactions
```

## 📝 Discord Webhook Configuration

Update your Discord application's webhook URL to point to your Workers domain:
- Production: `https://your-worker.your-subdomain.workers.dev/interactions`
- Development: `http://localhost:8787/interactions`

## 🔍 Troubleshooting

### Build Errors
- Ensure all dependencies are installed: `pnpm install`
- Check TypeScript configuration in `tsconfig.json`
- Some Discord API type conflicts are resolved with `as any` assertions

### Runtime Errors
- Check environment variables are properly set
- Verify Discord webhook URL is correct
- Monitor Wrangler logs during development: `pnpm dev`

### Deployment Issues
- Ensure your Cloudflare account has Workers enabled
- Check `wrangler.toml` configuration
- Verify authentication: `wrangler whoami`

## 🎯 Next Steps for Full Compatibility

1. **Implement KV storage for reminders**
2. **Replace Puppeteer with Workers-compatible solution**
3. **Add error handling for Workers-specific edge cases**
4. **Optimize bundle size for Workers limits**
5. **Add comprehensive testing for Workers environment**

The conversion maintains full functionality for most Discord bot features while adapting to the Cloudflare Workers runtime environment.