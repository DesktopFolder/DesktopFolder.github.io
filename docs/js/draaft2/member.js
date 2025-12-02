import { apiRequest } from "./request.js";
import { STEVE, IS_ADMIN, UUID, play_audio } from "./util.js";
const MOJANG_UUID_LOOKUP_URL = "https://api.ashcon.app/mojang/v2/user";
// const MOJANG_UUID_LOOKUP_URL = "https://api.minecraftservices.com/minecraft/profile/lookup";
let LOOKUP_CACHE = new Map();
let LOOKING_UP_CACHE = new Map();
export async function uuidToUsername(uuid) {
    if (!LOOKUP_CACHE.has(uuid)) {
        if (!LOOKING_UP_CACHE.has(uuid)) {
            LOOKING_UP_CACHE.set(uuid, fetch(`${MOJANG_UUID_LOOKUP_URL}/${uuid}`)
                .then(body => body.json())
                .then(async (json) => {
                LOOKUP_CACHE.set(uuid, json.username);
            }));
        }
        await LOOKING_UP_CACHE.get(uuid);
    }
    return LOOKUP_CACHE.get(uuid);
}
export class Member {
    uuid;
    username = null;
    isPlayer = true;
    managed = [];
    playerOnly = [];
    swapButton = undefined;
    constructor(uuid) {
        this.uuid = uuid;
    }
    destroy() {
        for (const m of this.managed) {
            m.style.display = "none";
        }
    }
    populateUsername(e) {
        if (this.username == null) {
            // Don't await it. :)
            uuidToUsername(this.uuid).then(name => {
                e.innerText = name;
                this.username = name;
            });
        }
        else {
            e.innerText = this.username;
        }
        return this;
    }
    addImage(e, playerOnly) {
        let i = document.createElement("img");
        i.classList.add("member-face");
        i.src = `https://mineskin.eu/helm/${this.uuid}/100`;
        i.onerror = () => (i.src = STEVE);
        e.appendChild(i);
        this.addElement(i, playerOnly);
        return this;
    }
    addParagraph(e, playerOnly, str = undefined) {
        let p = document.createElement("p");
        p.classList.add("room-member", "member-name");
        if (str != undefined) {
            p.innerText = str;
        }
        else {
            this.populateUsername(p);
        }
        e.appendChild(p);
        this.addElement(p, playerOnly);
        return this;
    }
    addDiv(e, playerOnly, str = undefined) {
        let div = document.createElement("div");
        div.classList.add("room-member-container");
        this.addImage(div, playerOnly);
        this.addParagraph(div, playerOnly, str);
        e.appendChild(div);
        this.addElement(div, playerOnly);
        return this;
    }
    setIsPlayer(value) {
        this.isPlayer = value;
        this.swapButton.innerText = this.isPlayer ? "make spectator" : "make player";
        console.log(`Updating ${this.playerOnly.length} objects to reflect isPlayer of ${this.isPlayer}`);
        for (const e of this.playerOnly) {
            if (this.isPlayer) {
                // FIX THIS LATER LOL!
                e.style.display = e.oldDisplay;
            }
            else {
                e.oldDisplay = e.style.display;
                e.style.display = "none";
            }
        }
    }
    addElement(e, playerOnly) {
        this.managed.push(e);
        if (playerOnly) {
            this.playerOnly.push(e);
        }
    }
    addManagementButtons(e, playerOnly) {
        let div = document.createElement("div");
        div.classList.add("room-member-manager-buttons");
        // It's us. So, we just have the "leave" button.
        // We should probably print ourselves first...
        if (UUID == this.uuid) {
            let button = document.createElement("button");
            button.classList.add("room-member-manager-button", "room-leave-button");
            button.onclick = (_) => {
                console.log(`Attempted to have player '${this.username}' leave.`);
                play_audio("normal-click");
                if (IS_ADMIN) {
                    document.getElementById("confirm-room-destroy-admin").showModal();
                }
                else {
                    document.getElementById("confirm-room-destroy-user").showModal();
                }
            };
            button.innerText = "leave";
            div.appendChild(button);
            this.addElement(button, playerOnly);
        }
        // If we are not an admin, no more to add.
        else if (!IS_ADMIN) {
            // Nothing :)
        }
        else {
            let kick = document.createElement("button");
            kick.classList.add("room-member-manager-button", "room-kick-button");
            kick.onclick = (_) => {
                console.log(`Attempted to have player '${this.username}' kicked.`);
                // Shouldn't need to await this.
                play_audio("normal-click");
                apiRequest(`room/kick?member=${this.uuid}`);
            };
            kick.innerText = "kick";
            div.appendChild(kick);
            this.addElement(kick, playerOnly);
        }
        if (IS_ADMIN) {
            let swap = document.createElement("button");
            swap.classList.add("room-member-manager-button", "room-swap-button");
            swap.onclick = (_) => {
                play_audio("normal-click");
                console.log(`Attempted to have player '${this.username}' change status.`);
                apiRequest(`room/swapstatus?uuid=${this.uuid}`);
            };
            swap.innerText = this.isPlayer ? "make spectator" : "make player";
            div.appendChild(swap);
            this.addElement(swap, playerOnly);
            this.swapButton = swap;
        }
        e.appendChild(div);
        this.addElement(div, playerOnly);
        return this;
    }
    addManagementDiv(e, playerOnly) {
        let div = document.createElement("div");
        div.classList.add("room-member-manager");
        this.addDiv(div, playerOnly);
        this.addManagementButtons(div, playerOnly);
        e.appendChild(div);
        this.addElement(div, playerOnly);
        return this;
    }
}
;
