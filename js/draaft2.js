var UPDATING_TEXT_MAP = new Map();
const API_URI = "http://localhost:8000";
/**
 * Adds listeners to an input element that turn it into a
 * password field when focused or when it has a non-empty value.
 *
 * This should hide the input text reasonably well without
 * letting the browser suggest password autocompletion.
 *
 * This function is an implementation by gyromaniac of a method described here: https://stackoverflow.com/a/63373880
 */
function setupLazySecret(element) {
    console.assert(element.type === "text", "setupLazySecret is best used with input type text");
    // element.autocomplete = "off"; // Just for good measure.
    const originalType = element.type;
    const updateInputType = () => {
        if (element.value === "") {
            element.type = originalType;
        }
        else {
            element.type = "password";
        }
    };
    updateInputType(); // Initial call in case input already has value for some reason.
    element.addEventListener("focus", updateInputType); // Always set to password here before user types anything.
    element.addEventListener("blur", updateInputType);
    element.addEventListener("input", updateInputType);
}
export class UpdatingText {
    eleID;
    intervalID;
    textString;
    noAppend;
    timeoutValue;
    defaultText;
    update() {
        this.timeoutValue -= 1;
        if (this.timeoutValue <= 0) {
            this.cancel();
            return;
        }
        if (!this.noAppend) {
            this.textString.innerHTML = this.textString.innerHTML + ".";
        }
    }
    cancel() {
        this.textString.innerHTML = this.defaultText;
        window.clearInterval(this.intervalID);
        console.log(`Deleted interval ID: ${this.intervalID}`);
        UPDATING_TEXT_MAP.delete(this.eleID);
    }
    constructor(id, text, timeout, noAppend = true, defaultText = "") {
        this.noAppend = noAppend;
        this.timeoutValue = timeout;
        this.defaultText = defaultText;
        this.textString = document.getElementById(id);
        if (this.textString == undefined) {
            console.error(`Could not find ID '${id}' in DOM!`);
            return;
        }
        // Cancel the previous one here, so that we don't have weird side effects.
        if (UPDATING_TEXT_MAP.has(id)) {
            UPDATING_TEXT_MAP.get(id).cancel();
        }
        console.log(`Creating updating text with initial text: ${text}`);
        this.eleID = id;
        this.textString.innerHTML = text;
        this.intervalID = window.setInterval(() => this.update(), 1000);
        console.log(`Created interval ID: ${this.intervalID}`);
        UPDATING_TEXT_MAP.set(id, this);
    }
}
function showMenu(auth) {
    // Basic setup.
    setMenuClickers();
    // Show just our page.
    displayOnlyPage("menu-page");
}
function displayOnlyPage(id) {
    removeAllPages();
    document.getElementById(id).style.display = "flex";
    document.getElementById(id).classList.add("visible");
}
function hideAllPages() {
    document.getElementById("login-page").classList.add("invisible");
    document.getElementById("menu-page").classList.add("invisible");
    document.getElementById("room-page").classList.add("invisible");
}
function removeAllPages() {
    document.getElementById("login-page").style.display = "none";
    document.getElementById("menu-page").style.display = "none";
    document.getElementById("room-page").style.display = "none";
}
function loginSuccess(auth) {
    // Animation, lol.
    // First, start to fade out the page.
    hideAllPages();
    // Then, add a timeout to show our menu page.
    const menuShowTimeout = window.setTimeout(() => showMenu(auth), 500);
    // Don't forget to save the token, I guess.
    localStorage.setItem("draaft.token", auth);
    // Then, "race the beam" to get the user information.
    fetch(`${API_URI}/user`, {
        headers: {
            token: auth
        }
    })
        .then(resp => resp.json())
        .then(async (json) => {
        // Quickly check to see if we should move to a room page.
        if (json.room != null) {
            document.getElementById("menu-welcome-text").innerText = `ur in a room?? buggy website...`;
            window.clearTimeout(menuShowTimeout);
        }
        else {
            document.getElementById("menu-welcome-text").innerText = `welcome, ${json.username.toLowerCase()}`;
        }
    })
        .catch(error => {
        console.error("Error getting user data: ", error);
    });
}
async function testAuthToken(auth) {
    const interval = new UpdatingText("login-response-text", "contacting drAAft server..", 25, false);
    await fetch(`${API_URI}/authenticated`, {
        headers: {
            token: auth
        }
    })
        .then(resp => resp.text())
        .then(async (text) => {
        console.log(`Authentication Result: ${text}`);
        interval.cancel();
        if (text != "true") {
            new UpdatingText("login-response-text", "login token was incorrect, try logging in again", 20, true);
        }
        else {
            loginSuccess(auth);
        }
    })
        .catch(error => {
        interval.cancel();
        new UpdatingText("login-response-text", "error encountered with login, try logging in again", 20, true);
        console.error("Authentication Error: ", error);
    });
}
async function loginFlow(port) {
    console.log("Attempting login...");
    const response = await fetch(`http://localhost:${port}/`);
    console.assert(response.status == 200);
    const json = await response.json();
    console.assert(json.token !== undefined);
    return await testAuthToken(json.token);
}
function stored_token() {
    return localStorage.getItem("draaft.token");
}
function request_headers() {
    return {
        token: stored_token()
    };
}
function showRoom(code) {
    displayOnlyPage("room-page");
    document.getElementById("quick-remove").innerText = code;
}
function setupRoomPage(code) {
    // First, fade out all pages.
    hideAllPages();
    // Set a timeout to do our stuff.
    window.setTimeout(() => showRoom(code), 500);
    // In the meantime, as usual, get additional room metadata.
    fetch(`${API_URI}/room`, {
        headers: request_headers()
    })
        .then(resp => resp.json())
        .then(async (json) => {
        document.getElementById("menu-welcome-text").innerText = `welcome, ${json.members.length}`;
    })
        .catch(error => {
        console.error("Error getting room data: ", error);
    });
}
function menuJoinRoom() {
    new UpdatingText("menu-create-room", "joining room..", 15, false, "create a room");
    const rid = document.getElementById("menu-input-roomid");
    fetch(`${API_URI}/room/join`, {
        method: "POST",
        body: JSON.stringify({
            code: rid
        }),
        headers: request_headers()
    });
}
function menuCreateRoom() {
    new UpdatingText("menu-create-room", "creating room..", 15, false, "create a room");
    fetch(`${API_URI}/room/create`, {
        method: "GET",
        headers: request_headers()
    })
        .then(resp => resp.json())
        .then(async (json) => setupRoomPage(json.code));
}
function setMenuClickers() {
    document.getElementById("menu-roomid-join").addEventListener("click", () => menuJoinRoom());
    document.getElementById("menu-create-room").addEventListener("click", () => menuCreateRoom());
}
function setupOnClick() {
}
function main() {
    console.log("Launching drAAft 2 web client...");
    const storageToken = localStorage.getItem("draaft.token");
    if (storageToken != null) {
        testAuthToken(storageToken);
    }
    document.getElementById("login-page").classList.add("visible");
    setupLazySecret(document.getElementById("menu-input-roomid"));
    setupOnClick();
    const url = new URL(window.location.href);
    const urlParams = url.searchParams;
    const authPort = urlParams.get("auth_port");
    if (authPort !== null) {
        // Remove the token param from the URL
        urlParams.delete("auth_port");
        const newQuery = urlParams.toString();
        url.search = newQuery;
        window.history.replaceState({}, "", url);
        loginFlow(Number.parseInt(authPort));
    }
}
document.addEventListener("DOMContentLoaded", main, false);
