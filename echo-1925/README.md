# 回响·1925 —— 国家记忆中的工人力量

1925 年河南焦作煤矿工人大罢工历史纪录短片（大学思政课“国家记忆”主题实践作业）。
整部影片由代码生成：**React + TypeScript + Remotion** 负责画面，**Python（NumPy/SciPy）** 负责原创配乐与音效，**离线神经网络 TTS（sherpa-onnx + Kokoro v1.1-zh）** 负责中文旁白，**FFmpeg** 负责编码与响度标准化。

| 参数 | 值 |
| --- | --- |
| 时长 | 210 秒（6300 帧） |
| 分辨率 / 帧率 | 1920×1080 / 30fps |
| 编码 | H.264 High（yuv420p，两遍编码约 3.3Mbps，约 92MB）+ AAC 192kbps，MP4，响度 -16 LUFS |
| 语言 / 字幕 | 简体中文旁白 + 画面内字幕 + 独立 SRT |

## 成品文件

```
output/
├── 回响1925.mp4        成片
├── 回响1925.srt        字幕（与旁白同步）
├── 封面.png            1920×1080 封面
└── preview_960x540.mp4 低分辨率预览片
素材来源.md              史料与素材来源、授权说明
```

## 环境要求

- Node.js ≥ 18（已在 22 测试）
- Python ≥ 3.9：`pip install numpy scipy soundfile pillow fonttools brotli sherpa-onnx`
- FFmpeg（可选，用于响度标准化与读取 mp3；Remotion 自带编码器，没有 FFmpeg 也能出片）
- Chrome / Chromium：Remotion 首次渲染时会自动下载 Chrome Headless Shell；如果网络受限，可设置环境变量
  `REMOTION_BROWSER_EXECUTABLE=/path/to/chrome-headless-shell` 使用本机浏览器。

## 快速开始

```bash
npm install                     # 安装依赖
npm run dev                     # 打开 Remotion Studio，逐场景预览与检查
npm run render                  # 渲染成片 → output/回响1925.mp4（同时输出封面与 SRT）
```

音频（旁白、配乐、音效）已经生成并放在 `public/audio/` 中，可直接渲染。如果修改了旁白文字或时间轴，需要重新生成：

```bash
python3 scripts/download_models.py   # 首次：下载离线中文 TTS 模型（约 350MB）
npm run audio                        # = python3 scripts/prepare_audio.py：旁白 → 配乐 → 音效 → SRT
npm run render:preview               # 先出 960×540 预览片检查
npm run render                       # 再出 1920×1080 成片
```

Windows PowerShell：

```powershell
npm install
python scripts\download_models.py
python scripts\prepare_audio.py
.\scripts\render.ps1 -Preview   # 预览
.\scripts\render.ps1            # 成片
```

其他命令：`npm run cover`（只渲染封面）、`npm run subtitles`（只生成 SRT）、`npm run typecheck`、
`node scripts/check_frames.mjs output/frames 0.5,15.5,70.5`（渲染指定秒数的静帧用于检查）。

## 工程结构

```
echo-1925/
├── src/
│   ├── data/
│   │   ├── script.json            ★ 旁白文本、断句、场景时间轴、旁白窗口、TTS 参数（唯一文本来源）
│   │   ├── beats.json             ★ 关键画面节点（汽笛、日期、标题…），画面与音乐/音效共用
│   │   ├── narration.timing.json  由配音实际时长生成的逐句时间（字幕/SRT/音乐避让共用）
│   │   ├── timeline.ts            场景帧数换算
│   │   └── narration.ts           字幕区间、旁白存在度（用于 ducking）
│   ├── components/                可复用的电影化组件
│   │   ├── CinematicCamera.tsx    摄影机推拉摇移 + 景深分层视差（Layer depth / blur）
│   │   ├── FilmGrain.tsx          胶片颗粒、划痕、尘点、曝光闪烁、暗角（VintageTexture）
│   │   ├── IndustrialFog.tsx      工业雾气
│   │   ├── CoalParticles.tsx      煤尘粒子（被矿灯/光束照亮）
│   │   ├── LightBeam.tsx          矿灯光束与光晕
│   │   ├── MineLamp.tsx           1920 年代油灯式安全矿灯（贯穿全片的视觉母题）
│   │   ├── MineSilhouette.tsx     井架（天轮转动）、绞车房、烟囱与烟、矿车、飞轮连杆、锅炉、巷道
│   │   ├── WorkerSilhouette.tsx   参数化人物剪影（骨骼姿态 + 年代服饰/道具 + 轮廓光）
│   │   ├── CrowdSilhouette.tsx    群像：透视纵深、空气透视、汇聚/行进/朝镜头走来
│   │   ├── HistoricalDocument.tsx 历史文书（程序生成旧纸纹理，标注“示意”）
│   │   ├── HistoricalTitle.tsx    片头式标题、大号日期、信息条、情景再现标注
│   │   ├── AnimatedTimeline.tsx   历史时间推进
│   │   ├── DocumentarySubtitle.tsx 统一字幕
│   │   └── SceneTransition.tsx    镜头溶接、黑场、光线扫过
│   ├── scenes/                    八个章节 + 封面
│   ├── Video.tsx                  主时间轴、三条音轨与音乐自动避让
│   └── Root.tsx                   合成：Echo1925（成片）、Scene1~8（单场景预览）、Cover（封面）
├── scripts/
│   ├── prepare_audio.py           一键生成全部音频
│   ├── narration.py               旁白：离线 TTS / 逐句录音 / 整条录音导入，自动排布时间
│   ├── compose_music.py           原创配乐合成
│   ├── sound_effects.py           音效合成（汽笛、矿车、机械、钟声、人群、脚步…）
│   ├── generate_subtitles.py      SRT 生成与断句检查
│   ├── make_textures.py           程序生成纹理（胶片颗粒、雾、旧纸、煤壁、天空）
│   ├── subset_fonts.py            思源字体子集化
│   ├── download_models.py         下载离线 TTS 模型
│   ├── check_frames.mjs           静帧检查
│   ├── render.mjs / render.sh / render.ps1  渲染入口
└── public/  audio/ fonts/ images/textures/
```

## 修改与替换

- **改旁白文字 / 断句**：编辑 `src/data/script.json` 中的 `lines`（字幕显示，最多两行、每行 ≤18 字）和 `tts`（朗读文本，年份建议写成汉字以保证读法），然后 `npm run audio`。系统会按实际配音时长在每个场景的 `narrationWindow` 内自动排布，必要时微调语速（不超过 `maxSpeed`），字幕和 SRT 自动同步。
- **使用自己的配音**（推荐真人录音）：
  - 逐句录音：放到 `public/audio/narration_cues/<cue-id>.wav`（如 `s1-1.wav`），运行 `python3 scripts/narration.py --source cues`；
  - 整条录音：已按 210 秒时间轴录好的 `public/audio/narration_input.wav`，运行 `python3 scripts/narration.py --source file`（字幕时间按字数估算，需在 Studio 中核对）。
  - 若既没有 TTS 模型也没有录音，脚本会明确报告“旁白音轨缺失”，`npm run render` 默认拒绝出片。
- **换配乐**：用自己的授权音乐替换 `public/audio/music.wav`（建议 48kHz、210 秒）；音乐在旁白处自动降低音量（见 `src/Video.tsx` 的 `musicVolume`）。
- **改镜头时间**：场景时长在 `script.json`，场景内关键节点在 `beats.json`；音乐与音效脚本读取同一份 `beats.json`，修改后运行 `python3 scripts/prepare_audio.py --skip-narration` 即可保持声画同步。
- **改颜色**：`src/theme.ts`。
- **加入真实历史照片**：放到 `public/images/`，用 `<Img src={staticFile("images/xxx.jpg")} />` 引入，并在 `素材来源.md` 登记来源与授权。请勿使用来源不明或其他事件的照片。

## 常见问题

- **渲染时下载 Chrome 失败**：设置 `REMOTION_BROWSER_EXECUTABLE` 指向本机 Chrome/Chromium（或 Playwright 安装的 chrome-headless-shell）。
- **中文显示为方块**：字体子集只包含 GB2312 一级字与工程内用到的字。新增生僻字后，下载思源宋体/黑体 OTF 放进 `fonts-src/`，运行 `python3 scripts/subset_fonts.py fonts-src`。
- **渲染慢**：成片 6300 帧，4 核机器上渲染约 27 分钟，再加约 7 分钟交付编码。可以先用 `npm run render:preview` 检查（约 15 分钟）。
- **想要更高画质**：胶片颗粒每帧都不同，高画质母版约 50Mbps（1.3GB）。运行 `node scripts/render.mjs --master` 会额外保留 `output/回响1925_master.mp4`；也可以修改 `scripts/render.mjs` 中的 `vb`（交付码率）。
- **Edge TTS 能不能用？** 可以。只要生成逐句音频放进 `public/audio/narration_cues/` 即可走同一套排布与字幕流程。本工程默认使用完全离线的 Kokoro，避免依赖网络服务。

## 关于本片的真实性说明

片中所有画面均为代码绘制的**艺术化历史情景再现**，不是历史影像，相关段落在画面角落标注“历史情景再现”。文献画面只展示文献名称与日期，正文以排版线条示意，并标注“文献内容示意 · 非原件”。地图只用经纬网表示城市方位，不绘制行政边界，也不表示具体路线。详见 `素材来源.md`。
