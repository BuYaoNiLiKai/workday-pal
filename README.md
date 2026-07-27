# Workday Pal / 下班搭子

> 一个轻巧、温柔、可自定义的桌面下班计时器。  
> 让一个有名字的小搭子陪你上班、午休、喝水、加班，然后一起收工。

![Workday Pal companion preview](assets/characters/cat/working.png)

Workday Pal 是一个基于 **Electron** 的跨平台桌面悬浮应用。它不是一个网页计时器，而是一个可以放在桌面角落的小窗口：显示距离午休、下班或加班结束还有多久，并让桌面搭子根据当前状态切换动作。

## 亮点

- **首次启动引导**：第一次打开先设置上班、午休和下班时间
- **自由编辑日程**：每个人的工作时间不同，设置后会自动保存
- **真实工作进度**：进度条只计算工作时间，不把午休算进去
- **桌面搭子**：内置小猫、小狗、兔子、熊猫、小男孩、小女孩
- **动作状态**：准备、工作、喝水、玩手机、午睡、加班、下班
- **喝水提醒**：主界面显示下次提醒时间，到点后切换喝水动作
- **加班模式**：支持设置今日加班结束时间，也可以提前结束
- **DIY 装扮**：可以给每种动作导入自己的图片
- **小巧美观**：悬浮置顶、可拖动、可缩放，适合放在桌面角落
- **无需 .NET**：迁移到 Electron 后，普通用户不需要额外安装 .NET 运行时

## 预览

内置搭子示例：

| 小猫 | 小狗 | 兔子 | 熊猫 | 小男孩 | 小女孩 |
| --- | --- | --- | --- | --- | --- |
| ![cat](assets/characters/cat/working.png) | ![dog](assets/characters/dog/working.png) | ![rabbit](assets/characters/rabbit/working.png) | ![panda](assets/characters/panda/working.png) | ![boy](assets/characters/boy/working.png) | ![girl](assets/characters/girl/working.png) |

动作示例：

| 工作 | 喝水 | 午睡 | 加班 | 下班 |
| --- | --- | --- | --- | --- |
| ![working](assets/characters/cat/working.png) | ![water](assets/characters/cat/water.png) | ![sleep](assets/characters/cat/sleep.png) | ![overtime](assets/characters/cat/overtime.png) | ![off work](assets/characters/cat/off-work.png) |

## 安装使用

目前可以从 GitHub Actions 或 Release 下载构建产物。Windows 用户可以使用安装包或 zip 版本：

- `Workday Pal Setup 1.0.0.exe`
- `Workday Pal-1.0.0-win.zip`

macOS 会通过 GitHub Actions 构建 `.dmg` 和 `.zip`。未签名版本首次打开时，可能需要在 Finder 中右键选择“打开”。

## 本地开发

需要 Node.js 20 或更高版本。

```bash
npm install
npm start
```

国内网络如果下载 Electron 较慢，可以先设置镜像：

```powershell
$env:ELECTRON_MIRROR="https://npmmirror.com/mirrors/electron/"
$env:ELECTRON_BUILDER_BINARIES_MIRROR="https://npmmirror.com/mirrors/electron-builder-binaries/"
npm install
npm start
```

运行基础校验：

```bash
npm run lint
```

## 打包

Windows：

```bash
npm run build:win
```

macOS：

```bash
npm run build:mac
```

构建产物会输出到 `dist/`。

## 项目结构

```text
workday-pal/
├─ app/                  # 渲染层界面、样式和计时逻辑
├─ electron/             # Electron 主进程和 preload
├─ assets/characters/    # 内置搭子与动作图片
├─ scripts/              # 校验和打包脚本
├─ .github/workflows/    # Windows/macOS 自动构建
├─ package.json
└─ README.md
```

## DIY 素材说明

DIY 搭子需要为 7 种状态分别准备图片：

- 准备：`before-work`
- 工作：`working`
- 喝水：`water`
- 玩手机：`phone`
- 午睡：`sleep`
- 加班：`overtime`
- 下班：`off-work`

建议使用透明背景的方形 PNG，让角色主体居中，并在四周保留一点边距。导入后的图片只会保存到本机应用数据目录，不会上传到网络。

## 路线图

- 增加更多内置搭子和动作
- 支持托盘菜单和开机启动
- 支持自定义提醒文案
- 增加主题配色
- 增加正式应用图标
- 完善 macOS 签名和公证流程

## 贡献

欢迎提交 Issue、界面建议、角色素材和 Pull Request。这个项目适合做成一个温柔的小型开源工具：代码保持简单，功能保持克制，但让每天的下班时间多一点期待。

## 许可

本项目使用 [MIT License](LICENSE)。
