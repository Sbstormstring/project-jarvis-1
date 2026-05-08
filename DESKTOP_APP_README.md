# JARVIS Desktop App

## 🖥️ Setup Instructions

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Installation

1. **Clone/Download the repository**
   ```bash
   cd project-jarvis-1
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Run the app**
   ```bash
   npm start
   ```

### Building for Distribution

**Windows:**
```bash
npm run build-win
```

**Mac:**
```bash
npm run build-mac
```

**Linux:**
```bash
npm run build-linux
```

## 🎤 Features

✅ Always-listening background app
✅ "Hey JARVIS" wake word detection
✅ System tray integration
✅ Tasks, websites, smart home, and info commands
✅ Auto-start with system
✅ Voice feedback
✅ Minimizes to tray

## 🗣️ How to Use

1. Start the app - it minimizes to system tray
2. Say "Hey JARVIS" from anywhere
3. Speak your command
4. JARVIS executes it

## 📝 Voice Commands

Same as web version:
- "Add [task]"
- "Open Google"
- "Turn on the lights"
- "What's the weather?"
- And many more!

## 🔧 Troubleshooting

**Microphone not working?**
- Check browser microphone permissions
- Restart the app

**App not starting?**
- Delete node_modules and reinstall: `npm install`
- Check Node.js version: `node --version`

**Background listening not working?**
- Ensure app is running in system tray
- Check microphone permissions in system settings
