export type Theme = "dark" | "light";

export const THEME_STORAGE_KEY = "tadabbur-theme";

/**
 * Runs before first paint so a light-theme visitor never sees a dark flash.
 * Dark is the default; only an explicit saved choice switches to light.
 */
export const themeInitScript = `try{if(localStorage.getItem("${THEME_STORAGE_KEY}")==="light")document.documentElement.dataset.theme="light"}catch(e){}`;
