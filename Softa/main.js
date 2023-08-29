const { app, BrowserWindow, ipcMain } = require('electron')
const { download } = require('electron-dl');
const path = require('path')
async function createWindow() {
    const win = new BrowserWindow({
        width: 800,
        height: 450,
        maximizable: false,
        minimizable: true,
        title: "Test",
        autoHideMenuBar: true,
        icon: path.join(__dirname, 'icon.png'),
        webPreferences: {
            nodeIntegrationInWorker: true,
            nodeIntegration: true,
            devTools: true,
            imageAnimationPolicy: "animate",
            contextIsolation: false,
            enableRemoteModule: true,
            sandbox: false,
            webSecurity: true
        }
    })

    win.loadURL("http://localhost:8080/windows")

    win.webContents.on('will-navigate', (event, url) => {
        event.preventDefault();

        win.webContents.send('download-start', {
            ok: true,
        });

        downloadItem = download(win, url, {
            directory: path.join(__dirname, 'BootEase'),
            onProgress: (progress) => {
                var percent = progress.percent;
                percent = percent * 100;

                const remainingBytes = progress.totalBytes - progress.completedBytes;
                const remainingSeconds = progress.bytesPerSecond ? remainingBytes / progress.bytesPerSecond : 0;
                const remainingTime = remainingSeconds ? new Date(remainingSeconds * 1000).toISOString().substr(11, 8) : "00:00:00";
                win.webContents.send('download-progress', {
                    percent: percent,
                    bytesPerSecond: progress.bytesPerSecond,
                    remainingTime: remainingTime,
                });
                win.setProgressBar(percent / 100);
                win.setTitle(`BootEase - Ladataan - ${percent.toFixed(2)}%`);
            },
        })
            .then(dl => {
                win.setTitle("BootEase - Lataus valmis")

                let current = path.join(__dirname, 'BootEase');
                require('child_process').exec('start "" "' + current + '"');

                win.webContents.send('download-end', {
                    ok: true,
                });

                console.log(dl.getSavePath())
            })
            .catch(error => console.error(error));
    });
}

app.whenReady().then(() => {
    createWindow()

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow()
        }
    })
})

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit()
    }
})


ipcMain.on('get-downloads-path', (event) => {
    event.returnValue = app.getPath('downloads');
});

ipcMain.on('get-download-speed', (event) => {
    if (downloadItem) {
        event.returnValue = downloadItem.getReceivedBytesPerSecond();
    } else {
        event.returnValue = 0;
    }
});
