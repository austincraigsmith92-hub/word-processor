# Eyes-Closed Word Processor

A browser-only word processor designed for "eyes-closed" typing, featuring offline support, typing heartbeat monitoring, auditory feedback (active/idle/error tones), and Google Drive backups.

## Features
- **Privacy Mode:** Hides the UI, leaving only the editor active, to prevent distraction.
- **Heartbeat Monitor:** Tracks typing activity every 60 seconds.
- **Auditory Alerts:** Plays different tones depending on whether you are actively typing, idle, or if an error occurs.
- **Google Drive Backup:** Automatically syncs text changes to a file (`EyesClosedDraft.txt`) in your Google Drive.
- **PWA Ready:** Can be installed on mobile devices for a native-like experience and functions offline using a Service Worker.

## Getting Started

Because this is a pure HTML/JS progressive web application, you can simply open `index.html` in any browser.

1. Click **Authorize Google Drive** to log in and connect the app.
2. Adjust your **Tone** and **Volume** settings using the left sidebar.
3. Click **Start Monitoring** to begin the heartbeat tracking.
4. (Optional) Click **Enter Privacy Mode** to hide all controls and focus only on writing.

## Development & Testing

This project uses [Playwright](https://playwright.dev/) for automated end-to-end tests.

```bash
# Install dependencies
npm install

# Run tests
npm test
```

## Deployment
You can deploy it to any static web host, such as:
- **GitHub Pages:** Just push to your `main` branch or `gh-pages` branch.
- **Vercel / Netlify / Cloudflare Pages:** Connect your git repository and let them serve the static output.

*Note for Google Drive API:* You will need to configure your own Google Cloud OAuth 2.0 Client ID and update the string inside `js/drive.js` (`this.clientId = 'YOUR_CLIENT_ID_HERE.apps.googleusercontent.com'`) before deploying for public use, and ensure your deployment domain is listed in the Google Cloud Console's "Authorized JavaScript origins".
