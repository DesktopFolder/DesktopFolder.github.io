import {reloadNotification, stored_token} from "./util.js";

// Should not have to change any of these in production.
export const LOCAL_TESTING: boolean =
    mapNotNull(localStorage.getItem("draaft.dev"), v => v === "true") ?? window.location.hostname === "localhost";

export const API_URI = new URL(
    localStorage.getItem("draaft.apiUri") ?? (LOCAL_TESTING ? "http://localhost:8000" : "https://api.disrespec.tech")
);

export const WS_URI = urlWithProtocol(API_URI, API_URI.protocol === "http:" ? "ws:" : "wss:");

export function request_headers() {
    return {
        token: stored_token(),
        "Content-Type": "application/json"
    };
}

export function apiRequest(endpoint: string, body?: BodyInit, method = "POST") {
    return fetch(resolveUrl(API_URI, endpoint), {
        headers: request_headers(),
        method: method,
        body: body
    });
}

export function requiredJsonGETRequest(endpoint: string, callback: (json_data: object) => void): Promise<void> {
    return apiRequest(endpoint, undefined, "GET")
        .then(resp => resp.text())
        .then(async text => {
            try {
                callback(JSON.parse(text));
            } catch {
                console.error(`drAAft error when contacting server/${endpoint} (likely failed JSON parse). Text data:`);
                console.error(text);
                reloadNotification("Error when contacting drAAft server.");
            }
        });
}

export function resolveUrl(base: URL, ...parts: string[]): URL {
    var url = base;

    for (const part of parts) {
        url = new URL(part, url);
    }

    return url;
}

function urlWithProtocol(url: URL, protocol: string): URL {
    const result = new URL(url);
    result.protocol = protocol;
    return result;
}

function mapNotNull<T, Y>(value: T | null, f: (v: T) => Y): Y | null {
    if (value !== null) {
        return f(value);
    } else {
        return null;
    }
}
