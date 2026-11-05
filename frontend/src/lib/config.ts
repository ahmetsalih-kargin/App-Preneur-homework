// Tek kaynak: API adresi. Önceden api.ts sabit "http://localhost:8000" kullanırken
// WebSocket ve dışa aktarım NEXT_PUBLIC_API_URL kullanıyordu; ikisi ayrışınca
// dağıtımda bir kısım istekler yanlış sunucuya gidiyordu.
const rawOrigin = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export const API_ORIGIN = rawOrigin.replace(/\/+$/, "");
export const API_BASE_URL = `${API_ORIGIN}/api`;
export const WS_ORIGIN = API_ORIGIN.replace(/^http/, "ws");
