// ANSI 颜色代码
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  white: "\x1b[37m",
  gray: "\x1b[90m",
};

export function customLog(msg: string) {
  const coloredMsg = `${colors.cyan}${colors.bright}[LOG] ${colors.reset}${colors.cyan}${msg}${colors.reset}`;
  console.info(coloredMsg);
}

export function customError(msg: string) {
  const coloredMsg = `${colors.red}${colors.bright}[ERROR] ${colors.reset}${colors.red}${msg}${colors.reset}`;
  console.error(coloredMsg);
}

// 额外的彩色日志函数
export function customSuccess(msg: string) {
  const coloredMsg = `${colors.green}${colors.bright}[SUCCESS] ${colors.reset}${colors.green}${msg}${colors.reset}`;
  console.log(coloredMsg);
}

export function customWarning(msg: string) {
  const coloredMsg = `${colors.yellow}${colors.bright}[WARNING] ${colors.reset}${colors.yellow}${msg}${colors.reset}`;
  console.warn(coloredMsg);
}
