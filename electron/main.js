const { app, BrowserWindow, dialog, ipcMain, nativeImage, Notification } = require("electron");
const fs = require("node:fs");
const path = require("node:path");

const APP_NAME = "Workday Pal";
const APP_ID = "com.workdaypal.app";
const APP_ICON = path.join(__dirname, "..", "assets", "icons", process.platform === "win32" ? "icon.ico" : "icon.png");
const appIcon = nativeImage.createFromPath(APP_ICON);

if (process.platform === "win32") {
  app.setAppUserModelId(APP_ID);
}

const defaultConfig = {
  isConfigured: false,
  workStart: "08:15",
  breakStart: "11:45",
  breakEnd: "13:30",
  workEnd: "18:00",
  character: "cat",
  characterName: "橘子",
  waterReminderEnabled: true,
  waterReminderMinutes: 45,
  uiScalePercent: 100,
  overtimeActive: false,
  overtimeDate: null,
  overtimeEnd: "20:00",
  customImages: {}
};

let mainWindow;

function getConfigPath() {
  return path.join(app.getPath("userData"), "config.json");
}

function readConfig() {
  try {
    const raw = fs.readFileSync(getConfigPath(), "utf8");
    return normalizeConfig(JSON.parse(raw));
  } catch {
    return { ...defaultConfig };
  }
}

function normalizeConfig(config) {
  return {
    ...defaultConfig,
    ...config,
    customImages: { ...(config && config.customImages ? config.customImages : {}) }
  };
}

function saveConfig(config) {
  const next = normalizeConfig(config);
  fs.mkdirSync(app.getPath("userData"), { recursive: true });
  fs.writeFileSync(getConfigPath(), JSON.stringify(next, null, 2), "utf8");
  return next;
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 500,
    height: 286,
    minWidth: 400,
    minHeight: 228,
    show: false,
    frame: false,
    transparent: false,
    resizable: true,
    alwaysOnTop: true,
    skipTaskbar: false,
    title: APP_NAME,
    icon: appIcon,
    backgroundColor: "#f7f3ec",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.setMenuBarVisibility(false);
  mainWindow.setIcon(appIcon);
  mainWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  mainWindow.once("ready-to-show", () => {
    mainWindow.setIcon(appIcon);
    mainWindow.show();
  });
  mainWindow.loadFile(path.join(__dirname, "..", "app", "index.html"));
}

app.whenReady().then(() => {
  app.setName(APP_NAME);
  if (process.platform === "win32") {
    app.setAppUserModelId(APP_ID);
  }
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

ipcMain.handle("config:get", () => readConfig());

ipcMain.handle("config:save", (_event, config) => saveConfig(config));

ipcMain.handle("window:minimize", () => {
  mainWindow && mainWindow.minimize();
});

ipcMain.handle("window:close", () => {
  mainWindow && mainWindow.close();
});

ipcMain.handle("window:set-size-scale", (_event, scalePercent) => {
  if (!mainWindow) return;
  const scale = Math.min(1.5, Math.max(0.8, Number(scalePercent) / 100));
  mainWindow.setSize(Math.round(500 * scale), Math.round(286 * scale), true);
});

ipcMain.handle("custom-image:pick", async (_event, state) => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: "选择动作图片",
    properties: ["openFile"],
    filters: [
      { name: "Images", extensions: ["png", "jpg", "jpeg", "webp"] }
    ]
  });

  if (result.canceled || result.filePaths.length === 0) {
    return null;
  }

  const source = result.filePaths[0];
  const extension = path.extname(source) || ".png";
  const targetDir = path.join(app.getPath("userData"), "custom-character");
  const target = path.join(targetDir, `${state}${extension}`);
  fs.mkdirSync(targetDir, { recursive: true });
  fs.copyFileSync(source, target);
  return target;
});

ipcMain.handle("notify:water", (_event, body) => {
  if (!Notification.isSupported()) return;
  new Notification({
    title: "该喝水啦",
    icon: appIcon,
    body: body || "起来活动一下，补充一点水分。"
  }).show();
});
