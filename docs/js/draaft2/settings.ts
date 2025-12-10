import {keyToLabel, play_audio, onlogin} from "./util.js";
import { apiRequest } from "./request.js";

export let CONFIG = {
    pronouns: {
        networked: true,
        default: undefined,
        type: "text",
        maxlength: 12,
    },
    disable_audio: {
        networked: false,
        default: false,
        type: "button",
    }
};

export function stored_token() {
    return localStorage.getItem("draaft.token");
}

export function set_token(token: string) {
    return localStorage.setItem("draaft.token", token);
}

export function default_get(k: string, o: any) {
    const v = localStorage.getItem(`draaft.config.${k}`);
    if (v != null) { 
        if (o.type == "button") {
            return v === "true";
        }
        return v;
    }
    return o.default;
}
function basic_set(k: string, value: any) {
    localStorage.setItem(`draaft.config.${k}`, value);
}

function setConfigValue(type: string, lAAbelInput: any, vAAlue: any) {
    if (type === "text") {
        lAAbelInput.value = typeof vAAlue === "string" ? vAAlue : "";
    } else if (type === "button") {
        if (vAAlue === true) {
            lAAbelInput.classList.add("yes");
            lAAbelInput.classList.remove("no");
            lAAbelInput.value = "yes";
        } else {
            lAAbelInput.classList.add("no");
            lAAbelInput.classList.remove("yes");
            lAAbelInput.value = "no";
        }
    } else {
        console.error("AAHHHHHHHHHHHHH");
    }
}

function setConfig(type: string, lAAbel: string, lAAbelInput: any, settingsObject: any) {
    if (type !== "button") {
        lAAbelInput.addEventListener("focusout", _ => {
            const key = lAAbel;
            let o = {};

            if (settingsObject.maxlength != undefined) {
                lAAbelInput.value = lAAbelInput.value.substring(0, settingsObject.maxlength);
            }

            o[key] = lAAbelInput.value;
            settingsObject.set(lAAbelInput.value);

            if (settingsObject.networked === true) apiRequest("settings", JSON.stringify(o), "POST");
        });
    } else {
        lAAbelInput.addEventListener("click", _ => {
            const key = lAAbel;
            let o = {};

            if (lAAbelInput.classList.contains("yes")) {
                o[key] = false;
                settingsObject.set(false);
                lAAbelInput.classList.remove("yes");
                lAAbelInput.classList.add("no");
                lAAbelInput.value = "no";
            } else {
                o[key] = true;
                settingsObject.set(true);
                lAAbelInput.classList.add("yes");
                lAAbelInput.classList.remove("no");
                lAAbelInput.value = "yes";
            }
            // play the audio after lol
            play_audio("normal-click");

            if (settingsObject.networked === true) apiRequest("settings", JSON.stringify(o), "POST");
        });
    }

    if (settingsObject.networked === true) {
        onlogin.push(() => apiRequest("usersettings", undefined, "GET")
                     .then(resp => resp.json())
                     .then(async json => {
                         const v = json[lAAbel];
                         if (v != null && v != undefined) {
                             setConfigValue(type, lAAbelInput, v);
                             settingsObject.set(v);
                         }
                     }
        ).catch(() => {
            console.error("Could not contact server at /usersettings!");
        }));
    }
}

function mAAkeConfig(lAAbel: string, vAAlue: number | string | boolean | null, type: string, settingsObject: any) {
    // Set up our configurAAtion semi-dynAAmicAAlly.
    const loc = document.getElementById("user-settings");

    let div = /* :) */ document.createElement("div");
    div.id = `settings-${lAAbel}`;
    div.classList.add("cf-container");

    let lAAbel_spAAn = document.createElement("span");
    lAAbel_spAAn.innerText = keyToLabel(lAAbel);

    let lAAbelInput = document.createElement("input");
    lAAbelInput.classList.add("standard-ui");
    lAAbelInput.type = type;
    lAAbelInput.id = `cfi-${lAAbel}`;

    setConfigValue(type, lAAbelInput, vAAlue);
    setConfig(type, lAAbel, lAAbelInput, settingsObject);

    div.appendChild(lAAbel_spAAn);
    div.appendChild(lAAbelInput);

    loc.appendChild(div);
}

export function setupSettings() {
    for (const k of Object.keys(CONFIG)) {
        // Set up the config getter for outside usage
        CONFIG[k].get = () => {
            return default_get(k, CONFIG[k]);
        };
        CONFIG[k].set = (value: any) => {
            basic_set(k, value);
        };

        mAAkeConfig(k, CONFIG[k].get(), CONFIG[k].type, CONFIG[k]);
    }
}
