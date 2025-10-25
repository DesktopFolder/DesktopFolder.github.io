import {Member} from "./draaft2/member.js";
import {WS_URI, API_URI, LOCAL_TESTING, apiRequest} from "./draaft2/request.js";
import {IS_ADMIN, UUID, UpdatingText, fullPageNotification, set_admin, set_token, set_uuid, stored_token, annoy_user_lol} from "./draaft2/util.js";

var API_WS: WebSocket | null = null;

/**
 * Adds listeners to an input element that turn it into a
 * password field when focused or when it has a non-empty value.
 *
 * This should hide the input text reasonably well without
 * letting the browser suggest password autocompletion.
 *
 * This function is an implementation by gyromaniac of a method described here: https://stackoverflow.com/a/63373880
 */
function setupLazySecret(element: HTMLInputElement) {
    console.assert(element.type === "text", "setupLazySecret is best used with input type text");

    // element.autocomplete = "off"; // Just for good measure.
    const originalType = element.type;
    const updateInputType = () => {
        if (element.value === "") {
            element.type = originalType;
        } else {
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
            ROOM_MEMBERS.push(
                new Member(d.uuid)
                    .addDiv(document.getElementById("room-page-header"), true)
                    .addManagementDiv(document.getElementById("player-gutter"), false)
            );
            break;
        case "kick":
        case "leave":
            if (d.uuid === UUID) {
                console.log("Looks like we are leaving. Bye!");
                fullPageNotification("You have been removed from the lobby 😭", "Click to reload 🪣", () => window.location.reload());
            }
            else {
                // Delete the member.
                visitUuid(d.uuid, (m: Member) => {
                    m.destroy();
                });
                ROOM_MEMBERS = ROOM_MEMBERS.filter(m => m.uuid != d.uuid);
            }
            break;
        case "spectate":
            visitUuid(d.uuid, (m: Member) => m.setIsPlayer(false));
            break;
        case "player":
            visitUuid(d.uuid, (m: Member) => m.setIsPlayer(true));
            break;
        default:
            console.error(`Unhandled player event: ${d.action}`);
    }
}

/* WebSocket Testing */
export function connect(token: string) {
    if (API_WS == null || API_WS == undefined) {
        API_WS = new WebSocket(`${WS_URI}/listen?token=${token}`);
        API_WS.onerror = function (event) {
            console.warn("WebSocket errored. Must reconnect.");
            API_WS = null;
        };
        API_WS.onopen = function (event) {
            console.log("Successfully connected websocket.");
        };
        API_WS.onmessage = function (event) {
            // websocket time!
            const d = JSON.parse(event.data);
            console.log(d);

            switch (d.variant) {
                case "playerupdate":
                    handlePlayerupdate(d);
                    break;
                default:
                    console.error(`Unhandled event type ${d.variant}`);
                    break;
            }
        };
    } else {
        console.warn(`Tried to connect() twice... (websocket: ${API_WS})`);
    }
}
export function sendMessage(message: string) {
    if (API_WS != null) {
        API_WS.send(message);
    } else {
        console.warn("Tried to sendMessage() without websocket...");
    }
}
if (LOCAL_TESTING) {
    (window as any).test_connect = connect;
    (window as any).test_message = sendMessage;
}

function showMenu(auth: string) {
    // Basic setup.
    setMenuClickers();
    // Show just our page.
    displayOnlyPage("menu-page");
}

function displayOnlyPage(id: string) {
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

function loginSuccess(auth: string) {
    // Animation, lol.
    // First, start to fade out the page.
    hideAllPages();
    // Then, add a timeout to show our menu page.
    const menuShowTimeout = window.setTimeout(() => showMenu(auth), 500);

    // Don't forget to save the token, I guess.
    set_token(auth);

    // Then, "race the beam" to get the user information.
    fetch(`${API_URI}/user`, {
        headers: {
            token: auth
        }
    })
        .then(resp => resp.json())
        .then(async json => {
            set_uuid(json.uuid);
            // Quickly check to see if we should move to a room page.
            if (json.room_code != null) {
                console.log("Rejoining room after successful login...");
                console.log(json);
                menuJoinRoom(json.room_code);
                window.clearTimeout(menuShowTimeout);
            } else {
                document.getElementById("menu-welcome-text").innerText = `welcome, ${json.username.toLowerCase()}`;
            }
        })
        .catch(error => {
            console.error("Error getting user data: ", error);
        });
}

async function testAuthToken(auth: string) {
    const interval = new UpdatingText("login-response-text", "contacting drAAft server..", 25, false);
    await fetch(`${API_URI}/authenticated`, {
        headers: {
            token: auth
        }
    })
        .then(resp => resp.text())
        .then(async text => {
            console.log(`Authentication Result: ${text}`);

            interval.cancel();
            if (text != "true") {
                new UpdatingText("login-response-text", "login token was incorrect, try logging in again", 20, true);
            } else {
                loginSuccess(auth);
            }
        })
        .catch(error => {
            interval.cancel();
            new UpdatingText("login-response-text", "error encountered with login, try logging in again", 20, true);
            console.error("Authentication Error: ", error);
        });
}

async function loginFlow(port: number) {
    console.log("Attempting login...");

    const response = await fetch(`http://localhost:${port}/`);

    console.assert(response.status == 200);

    const json = await response.json();

    console.assert(json.token !== undefined);

    return await testAuthToken(json.token);
}

function showRoom(code: string) {
    displayOnlyPage("room-page");
    console.log("- Showing created room");
    // document.getElementById("quick-remove").innerText = code;
    document.getElementById("home-button").style.display = "none";
}

let ROOM_MEMBERS: Array<Member> = [];
function visitUuid(uuid: string, callback: (arg0: Member) => void) {
    for (const m of ROOM_MEMBERS) {
        if (m.uuid === uuid) {
            callback(m);
        }
    }
}
function setupRoomPage(code: string, members) {
    // First, fade out all pages.
    hideAllPages();

    connect(stored_token());

    // Set a timeout to do our stuff.
    window.setTimeout(() => showRoom(code), 500);

    // In the meantime, as usual, get additional room metadata.
    apiRequest(`room`, undefined, "GET")
        .then(resp => resp.json())
        .then(async json => {
            // document.getElementById("room-welcome-text").innerText = `welcome, ${json.members.length}`;
        })
        .catch(error => {
            console.error("Error getting room data: ", error);
        });

    // Also fill in the members stuff, which we actually got from the initial request now
    for (const m of members) {
        ROOM_MEMBERS.push(
            new Member(m)
                .addDiv(document.getElementById("room-page-header"), true)
                .addManagementDiv(document.getElementById("player-gutter"), false)
        );
    }

    document.getElementById("room-copy-link").onclick = _ => navigator.clipboard.writeText(code);
}

function menuJoinRoom(rid?: string) {
    new UpdatingText("menu-create-room", "joining room..", 15, false, "create a room");
    if (rid == undefined) {
        rid = (<HTMLInputElement>document.getElementById("menu-input-roomid")).value;
    }
    console.log(`Joining room: ${rid}`);
    apiRequest(`room/join`, JSON.stringify({code: rid}), "POST")
        .then(resp => resp.json())
        .then(async json => {
            console.log(`Join room command returned JSON: ${json}`);
            if (json.code === undefined) {
                console.error(`Error: Bad data returned from API.`);
                fullPageNotification("error: bad API interaction", "click to reload 🪣", () => window.location.reload());
            } else {
                if (json.state == "rejoined_as_admin") {
                    set_admin(true);
                }
                setupRoomPage(json.code, json.members);
            }
        })
        .catch(async (e) => {
            console.error(`Got error rejoining room. Attempting to reload. Error: ${e}`);
            fullPageNotification("error: bad API interaction", "click to reload 🪣", () => window.location.reload());
        });
}

function menuCreateRoom() {
    new UpdatingText("menu-create-room", "creating room..", 15, false, "create a room");
    apiRequest(`room/create`, undefined, "GET")
        .then(resp => resp.json())
        .then(async json => {
            set_admin(true);
            setupRoomPage(json.code, json.members);
        });
}

function setMenuClickers() {
    document.getElementById("menu-roomid-join").addEventListener("click", () => menuJoinRoom());
    document.getElementById("menu-create-room").addEventListener("click", () => menuCreateRoom());
}

function startDrafting() {
    console.log("It's drafting time, yo!");
}

function setupOnClick() {
    // One-time on-click setups.

    // Room setup menu.
    for (const cb of document.getElementsByClassName("confirm-leave")) {
        cb.addEventListener("close", e => {
            const d = <HTMLDialogElement>e.target;
            console.log(`Closed confirm-leave box with return: ${d.returnValue}`);
            if (d.returnValue == "confirm") {
                apiRequest(`room/leave`, undefined, "POST").finally(() => window.location.reload());
            }
        });
    }

    (<HTMLButtonElement>document.getElementById("room-start")).addEventListener("click", _ => {
        if (!IS_ADMIN) {
            annoy_user_lol();
        }
        else {
            fullPageNotification("are you sure you want to start draafting?", "🪣🪣🪣 yes 🪣🪣🪣", startDrafting, true);
        }
    });
}

function main() {
    console.log("Launching drAAft 2 web client...");

    if (LOCAL_TESTING) {
        addEventListener("keyup", event => {
            if (event.key == "o") {
                console.log("Let's add Feinberg...");
                apiRequest("dev/adduser");
            }
            else if (event.key == "k") {
                console.log("Kicking myself when I'm down...");
                apiRequest(`dev/kickself`);
            }
        });
    }

    const storageToken: string = localStorage.getItem("draaft.token");
    if (storageToken != null) {
        testAuthToken(storageToken);
    }

    document.getElementById("login-page").classList.add("visible");

    setupLazySecret(<HTMLInputElement>document.getElementById("menu-input-roomid"));
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
