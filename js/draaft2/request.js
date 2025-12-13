import { reloadNotification, stored_token } from "./util.js";
// Should not have to change any of these in production.
export const LOCAL_TESTING = mapNotNull(localStorage.getItem("draaft.dev"), v => v === "true") ?? window.location.hostname === "localhost";
export const API_URI = new URL(localStorage.getItem("draaft.apiUri") ?? (LOCAL_TESTING ? "http://localhost:8000" : "https://api.disrespec.tech"));
export const WS_URI = urlWithProtocol(API_URI, API_URI.protocol === "http:" ? "ws:" : "wss:");
export function request_headers() {
    return {
        token: stored_token(),
        "Content-Type": "application/json"
    };
}
export function externalAPIRequest(endpoint, body, method = "GET") {
    return fetch(resolveUrl(API_URI, endpoint), {
        method: method,
        body: body
    });
}
export function apiRequest(endpoint, body, method = "POST") {
    return fetch(resolveUrl(API_URI, endpoint), {
        headers: request_headers(),
        method: method,
        body: body
    });
}
export function requiredJsonGETRequest(endpoint, callback) {
    return apiRequest(endpoint, undefined, "GET")
        .then(resp => resp.text())
        .then(async (text) => {
        try {
            callback(JSON.parse(text));
        }
        catch {
            console.error(`drAAft error when contacting server/${endpoint} (likely failed JSON parse). Text data:`);
            console.error(text);
            reloadNotification("Error when contacting drAAft server.");
        }
    });
}
export function resolveUrl(base, ...parts) {
    var url = base;
    for (const part of parts) {
        url = new URL(part, url);
    }
    return url;
}
function urlWithProtocol(url, protocol) {
    const result = new URL(url);
    result.protocol = protocol;
    return result;
}
function mapNotNull(value, f) {
    if (value !== null) {
        return f(value);
    }
    else {
        return null;
    }
}
