import { apiRequest } from "./request.js";
import { STEVE, IS_ADMIN, UUID } from "./util.js";
const MOJANG_UUID_LOOKUP_URL = "https://api.ashcon.app/mojang/v2/user";
// const MOJANG_UUID_LOOKUP_URL = "https://api.minecraftservices.com/minecraft/profile/lookup";
export async function uuidToUsername(uuid) {
    let res = await fetch(`${MOJANG_UUID_LOOKUP_URL}/${uuid}`);
    let json = await res.json();
    return json.username;
}
export class Member {
    uuid;
    username = null;
    isPlayer = true;
    managed = [];
    constructor(uuid) {
        this.uuid = uuid;
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
    addImage(e) {
        let i = document.createElement("img");
        i.classList.add("member-face");
        i.src = `https://mineskin.eu/helm/${this.uuid}/100`;
        i.onerror = () => (i.src = STEVE);
        e.appendChild(i);
        this.managed.push(i);
        return this;
    }
    addParagraph(e) {
        let p = document.createElement("p");
        p.classList.add("room-member", "member-name");
        this.populateUsername(p);
        e.appendChild(p);
        this.managed.push(p);
        return this;
    }
    addDiv(e) {
        let div = document.createElement("div");
        div.classList.add("room-member-container");
        this.addImage(div);
        this.addParagraph(div);
        e.appendChild(div);
        this.managed.push(div);
        return this;
    }
    addManagementButtons(e) {
        let div = document.createElement("div");
        div.classList.add("room-member-manager-buttons");
        // It's us. So, we just have the "leave" button.
        // We should probably print ourselves first...
        if (UUID == this.uuid) {
            let button = document.createElement("button");
            button.classList.add("room-member-manager-button", "room-leave-button");
            button.onclick = (_) => {
                console.log(`Attempted to have player '${this.username}' leave.`);
                if (IS_ADMIN) {
                    document.getElementById("confirm-room-destroy-admin").showModal();
                }
                else {
                    document.getElementById("confirm-room-destroy-user").showModal();
                }
            };
            button.innerText = "leave";
            div.appendChild(button);
            this.managed.push(button);
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
                apiRequest(`room/kick?member=${this.uuid}`);
            };
            kick.innerText = "kick";
            div.appendChild(kick);
            this.managed.push(kick);
            let swap = document.createElement("button");
            swap.classList.add("room-member-manager-button", "room-swap-button");
            swap.onclick = (_) => {
                console.log(`Attempted to have player '${this.username}' change status.`);
                // TODO. Send leave room request to server and update swap innerText.
            };
            swap.innerText = this.isPlayer ? "make spectator" : "make player";
            div.appendChild(swap);
            this.managed.push(swap);
        }
        e.appendChild(div);
        this.managed.push(div);
        return this;
    }
    addManagementDiv(e) {
        let div = document.createElement("div");
        div.classList.add("room-member-manager");
        this.addDiv(div);
        this.addManagementButtons(div);
        e.appendChild(div);
        this.managed.push(div);
        return this;
    }
}
;
