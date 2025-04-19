import { DraftItem, DraftPool, pools } from "./draaft/options.js";
import { Player } from "./draaft/players.js";

let allPlayers: Array<Player> = [];

class StateMachine {
    title: HTMLParagraphElement;
    titleContainer: HTMLDivElement;

    playerList: Array<Player> = [];
    playerReset: Array<Player> = [];
    playerCount: number = 0;
    draftLimit: number = 0;
    actions = [];

    isDraftComplete() {
        // draft is complete if all players have completed drafting
        // a truismer tautology has never been said
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
            return;
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

        this.title.innerHTML = `Draft complete. Download datapacks from the sidebar.`;
    }

    start() {
        if (this.checkPlayers() == 0) {
            return;
        }
        console.log("Starting drafting...");
        this.title.innerHTML = "Drafting...";

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

        this.title.innerHTML = `Draft pick: ${this.playerList[0].name}`;

        for (const p of pools) {
            for (const di of p.items) {
                // do this into actions ig for undo...
                di.poolItem.onclick = () => {
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

                    // state management
                    di.isDrafted = true;
                    p.getDiv().removeChild(di.poolItem);
                    this.playerReset.push(this.playerList.shift());

                    if (this.playerList.length == 0) {
                        while (this.playerReset.length != 0) {
                            this.playerList.push(this.playerReset.pop());
                        }
                    }

                    this.title.innerHTML = `Draft pick: ${this.playerList[0].name}`;

                    this.checkDraftComplete();
                };
            }
        }
    }

    setToPlayers(n: number) {
        if (n == 0) {
            this.title.innerHTML = "Waiting for players...";
        } else if (n == 1) {
            this.title.innerHTML =
                "1 player entered, press start to begin draft...";
        } else {
            this.title.innerHTML = `${n} players entered, press start to begin draft...`;
        }
    }

    constructor() {
        this.title = document.createElement("p");
        this.titleContainer = document.createElement("div");
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
    let sm = new StateMachine();

    let players = document.createElement("div");
    players.id = "left-gutter";
    for (let step = 0; step < 4; step++) {
        let p = new Player();
        players.appendChild(p.container);
        allPlayers.push(p);
        p.input.addEventListener("change", () => {
            sm.checkPlayers();
        });
    }
    let starter = document.createElement("a");
    starter.classList.add("start-button");
    starter.href = "#";
    starter.innerHTML = "Start";
    starter.onclick = () => {
        sm.start();
        return false;
    };
    players.appendChild(starter);
    document.body.appendChild(players);

    let container = document.createElement("div");
    container.id = "draft-body";
    container.classList.add("flex-right");

    container.appendChild(sm.titleContainer);

    for (const pool of pools) {
        console.log(`Adding pool: ${pool.prettyName}`);
        container.appendChild(pool.makeDiv());
    }

    document.body.appendChild(container);
}

document.addEventListener("DOMContentLoaded", main, false);
