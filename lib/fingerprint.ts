const FINGERPRINT_KEY = "pfh_fingerprint_id";

async function generateHash(message: string) {
  if (crypto.subtle) {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
  }
  // Fallback for non-secure contexts (HTTP)
  let hash = 0;
  for (let i = 0; i < message.length; i++) {
    hash = ((hash << 5) - hash) + message.charCodeAt(i);
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(16) + Date.now().toString(16);
}

export async function getVisitorFingerprint(): Promise<string> {
  if (typeof window === "undefined") return "server";
  
  let fp = localStorage.getItem(FINGERPRINT_KEY);
  if (fp) return fp;
  
  // Safely extract WebGL renderer info if available
  let webglInfo = "unknown";
  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
    if (gl && "getExtension" in gl) {
      const debugInfo = (gl as WebGLRenderingContext).getExtension("WEBGL_debug_renderer_info");
      if (debugInfo) {
        webglInfo = (gl as WebGLRenderingContext).getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || "unknown";
      }
    }
  } catch {
    webglInfo = "error";
  }

  // Create a robust fingerprint based on available safe properties
  const components = [
    navigator.userAgent,
    navigator.language,
    Intl.DateTimeFormat().resolvedOptions().timeZone,
    window.screen.colorDepth,
    window.screen.width + "x" + window.screen.height,
    window.devicePixelRatio || 1,
    navigator.maxTouchPoints || 0,
    webglInfo,
    navigator.hardwareConcurrency || "unknown",
    //@ts-expect-error deviceMemory is not standard but available in some browsers
    navigator.deviceMemory || "unknown"
  ];
  
  const rawString = components.join("||") + "||" + crypto.randomUUID();
  fp = await generateHash(rawString);
  
  localStorage.setItem(FINGERPRINT_KEY, fp);
  return fp;
}
