/** 色彩系统（见创作说明 2.2）。历史段落以低饱和为主，暗红只用于重要节点。 */
export const C = {
  bg: "#101419", // 主背景
  steel: "#252B31", // 工业深灰
  coal: "#090B0D", // 煤炭黑
  paper: "#E8E0D2", // 旧纸白
  gold: "#D6AC66", // 矿灯暖金
  red: "#A83B35", // 历史暗红
  ink: "#2A2622", // 文书墨色
  fog: "#8A9096",
} as const;

export const FONT = {
  serif: '"EchoSerif", "Noto Serif SC", "Source Han Serif SC", "Songti SC", "SimSun", serif',
  sans: '"EchoSans", "Noto Sans SC", "Source Han Sans SC", "PingFang SC", "Microsoft YaHei", "WenQuanYi Zen Hei", sans-serif',
} as const;

export const W = 1920;
export const H = 1080;
