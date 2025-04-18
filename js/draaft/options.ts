export function hover(description: string, id: string) {
    let ele = document.getElementById(id);
    if (ele == null) {
        console.error(
            `Uh-oh! Could not set hover text to ${description} - couldn't find ${id}`
        );
    } else {
        ele.innerHTML = description;
    }
}

export class DraftItem {
    public constructor(
        public id: Number,
        public pool: string,
        public prettyName: string,
        public description: string,
        public image: string,
        public datapackModifier: CallableFunction
    ) {}

    public makeDiv() {
        return `<div data-di-id=${this.id} class="draft-item basic-box">
            <p class="draft-item" id="di-${this.id}" onmouseover="hover('${this.description}', 'di-${this.id}')">${this.prettyName}</p>  
        </div>`;
    }
}

export class DraftPool {
    public constructor(
        public id: Number,
        public name: string,
        public prettyName: string,
        public items: DraftItem[]
    ) {}

    public makeDiv() {
        var pools: string[] = [];
        for (const di of this.items) {
            pools.push(di.makeDiv());
        }
        return `<div class="draft-pool basic-box flex-down" id="pool-${
            this.name
        }">
            <div class="draft-header basic-box" id="pool-header-${
                this.name
            }" style="text-align:center;">
                <p class="pool-header">Pool: ${this.prettyName}</p>
            </div>
            <div class="draft-pool-inner flex-right" id="pool-inner-${
                this.name
            }">
                ${pools.join("\n")}
            </div>
        </div>
        `;
    }
}

// Pool: biomes
let dMesa = new DraftItem(
    1,
    "biomes",
    "Mesa",
    "Mesa - Gives all mesa biomes and cave spider kill",
    "mesa.png",
    () => null
);
let dJungle = new DraftItem(
    2,
    "biomes",
    "Jungle",
    "Jungle - Gives all jungle biomes, cookie and melon eat, and panda and ocelot breeds.",
    "jungle.png",
    () => null
);
let dSnowy = new DraftItem(
    3,
    "biomes",
    "Snowy",
    "Snowy - Gives all snowy biomes and stray kill",
    "snowy.png",
    () => null
);
let dMegaTaiga = new DraftItem(
    4,
    "biomes",
    "Mega Taiga",
    "Mega Taiga - Gives all mega taiga biomes",
    "taiga.png",
    () => null
);
let dMushroomIsland = new DraftItem(
    5,
    "biomes",
    "Mushroom Island",
    "Mushroom Island - Gives all mushroom biomes and mooshroom breed",
    "mooshroom.png",
    () => null
);

let pBiomes = new DraftPool(1, "biomes", "Biomes", [
    dMesa,
    dJungle,
    dSnowy,
    dMegaTaiga,
    dMushroomIsland,
]);

export let pools: DraftPool[] = [pBiomes];
