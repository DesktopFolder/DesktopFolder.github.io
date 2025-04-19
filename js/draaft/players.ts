import { allItems, DraftItem } from "./options.js";
// @ts-ignore Import module
import { downloadZip } from "https://cdn.jsdelivr.net/npm/client-zip/index.js";

export class Player {
    name = "";

    // Player objects represent all their information.
    drafted: Array<number> = [];
    draftedPools: Set<string> = new Set();
    input: HTMLInputElement;
    container: HTMLDivElement;
    title: HTMLParagraphElement;
    draftedList: HTMLParagraphElement;

    public reset() {
        if (this.drafted.length != 0) {
            console.error(
                `Could not reset ${this.name} -- there are ${this.drafted.length} draft already done.`
            );
        } else {
            this.setName("");
        }
    }

    public tryDraft(di: DraftItem) {
        if (this.draftedPools.has(di.pool)) {
            return false;
        }
        this.draftedPools.add(di.pool);
        this.updateDraft(di.id);
        return true;
    }

    public updateDraft(n: number) {
        if (n != 0) {
            this.drafted.push(n);
        }
        this.draftedList.innerHTML = `Drafted: ${this.drafted.join(', ')}`;
    }

    public setName(val: string) {
        this.name = val;
        this.title.innerHTML = `Player: ${val}`;
    }

    public exists() {
        return this.name.length != 0;
    }

    public updateFile(file: string) {
        for (const d of this.drafted) {
            file = allItems[d - 1].datapackModifier(file);
        }
        return file;
    }

    public download() {
        fetch("/assets/draaft/index.txt")
            .then((resp) => resp.text())
            .then((text) => {
                let all_urls: Array<Promise<Array<any>>> = [];
                for (const line of text.split("\n")) {
                    if (line.trim().length == 0) continue;
                    all_urls.push(
                        fetch(`/assets/draaft/${line}`)
                            .then((resp: Response) => resp.blob())
                            .then((blob: Blob) => [blob, line])
                    );
                }
                Promise.all(all_urls).then(async (list: Array<any>) => {
                    let data = [];
                    // We need to append things to on_load.mcfunction
                    for (const i of list) {
                        const name: string = i[1];
                        let input = null;
                        if (name.includes("on_load.mcfunction")) {
                            const b: Blob = i[0];
                            input = this.updateFile(await b.text());
                        } else {
                            input = i[0];
                        }
                        data.push({
                            name: name,
                            lastModified: new Date(),
                            input: input,
                        });
                    }

                    // get the ZIP stream in a Blob
                    downloadZip(data)
                        .blob()
                        .then((b: Blob) => {
                            // make and click a temporary link to download the Blob
                            const link = document.createElement("a");
                            link.href = URL.createObjectURL(b);
                            link.download = "draaftpack.zip";
                            link.click();
                            link.remove();
                        });
                });
            });
    }

    public constructor() {
        this.input = document.createElement("input");
        this.input.classList.add("player-name");
        this.input.placeholder = "Player name...";
        this.input.addEventListener("input", () => {
            this.setName(this.input.value.trim());
        });

        this.title = document.createElement("p");
        this.title.innerHTML = "Player: ";

        let buttons = document.createElement("div");
        buttons.classList.add("flex-right");
        let resetButton = document.createElement("a");
        resetButton.classList.add("player-button");
        resetButton.href = "#";
        resetButton.innerHTML = "reset";
        resetButton.onclick = () => {
            this.reset();
            return false;
        };
        buttons.appendChild(resetButton);

        let downloadButton = document.createElement("a");
        downloadButton.classList.add("player-button");
        downloadButton.href = "#";
        downloadButton.innerHTML = "download pack";
        downloadButton.onclick = () => {
            this.download();
            return false;
        };
        buttons.appendChild(downloadButton);

        this.container = document.createElement("div");
        this.container.classList.add("flex-down", "player-container");

        this.draftedList = document.createElement("p");
        this.draftedList.style.fontSize = "12";
        this.updateDraft(0);

        this.container.appendChild(this.title);
        this.container.appendChild(this.input);
        this.container.appendChild(this.draftedList);
        this.container.appendChild(buttons);
    }
}
