import { CONFIG } from "./settings.js";
export const STEVE = "/assets/steve.png";
export let ROOM_CONFIG = undefined;
export function set_room_config(rc) {
    ROOM_CONFIG = rc;
}
export let IS_PLAYER = false;
export let PLAYER_SET = new Set();
export function set_draft_info(rc) {
    for (const p of rc.players) {
        if (p === UUID) {
            console.log("-> Set draft info: We are a player");
            IS_PLAYER = true;
        }
        PLAYER_SET.add(p);
    }
    // why is this code here?
    // screw you. that's why.
    // this is a joke :) haha
    if (rc.players.length > 1 || document.getElementById("end-draft-button") != undefined) {
        return;
    }
    const h = document.getElementById("draft-page-header-container");
    let button = document.createElement("button");
    button.classList.add("standard-ui");
    button.id = "end-draft-button";
    button.innerText = "finish draafting";
    h.appendChild(button);
}
const MAP = {};
export function keyToLabel(label) {
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
export function stored_token() {
    return localStorage.getItem("draaft.token");
}
export function set_token(token) {
    return localStorage.setItem("draaft.token", token);
}
export let IS_ADMIN = false;
export function set_admin(b) {
    IS_ADMIN = b;
}
export let UUID;
export function set_uuid(s) {
    UUID = s;
}
export let onlogin = new Array();
let AUDIO_CACHE = new Map();
export function play_audio(k) {
    if (CONFIG.disable_audio.get() === true)
        return;
    console.log(`Playing audio: ${k}`);
    AUDIO_CACHE.get(k).currentTime = 0;
    AUDIO_CACHE.get(k).play();
}
export function cache_audio(k, uri) {
    AUDIO_CACHE.set(k, new Audio(uri));
    return AUDIO_CACHE.get(k);
}
var UPDATING_TEXT_MAP = new Map();
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
export function reloadNotification(text) {
    console.log(`Creating a full page notification with text: ${text}`);
    const no = document.createElement("dialog");
    no.classList.add("notify-require-interact", "basic-modal-dialog");
    const pr = document.createElement("p");
    pr.innerText = text;
    pr.classList.add("notify-require-interact-text");
    const fm = document.createElement("form");
    fm.method = "dialog";
    const bu = document.createElement("button");
    bu.autofocus = true;
    bu.classList.add("confirm-button", "notify-require-interact-button");
    bu.value = "confirm";
    // haha
    const bp = document.createElement("p");
    bp.classList.add("button-inline-text", "button-inline");
    bp.innerText = "click to reload";
    const bucket = document.createElement("img");
    bucket.classList.add("button-inline-image", "button-inline");
    bucket.src = "/assets/draaft/picks/bucket.png";
    bu.appendChild(bp);
    bu.appendChild(bucket);
    fm.appendChild(bu);
    no.appendChild(pr);
    no.appendChild(fm);
    bu.addEventListener("click", _ => {
        window.location.reload();
        // no.close();
        // document.body.removeChild(no);
    });
    document.body.appendChild(no);
    no.showModal();
}
export function fullPageNotification(text, buttontext, callback, cancelable = false) {
    console.log(`Creating a full page notification with text: ${text}`);
    const no = document.createElement("dialog");
    no.classList.add("notify-require-interact", "basic-modal-dialog");
    const pr = document.createElement("p");
    pr.innerText = text;
    pr.classList.add("notify-require-interact-text");
    const fm = document.createElement("form");
    fm.method = "dialog";
    const bu = document.createElement("button");
    bu.autofocus = true;
    bu.classList.add("confirm-button", "notify-require-interact-button");
    bu.value = "confirm";
    bu.innerText = buttontext;
    fm.appendChild(bu);
    no.appendChild(pr);
    no.appendChild(fm);
    if (cancelable) {
        const cn = document.createElement("button");
        cn.autofocus = false;
        cn.classList.add("cancel-button", "notify-require-interact-button");
        cn.value = "cancel";
        cn.innerText = "cancel";
        fm.appendChild(cn);
        cn.addEventListener("click", _ => {
            no.close();
            document.body.removeChild(no);
        });
    }
    bu.addEventListener("click", _ => {
        callback();
        no.close();
        document.body.removeChild(no);
    });
    document.body.appendChild(no);
    no.showModal();
}
var USER_ANNOY_COUNT = 0;
export function annoy_user_lol() {
    const strings = [
        "hey. stop trying to do that.",
        "that's illegal. I'm calling the draaft police.",
        "yep officer, this one right here",
        "ok, you KNOW you're not supposed to click that.",
        "to whom it may concern... you can't do that.",
        "are you doing this to mess with me",
        "no matter how many times you click this. it will not work.",
        "hello weak non-admin user, you can't click that button.",
        "maybe if you click a few more times it'll work", // from rejid
        "you didn't click hard enough. try again?", // break their mouse haha. :)
        "this button only works if smart users click it, sorry",
        "please wait 5 minutes and try again", // me_nx
    ];
    const msg = (USER_ANNOY_COUNT == 0) ? "you cannot do that, you aren't the admin" : strings[Math.floor(Math.random() * strings.length)];
    const buts = [
        "my apologies",
        "sorry, eh",
        "i understand...",
        "oh, okay",
        "i will write an apology essay of no less than five hundred (500) words",
        "this is my fault. I shall atone by first-picking the enchanted bucket.",
        "it was just a misclick bro. don't be so serious all the time.",
        "i was trying to click the close browser button so I could play a better game (hades II)",
        "Supreme Overlord Folder it is with my sincerest regrets that I come to apologize for my grievous error of attempting to begin draafting. Please forgive me my lord.", // pacman
        "i am sending you my first born by carrier pigeon to atone for my sins", // pacman
    ];
    const but = (USER_ANNOY_COUNT == 0) ? "okay" : buts[Math.floor(Math.random() * buts.length)];
    fullPageNotification(msg, but, () => undefined);
    USER_ANNOY_COUNT += 1;
}
export function displayOnlyPage(id) {
    removeAllPages();
    document.getElementById(id).style.display = "flex";
    document.getElementById(id).classList.add("visible", "fade");
}
export function hideAllPages() {
    document.getElementById("login-page").classList.add("invisible");
    document.getElementById("menu-page").classList.add("invisible");
    document.getElementById("room-page").classList.add("invisible");
    document.getElementById("draft-page").classList.add("invisible");
}
export function removeAllPages() {
    document.getElementById("login-page").style.display = "none";
    document.getElementById("menu-page").style.display = "none";
    document.getElementById("room-page").style.display = "none";
    document.getElementById("draft-page").style.display = "none";
}
