# Employee Attendance Desktop Application

This is a Windows desktop version of the Employee Attendance Management System built with Electron.

## Features

- **Native Desktop Experience**: Runs as a standalone Windows application
- **Full Functionality**: All web features available in desktop environment
- **Offline Capability**: Can work without internet connection (when database is local)
- **System Integration**: Native file dialogs, notifications, and system tray
- **Responsive Design**: Optimized for desktop screen sizes
- **Menu Bar**: Full application menu with keyboard shortcuts

## Prerequisites

- Node.js (v14 or higher)
- npm (comes with Node.js)
- MySQL Server (for database functionality)

## Installation & Setup

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Setup Database** (if not already done):
   ```bash
   npm run init-db
   ```

3. **Run Desktop Application**:
   ```bash
   npm run electron
   ```

   Or double-click `launch-desktop-app.bat` for easy startup.

## Available Scripts

- `npm run electron` - Launch the desktop application
- `npm run electron-dev` - Launch with development server (requires web server running)
- `npm run build` - Build the application for distribution
- `npm run dist` - Create Windows installer

## Desktop-Specific Features

### Window Controls
- Minimize, maximize, and close buttons
- Resizable window with minimum size constraints
- Remember window position and size

### Menu Bar
- **File Menu**: Refresh, Exit
- **View Menu**: Developer Tools, Zoom controls
- **Help Menu**: About dialog

### Keyboard Shortcuts
- `Ctrl+R` - Refresh application
- `Ctrl+Q` - Quit application
- `Ctrl+Shift+I` - Toggle Developer Tools
- `Ctrl+0` - Reset zoom level
- `Ctrl++` - Zoom in
- `Ctrl+-` - Zoom out

### System Integration
- Native file selection dialogs
- System notifications for attendance events
- Desktop icon and taskbar integration

## Building for Distribution

To create a Windows installer:

1. **Install electron-builder** (if not already installed):
   ```bash
   npm install --save-dev electron-builder
   ```

2. **Build the application**:
   ```bash
   npm run dist
   ```

3. The installer will be created in the `dist` folder.

## File Structure

```
├── main.js              # Main Electron process
├── preload.js           # Preload script for security
├── attendance.html      # Main application UI
├── assets/
│   └── icon.svg         # Application icon
├── launch-desktop-app.bat # Windows launcher
└── package.json         # Electron configuration
```

## Troubleshooting

### Application Won't Start
- Ensure Node.js is installed and updated
- Run `npm install` to install dependencies
- Check that port 3000 is not in use by another application

### Database Connection Issues
- Verify MySQL server is running
- Check database credentials in configuration
- Run `npm run init-db` to initialize database

### Performance Issues
- Close Developer Tools if open
- Restart the application
- Check system resources

## Security Features

- Context isolation enabled
- Node integration disabled in renderer
- Secure preload script for API exposure
- External links open in default browser

## Development

For development with hot reload:

1. Start the web server:
   ```bash
   npm run start
   ```

2. In another terminal, start Electron:
   ```bash
   npm run electron-dev
   ```

## Support

For issues specific to the desktop application, please check:
1. Console output in Developer Tools (`Ctrl+Shift+I`)
2. Terminal output where the application was launched
3. System event logs

## Version Information

- Electron Version: Latest stable
- Node.js Integration: Disabled (for security)
- Context Isolation: Enabled
- Platform: Windows (primary), Cross-platform compatible