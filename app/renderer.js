const states = ["before-work", "working", "water", "phone", "sleep", "overtime", "off-work"];

const stateNames = {
  "before-work": "准备",
  working: "工作",
  water: "喝水",
  phone: "玩手机",
  sleep: "午睡",
  overtime: "加班",
  "off-work": "下班"
};

const characters = [
  { id: "cat", name: "小猫", defaultName: "橘子" },
  { id: "dog", name: "小狗", defaultName: "元宝" },
  { id: "rabbit", name: "兔子", defaultName: "糯米" },
  { id: "panda", name: "熊猫", defaultName: "团团" },
  { id: "boy", name: "小男孩", defaultName: "小宇" },
  { id: "girl", name: "小女孩", defaultName: "小满" },
  { id: "custom", name: "我的 DIY", defaultName: "我的搭子" }
];

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

let config = { ...defaultConfig };
let draftConfig = null;
let selectedCharacter = "cat";
let customImages = {};
let firstRunSettings = false;
let lastWaterReminder = new Date();
let waterReminderActiveUntil = new Date(0);
let lastWaterNotificationAt = 0;

const $ = (id) => document.getElementById(id);

function applyUiScale(scalePercent) {
  const scale = Math.min(1.5, Math.max(0.8, Number(scalePercent) / 100));
  document.documentElement.style.setProperty("--ui-scale", String(scale));
}

const elements = {
  todayLabel: $("todayLabel"),
  characterImage: $("characterImage"),
  characterName: $("characterName"),
  statusLabel: $("statusLabel"),
  overtimeBadge: $("overtimeBadge"),
  countdownLabel: $("countdownLabel"),
  captionLabel: $("captionLabel"),
  progressFill: $("progressFill"),
  progressLabel: $("progressLabel"),
  scheduleLabel: $("scheduleLabel"),
  waterHintLabel: $("waterHintLabel"),
  modalLayer: $("modalLayer"),
  settingsModal: $("settingsModal"),
  dressModal: $("dressModal"),
  overtimeModal: $("overtimeModal")
};

function parseTime(value) {
  const [hours, minutes] = String(value || "00:00").split(":").map(Number);
  return hours * 60 + minutes;
}

function minutesNow(date) {
  return date.getHours() * 60 + date.getMinutes() + date.getSeconds() / 60;
}

function todayKey(date) {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

function targetToday(date, minutes) {
  const target = new Date(date);
  target.setHours(Math.floor(minutes / 60), minutes % 60, 0, 0);
  return target;
}

function formatDuration(ms) {
  const seconds = Math.max(0, Math.floor(ms / 1000));
  const hours = String(Math.floor(seconds / 3600)).padStart(2, "0");
  const minutes = String(Math.floor((seconds % 3600) / 60)).padStart(2, "0");
  const rest = String(seconds % 60).padStart(2, "0");
  return `${hours}:${minutes}:${rest}`;
}

function characterDefaultName(characterId) {
  return (characters.find((item) => item.id === characterId) || characters[0]).defaultName;
}

function assetSrc(characterId, state) {
  if (characterId === "custom" && config.customImages && config.customImages[state]) {
    return window.workdayPal.fileUrl(config.customImages[state]);
  }
  const builtin = characterId === "custom" ? "cat" : characterId;
  return `../assets/characters/${builtin}/${state}.png`;
}

function calculateWorkdayProgress(time) {
  const workStart = parseTime(config.workStart);
  const breakStart = parseTime(config.breakStart);
  const breakEnd = parseTime(config.breakEnd);
  const workEnd = parseTime(config.workEnd);
  const morning = breakStart - workStart;
  const afternoon = workEnd - breakEnd;
  const total = morning + afternoon;

  if (total <= 0 || time <= workStart) return 0;
  if (time < breakStart) return (time - workStart) / total;
  if (time < breakEnd) return morning / total;
  if (time < workEnd) return (morning + (time - breakEnd)) / total;
  return 1;
}

function isWorkMoment(time) {
  return time >= parseTime(config.workStart) &&
    time < parseTime(config.workEnd) &&
    (time < parseTime(config.breakStart) || time >= parseTime(config.breakEnd));
}

function isOvertimeToday(now) {
  return config.overtimeActive && config.overtimeDate === todayKey(now);
}

async function expireOldOvertime(now) {
  if (!config.overtimeActive) return;
  if (config.overtimeDate !== todayKey(now) || minutesNow(now) >= parseTime(config.overtimeEnd)) {
    config.overtimeActive = false;
    config = await window.workdayPal.saveConfig(config);
  }
}

function getCurrentView(now) {
  const time = minutesNow(now);
  const workStart = parseTime(config.workStart);
  const breakStart = parseTime(config.breakStart);
  const breakEnd = parseTime(config.breakEnd);
  const workEnd = parseTime(config.workEnd);
  const progress = calculateWorkdayProgress(time);
  let isWaterMoment = config.waterReminderEnabled && now < waterReminderActiveUntil;

  if (config.waterReminderEnabled && isWorkMoment(time)) {
    const due = now - lastWaterReminder >= Number(config.waterReminderMinutes) * 60 * 1000;
    if (due) {
      lastWaterReminder = now;
      waterReminderActiveUntil = new Date(now.getTime() + 12 * 1000);
      isWaterMoment = true;
      if (now.getTime() - lastWaterNotificationAt > 60 * 1000) {
        lastWaterNotificationAt = now.getTime();
        window.workdayPal.notifyWater(`${config.characterName} 提醒你补充水分。`);
      }
    }
  }

  if (time < workStart) {
    return makeView("before-work", "等待上班", "整理一下，准备开工", now, targetToday(now, workStart), progress);
  }

  if (time < breakStart) {
    return makeView(
      isWaterMoment ? "water" : "working",
      "距离午休",
      isWaterMoment ? "喝口水，再继续" : "认真敲键盘中",
      now,
      targetToday(now, breakStart),
      progress
    );
  }

  if (time < breakEnd) {
    const state = now.getMinutes() % 2 === 0 ? "phone" : "sleep";
    return makeView(
      state,
      "午休剩余",
      state === "phone" ? "刷会儿手机放松一下" : "闭眼充充电",
      now,
      targetToday(now, breakEnd),
      progress
    );
  }

  if (time < workEnd) {
    return makeView(
      isWaterMoment ? "water" : "working",
      "距离下班",
      isWaterMoment ? "补充水分中" : "下午继续努力",
      now,
      targetToday(now, workEnd),
      progress
    );
  }

  if (isOvertimeToday(now) && time < parseTime(config.overtimeEnd)) {
    return makeView("overtime", "加班剩余", "亮起小台灯，再坚持一下", now, targetToday(now, parseTime(config.overtimeEnd)), 1);
  }

  return { state: "off-work", status: "今天已下班", caption: "收工，回家好好休息", remainingMs: 0, progress: 1 };
}

function makeView(state, status, caption, now, target, progress) {
  return {
    state,
    status,
    caption,
    remainingMs: target - now,
    progress
  };
}

function getWaterHint(now) {
  if (!config.waterReminderEnabled) return "已关闭";
  if (now < waterReminderActiveUntil) return "该喝水啦";

  const time = minutesNow(now);
  if (time < parseTime(config.workStart)) return "上班后开始";
  if (time >= parseTime(config.breakStart) && time < parseTime(config.breakEnd)) return "午休后继续";
  if (time >= parseTime(config.workEnd)) return "今日已结束";

  const remaining = lastWaterReminder.getTime() + Number(config.waterReminderMinutes) * 60 * 1000 - now.getTime();
  return `${Math.max(1, Math.ceil(remaining / 60000))} 分钟后`;
}

async function refresh() {
  const now = new Date();
  await expireOldOvertime(now);
  const view = getCurrentView(now);
  const progress = Math.round(Math.max(0, Math.min(1, view.progress)) * 100);

  elements.todayLabel.textContent = `${now.getMonth() + 1}月${now.getDate()}日`;
  elements.characterName.textContent = config.characterName;
  elements.statusLabel.textContent = view.status;
  elements.overtimeBadge.style.display = view.state === "overtime" ? "inline-block" : "none";
  elements.countdownLabel.textContent = formatDuration(view.remainingMs);
  elements.captionLabel.textContent = view.caption;
  elements.progressFill.style.width = `${progress}%`;
  elements.progressLabel.textContent = `${progress}%`;
  elements.scheduleLabel.textContent = `${config.workStart} 上班 · ${config.breakStart}-${config.breakEnd} 午休 · ${config.workEnd} 下班`;
  elements.waterHintLabel.textContent = getWaterHint(now);
  elements.characterImage.src = assetSrc(config.character, view.state);
  $("overtimeButton").textContent = isOvertimeToday(now) ? "结束加班" : "加班";
}

function showModal(modal) {
  elements.modalLayer.classList.remove("hidden");
  [elements.settingsModal, elements.dressModal, elements.overtimeModal].forEach((item) => item.classList.add("hidden"));
  modal.classList.remove("hidden");
}

function closeModals() {
  if (firstRunSettings && !config.isConfigured) return;
  elements.modalLayer.classList.add("hidden");
  [elements.settingsModal, elements.dressModal, elements.overtimeModal].forEach((item) => item.classList.add("hidden"));
}

function openSettings(firstRun = false) {
  firstRunSettings = firstRun;
  $("settingsEyebrow").textContent = firstRun ? "首次启动" : "设置";
  $("settingsTitle").textContent = firstRun ? "先设定你的工作节奏" : "调整工作时间";
  $("settingsCancelButton").style.display = firstRun ? "none" : "inline-block";
  $("workStartInput").value = config.workStart;
  $("breakStartInput").value = config.breakStart;
  $("breakEndInput").value = config.breakEnd;
  $("workEndInput").value = config.workEnd;
  $("waterEnabledInput").checked = config.waterReminderEnabled;
  $("waterMinutesInput").value = config.waterReminderMinutes;
  $("scaleInput").value = config.uiScalePercent;
  $("settingsError").textContent = "";
  showModal(elements.settingsModal);
}

function validateSchedule(next) {
  const workStart = parseTime(next.workStart);
  const breakStart = parseTime(next.breakStart);
  const breakEnd = parseTime(next.breakEnd);
  const workEnd = parseTime(next.workEnd);
  if (!(workStart < breakStart && breakStart < breakEnd && breakEnd < workEnd)) {
    return "时间需要满足：上班 < 午休开始 < 午休结束 < 下班。";
  }
  if (Number(next.waterReminderMinutes) < 15) {
    return "喝水间隔至少 15 分钟。";
  }
  return "";
}

async function saveSettings() {
  const next = {
    ...config,
    workStart: $("workStartInput").value,
    breakStart: $("breakStartInput").value,
    breakEnd: $("breakEndInput").value,
    workEnd: $("workEndInput").value,
    waterReminderEnabled: $("waterEnabledInput").checked,
    waterReminderMinutes: Number($("waterMinutesInput").value),
    uiScalePercent: Number($("scaleInput").value),
    isConfigured: true
  };
  const error = validateSchedule(next);
  if (error) {
    $("settingsError").textContent = error;
    return;
  }
  config = await window.workdayPal.saveConfig(next);
  applyUiScale(config.uiScalePercent);
  await window.workdayPal.setSizeScale(config.uiScalePercent);
  firstRunSettings = false;
  closeModals();
  if (draftConfig) draftConfig = null;
  await refresh();
  if (!config.character) openDress(true);
}

function openDress() {
  draftConfig = JSON.parse(JSON.stringify(config));
  selectedCharacter = draftConfig.character;
  customImages = { ...draftConfig.customImages };
  $("nameInput").value = draftConfig.characterName || characterDefaultName(selectedCharacter);
  $("dressError").textContent = "";
  renderCharacterGrid();
  renderActionGrid();
  showModal(elements.dressModal);
}

function renderCharacterGrid() {
  const grid = $("characterGrid");
  grid.innerHTML = "";
  characters.forEach((character) => {
    const card = document.createElement("button");
    card.className = `pal-card ${character.id === selectedCharacter ? "selected" : ""}`;
    card.innerHTML = `
      <img src="${character.id === "custom" && customImages.working ? window.workdayPal.fileUrl(customImages.working) : `../assets/characters/${character.id === "custom" ? "cat" : character.id}/working.png`}" alt="">
      <span class="card-title">${character.defaultName}</span>
      <span class="card-subtitle">${character.name}</span>
    `;
    card.addEventListener("click", () => {
      const previousDefault = characterDefaultName(selectedCharacter);
      selectedCharacter = character.id;
      if (!$("nameInput").value.trim() || $("nameInput").value.trim() === previousDefault) {
        $("nameInput").value = character.defaultName;
      }
      renderCharacterGrid();
      renderActionGrid();
    });
    grid.appendChild(card);
  });
}

function actionImageSrc(state) {
  if (selectedCharacter === "custom" && customImages[state]) {
    return window.workdayPal.fileUrl(customImages[state]);
  }
  const builtin = selectedCharacter === "custom" ? "cat" : selectedCharacter;
  return `../assets/characters/${builtin}/${state}.png`;
}

function renderActionGrid() {
  const grid = $("actionGrid");
  grid.innerHTML = "";
  states.forEach((state) => {
    const card = document.createElement("button");
    card.className = `action-card ${selectedCharacter === "custom" ? "custom" : ""}`;
    card.innerHTML = `
      <img src="${actionImageSrc(state)}" alt="">
      <span class="card-title">${stateNames[state]}</span>
      <span class="card-subtitle">${selectedCharacter === "custom" ? "点击导入" : "内置动作"}</span>
    `;
    if (selectedCharacter === "custom") {
      card.addEventListener("click", async () => {
        const picked = await window.workdayPal.pickCustomImage(state);
        if (picked) {
          customImages[state] = picked;
          $("dressError").textContent = `已更新“${stateNames[state]}”动作。`;
          renderActionGrid();
          renderCharacterGrid();
        }
      });
    }
    grid.appendChild(card);
  });
}

async function saveDress() {
  if (selectedCharacter === "custom") {
    const missing = states.filter((state) => !customImages[state]);
    if (missing.length > 0) {
      $("dressError").textContent = `DIY 搭子还缺少：${missing.map((state) => stateNames[state]).join("、")}。`;
      return;
    }
  }
  config = await window.workdayPal.saveConfig({
    ...config,
    character: selectedCharacter,
    characterName: $("nameInput").value.trim() || characterDefaultName(selectedCharacter),
    customImages
  });
  closeModals();
  await refresh();
}

function openOvertime() {
  $("overtimeEndInput").value = config.overtimeEnd || "20:00";
  $("overtimeError").textContent = "";
  showModal(elements.overtimeModal);
}

async function saveOvertime() {
  const end = $("overtimeEndInput").value;
  const now = new Date();
  if (parseTime(end) <= minutesNow(now)) {
    $("overtimeError").textContent = "加班结束时间需要晚于现在。";
    return;
  }
  config = await window.workdayPal.saveConfig({
    ...config,
    overtimeActive: true,
    overtimeDate: todayKey(now),
    overtimeEnd: end
  });
  closeModals();
  await refresh();
}

async function endOvertimeOrOpen() {
  const now = new Date();
  if (isOvertimeToday(now)) {
    config = await window.workdayPal.saveConfig({ ...config, overtimeActive: false });
    await refresh();
    return;
  }
  openOvertime();
}

function bindEvents() {
  $("settingsButton").addEventListener("click", () => openSettings(false));
  $("dressButton").addEventListener("click", () => openDress(false));
  $("minimizeButton").addEventListener("click", () => window.workdayPal.minimize());
  $("closeButton").addEventListener("click", () => window.workdayPal.close());
  $("settingsCancelButton").addEventListener("click", closeModals);
  $("settingsSaveButton").addEventListener("click", saveSettings);
  $("dressCancelButton").addEventListener("click", closeModals);
  $("dressSaveButton").addEventListener("click", saveDress);
  $("overtimeButton").addEventListener("click", endOvertimeOrOpen);
  $("overtimeCancelButton").addEventListener("click", closeModals);
  $("overtimeSaveButton").addEventListener("click", saveOvertime);
  $("quickWaterButton").addEventListener("click", async () => {
    lastWaterReminder = new Date();
    waterReminderActiveUntil = new Date(lastWaterReminder.getTime() + 3000);
    await refresh();
  });
  $("scaleInput").addEventListener("input", (event) => {
    const scalePercent = Number(event.target.value);
    applyUiScale(scalePercent);
  });
  $("scaleInput").addEventListener("change", async (event) => {
    const scalePercent = Number(event.target.value);
    await window.workdayPal.setSizeScale(scalePercent);
  });
}

async function boot() {
  bindEvents();
  config = { ...defaultConfig, ...(await window.workdayPal.getConfig()) };
  applyUiScale(config.uiScalePercent);
  await window.workdayPal.setSizeScale(config.uiScalePercent);
  await refresh();
  setInterval(refresh, 1000);
  if (!config.isConfigured) {
    openSettings(true);
  }
}

boot();
