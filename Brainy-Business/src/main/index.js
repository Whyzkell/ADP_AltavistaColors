import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'

const { fork } = require('child_process')
const path = require('path')

// 1. Variable global para guardar el proceso del backend
let serverProcess = null

function startServer() {
  // Definimos la ruta del backend dependiendo del entorno
  let serverPath

  if (is.dev) {
    // EN DESARROLLO:
    // Asumiendo que tu estructura es:
    // Brainy-Business/src/main/index.js (donde estamos)
    // Brainy-Business/backend/server.js (donde está el server)
    // Subimos 2 niveles (../../) para llegar a la raíz y entrar a backend
    serverPath = path.join(process.cwd(), 'backend', 'src', 'server.js')
  } else {
    // EN PRODUCCIÓN (cuando ya es un .exe):
    // El backend estará dentro de la carpeta de recursos gracias a electron-builder
    serverPath = path.join(process.resourcesPath, 'backend', 'src', 'server.js')
  }

  console.log(`Intentando iniciar servidor backend desde: ${serverPath}`)

  // Iniciamos el servidor como un subproceso
  serverProcess = fork(serverPath, [], {
    // Puedes pasar variables de entorno aquí si las necesitas
    env: {
      ...process.env,
      PORT: 3001, // Forzamos el puerto 3001 (asegúrate que tu React apunte aquí)
      NODE_ENV: is.dev ? 'development' : 'production'
    }
  })

  serverProcess.on('message', (msg) => {
    console.log('Mensaje del Backend:', msg)
  })

  serverProcess.on('error', (err) => {
    console.error('Error en el Backend:', err)
  })
}

function createWindow() {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1200,
    minHeight: 700,
    resizable: true,
    show: false,
    backgroundColor: '#ffffff',
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      nodeIntegration: true, // A veces necesario si usas require en renderer (opcional)
      contextIsolation: true
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  // 2. INICIAR EL SERVIDOR BACKEND AQUÍ
  startServer()

  electronApp.setAppUserModelId('com.electron')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  ipcMain.on('ping', () => console.log('pong'))

  createWindow()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// 3. MATAR EL PROCESO DEL SERVIDOR AL CERRAR LA APP
// Esto es vital para que no se queden procesos de node.js "zombies" en segundo plano
app.on('before-quit', () => {
  if (serverProcess) {
    console.log('Cerrando servidor backend...')
    serverProcess.kill()
    serverProcess = null
  }
})
