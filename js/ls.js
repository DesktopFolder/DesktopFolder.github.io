export function getItem(id, default_value = null) {
    return (
        localStorage.getItem("_elo:" + id.toLowerCase()) || default_value
    );
}

export function setItem(id, val) {
    return localStorage.setItem("_elo:" + id.toLowerCase(), val);
}

export function removeItem(id) {
    return localStorage.removeItem("_elo:" + id.toLowerCase());
}
