import { app, BrowserWindow, dialog, ipcMain, nativeTheme, Menu } from 'electron'
import path from 'path'
import fs from 'fs'

let mainWindow: BrowserWindow | null = null
let pendingFile: string | null = null

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 900,
    minHeight: 600,
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 16, y: 16 },
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    show: false,
    backgroundColor: nativeTheme.shouldUseDarkColors ? '#1e1e1e' : '#ffffff',
  })

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show()
    // If a file was opened before the window was ready, send it now
    if (pendingFile) {
      sendFileToRenderer(pendingFile)
      pendingFile = null
    }
  })

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL)
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

function sendFileToRenderer(filePath: string) {
  if (!mainWindow) {
    pendingFile = filePath
    return
  }
  try {
    const content = fs.readFileSync(filePath, 'utf-8')
    mainWindow.webContents.send('har-file-opened', {
      filePath,
      content,
      fileName: path.basename(filePath),
    })
  } catch (err) {
    console.error('Failed to read HAR file:', err)
  }
}

// Handle file open dialog
ipcMain.handle('open-file-dialog', async () => {
  const result = await dialog.showOpenDialog(mainWindow!, {
    properties: ['openFile'],
    filters: [
      { name: 'HAR Files', extensions: ['har'] },
      { name: 'All Files', extensions: ['*'] },
    ],
  })

  if (!result.canceled && result.filePaths.length > 0) {
    const filePath = result.filePaths[0]
    try {
      const content = fs.readFileSync(filePath, 'utf-8')
      return {
        filePath,
        content,
        fileName: path.basename(filePath),
      }
    } catch (err) {
      console.error('Failed to read file:', err)
      return null
    }
  }
  return null
})

// Handle reading a file from a dropped path
ipcMain.handle('read-har-file', async (_event, filePath: string) => {
  try {
    const content = fs.readFileSync(filePath, 'utf-8')
    return {
      filePath,
      content,
      fileName: path.basename(filePath),
    }
  } catch (err) {
    console.error('Failed to read file:', err)
    return null
  }
})

// Handle theme query
ipcMain.handle('get-native-theme', () => {
  return nativeTheme.shouldUseDarkColors ? 'dark' : 'light'
})

// Watch for theme changes
nativeTheme.on('updated', () => {
  mainWindow?.webContents.send(
    'theme-changed',
    nativeTheme.shouldUseDarkColors ? 'dark' : 'light'
  )
})

// Build application menu
function buildMenu() {
  const template: Electron.MenuItemConstructorOptions[] = [
    {
      label: app.name,
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        { role: 'services' },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideOthers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' },
      ],
    },
    {
      label: 'File',
      submenu: [
        {
          label: 'Open HAR File...',
          accelerator: 'CmdOrCtrl+O',
          click: async () => {
            const result = await dialog.showOpenDialog(mainWindow!, {
              properties: ['openFile'],
              filters: [
                { name: 'HAR Files', extensions: ['har'] },
                { name: 'All Files', extensions: ['*'] },
              ],
            })
            if (!result.canceled && result.filePaths.length > 0) {
              sendFileToRenderer(result.filePaths[0])
            }
          },
        },
        { type: 'separator' },
        { role: 'close' },
      ],
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'copy' },
        { role: 'selectAll' },
      ],
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
      ],
    },
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        { role: 'zoom' },
        { type: 'separator' },
        { role: 'front' },
      ],
    },
  ]

  Menu.setApplicationMenu(Menu.buildFromTemplate(template))
}

// macOS: Handle file open via Finder double-click or drag onto dock icon
app.on('open-file', (event, filePath) => {
  event.preventDefault()
  if (mainWindow) {
    sendFileToRenderer(filePath)
  } else {
    pendingFile = filePath
  }
})

app.whenReady().then(() => {
  buildMenu()
  createWindow()

  // Check if launched with a file argument (e.g., from command line)
  const args = process.argv.slice(1)
  const harFile = args.find(
    (arg) => arg.endsWith('.har') && fs.existsSync(arg)
  )
  if (harFile && !pendingFile) {
    pendingFile = path.resolve(harFile)
  }
})

app.on('window-all-closed', () => {
  app.quit()
})

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow()
  }
})
