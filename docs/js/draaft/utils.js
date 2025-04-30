export const STEVE = "/assets/steve.png";
export function isValidPlayerName(pn) {
    return /^[a-zA-Z_0-9]{3,24}$/.test(pn);
}
export function playerFaceLink(pn) {
    if (isValidPlayerName(pn)) {
        return `https://mineskin.eu/helm/${pn}/100`;
    }
    else {
        return STEVE;
    }
}
export function playerFaceImageAsString(pn, classname = "player-title-face") {
    let plink = playerFaceLink(pn);
    return `<img src="${plink}" class="${classname}" onerror="this.onerror=null;this.src='${STEVE}';">`;
}
