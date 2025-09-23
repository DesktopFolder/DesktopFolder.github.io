import { STEVE } from "./util.js";

const MOJANG_UUID_LOOKUP_URL = "https://api.ashcon.app/mojang/v2/user";
// const MOJANG_UUID_LOOKUP_URL = "https://api.minecraftservices.com/minecraft/profile/lookup";

export async function uuidToUsername(uuid: string) {
    let res = await fetch(`${MOJANG_UUID_LOOKUP_URL}/${uuid}`);
    let json = await res.json();
    return json.username;
}

export class Member {
    uuid: string;
    username = null;

    managed: Array<HTMLElement> = [];

    public constructor(uuid: string) {
        this.uuid = uuid;
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

    public addImage(e: HTMLElement) {
        let i = document.createElement("img");
        i.classList.add("member-face");
        i.src = `https://mineskin.eu/helm/${this.uuid}/100`;
        i.onerror = () => (i.src = STEVE);

        e.appendChild(i);
        this.managed.push(i);

        return this;
    }

    public addParagraph(e: HTMLElement) {
        let p = document.createElement("p");

        p.classList.add("room-member", "member-name");
        this.populateUsername(p);

        e.appendChild(p);
        this.managed.push(p);

        return this;
    }

    public addDiv(e: HTMLElement) {
        let div = document.createElement("div");
        div.classList.add("room-member-container");

        this.addImage(div);
        this.addParagraph(div);

        e.appendChild(div);
        this.managed.push(div);

        return this;
    }
};
