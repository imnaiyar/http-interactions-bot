# Read Manga Bot

A Discord bot that allows users to read manga directly within Discord using interactive components and slash commands.

## Features

- **Manga Search**: Search for manga with autocomplete functionality
- **Chapter Reading**: Read manga chapters with an interactive page viewer
- **Cross-Platform**: Works in Discord servers, DMs, and private channels

## Commands

### `/manga read`
Read a specific manga chapter with interactive navigation.

**Parameters:**
- `manga` - The manga to read (with autocomplete)
- `chapter` - The chapter to read (with autocomplete)

**Features:**
- Interactive page viewer with media gallery
- Previous/Next navigation buttons
- Page selection dropdown
- Real-time page updates

### `/manga continue`
Continue reading a manga from where you left off.

**Parameters:**
- `manga` - The manga to continue reading (with autocomplete)

## Tech Stack

- **Runtime**: Cloudflare Workers
- **Language**: TypeScript
- **Testing**: Vitest
- **Deployment**: Wrangler


## Environment Variables

The bot requires the following environment variables:

- `TOKEN` - Discord bot token
- `APP_ID` - Discord application ID
- `MANGA_API` - Manga API endpoint URL

## Development

### Prerequisites
- Node.js 18+
- pnpm package manager
- Cloudflare Workers account

### Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Set up environment variables in `.env` file

4. Start development server:
   ```bash
   pnpm dev
   ```

### Deployment

Deploy to Cloudflare Workers:
```bash
pnpm run deploy
```

### Testing

Run tests with Vitest:
```bash
pnpm test
```

## API Integration

The bot integrates with a manga API service to:
- Search for manga titles
- Retrieve manga metadata
- Fetch chapter pages and images
