const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Window controls
  minimizeWindow: () => ipcRenderer.invoke('minimize-window'),
  maximizeWindow: () => ipcRenderer.invoke('maximize-window'),
  closeWindow: () => ipcRenderer.invoke('close-window'),
  
  // File operations
  selectFile: () => ipcRenderer.invoke('select-file'),
  saveFile: (data) => ipcRenderer.invoke('save-file', data),
  
  // System info
  getSystemInfo: () => ipcRenderer.invoke('get-system-info'),
  
  // App info
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  
  // Notifications
  showNotification: (title, body) => ipcRenderer.invoke('show-notification', title, body),
  
  // Database operations (if needed for offline mode)
  executeQuery: (query, params) => ipcRenderer.invoke('execute-query', query, params),
  
  // Listen for events from main process
  onUpdateAvailable: (callback) => ipcRenderer.on('update-available', callback),
  onUpdateDownloaded: (callback) => ipcRenderer.on('update-downloaded', callback),
  
  // Remove listeners
  removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel)
});

// Expose a limited set of Node.js APIs
contextBridge.exposeInMainWorld('nodeAPI', {
  platform: process.platform,
  arch: process.arch,
  versions: process.versions
});

// Desktop-specific styling adjustments
window.addEventListener('DOMContentLoaded', () => {
  // Add desktop class to body for CSS targeting
  document.body.classList.add('desktop-app');
  
  // Adjust for desktop environment
  const style = document.createElement('style');
  style.textContent = `
    .desktop-app {
      user-select: none;
      -webkit-user-select: none;
    }
    
    .desktop-app .attendance-container {
      padding: 10px;
      max-width: none;
    }
    
    .desktop-app .header {
      -webkit-app-region: drag;
      padding: 10px 0;
    }
    
    .desktop-app .header button,
    .desktop-app .header input,
    .desktop-app .header select {
      -webkit-app-region: no-drag;
    }
    
    .desktop-app .main-cards {
      margin-top: 10px;
    }
    
    /* Scrollbar styling for desktop */
    .desktop-app ::-webkit-scrollbar {
      width: 8px;
    }
    
    .desktop-app ::-webkit-scrollbar-track {
      background: #f1f1f1;
      border-radius: 4px;
    }
    
    .desktop-app ::-webkit-scrollbar-thumb {
      background: #c1c1c1;
      border-radius: 4px;
    }
    
    .desktop-app ::-webkit-scrollbar-thumb:hover {
      background: #a8a8a8;
    }
  `;
  document.head.appendChild(style);
});