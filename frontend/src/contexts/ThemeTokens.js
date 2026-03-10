// Centralized Theme Token System
import { themePackages } from './themePackages';

export function getThemeTokens(themeKey) {
  return themePackages[themeKey] || themePackages.sentinelDark;
}
