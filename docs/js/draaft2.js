import { Member } from "./draaft2/member.js";
import { WS_URI, API_URI, LOCAL_TESTING, apiRequest, resolveUrl, externalAPIRequest } from "./draaft2/request.js";
import { setupSettings } from "./draaft2/settings.js";
import { setupLeaderboard } from "./draaft2/leaderboard.js";
import { IS_ADMIN, UUID, set_room_config, set_draft_info, UpdatingText, fullPageNotification, reloadNotification, set_admin, set_token, set_uuid, stored_token, annoy_user_lol, displayOnlyPage, hideAllPages, cache_audio, play_audio, PLAYER_SET, onlogin, setCachedValue } from "./draaft2/util.js";
import { fetchData, startDrafting, handleDraftpick, downloadZip, downloadWorldgen, draft_disconnect_player, fetchPublicData, stop_drafting } from "./draaft2/draft.js";
import { addRoomConfig, configureRoom } from "./draaft2/room.js";
var API_WS = null;
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
function handlePlayerupdate(d) {
    switch (d.action) {
        case "joined":
            const uuid = d.uuid;
            for (const m of ROOM_MEMBERS) {
                if (m.uuid == uuid) {
                    // ignore the same uuid we already have.
                    return;
                }
            }
            ROOM_MEMBERS.push(new Member(d.uuid)
                .addDiv(document.getElementById("room-page-header"), true)
                .addManagementDiv(document.getElementById("player-gutter"), false));
            break;
        case "kick":
        case "leave":
            if (d.uuid === UUID) {
                console.log("Looks like we are leaving. Bye!");
                reloadNotification("You have been removed from the lobby 😭");
            }
            else {
                // Delete the member.
                visitUuid(d.uuid, (m) => {
                    m.destroy();
                });
                ROOM_MEMBERS = ROOM_MEMBERS.filter(m => m.uuid != d.uuid);
                if (PLAYER_SET.has(d.uuid)) {
                    draft_disconnect_player(d.uuid);
                }
            }
            break;
        case "spectate":
            visitUuid(d.uuid, (m) => m.setIsPlayer(false));
            break;
        case "player":
            visitUuid(d.uuid, (m) => m.setIsPlayer(true));
            break;
        default:
            console.error(`Unhandled player event: ${d.action}`);
    }
}
function handleRoomupdate(d) {
    switch (d.update) {
        case "commenced":
            set_room_config(d.config);
            startDrafting();
            break;
        case "config":
            configureRoom(d.config);
            break;
        case "closed":
            reloadNotification("this room has been deleted");
            break;
        case "loading_complete":
            // displayIngame();
            break;
        case "draft_complete":
            stop_drafting();
            break;
        default:
            console.error(`Unhandled room event: ${d.update}`);
    }
}
export function connect(token) {
    console.log(`Connecting to websocket at ${WS_URI}`);
    if (API_WS == null || API_WS == undefined) {
        API_WS = new WebSocket(new URL(`listen?token=${token}`, WS_URI));
        API_WS.onerror = function (event) {
            console.warn("WebSocket errored. Must reconnect.");
            API_WS = null;
        };
        API_WS.onopen = function (event) {
            console.log("Important: Successfully connected websocket.");
        };
        API_WS.onmessage = function (event) {
            // websocket time!
            const d = JSON.parse(event.data);
            console.log(d);
            switch (d.variant) {
                case "playerupdate":
                    handlePlayerupdate(d);
                    break;
                case "roomupdate":
                    handleRoomupdate(d);
                    break;
                case "draftpick":
                    handleDraftpick(d);
                    break;
                default:
                    console.error(`Unhandled event type ${d.variant}`);
                    break;
            }
        };
    }
    else {
        console.warn(`Tried to connect() twice... (websocket: ${API_WS})`);
    }
}
export function finishSomeonesRun(room_id) {
    apiRequest(`/admin/register_completion/${room_id}`, undefined, "POST");
}
export function sendMessage(message) {
    if (API_WS != null) {
        API_WS.send(message);
    }
    else {
        console.warn("Tried to sendMessage() without websocket...");
    }
}
export function generateServiceAccount() {
    apiRequest('/service_account', undefined, "GET");
}
if (LOCAL_TESTING) {
    window.test_connect = connect;
    window.test_message = sendMessage;
    window.download_zip = downloadZip;
    window.download_wgo = downloadWorldgen;
}
window.admin_finish_run = finishSomeonesRun;
window.debugDownloadWorldGenSettings = downloadWorldgen;
window.generateServiceAccount = generateServiceAccount;
function showMenu(auth) {
    // Show just our page.
    displayOnlyPage("menu-page");
}
function loginSuccess(auth) {
    // Animation, lol.
    // First, start to fade out the page.
    hideAllPages();
    // Don't forget to save the token, I guess.
    // SAVE IT BEFORE CALLING THE ONLOGIN CALLBACKS? HELLO?
    set_token(auth);
    // fire all our onlogin callbacks
    for (const p of onlogin) {
        p();
    }
    // Then, add a timeout to show our menu page.
    const menuShowTimeout = window.setTimeout(() => showMenu(auth), 500);
    // Then, "race the beam" to get the user information.
    fetch(resolveUrl(API_URI, "/user"), {
        headers: {
            token: auth
        }
    })
        .then(resp => resp.json())
        .then(async (json) => {
        set_uuid(json.uuid);
        // Quickly check to see if we should move to a room page.
        if (json.room_code != null) {
            console.log("Rejoining room after successful login...");
            console.log(json);
            menuJoinRoom(json.room_code);
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
    await fetch(resolveUrl(API_URI, "/authenticated"), {
        headers: {
            token: auth
        }
    })
        .then(resp => resp.text())
        .then(async (text) => {
        console.log(`Authentication Result: ${text}`);
        interval.cancel();
        if (text != "true") {
            new UpdatingText("login-response-text", "login expired, please log in again", 20, true);
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
    try {
        const json = await response.json();
        console.assert(json.token !== undefined);
        return await testAuthToken(json.token);
    }
    catch {
        console.log(`Bad response from local fetch: ${response.body}`);
    }
}
async function otpLoginFlow(otp) {
    console.log("Attempting OTP login...");
    const resp = await externalAPIRequest(`otplogin?otp=${otp}`);
    console.assert(resp.status == 200);
    const token = (await resp.text()).trim();
    return await testAuthToken(token);
}
function showRoom(code) {
    displayOnlyPage("room-page");
    console.log("- Showing created room");
    // document.getElementById("quick-remove").innerText = code;
    document.getElementById("home-button").style.display = "none";
}
let ROOM_MEMBERS = [];
function visitUuid(uuid, callback) {
    for (const m of ROOM_MEMBERS) {
        if (m.uuid === uuid) {
            callback(m);
        }
    }
}
function setupRoomPage(code, members) {
    // First, fade out all pages.
    hideAllPages();
    connect(stored_token());
    // Set a timeout to do our stuff.
    window.setTimeout(() => showRoom(code), 500);
    // In the meantime, as usual, get additional room metadata.
    apiRequest(`room`, undefined, "GET")
        .then(resp => resp.json())
        .then(async (json) => {
        // document.getElementById("room-welcome-text").innerText = `welcome, ${json.members.length}`;
        addRoomConfig(json);
    })
        .catch(error => {
        console.error("Error getting room data: ", error);
    });
    // Also fill in the members stuff, which we actually got from the initial request now
    for (const m of members) {
        ROOM_MEMBERS.push(new Member(m)
            .addDiv(document.getElementById("room-page-header"), true)
            .addManagementDiv(document.getElementById("player-gutter"), false));
    }
    const copybutton = document.getElementById("room-copy-link");
    copybutton.onclick = _ => {
        play_audio("normal-click");
        navigator.clipboard.writeText(code);
        copybutton.innerText = "copied";
        setTimeout(() => (copybutton.innerText = "copy code"), 3000);
    };
}
function menuJoinRoom(rid) {
    new UpdatingText("menu-create-room", "joining room..", 15, false, "create a room");
    if (rid == undefined) {
        rid = document.getElementById("menu-input-roomid").value;
    }
    console.log(`Joining room: ${rid}`);
    apiRequest(`room/join`, JSON.stringify({ code: rid }), "POST")
        .then(resp => resp.json())
        .then(async (json) => {
        console.log(`Join room command returned JSON: ${JSON.stringify(json)}`);
        if (json.drafting === true || json.playing === true) {
            console.log("Join room command returned that we are drafting. Fetching draft...");
            if (UUID == undefined) {
                console.error("No UUID when checking for admin status");
            }
            else if (UUID == json.room.admin) {
                console.log("Setting that we are the room admin.");
                set_admin(true);
            }
            set_room_config(json.room.config);
            set_draft_info(json.room.draft);
            connect(stored_token());
            startDrafting();
        }
        else if (json.code === undefined) {
            console.error(`Error: Bad data returned from API.`);
            reloadNotification("error: bad API interaction");
        }
        else {
            if (json.state == "rejoined_as_admin") {
                set_admin(true);
            }
            setupRoomPage(json.code, json.members);
        }
    })
        .catch(async (e) => {
        console.error(`Got error rejoining room. Attempting to reload. Error: ${e}`);
        reloadNotification("error: bad API interaction");
    });
}
function menuCreateRoom() {
    new UpdatingText("menu-create-room", "creating room..", 15, false, "create a room");
    apiRequest(`room/create`, undefined, "GET")
        .then(resp => resp.json())
        .then(async (json) => {
        set_admin(true);
        setupRoomPage(json.code, json.members);
    });
}
function setupOnClick() {
    // One-time on-click setups.
    // Main logged in menu.
    document.getElementById("menu-roomid-join").addEventListener("click", () => menuJoinRoom());
    document.getElementById("menu-create-room").addEventListener("click", () => menuCreateRoom());
    // Room setup menu.
    for (const cb of document.getElementsByClassName("confirm-leave")) {
        cb.addEventListener("close", e => {
            const d = e.target;
            console.log(`Closed confirm-leave box with return: ${d.returnValue}`);
            if (d.returnValue == "confirm") {
                apiRequest(`room/leave`, undefined, "POST").finally(() => window.location.reload());
            }
        });
    }
    for (const cb of document.getElementsByClassName("settings-button")) {
        console.log(`Setting up callback for id: ${cb.id}`);
        if (cb instanceof HTMLButtonElement) {
            cb.onclick = () => {
                play_audio("normal-click");
                document.getElementById("user-settings-dialog").showModal();
            };
        }
        else {
            console.warn(`${cb.id} is not a button!`);
        }
    }
    for (const cb of document.getElementsByClassName("ingame-exit-button")) {
        console.log(`Setting up callback for id: ${cb.id}`);
        if (cb instanceof HTMLButtonElement) {
            cb.onclick = () => {
                console.log(`Attempted to leave the room.`);
                play_audio("normal-click");
                if (IS_ADMIN) {
                    document.getElementById("confirm-room-destroy-admin").showModal();
                }
                else {
                    document.getElementById("confirm-room-destroy-user").showModal();
                }
            };
        }
        else {
            console.warn(`${cb.id} is not a button!`);
        }
    }
    document.getElementById("room-start").addEventListener("click", _ => {
        play_audio("normal-click");
        if (!IS_ADMIN) {
            annoy_user_lol();
        }
        else {
            fullPageNotification("are you sure you want to start draafting?", "🪣🪣🪣 yes 🪣🪣🪣", () => {
                play_audio("normal-click");
                apiRequest(`room/commence`, undefined, "POST");
            }, true);
        }
    });
}
function main() {
    console.log("Launching drAAft 2 web client...");
    // non-blocking, probably :)
    // we can't do this until we're logged in lol
    onlogin.push(() => {
        return fetchData();
    });
    onlogin.push(() => {
        return apiRequest(`checkoq`, undefined, "GET")
            .then(resp => resp.json())
            .then(async (json) => {
            if (json.finished_oq === true) {
                // we're done, the server says
                setCachedValue("oq-finished", true);
            }
            setCachedValue("oq-attempts", json.oq_attempts);
            setCachedValue("max-oq-attempts", json.max_oq_attempts);
        })
            .catch(() => console.log("checkoq doesn't work yet."));
    });
    // also adds onlogin things
    setupSettings();
    fetchPublicData();
    if (LOCAL_TESTING) {
        console.log(`Local testing enabled. Backend URI: ${API_URI}`);
        addEventListener("keyup", event => {
            // don't do random stuff if we are in a ui element
            if (document.activeElement instanceof HTMLInputElement) {
                const ae = document.activeElement;
                if (ae.classList.contains("standard-ui"))
                    return;
            }
            if (event.key == "o") {
                console.log("Let's add Feinberg...");
                apiRequest("dev/adduser");
            }
            else if (event.key == "k") {
                console.log("Kicking myself when I'm down...");
                apiRequest(`dev/kickself`);
            }
            else if (event.key == "p") {
                console.log("Becoming a user?!");
                fetch(resolveUrl(API_URI, `dev/becomeuser`), {
                    method: "POST"
                })
                    .then(resp => resp.json())
                    .then(async (json) => {
                    set_token(json.token);
                });
            }
        });
    }
    addEventListener("keyup", event => {
        if (event.key == "s") {
            if (document.activeElement instanceof HTMLInputElement) {
                const ae = document.activeElement;
                if (ae.classList.contains("standard-ui") && !(ae instanceof HTMLButtonElement || (ae instanceof HTMLInputElement && ae.type == "button")))
                    return;
            }
            const hde = document.getElementById("user-settings-dialog");
            if (hde.open) {
                hde.close();
            }
            else {
                hde.showModal();
            }
        }
        else if (event.key == "l") {
            if (document.activeElement instanceof HTMLInputElement) {
                const ae = document.activeElement;
                if (ae.classList.contains("standard-ui") && !(ae instanceof HTMLButtonElement || (ae instanceof HTMLInputElement && ae.type == "button")))
                    return;
            }
            const hde = document.getElementById("leaderboard-oq1-dialog");
            if (hde.open) {
                hde.close();
            }
            else {
                hde.showModal();
            }
        }
        else if (event.key == "Escape") {
            const docDialog = document.getElementById("documentation-dialog");
            if (docDialog.open) {
                docDialog.close();
            }
        }
    });
    for (const e of document.getElementsByClassName("learn-to-play")) {
        e.onclick = () => { document.getElementById("documentation-dialog").showModal(); };
    }
    // set up the leaderboard for oq1
    setupLeaderboard();
    let loadingCredits = document.getElementById("loading-credits");
    let creditsCredits = loadingCredits.cloneNode(true);
    document.body.appendChild(creditsCredits);
    creditsCredits.id = "credits-credits";
    creditsCredits.closedBy = "any";
    let creditsTitle = creditsCredits.querySelector(".credits-title");
    creditsTitle.innerText = "Credits";
    let openCredits = () => {
        let credits = document.getElementById("credits-credits");
        credits.show();
    };
    for (const e of document.getElementsByClassName("credits-opener")) {
        e.onclick = () => {
            openCredits();
        };
    }
    const url = new URL(window.location.href);
    const urlParams = url.searchParams;
    const authPort = urlParams.get("auth_port");
    const otp = urlParams.get("otp");
    if (otp != null) {
        urlParams.delete("otp");
        const newQuery = urlParams.toString();
        url.search = newQuery;
        window.history.replaceState({}, "", url);
        // get the token!
        otpLoginFlow(otp);
    }
    else if (authPort !== null) {
        // Remove the token param from the URL
        urlParams.delete("auth_port");
        const newQuery = urlParams.toString();
        url.search = newQuery;
        window.history.replaceState({}, "", url);
        // TODO. should we return here? no, right?
        // but then why do we test auth token twice?
        loginFlow(Number.parseInt(authPort));
    }
    const lb = urlParams.get("leaderboard");
    if (lb != null) {
        const hde = document.getElementById("leaderboard-oq1-dialog");
        if (!hde.open) {
            console.log("Auto-showing the leaderboard.");
            hde.showModal();
        }
    }
    const storageToken = localStorage.getItem("draaft.token");
    // Only do this if we aren't doing the login flow already.
    if (authPort === null && storageToken != null) {
        testAuthToken(storageToken);
    }
    document.getElementById("login-page").classList.add("visible");
    setupLazySecret(document.getElementById("menu-input-roomid"));
    setupOnClick();
    cache_audio("normal-click", "/assets/draaft/sounds/click_stereo.ogg").volume = 0.4;
    cache_audio("low-sound", "/assets/draaft/sounds/note_block.ogg").volume = 0.6;
    cache_audio("your-turn", "/assets/draaft/sounds/Successful_hit.ogg").volume = 0.5;
}
document.addEventListener("DOMContentLoaded", main, false);
