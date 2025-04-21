let ID_COUNTER = 0;
let DRAFT_COUNTER = 0;

export class DraftItem {
    public poolItem: HTMLDivElement = document.createElement("div");
    public poolOuter: HTMLDivElement = null;
    public isDrafted: boolean = false;
    public fileQuery: string = null;
    public id: number;
    public simpleName: string;
    public boxName: string;

    public constructor(
        public pool: string,
        public prettyName: string,
        public description: string,
        public image: string,
        public datapackModifier: (file: string) => string
    ) {
        ID_COUNTER += 1;
        this.id = ID_COUNTER;

        this.simpleName = prettyName;
        this.boxName = this.prettyName;
    }

    public makeDiv() {
        this.poolItem.setAttribute("data-di-id", this.id.toString());
        this.poolItem.classList.add("draft-item", "basic-box");

        let poolDefaultText = document.createElement("p");
        poolDefaultText.innerHTML = this.boxName;
        poolDefaultText.id = `di-${this.id}`;
        poolDefaultText.classList.add("draft-item");

        let poolDescriptionText = document.createElement("p");
        poolDescriptionText.innerHTML = this.description;
        poolDescriptionText.classList.add("draft-item-desc");

        this.poolItem.addEventListener("mouseenter", () => {
            this.poolItem.innerHTML = "";
            poolDefaultText.classList.add("with-hover");
            this.poolItem.appendChild(poolDefaultText);
            this.poolItem.appendChild(poolDescriptionText);
        });

        this.poolItem.addEventListener("mouseleave", () => {
            this.poolItem.innerHTML = "";
            poolDefaultText.classList.remove("with-hover");
            this.poolItem.appendChild(poolDefaultText);
        });

        this.poolItem.appendChild(poolDefaultText);

        return this.poolItem;
    }
}

export class DraftPool {
    public id: number;

    public constructor(
        public name: string,
        public prettyName: string,
        public items: DraftItem[]
    ) {
        DRAFT_COUNTER += 1;
        this.id = DRAFT_COUNTER;
    }

    public getDiv() {
        return document.getElementById(`pool-body-${this.name}`);
    }

    public makeDiv() {
        let draftPool = document.createElement("div");
        draftPool.classList.add("draft-pool", "basic-box", "flex-down");
        draftPool.id = `pool-${this.name}`;

        let poolHeader = document.createElement("div");
        poolHeader.classList.add("draft-header", "basic-box");
        poolHeader.id = `pool-header-${this.name}`;
        poolHeader.style = "text-align:center;";

        let poolHeaderText = document.createElement("p");
        poolHeaderText.classList.add("pool-header");
        poolHeaderText.innerHTML = `${this.prettyName}`;

        poolHeader.appendChild(poolHeaderText);
        draftPool.appendChild(poolHeader);

        // Now create the pool body.
        let poolBody = document.createElement("div");
        poolBody.classList.add("draft-pool-inner", "flex-right");
        poolBody.id = `pool-body-${this.name}`;
        for (const di of this.items) {
            poolBody.appendChild(di.makeDiv());
        }

        draftPool.appendChild(poolBody);

        return draftPool;
    }
}

// Pool: biomes
let dMesa = new DraftItem(
    "biomes",
    "Mesa",
    "Gives all mesa biomes and cave spider kill",
    "mesa.png",
    (file) => {
        file += `
advancement grant @a only minecraft:adventure/adventuring_time minecraft:badlands
advancement grant @a only minecraft:adventure/adventuring_time minecraft:badlands_plateau
advancement grant @a only minecraft:adventure/adventuring_time minecraft:wooded_badlands_plateau
advancement grant @a only minecraft:adventure/kill_all_mobs minecraft:cave_spider
        `;
        return file;
    }
);
let dJungle = new DraftItem(
    "biomes",
    "Jungle",
    "Gives jungle biomes, cookie & melon eat, and panda & ocelot breeds.",
    "jungle.png",
    (file) => {
        file += `
advancement grant @a only minecraft:adventure/adventuring_time minecraft:bamboo_jungle
advancement grant @a only minecraft:adventure/adventuring_time minecraft:bamboo_jungle_hills
advancement grant @a only minecraft:adventure/adventuring_time minecraft:jungle_hills
advancement grant @a only minecraft:adventure/adventuring_time minecraft:jungle_edge
advancement grant @a only minecraft:adventure/adventuring_time minecraft:jungle
advancement grant @a only minecraft:husbandry/bred_all_animals minecraft:panda
advancement grant @a only minecraft:husbandry/bred_all_animals minecraft:ocelot
advancement grant @a only minecraft:husbandry/balanced_diet melon_slice
advancement grant @a only minecraft:husbandry/balanced_diet cookie
        `;
        return file;
    }
);
let dSnowy = new DraftItem(
    "biomes",
    "Snowy",
    "Gives all snowy biomes and stray kill",
    "snowy.png",
    (file) => {
        file += `
advancement grant @a only minecraft:adventure/adventuring_time minecraft:snowy_tundra
advancement grant @a only minecraft:adventure/adventuring_time minecraft:snowy_taiga
advancement grant @a only minecraft:adventure/adventuring_time minecraft:snowy_taiga_hills
advancement grant @a only minecraft:adventure/adventuring_time minecraft:snowy_mountains
advancement grant @a only minecraft:adventure/adventuring_time minecraft:snowy_beach
advancement grant @a only minecraft:adventure/adventuring_time minecraft:frozen_river
advancement grant @a only minecraft:adventure/kill_all_mobs minecraft:stray
        `;
        return file;
    }
);
let dMegaTaiga = new DraftItem(
    "biomes",
    "Mega Taiga",
    "Gives all mega taiga biomes",
    "taiga.png",
    (file) => {
        file += `
advancement grant @a only minecraft:adventure/adventuring_time minecraft:giant_tree_taiga
advancement grant @a only minecraft:adventure/adventuring_time minecraft:giant_tree_taiga_hills
        `;
        return file;
    }
);
let dMushroomIsland = new DraftItem(
    "biomes",
    "Mushroom Island",
    "Gives all mushroom biomes and mooshroom breed",
    "mooshroom.png",
    (file) => {
        file += `
advancement grant @a only minecraft:adventure/adventuring_time minecraft:mushroom_fields
advancement grant @a only minecraft:adventure/adventuring_time minecraft:mushroom_field_shore
advancement grant @a only minecraft:husbandry/bred_all_animals minecraft:mooshroom
        `;
        return file;
    }
);
dMushroomIsland.simpleName = "Mushroom";
dMushroomIsland.boxName = "Mushroom";

let pBiomes = new DraftPool("biomes", "Biomes", [
    dMesa,
    dJungle,
    dSnowy,
    dMegaTaiga,
    dMushroomIsland,
]);

// Pool: Armour
let dHelmet = new DraftItem(
    "armour",
    "Helmet",
    "Gives fully enchanted netherite helmet",
    "helmet.png",
    (file) => {
        file += `
give @a minecraft:netherite_helmet{Enchantments:[{id:"minecraft:protection",lvl:5},{id:"minecraft:unbreaking",lvl:3},{id:"minecraft:respiration",lvl:3},{id:"minecraft:aqua_affinity",lvl:1}]}
        `;
        return file;
    }
);
let dChestplate = new DraftItem(
    "armour",
    "Chestplate",
    "Gives fully enchanted netherite chestplate",
    "chestplate.png",
    (file) => {
        file += `
give @a minecraft:netherite_chestplate{Enchantments:[{id:"minecraft:protection",lvl:5},{id:"minecraft:unbreaking",lvl:3}]}
        `;
        return file;
    }
);
let dLeggings = new DraftItem(
    "armour",
    "Leggings",
    "Gives fully enchanted netherite leggings",
    "leggings.png",
    (file) => {
        file += `
give @a minecraft:netherite_leggings{Enchantments:[{id:"minecraft:protection",lvl:5},{id:"minecraft:unbreaking",lvl:3}]}
        `;
        return file;
    }
);
let dBoots = new DraftItem(
    "armour",
    "Boots",
    "Gives fully enchanted netherite boots",
    "boots.png",
    (file) => {
        file += `
give @a minecraft:netherite_boots{Enchantments:[{id:"minecraft:protection",lvl:5},{id:"minecraft:unbreaking",lvl:3},{id:"minecraft:depth_strider",lvl:3}]}
        `;
        return file;
    }
);
let dBucket = new DraftItem(
    "armour",
    "Bucket",
    "Gives a fully enchanted, max-tier bucket",
    "bucket.png",
    (file) => {
        file += `
give @a minecraft:bucket{Enchantments:[{}]}
        `;
        return file;
    }
);

let pArmour = new DraftPool("armour", "Armour", [
    dHelmet,
    dChestplate,
    dLeggings,
    dBoots,
    dBucket,
]);

// Pool: Tools
let dSword = new DraftItem(
    "tools",
    "Sword",
    "Gives fully enchanted netherite sword",
    "sword.png",
    (file) => {
        file += `
give @a minecraft:netherite_sword{Enchantments:[{id:"minecraft:smite",lvl:5},{id:"minecraft:looting",lvl:3},{id:"minecraft:unbreaking",lvl:3}]}
        `;
        return file;
    }
);
let dPickaxe = new DraftItem(
    "tools",
    "Pickaxe",
    "Gives fully enchanted netherite pickaxe",
    "pickaxe.png",
    (file) => {
        file += `
give @a minecraft:netherite_pickaxe{Enchantments:[{id:"minecraft:efficiency",lvl:5},{id:"minecraft:fortune",lvl:3},{id:"minecraft:unbreaking",lvl:3}]}
        `;
        return file;
    }
);
let dShovel = new DraftItem(
    "tools",
    "Shovel",
    "Gives fully enchanted netherite shovel",
    "shovel.png",
    (file) => {
        file += `
give @a minecraft:netherite_shovel{Enchantments:[{id:"minecraft:efficiency",lvl:5},{id:"minecraft:fortune",lvl:3},{id:"minecraft:unbreaking",lvl:3}]}
        `;
        return file;
    }
);
let dHoe = new DraftItem(
    "tools",
    "Hoe",
    "Gives fully enchanted netherite hoe",
    "hoe.png",
    (file) => {
        file += `
give @a minecraft:netherite_hoe{Enchantments:[{id:"minecraft:efficiency",lvl:5},{id:"minecraft:silk_touch",lvl:1},{id:"minecraft:unbreaking",lvl:3}]}
        `;
        return file;
    }
);
let dAxe = new DraftItem(
    "tools",
    "Axe",
    "Gives fully enchanted netherite axe",
    "axe.png",
    (file) => {
        file += `
give @a minecraft:netherite_axe{Enchantments:[{id:"minecraft:efficiency",lvl:5},{id:"minecraft:silk_touch",lvl:1},{id:"minecraft:unbreaking",lvl:3}]}
        `;
        return file;
    }
);
let dTrident = new DraftItem(
    "tools",
    "Trident",
    "Gives fully enchanted netherite trident",
    "trident.png",
    (file) => {
        file += `
give @a minecraft:trident{Enchantments:[{id:"minecraft:channeling",lvl:1},{id:"minecraft:loyalty",lvl:3},{id:"minecraft:impaling",lvl:5}]}
        `;
        return file;
    }
);

let pTools = new DraftPool("tools", "Tools", [
    dSword,
    dPickaxe,
    dShovel,
    dHoe,
    dAxe,
    dTrident,
]);

// Pool: Big
let dACC = new DraftItem(
    "big",
    "A Complete Catalogue",
    "Gives a complete catalogue",
    "acc.png",
    (file) => {
        file += `
advancement grant @a only minecraft:husbandry/complete_catalogue
        `;
        return file;
    }
);
dACC.boxName = "Catalogue";
let dAT = new DraftItem(
    "big",
    "Adventuring Time",
    "Gives adventuring time",
    "at.png",
    (file) => {
        file += `
advancement grant @a only minecraft:adventure/adventuring_time
        `;
        return file;
    }
);
dAT.boxName = "Adventuring";
let d2b2 = new DraftItem(
    "big",
    "Two by Two",
    "Gives two by two",
    "2b2.png",
    (file) => {
        file += `
advancement grant @a only minecraft:husbandry/bred_all_animals
        `;
        return file;
    }
);
let dMH = new DraftItem(
    "big",
    "Monsters Hunted",
    "Gives monsters hunted",
    "mh.png",
    (file) => {
        file += `
advancement grant @a only minecraft:adventure/kill_all_mobs
        `;
        return file;
    }
);
dMH.boxName = "Monsters";
let dABD = new DraftItem(
    "big",
    "A Balanced Diet",
    "Gives a balanced diet",
    "abd.png",
    (file) => {
        file += `
advancement grant @a only minecraft:husbandry/balanced_diet
        `;
        return file;
    }
);
dABD.boxName = "Balanced Diet";

// also known as Multi-Part Advancements. Dunno if that fits?
let pBig = new DraftPool("big", "Major Advancements", [
    dACC,
    dAT,
    d2b2,
    dMH,
    dABD,
]);

// Pool: Collectors
let dNetherite = new DraftItem(
    "collectors",
    "Netherite",
    "Gives 4 netherite ingots",
    "netherite.png",
    (file) => {
        file += `
give @a minecraft:netherite_ingot 4
        `;
        return file;
    }
);
let dShells = new DraftItem(
    "collectors",
    "Shells",
    "Gives 7 nautilus shells",
    "shell.png",
    (file) => {
        file += `
give @a minecraft:nautilus_shell 7
        `;
        return file;
    }
);
let dSkulls = new DraftItem(
    "collectors",
    "Skulls",
    "Gives 2 wither skeleton skulls",
    "skull.png",
    (file) => {
        file += `
give @a minecraft:wither_skeleton_skull 2
        `;
        return file;
    }
);
let dBreeds = new DraftItem(
    "collectors",
    "Breeds",
    "Gives breed credit for horse, donkey, mule, llama, wolf, fox, and turtle",
    "breeds.png",
    (file) => {
        file += `
advancement grant @a only minecraft:husbandry/bred_all_animals minecraft:horse
advancement grant @a only minecraft:husbandry/bred_all_animals minecraft:donkey
advancement grant @a only minecraft:husbandry/bred_all_animals minecraft:mule
advancement grant @a only minecraft:husbandry/bred_all_animals minecraft:llama
advancement grant @a only minecraft:husbandry/bred_all_animals minecraft:wolf
advancement grant @a only minecraft:husbandry/bred_all_animals minecraft:fox
advancement grant @a only minecraft:husbandry/bred_all_animals minecraft:turtle
        `;
        return file;
    }
);
let dShulker = new DraftItem(
    "collectors",
    "Shulker Box",
    "Gives a shulker box",
    "shulker.png",
    (file) => {
        file += `
give @a minecraft:shulker_box
        `;
        return file;
    }
);
let dBees = new DraftItem(
    "collectors",
    "Bees",
    "Gives all bee-related requirements",
    "shulker.png",
    (file) => {
        file += `
advancement grant @a only minecraft:husbandry/safely_harvest_honey
advancement grant @a only minecraft:husbandry/silk_touch_nest
advancement grant @a only minecraft:adventure/honey_block_slide
advancement grant @a only minecraft:husbandry/bred_all_animals minecraft:bee
advancement grant @a only minecraft:husbandry/balanced_diet honey_bottle
        `;
        return file;
    }
);

let pCollectors = new DraftPool("collectors", "Collectors", [
    dNetherite,
    dShells,
    dSkulls,
    dBreeds,
    dShulker,
    dBees,
]);

// Pool: misc
let dTotem = new DraftItem(
    "misc",
    "Totem",
    "Gives totem of undying and evoker & vex kill credit",
    "skull.png",
    (file) => {
        file += `
give @a minecraft:totem_of_undying
advancement grant @a only minecraft:adventure/kill_all_mobs minecraft:evoker
advancement grant @a only minecraft:adventure/kill_all_mobs minecraft:vex
        `;
        return file;
    }
);
let dFireworks = new DraftItem(
    "misc",
    "Fireworks",
    "Gives 64 fireworks",
    "firework.png",
    (file) => {
        file += `
give @a minecraft:firework_rocket{Fireworks:{Flight:1}} 64
        `;
        return file;
    }
);
let dGrace = new DraftItem(
    "misc",
    "Dolphin's Grace",
    "Gives dolphin's grace",
    "firework.png",
    (file) => {
        file += `
effect give @a minecraft:dolphins_grace 3600
        `;
        return file;
    }
);
dGrace.simpleName = "Grace";
dGrace.boxName = "Grace";
dGrace.fileQuery = "tick.mcfunction";
let dLeads = new DraftItem(
    "misc",
    "Leads",
    "Gives 23 leads & slime kill",
    "leads.png",
    (file) => {
        file += `
advancement grant @a only minecraft:adventure/kill_all_mobs minecraft:slime
give @a minecraft:lead 23
        `;
        return file;
    }
);

let pMisc = new DraftPool("misc", "Misc", [dTotem, dFireworks, dGrace, dLeads]);

export let pools: DraftPool[] = [
    pBiomes,
    pArmour,
    pTools,
    pBig,
    pCollectors,
    pMisc,
];
export let allItems: DraftItem[] = [];

for (const p of pools) {
    for (const i of p.items) {
        allItems.push(i);
        console.assert(allItems.length == i.id, "Oh no, not equal!!");
    }
}

// Use a function for this so that we can fix this horrible implementation later.
export function getDraftItem(id: number) {
    return allItems[id - 1];
}
