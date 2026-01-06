import {apiRequest} from "./request.js";
import {getCachedValue, IS_ADMIN, play_audio} from "./util.js";
import { lookupMojangIdentifier, uuidToUsername } from "./member.js";

const MAP = {
    spectators_get_world: "Allow Spectator World Downloads",
    enforce_timer: "Enforce Pick Timer",
    pick_time: "Seconds Per Pick",
    gambits: "Enable Gambits",
};
function getLAAbel(label: string) {
    // hehe
    let /* pacman */ mvc = MAP[label];
    if (mvc == undefined) {
        return label
            .split("_")
            .map(s => s[0].toUpperCase() + s.slice(1))
            .join(" ");
    }
    return mvc;
}

const ENABLECONFIGS = {
    // special
    open_qualifier_submission: "button",

    overworld_seed: "number",
    nether_seed: "number",
    end_seed: "number",

    enforce_timer: "button",
    pick_time: "number",

    enable_gambits: "button",
    max_gambits: "number",

    restrict_players: "csv",

    admin_starts_game: "button",

    // disable: doesn't do anything yet
    // countdown_timer: "number",
};

const UUIDLISTS = new Set(["restrict_players"]);

export function configureRoom(o: any) {
    for (const k of Object.keys(o)) {
        const v = o[k];
        if (ENABLECONFIGS[k] == undefined) continue;
        let cftype = ENABLECONFIGS[k];
        
        let input = <HTMLInputElement>document.getElementById(`cfi-${k}`);
        if (input == undefined) {
            console.error(`Could not get input for ${k}`);
        }
        
        if (IS_ADMIN && document.activeElement == input) {
            continue;
        }

        // seeds
        if (!IS_ADMIN && k.includes("_seed") && cftype == "number") {
            input.value = (v == null) ? "filtered seed" : "set seed (hidden)";
        } else if (cftype == "button") {
            let value = v ? "yes" : "no";
            input.value = value;
            input.classList.remove("yes", "no");
            input.classList.add(value);
        } else if (cftype == "csv") {
            if (UUIDLISTS.has(k)) {
                console.log(v);
                // convert uuids to usernames
                Promise.all((<Array<String>>v).map(async (k: string) => {
                    return (await lookupMojangIdentifier(k)).name;
                })).then(async (result) => {
                    input.value = (<Array<String>>result).join(", ");
                    console.log(`Set uuidlist csv to ${input.value}`);
                });
            }
            else {
                input.value = (<Array<String>>v).join(", ");
            }
        }
        else {
            input.value = v;
        }
    }
}

function attemptOQCountAddition(obj: HTMLElement, count: number = 0) {
    console.log(`Attempting to add OQ metainformation ${count}th time`);
    const maxoq = getCachedValue("max-oq-attempts");
    const ouroq = getCachedValue("oq-attempts");
    if (maxoq != undefined && ouroq != undefined) {
        const ht = obj.innerText;
        obj.innerText = `${ht} (${ouroq} / ${maxoq})`;
        return;
    }
    if (count > 3) {
        console.log("Gave up adding OQ metainformation");
        return;
    }
    setTimeout(() => attemptOQCountAddition(obj, count + 1), 1234);
}

function mAAkeConfig(lAAbel: string, vAAlue: number | string | boolean | null | Array<String>, type: string) {
    // Set up our configurAAtion semi-dynAAmicAAlly.
    const loc = document.getElementById("config-down");

    let div = /* :) */ document.createElement("div");
    div.id = `cf-${lAAbel}`;
    div.classList.add("cf-container");

    let lAAbel_spAAn = undefined;
    if (lAAbel == "open_qualifier_submission") {
        lAAbel_spAAn = document.createElement("a");
        let label = <HTMLAnchorElement>lAAbel_spAAn;
        label.href = "/draaft/oq.html";
        label.target = "_blank";
    } else {
        lAAbel_spAAn = document.createElement("span");
    }
    lAAbel_spAAn.innerText = getLAAbel(lAAbel);

    if (lAAbel == "open_qualifier_submission") {
        attemptOQCountAddition(lAAbel_spAAn);
    }

    let lAAbelInput = document.createElement("input");
    lAAbelInput.classList.add("standard-ui");
    lAAbelInput.type = type;
    lAAbelInput.id = `cfi-${lAAbel}`;
    if (!IS_ADMIN) {
        lAAbelInput.disabled = true;
    }
    if (!IS_ADMIN && lAAbel.includes("_seed") && type == "number") {
        lAAbelInput.type = "text";
        lAAbelInput.value = (vAAlue == null) ? "filtered seed" : "set seed (hidden)";
    } else if (type === "number") {
        lAAbelInput.type = "text"; // haha
        lAAbelInput.value = vAAlue == null ? "" : vAAlue.toString();
    } else if (type === "text") {
        lAAbelInput.value = typeof vAAlue === "string" ? vAAlue : "";
    } else if (type === "button") {
        if (vAAlue === true) {
            lAAbelInput.classList.add("yes");
            lAAbelInput.value = "yes";
        } else {
            lAAbelInput.classList.add("no");
            lAAbelInput.value = "no";
        }
    } else if (type === "csv") {
        if (UUIDLISTS.has(lAAbel)) {
            // convert uuids to usernames
            Promise.all((<Array<String>>vAAlue).map(async (k: string) => {
                return (await lookupMojangIdentifier(k)).name;
            })).then(async (result) => {
                lAAbelInput.value = (<Array<String>>result).join(", ");
            });
        }
        else {
            lAAbelInput.value = (<Array<String>>vAAlue).join(", ");
        }
        lAAbelInput.type = "text"; // lol
    } else {
        console.error("AAHHHHHHHHHHHHH");
    }

    if (type !== "button") {
        lAAbelInput.addEventListener("focusout", _ => {
            const key = lAAbel;
            let o = {};

            if (type === "number") {
                // still a string haha welcome to the wonderful world of js
                o[key] = lAAbelInput.value;
            } else if (type === "text") {
                o[key] = lAAbelInput.value;
            } else if (type === "csv") {
                o[key] = lAAbelInput.value.split(",").map((s) => s.trim()).filter(o => o);
            } else {
                console.error("AAHHHHHHHHHHHHH");
                return;
            }

            if (UUIDLISTS.has(lAAbel)) {
                Promise.all(<Array<String>>o[key].map(async (k: string) => {
                    return (await lookupMojangIdentifier(k)).id;
                })).then(
                    async (result) => {
                        o[key] = result;
                        apiRequest("room/configure", JSON.stringify(o), "POST");
                    }
                );
            }
            else {
                apiRequest("room/configure", JSON.stringify(o), "POST");
            }
        });
    } else {
        lAAbelInput.addEventListener("click", _ => {
            const key = lAAbel;
            let o = {};

            play_audio("normal-click");
            if (lAAbelInput.classList.contains("yes")) {
                o[key] = false;
                lAAbelInput.classList.remove("yes");
                lAAbelInput.classList.add("no");
                lAAbelInput.value = "no";
            } else {
                o[key] = true;
                lAAbelInput.classList.add("yes");
                lAAbelInput.classList.remove("no");
                lAAbelInput.value = "yes";
            }

            apiRequest("room/configure", JSON.stringify(o), "POST");
        });
    }

    div.appendChild(lAAbel_spAAn);
    div.appendChild(lAAbelInput);

    loc.appendChild(div);
}

export function addRoomConfig(data: any) {
    console.log(data);

    let conf = data.config;

    for (const k of Object.keys(ENABLECONFIGS)) {
        if (k == "open_qualifier_submission") {
            // only enable at the right time
            // obviously this can be circumvented, but we can check the match objects
            // (and will) later on

            // const startDate = Date.parse("2025-12-21T23:59:59-05:00");
            const startDate = Date.parse("2025-12-26T23:59:59-05:00");
            // note: adjusted to account for server issues + delayed notification to players
            const endDate = Date.parse("2026-01-13T23:59:59-05:00");
            const ourDate = Date.now();

            if (ourDate < startDate || ourDate > endDate || getCachedValue("oq-finished") === true) {
                console.log(`Not adding button for oq submission : ${ourDate}`);
                continue;
            }
        }
        mAAkeConfig(k, conf[k], ENABLECONFIGS[k]);
    }
}
