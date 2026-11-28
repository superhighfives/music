/** Applies a saved light/dark choice before first paint, so there's no flash. Every page runs it in its head. */
export const THEME_SCRIPT = `try{var t=localStorage.getItem("music.theme");if(t==="dark"||t==="light")document.documentElement.setAttribute("data-theme",t)}catch(e){}`
