# Patreon Mailing

A desktop app for managing and sending mailings to your Patreon supporters.

![License](https://img.shields.io/github/license/mtguerens/patreon-mailing)
![Release](https://img.shields.io/github/v/release/mtguerens/patreon-mailing)
![Downloads](https://img.shields.io/github/downloads/mtguerens/patreon-mailing/total)
![Platform](https://img.shields.io/badge/platform-macOS-lightgrey)

---

## Features

- 📋 Manage your Patreon subscriber list locally
- ✉️ Compose mailings to supporters
- 📄 Export mailing reports to PDF
- 🗃️ All data stored locally with SQLite

## Download

Head to the [**Releases**](https://github.com/mtguerens/patreon-mailing/releases) page and grab the latest version for your platform.

| Platform | Architecture | File |
|----------|-------------|------|
| macOS | Apple Silicon (M1/M2/M3) | `Patreon.Mailing-x.x.x-arm64.dmg` |
| macOS | Intel | `Patreon.Mailing-x.x.x-x64.dmg` |
| Windows | x64 | `Patreon.Mailing-*-x64.exe` |

> **macOS note:** The app is not notarized. When you open it for the first time, right-click the `.dmg` and choose **Open**, then confirm in the dialog.

## Getting Started (Development)

### Prerequisites

- [Node.js](https://nodejs.org/) 20+
- [pnpm](https://pnpm.io/) 9+

### Setup

```bash
# Clone the repository
git clone https://github.com/mtguerens/patreon-mailing.git
cd patreon-mailing

# Install dependencies
pnpm install

# Start in development mode
pnpm dev
```

### Build

```bash
# Build for production (creates installers in /release)
pnpm build
```

The output DMGs will be in the `release/` directory.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Shell | [Electron](https://www.electronjs.org/) |
| UI | [React](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/) |
| Styling | [Tailwind CSS v4](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/) |
| Database | [better-sqlite3](https://github.com/WiseLibs/better-sqlite3) |
| PDF Export | [jsPDF](https://github.com/parallax/jsPDF) |
| Build | [Vite](https://vitejs.dev/) + [electron-builder](https://www.electron.build/) |

## Project Structure

```
patreon-mailing/
├── src/                  # React frontend source
├── electron/             # Electron main process
├── public/               # Static assets
├── dist/                 # Compiled frontend (generated)
├── dist-electron/        # Compiled Electron main (generated)
└── release/              # Packaged installers (generated)
```

## Contributing

Contributions are welcome! Please open an issue first to discuss what you'd like to change.

1. Fork the repo
2. Create a feature branch: `git checkout -b feat/my-feature`
3. Commit your changes: `git commit -m 'feat: add my feature'`
4. Push to your branch: `git push origin feat/my-feature`
5. Open a pull request

Please follow [Conventional Commits](https://www.conventionalcommits.org/) for commit messages.

## License

[MIT](LICENSE)
