import { app, BrowserWindow, dialog } from "electron";
import path from "node:path";
import { mkdir } from "node:fs/promises";
import { logger, isDev } from "./logger";
import { IpcBridge } from "./ipc";

const isWindows = process.platform === "win32";

app.setName("CML Launcher");
app.setPath("userData", path.join(app.getPath("appData"), "CML Launcher"));

let mainWindow: BrowserWindow | null = null;
let bridge: IpcBridge | null = null;

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1180,
    height: 760,
    minWidth: 940,
    minHeight: 620,
    frame: false,
    backgroundColor: "#0b0e14",
    title: "CML Launcher",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  if (isDev && process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
    mainWindow.webContents.openDevTools({ mode: "detach" });
  } else {
    mainWindow.loadFile(path.join(__dirname, "..", "renderer", "index.html"));
  }

  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  mainWindow.webContents.on("did-finish-load", () => {
    logger.info("Arayüz yüklendi");
  });

  // Renderer çökerse
  mainWindow.webContents.on("render-process-gone", (_e, details) => {
    logger.error(`Renderer çöktü: ${details.reason}`);
    dialog.showErrorBox(
      "Arayüz çöktü",
      "Uygulama arayüzü beklenmedik şekilde çöktü. Yeniden başlatın.",
    );
  });
}

app.whenReady().then(async () => {
  logger.info(`CML Launcher başlatıldı (v${app.getVersion()})`);

  await mkdir(path.join(app.getPath("userData"), "minecraft"), { recursive: true });

  bridge = new IpcBridge(app.getPath("userData"));
  await bridge.init();
  bridge.register();

  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  app.quit();
});

process.on("uncaughtException", (err) => {
  const msg = err.stack ?? err.message;
  if (msg.includes("getsockopt") || msg.includes("ECONNREFUSED") || msg.includes("ETIMEDOUT")) {
    logger.error(`Network hatası (geçici): ${msg.split("\n")[0]}`);
  } else {
    logger.error(`Yakalanmamış hata: ${msg}`);
  }
});

process.on("unhandledRejection", (reason) => {
  const msg = String(reason);
  if (msg.includes("getsockopt") || msg.includes("ECONNREFUSED") || msg.includes("ETIMEDOUT")) {
    logger.error(`Network hatası (geçici): ${msg.split("\n")[0]}`);
  } else {
    logger.error(`Yakalanmamış promise reddi: ${msg}`);
  }
});
