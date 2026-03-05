# Real-time Chat Application

A production-ready, WhatsApp-inspired chat application built with Soketi (Pusher Protocol) and TypeScript. Features real-time messaging, typing indicators, and comprehensive accessibility support.

## Features

### Core Functionality
- **Real-time Messaging** - Instant message delivery using WebSocket connections
- **Typing Indicators** - Live "user is typing..." notifications
- **System Messages** - Automated join/leave notifications
- **Message Timestamps** - HH:MM format with screen reader support
- **Connection Status** - Real-time connection monitoring

### User Experience
- **WhatsApp-Inspired UI** - Clean, familiar interface with message bubbles
- **Smart Auto-scroll** - Only scrolls when user is near bottom
- **Duplicate Prevention** - Message deduplication via unique IDs
- **Form Validation** - Username and message input validation
- **Keyboard Navigation** - Full keyboard support (Enter to send)

### Accessibility (WCAG 2.1 Level AA)
- **Screen Reader Support** - ARIA live regions for announcements
- **Semantic HTML** - Proper heading hierarchy, landmarks, and roles
- **Focus Management** - Visible focus states with `:focus-visible`
- **Motion Preferences** - Respects `prefers-reduced-motion`
- **Form Accessibility** - Labels, autocomplete, and ARIA attributes
- **Touch Optimization** - `touch-action: manipulation` on interactive elements

## Quick Start

### Prerequisites
- [Bun](https://bun.sh) runtime installed
- Soketi server running (or Pusher account)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd soketi-example
   ```

2. **Install dependencies**
   ```bash
   bun install
   ```

3. **Configure the application**
   ```bash
   cp config.example.ts config.ts
   # Edit config.ts with your Soketi/Pusher credentials
   ```

4. **Build the application**
   ```bash
   bun build client.ts --outfile client.js --target browser
   ```

5. **Open in browser**
   ```bash
   # Option 1: Simple HTTP server
   python -m http.server 8000

   # Option 2: Direct file access
   open index.html
   ```

## Configuration

Edit `config.ts` with your Soketi or Pusher credentials:

```typescript
export const config = {
    pusher: {
        appKey: 'your-app-key',
        wsHost: '127.0.0.1',           // Soketi server host
        wsPort: 6001,                  // WebSocket port
        forceTLS: false,               // Enable for production
        cluster: 'mt1',                // Required by Pusher protocol
        enabledTransports: ['ws', 'wss']
    },
    channel: {
        name: 'chat-room'              // Channel name
    }
};
```

### Soketi Server Setup

Ensure your Soketi server has client events enabled:

```yaml
# config.yaml
appManager:
  array:
    apps:
      - id: app-id
        key: app-key
        secret: app-secret
        enableClientMessages: true    # Required for typing indicators
```

## Development

### Build Commands

```bash
# Single build
bun build client.ts --outfile client.js --target browser

# Watch mode (auto-rebuild on changes)
bun build client.ts --outfile client.js --target browser --watch
```

### Project Structure

```
soketi-example/
├── index.html              # Main HTML file with embedded CSS
├── client.ts               # TypeScript source code
├── client.js               # Compiled JavaScript (generated)
├── config.ts               # Configuration file (gitignored)
├── config.example.ts       # Configuration template
├── .gitignore             # Git ignore rules
├── package.json           # Dependencies
├── tsconfig.json          # TypeScript configuration
└── README.md              # This file
```

### Technology Stack

- **TypeScript** - Type-safe application code
- **Pusher JS** - WebSocket client library
- **Bun** - Fast JavaScript runtime and bundler
- **CSS3** - Modern styling with CSS variables
- **HTML5** - Semantic markup with ARIA

## Deployment

### Deploying to Dokploy / Railway / Nixpacks

This application is configured to deploy on platforms using Nixpacks (Dokploy, Railway, etc.).

1. **Push your code** to a Git repository (GitHub, GitLab, etc.)

2. **Configure environment variables** in your deployment platform:
   ```
   PUSHER_APP_KEY=your-app-key
   PUSHER_WS_HOST=your-soketi-host.com
   PUSHER_WS_PORT=6001
   PUSHER_FORCE_TLS=true
   PUSHER_CLUSTER=mt1
   PUSHER_CHANNEL=chat-room
   ```

3. **Deploy** - The platform will automatically:
   - Install dependencies with `bun install`
   - Generate `config.ts` from environment variables
   - Build the TypeScript to JavaScript
   - Start the HTTP server on port 3000

4. **Important**: Make sure your Soketi server:
   - Is accessible from the internet
   - Has `enableClientMessages: true` enabled
   - Allows connections from your deployed app's domain

### Environment Variables

See [.env.example](.env.example) for all available configuration options.

The `generate-config.js` script automatically creates `config.ts` from these environment variables during build time.

## Usage

1. Open the application in two browser windows/tabs
2. Enter different usernames in each window
3. Start chatting in real-time
4. Type in one window to see "typing..." indicator in the other

### Message Types

- **Own Messages** - Green bubbles aligned right
- **Received Messages** - White bubbles aligned left
- **System Messages** - Centered gray bubbles for join/leave events

## Security

⚠️ **Important Security Notes**

- `config.ts` is excluded from version control via `.gitignore`
- Never commit credentials or API keys to the repository
- Use `config.example.ts` as a template for configuration
- Enable TLS (`forceTLS: true`) in production environments
- Validate and sanitize user input on both client and server

## Accessibility Compliance

This application adheres to:

- [Web Interface Guidelines](https://github.com/vercel-labs/web-interface-guidelines) (Vercel)
- [WCAG 2.1 Level AA](https://www.w3.org/WAI/WCAG21/quickref/)
- [ARIA Authoring Practices Guide](https://www.w3.org/WAI/ARIA/apg/)

### Accessibility Features

| Feature | Implementation |
|---------|---------------|
| Screen Readers | `aria-live` regions, `role` attributes |
| Keyboard Navigation | Enter to send, Tab navigation, focus states |
| Form Labels | Explicit `<label>` elements, `aria-label` |
| Status Updates | `role="status"`, `aria-live="polite"` |
| Motion Sensitivity | `@media (prefers-reduced-motion)` |
| Touch Targets | Minimum 44x44px interactive areas |

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari, Chrome Mobile)

## Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Standards

- TypeScript strict mode enabled
- ESLint/Prettier for code formatting
- Semantic commit messages
- Accessibility testing before PR submission

## Troubleshooting

### Connection Issues

**Problem:** "Desconectado" status indicator

**Solutions:**
- Verify Soketi server is running
- Check `wsHost` and `wsPort` in `config.ts`
- Ensure firewall allows WebSocket connections
- Check browser console for connection errors

### Typing Indicators Not Working

**Problem:** No "is typing..." indicator appears

**Solutions:**
- Verify `enableClientMessages: true` in Soketi config
- Check browser console for client event errors
- Ensure both clients are on the same channel
- Verify WebSocket connection is established

## License

MIT License - see [LICENSE](LICENSE) file for details

## Acknowledgments

- Built with [Soketi](https://soketi.app/) - Open-source Pusher alternative
- UI inspired by [WhatsApp Web](https://web.whatsapp.com/)
- Accessibility guidelines from [Vercel](https://github.com/vercel-labs/web-interface-guidelines)

---

**Built with ❤️ using TypeScript and Soketi**
