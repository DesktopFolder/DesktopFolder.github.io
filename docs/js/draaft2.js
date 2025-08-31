var UPDATING_TEXT_MAP = new Map();
export class UpdatingText {
    eleID;
    intervalID;
    textString;
    noAppend;
    timeoutValue;
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
        this.textString.innerHTML = "";
        window.clearInterval(this.intervalID);
        console.log(`Deleted interval ID: ${this.intervalID}`);
        UPDATING_TEXT_MAP.delete(this.eleID);
    }
    constructor(id, text, timeout, noAppend = true) {
        this.noAppend = noAppend;
        this.timeoutValue = timeout;
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
    console.log("Showing menu page...");
    document.getElementById("login-page").style.display = "none";
    document.getElementById("menu-page").classList.add("visible");
}
function loginSuccess(auth) {
    // Animation, lol.
    // First, start to fade out the page.
    document.getElementById("login-page").classList.add("invisible");
    // Then, add a timeout to show our menu page.
    window.setTimeout(() => showMenu(auth), 500);
    // Then, "race the beam" to get the user information.
    fetch("http://localhost:8000/user", {
        headers: {
            token: auth,
        },
    })
        .then((resp) => resp.json())
        .then(async (json) => {
        document.getElementById("menu-welcome-text").innerText = `welcome, ${json.username}`;
    })
        .catch((error) => {
        console.error("Error getting user data: ", error);
    });
}
async function testAuthToken(auth) {
    const interval = new UpdatingText("login-response-text", "contacting drAAft server..", 25, false);
    fetch("http://localhost:8000/authenticated", {
        headers: {
            token: auth,
        },
    })
        .then((resp) => resp.text())
        .then(async (text) => {
        console.log(`Authentication Result: ${text}`);
        interval.cancel();
        if (text != "true") {
            new UpdatingText("login-response-text", "incorrect login token, try copying again", 20, true);
        }
        else {
            loginSuccess(auth);
        }
    })
        .catch((error) => {
        interval.cancel();
        new UpdatingText("login-response-text", "error encountered with login, try copying again", 20, true);
        console.error("Authentication Error: ", error);
    });
}
async function loginFlow(token = null) {
    console.log("Attempting login...");
    const interval = new UpdatingText("login-response-text", "waiting for paste..", 25, false);
    const auth = token ? token : await navigator.clipboard.readText();
    interval.cancel();
    return await testAuthToken(auth);
}
function main() {
    console.log("Launching drAAft 2 web client...");
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    const token = urlParams.get("token");
    if (token != null) {
        // Remove the token param from the URL
        urlParams.delete("token");
        const newQuery = urlParams.toString();
        const newUrl = window.location.pathname +
            (newQuery ? "?" + newQuery : "") +
            window.location.hash;
        window.history.replaceState({}, document.title, newUrl);
        loginFlow(token);
    }
    else {
        document
            .getElementById("login-button")
            .addEventListener("click", () => loginFlow());
        document.getElementById("login-page").classList.add("visible");
    }
}
document.addEventListener("DOMContentLoaded", main, false);
