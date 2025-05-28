import { pools, DraftItem } from "./draaft/options.js";
import { Player, allPlayers } from "./draaft/players.js";
import { playerFaceLink, STEVE } from "./draaft/utils.js";
import { conf, initialize } from "./draaft/config.js";
import { load_overlay } from "./draaft/overlay.js";

// Populated in launchSeeds
var SEEDLIST: Array<string> = [];

// https://stackoverflow.com/questions/2719668/an-html5-canvas-element-in-the-background-of-my-page/2723376
// https://coolors.co/edffec-61e786-5a5766-48435c-9792e3

function launchSeeds() {
    fetch("/assets/seedlist.txt")
        .then((resp) => resp.text())
        .then((text) => {
            for (const line of text.split("\n")) {
                if (line.trim().length == 0) continue;
                SEEDLIST.push(line.trim());
            }
        })
        .then(() => {
            console.log(`Loaded ${SEEDLIST.length} seeds.`);
        });
}

function resetPoolHighlights() {
    // reset highlights
    for (const pool of pools) {
        pool.getBodyDiv().style.backgroundColor = "#FFF";
        pool.getHeaderDiv().style.backgroundColor = "#FFF";
        pool.getDiv().style.backgroundColor = "#FFF";
    }
}

function updatePoolColours(draftLimit: number, draftPlayer: Player) {
    for (const pool of pools) {
        let st = pool.getBodyDiv().style;
        let hst = pool.getHeaderDiv().style;
        let dst = pool.getDiv().style;
        let pc = draftPlayer.getCount(pool.name);
        if (pc == 0) continue;
        if (pc == draftLimit) {
            st.backgroundColor = "#AAA";
            hst.backgroundColor = "#AAA";
            dst.backgroundColor = "#AAA";
        } else if (pc == draftLimit - 1) {
            st.backgroundColor = "#DDD";
            hst.backgroundColor = "#DDD";
            dst.backgroundColor = "#DDD";
        }
    }
}

class Action {
    public constructor(
        public di: DraftItem,
        public p: Player,
        public dlimit: number
    ) {}

    public undo() {
        // what a pain this will be
        console.assert(
            this.di.isDrafted,
            "DraftItem to be undone was not drafted?!"
        );
        console.log(`Undoing ${this.di.prettyName} for player ${this.p.name}`);
        this.p.undoDraft(this.di);
        this.di.isDrafted = false;
        this.di.unfinish();

        // MUST TAKE CARE OF THIS IN PARENT
        // this.playerReset.push(this.playerList.shift());
        // if (this.playerList.length == 0) {
        //     while (this.playerReset.length != 0) {
        //         this.playerList.push(this.playerReset.pop());
        //     }
        // }
        // let draftPlayer = this.playerList[0];
        // this.setTitleFrom(draftPlayer.name);
        resetPoolHighlights();

        // updatePoolColours(this.draftLimit, draftPlayer);
    }
}

class StateMachine {
    title: HTMLParagraphElement;
    titleContainer: HTMLDivElement;
    starter: HTMLAnchorElement;

    playerList: Array<Player> = [];
    playerReset: Array<Player> = [];
    playerCount: number = 0;
    draftLimit: number = 0;
    actions: Array<Action> = [];

    isDraftComplete() {
        // draft is complete if all players have completed drafting
        // a truismer tautology has never been said
        // also, if there's one player, it changes a bit.
        if (this.playerCount == 1) {
            for (const p of pools) {
                for (const di of p.items) {
                    if (!di.isDrafted) {
                        return false;
                    }
                }
            }
            return true;
        }
        for (const p of allPlayers) {
            if (!p.exists()) {
                continue;
            }
            if (!p.completeDrafting(this.draftLimit)) {
                return false;
            }
        }
        return true;
    }

    checkDraftComplete() {
        if (!this.isDraftComplete()) {
            // draft is incomplete :( try harder!! you can do it!!!
            return false;
        }

        console.log("Draft complete! Finalizing...");

        // Wicked, the draft is now complete. Remove all onclick handlers
        // and add communal values.

        for (const p of pools) {
            for (const di of p.items) {
                // no more clicking. :/
                di.poolItem.removeAttribute("onclick");
                di.poolItem.onclick = undefined;
                if (!di.isDrafted) {
                    // these are global ones. give them to all the players.
                    for (const player of allPlayers) {
                        if (!player.exists()) {
                            continue;
                        }
                        player.updateDraft(di.id);
                    }
                }
            }
        }

        let rs = SEEDLIST[Math.floor(Math.random() * SEEDLIST.length)];
        let copier = `<a href="#" style="text-decoration:none;" onclick="navigator.clipboard.writeText('${rs}')">📋</a>`;
        let seedAppearance =
            conf("seedhider") == true ? "Seed hidden, copy by clicking ->" : rs;
        this.title.innerHTML = `Completed! Download datapacks from the sidebar. Your seed is: ${seedAppearance} ${copier} (<a href="/draaft/seedlist.html" target="_blank">Seed filter info</a>)`;
        return true;
    }

    setTitleFrom(pn: string) {
        let plink = playerFaceLink(pn);
        let pimg = `<img src="${plink}" class="player-title-face" onerror="this.onerror=null;this.src='${STEVE}';">`;
        this.title.innerHTML = `Draft pick: ${pimg} ${pn}`;
    }

    start() {
        if (this.checkPlayers() == 0) {
            return;
        }
        console.log("Starting drafting...");
        this.title.innerHTML = "Drafting...";

        // UNDO FEATURE
        let undoer = <HTMLAnchorElement>document.getElementById("undo-button");
        undoer.onclick = () => {
            let sm: StateMachine = this;
            if (sm.actions.length == 0) {
                console.log("Tried to undo when no actions have been taken.");
                return;
            }
            let act = sm.actions.pop();
            act.undo();

            // okay, now we need to do our work.
            // we need to shift everything back.
            // if our playerReset is empty, and we have taken an action, that means
            // that the last action reversed playerReset into playerList
            console.assert(this.playerList.length > 0);
            if (this.playerReset.length == 0) {
                while (this.playerList.length > 0) {
                    this.playerReset.push(this.playerList.pop());
                }
            }

            console.assert(this.playerReset.length > 0);
            this.playerList.unshift(this.playerReset.pop());

            let draftPlayer = this.playerList[0];
            this.setTitleFrom(draftPlayer.name);

            updatePoolColours(this.draftLimit, draftPlayer);
        };

        // Let's get our players!
        for (const player of allPlayers) {
            if (player.exists()) {
                this.playerList.push(player);
            }
        }
        console.assert(this.playerList.length > 0, "Playerlist is small??");
        this.playerCount = this.playerList.length;
        if (this.playerCount == 1) {
            this.draftLimit = 1000;
        } else if (this.playerCount == 2) {
            this.draftLimit = 2;
        } else {
            this.draftLimit = 1;
        }

        this.setTitleFrom(this.playerList[0].name);

        for (const p of pools) {
            for (const di of p.items) {
                // do this into actions ig for undo...
                di.poolItem.onclick = () => {
                    if (di.isDrafted) {
                        console.log(
                            `Did not draft ${di.boxName} : already drafted.`
                        );
                        return;
                    }
                    let player = this.playerList[0];
                    console.log(
                        `Drafting ${di.prettyName} for player ${player.name}`
                    );
                    if (!player.tryDraft(di, this.draftLimit)) {
                        console.log(
                            "Did not draft: Invalid draft choice (from same pool as before)" +
                                ` Note: Limit: ${this.draftLimit}, Player count: ${this.playerCount}`
                        );
                        return;
                    }

                    this.actions.push(new Action(di, player, this.draftLimit));

                    // state management
                    di.isDrafted = true;

                    // Old: Remove the item entirely.
                    // p.getBodyDiv().removeChild(di.poolItem);
                    // New: Reset innerHTML, still hoverable?
                    di.finish(player.name);

                    this.playerReset.push(this.playerList.shift());

                    if (this.playerList.length == 0) {
                        while (this.playerReset.length != 0) {
                            this.playerList.push(this.playerReset.pop());
                        }
                    }

                    let draftPlayer = this.playerList[0];

                    this.setTitleFrom(draftPlayer.name);

                    resetPoolHighlights();

                    if (this.checkDraftComplete()) return;

                    updatePoolColours(this.draftLimit, draftPlayer);
                };
            }
        }
    }

    setToPlayers(n: number) {
        if (n == 0) {
            this.title.innerHTML = "Waiting for players...";
            this.starter.style.display = "none";
            return;
        } else if (n == 1) {
            this.title.innerHTML = "1 player entered. ";
        } else {
            this.title.innerHTML = `${n} players entered. `;
        }
        this.starter.style.display = "inline";
        this.title.appendChild(this.starter);
    }

    constructor() {
        this.title = document.createElement("p");
        this.titleContainer = document.createElement("div");
        this.starter = document.createElement("a");
        this.starter.classList.add("start-button");
        this.starter.href = "#";
        this.starter.innerHTML = "Click to start draft.";
        this.starter.onclick = () => {
            this.start();
            return false;
        };
        this.title.appendChild(this.starter);
        this.titleContainer.appendChild(this.title);
        this.titleContainer.classList.add("title-container");
        this.checkPlayers();
    }

    checkPlayers() {
        let count = 0;
        for (const p of allPlayers) {
            if (p.exists()) {
                count += 1;
            }
        }
        this.setToPlayers(count);
        return count;
    }
}

function main() {
    const queryString = window.location.search;
    const params = new URLSearchParams(queryString);
    if (params.get("overlay") == "true") {
        console.log("Entering overlay mode. xqcL - oliivia");
        return load_overlay(params);
    }

    initialize();

    launchSeeds();

    let sm = new StateMachine();

    let players = document.createElement("div");
    players.id = "left-gutter";
    for (let step = 0; step < 4; step++) {
        let p = new Player();
        players.appendChild(p.container);
        allPlayers.push(p);
        p.input.addEventListener("change", () => {
            sm.checkPlayers();
            p.updateFace();
        });
    }

    let modDownload = document.createElement("a");
    modDownload.classList.add("start-button", "gutter-big-button");
    modDownload.href = "https://github.com/memerson12/drAAft/releases";
    modDownload.target = "_blank";
    modDownload.innerHTML = "Mod Download";

    let filterContainer = document.createElement("p");
    let filterInfo = document.createElement("a");
    filterInfo.classList.add("start-button", "gutter-big-button");
    filterInfo.href = "/draaft/seedlist.html";
    filterInfo.target = "_blank";
    filterInfo.innerHTML = "Seed Filter Info";
    filterContainer.appendChild(filterInfo);

    let discordContainer = document.createElement("p");
    let discordInfo = document.createElement("a");
    discordInfo.classList.add("start-button", "gutter-big-button");
    discordInfo.href = "https://discord.gg/37Q3KnbeQQ";
    discordInfo.target = "_blank";
    discordInfo.innerHTML = "Discord Link";
    discordContainer.appendChild(discordInfo);

    let trailerContainer = document.createElement("p");
    let trailer = document.createElement("a");
    trailer.classList.add("start-button", "gutter-big-button");
    trailer.href = "https://www.youtube.com/watch?v=1cJnTjbZEco";
    trailer.target = "_blank";
    trailer.innerHTML = "Event Trailer";
    trailerContainer.appendChild(trailer);

    let tutorialContainer = document.createElement("p");
    let tutorial = document.createElement("a");
    tutorial.classList.add("start-button", "gutter-big-button");
    tutorial.href = "https://www.youtube.com/watch?v=bCOTGwBlEbA";
    tutorial.target = "_blank";
    tutorial.innerHTML = "Setup Tutorial";
    tutorialContainer.appendChild(tutorial);

    players.appendChild(modDownload);
    players.appendChild(filterContainer);
    players.appendChild(discordContainer);
    players.appendChild(trailerContainer);
    players.appendChild(tutorialContainer);
    document.body.appendChild(players);

    let container = document.createElement("div");
    container.id = "draft-body";
    container.classList.add("flex-down");

    let poolContainer = document.createElement("div");
    poolContainer.id = "draft-pool-container";
    poolContainer.classList.add("flex-right");

    container.appendChild(sm.titleContainer);
    container.appendChild(poolContainer);

    for (const pool of pools) {
        console.log(`Adding pool: ${pool.prettyName}`);
        poolContainer.appendChild(pool.makeDiv());
    }

    document.body.appendChild(container);
}

document.addEventListener("DOMContentLoaded", main, false);
