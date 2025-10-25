import {apiRequest} from "./request.js";
import { STEVE, IS_ADMIN, UUID } from "./util.js";

const MOJANG_UUID_LOOKUP_URL = "https://api.ashcon.app/mojang/v2/user";
// const MOJANG_UUID_LOOKUP_URL = "https://api.minecraftservices.com/minecraft/profile/lookup";

export async function uuidToUsername(uuid: string) {
    let res = await fetch(`${MOJANG_UUID_LOOKUP_URL}/${uuid}`);
    let json = await res.json();
    return json.username;
}

export class Member {
    uuid: string;
    username: string = null;

    isPlayer: boolean = true;

    managed: Array<HTMLElement> = [];
    playerOnly: Array<HTMLElement> = [];

    swapButton: HTMLButtonElement = undefined;

    public constructor(uuid: string) {
        this.uuid = uuid;
    }

    public destroy() {
        for (const m of this.managed) {
            m.style.display = "none";
        }
    }

    public populateUsername(e: HTMLElement) {
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

    public addImage(e: HTMLElement, playerOnly: boolean) {
        let i = document.createElement("img");
        i.classList.add("member-face");
        i.src = `https://mineskin.eu/helm/${this.uuid}/100`;
        i.onerror = () => (i.src = STEVE);

        e.appendChild(i);
        this.addElement(i, playerOnly);

        return this;
    }

    public addParagraph(e: HTMLElement, playerOnly: boolean) {
        let p = document.createElement("p");

        p.classList.add("room-member", "member-name");
        this.populateUsername(p);

        e.appendChild(p);
        this.addElement(p, playerOnly);

        return this;
    }

    public addDiv(e: HTMLElement, playerOnly: boolean) {
        let div = document.createElement("div");
        div.classList.add("room-member-container");

        this.addImage(div, playerOnly);
        this.addParagraph(div, playerOnly);

        e.appendChild(div);
        this.addElement(div, playerOnly);

        return this;
    }

    public setIsPlayer(value: boolean) {
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

    public addElement(e: HTMLElement, playerOnly: boolean) {
        this.managed.push(e);
        if (playerOnly) {
            this.playerOnly.push(e);
        }
    }

    public addManagementButtons(e: HTMLElement, playerOnly: boolean) {
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
                    (<HTMLDialogElement>document.getElementById("confirm-room-destroy-admin")).showModal();
                }
                else {
                    (<HTMLDialogElement>document.getElementById("confirm-room-destroy-user")).showModal();
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

    public addManagementDiv(e: HTMLElement, playerOnly: boolean) {
        let div = document.createElement("div");
        div.classList.add("room-member-manager");

        this.addDiv(div, playerOnly);

        this.addManagementButtons(div, playerOnly);

        e.appendChild(div);
        this.addElement(div, playerOnly);

        return this;
    }
};
