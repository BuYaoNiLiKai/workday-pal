const { contextBridge, ipcRenderer } = require("electron");
const { pathToFileURL } = require("node:url");

contextBridge.exposeInMainWorld("workdayPal", {
  getConfig: () => ipcRenderer.invoke("config:get"),
  saveConfig: (config) => ipcRenderer.invoke("config:save", config),
  pickCustomImage: (state) => ipcRenderer.invoke("custom-image:pick", state),
  minimize: () => ipcRenderer.invoke("window:minimize"),
  close: () => ipcRenderer.invoke("window:close"),
  setSizeScale: (scalePercent) => ipcRenderer.invoke("window:set-size-scale", scalePercent),
  notifyWater: (body) => ipcRenderer.invoke("notify:water", body),
  fileUrl: (filePath) => pathToFileURL(filePath).toString()
});
