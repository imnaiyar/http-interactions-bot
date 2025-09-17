# HTTP Interactions Bot - Cloudflare Workers Edition

A Discord bot built with TypeScript that runs on Cloudflare Workers, utilizing HTTP interactions for optimal performance and scalability.

## 🚀 Features

- **Serverless**: Runs on Cloudflare Workers for global edge deployment
- **HTTP-only**: Uses Discord's HTTP interactions API (no gateway connection required)
- **User Installable**: Can be installed by users in any server or DM
- **TypeScript**: Fully typed codebase with modern TypeScript features
- **Fast**: Lightning-fast responses with edge computing

## 📋 Available Commands

### Slash Commands
- `/ping` - Check bot responsiveness
- `/facts` - Get random interesting facts
- `/userinfo` - Display user information
- `/eval` - Execute JavaScript code (owner only)
- `/todo` - Manage your todo list
- `/bookmarks` - Manage bookmarks
- `/convert` - Unit conversion utility
- `/reminders` - Set and manage reminders
- `/ephemeral` - Toggle ephemeral responses
- `/snap` - Take website screenshots (temporarily disabled)

### Context Menu Commands
- **User Commands**: Get user info, translate messages
- **Message Commands**: Bookmark messages, prettify code, get message info

## 🛠️ Development Setup

### Prerequisites
- [pnpm](https://pnpm.io/) package manager
- [Cloudflare account](https://dash.cloudflare.com/) with Workers enabled
- Discord application with bot token

### Installation

```bash
# Clone the repository
git clone https://github.com/imnaiyar/http-interactions-bot.git
cd http-interactions-bot

# Install dependencies
pnpm install

# Build the project
pnpm build
```

### Environment Variables

Set up your environment variables in Cloudflare Workers:

```bash
# Using Wrangler CLI
pnpm wrangler secret put DISCORD_TOKEN
pnpm wrangler secret put DISCORD_PUBLIC_KEY
pnpm wrangler secret put DISCORD_CLIENT_ID
```

### Local Development

```bash
# Start local development server
pnpm dev

# Register Discord commands
export DISCORD_TOKEN="your_bot_token"
export DISCORD_CLIENT_ID="your_client_id"
pnpm commands
```

## 🚀 Deployment

```bash
# Deploy to Cloudflare Workers
pnpm deploy
```

Update your Discord application's webhook URL to:
`https://your-worker.your-subdomain.workers.dev/interactions`

## 📚 Architecture

This bot has been converted from a traditional Node.js/Express.js application to run on Cloudflare Workers:

- **Runtime**: Cloudflare Workers (V8 Isolates)
- **HTTP Handler**: Native Workers fetch API
- **Package Manager**: pnpm
- **Build Tool**: TypeScript + Wrangler
- **Deployment**: Cloudflare Workers

See [WORKERS_CONVERSION.md](./WORKERS_CONVERSION.md) for detailed conversion information.

## 🔗 Resources

- [Discord Interactions API](https://discord.com/developers/docs/interactions/receiving-and-responding#receiving-an-interaction)
- [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers/)
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/)

## 📝 License

This project is open source and available under the [MIT License](LICENSE).

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
