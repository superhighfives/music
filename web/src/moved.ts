/**
 * chords and sounds used to live at chords.charliegleason.com and sounds.charliegleason.com. A browser
 * keeps localStorage per address, so a plain redirect would leave saved songs, settings and course
 * progress behind. This page copies the old address's localStorage into the new URL's hash, once,
 * then goes there. HANDOVER_SCRIPT on the new address writes it back. Old links, including the
 * "Send to chords" bookmarklet's #import=, keep working.
 */
export function moved(url: URL, name: string): Response {
  const path = url.pathname === '/' ? '' : url.pathname
  const to = `https://music.charliegleason.com/${name}${path}${url.search}`
  const html = `<!doctype html>
<meta charset="utf-8">
<title>${name} has moved</title>
<script>
var to = ${JSON.stringify(to)}, data = {}, n = 0
try {
  if (!localStorage.getItem('handedOver')) {
    for (var i = 0; i < localStorage.length; i++) { var k = localStorage.key(i); data[k] = localStorage.getItem(k); n++ }
    localStorage.setItem('handedOver', '1')
  }
} catch (e) {}
location.replace(n ? to + '#handover=' + encodeURIComponent(JSON.stringify({ data: data, hash: location.hash })) : to + location.hash)
</script>
<p>${name} has moved to <a href="${to}">${to}</a>.</p>`
  return new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' } })
}

/**
 * Runs first on every page: writes localStorage handed over from an old address, without replacing
 * anything already saved here, then puts back the hash the old link had.
 */
export const HANDOVER_SCRIPT = `try{var h=location.hash;if(h.indexOf('#handover=')===0){var p=JSON.parse(decodeURIComponent(h.slice(10)));for(var k in p.data)if(localStorage.getItem(k)===null)localStorage.setItem(k,p.data[k]);history.replaceState(null,'',location.pathname+location.search+(p.hash||''))}}catch(e){}`
