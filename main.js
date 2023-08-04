const {app, BrowserWindow, Menu, ipcMain, shell} = require('electron')
const path = require('path')
const os = require('os')
const fs = require('fs')
const resizeImg = require('resize-img');
const isMac = process.platform === 'darwin'
const isDev = process.env.NODE_ENV !== 'production'

let mainWindow;

function createMainWindow(){
    mainWindow = new BrowserWindow({
        title: 'Image Resizer',
        width: 500,
        height: 600,
        webPreferences: {
            contextIsolation: true,
            nodeIntegration: true,
            preload: path.join(__dirname, 'preload.js')
        }
    })

    // if(isDev) {
    //     mainWindow.webContents.openDevTools();
    // }

    mainWindow.loadFile(path.join(__dirname, './renderer/index.html'));
}

function createAboutWindow(){
    const aboutWindow = new BrowserWindow({
        title: 'About Image Resizer',
        width: 300,
        height: 300
    })
    aboutWindow.loadFile(path.join(__dirname, './renderer/about.html'));
}

const menu = [
    ...(isMac ? [
        {
            label: app.name,
            submenu: [
                {
                    label: 'About',
                }
            ]
        }
    ]: []),
    {
        label: 'File',
        submenu: [
            {
                label: 'Quit',
                click: () => app.quit(),
                accelerator: 'Ctrl+W'
            }
        ]
    },
    ...(!isMac ? [
        {
            label: 'Help',
            submenu: [
                {
                    label: 'About',
                    click: createAboutWindow
                }
            ]
        }
    ]: []),
]

app.whenReady().then(() => {
    createMainWindow();

    const mainMenu = Menu.buildFromTemplate(menu)
    Menu.setApplicationMenu(mainMenu)

    mainWindow.on('closed', () => (mainWindow = null));

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createMainWindow()
        }
      })
    
})

// IPCM
ipcMain.on('image:resize', (e, options) => {
    options.dest = path.join(os.homedir(), 'imageresizer')
    resizeImage(options)
})

async function resizeImage({imgPath, width, height, dest}){
    try {
        const newPath = await resizeImg(fs.readFileSync(imgPath), {
            width: +width,
            height: +height
        });

        const filename = path.basename(imgPath)
        if(!fs.existsSync(dest)){
            fs.mkdirSync(dest)
        }
        fs.writeFileSync(path.join(dest, filename), newPath)
        mainWindow.webContents.send('image:done')
        shell.openPath(dest)

    } catch (error) {
        console.log(error)
    }
}

app.on('window-all-closed', () => {
    if (!isMac) {
      app.quit()
    }
  })