import { stored_token } from "./util.js";
// Cursed but simplest way to do this with this site
export const LOCAL_TESTING = false;
// Should not have to change any of these in production.
export const API_PROTO = LOCAL_TESTING ? "http://" : "https://";
export const API_HOST = LOCAL_TESTING ? "localhost:8000" : "api.disrespec.tech";
export const API_URI = `${API_PROTO}${API_HOST}`;
export const WS_PROTO = LOCAL_TESTING ? "ws://" : "wss://";
export const WS_URI = `${WS_PROTO}${API_HOST}`;
export function request_headers() {
    return {
        token: stored_token(),
        "Content-Type": "application/json"
    };
}
export function apiRequest(endpoint, body, method = "POST") {
    return fetch(`${API_URI}/${endpoint}`, {
        headers: request_headers(),
        method: method,
        body: body
    });
}
