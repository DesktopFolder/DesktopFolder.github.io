import {playerFaceImageAsString} from "./utils.js";

export let allItems: DraftItem[] = [];

let ID_COUNTER = 0;
let DRAFT_COUNTER = 0;

function itemGiver(...args: (string|number)[]) {
    return (file: string) => {
        for (let i = 0; i < args.length; i++) {
            if (typeof args[i] === 'string') {
                if (i + 1 < args.length && typeof args[i + 1] === 'number') {
                    file += `
give @a minecraft:${args[i]} ${args[i + 1]}
`;
                }
                else {
                    file += `
give @a minecraft:${args[i]}
`;
                }
            }
            
        }

        return file;
    };
}

export class DraftItem {
    public poolItem: HTMLDivElement = document.createElement("div");
    public poolDefaultText: HTMLParagraphElement = document.createElement("p");
    public poolDescriptionText: HTMLParagraphElement = document.createElement("p");
    public isDrafted: boolean = false;
    public finished: boolean = false;
    public fileQuery: string = null;
    public id: number;
    public simpleName: string;
    public boxName: string;
    public smallName: string;
    public pool: string;
    public pickedBy: string = null;

    public constructor(
        public prettyName: string,
        public description: string,
        public image: string,
        public datapackModifier: (file: string) => string
    ) {
        ID_COUNTER += 1;
        this.id = ID_COUNTER;

        this.simpleName = prettyName;
        this.boxName = this.prettyName;
        this.smallName = null;

        allItems.push(this);
        console.assert(this.id == allItems.length);
    }

    public setFrom(it: DraftItem, pool: string) {
        this.pool = pool;
        this.simpleName = it.simpleName;
        this.boxName = it.boxName;
        this.fileQuery = it.fileQuery;
        this.smallName = it.smallName;
    }

    public finish(pn: string) {
        this.poolItem.onclick = undefined; 
        this.pickedBy = pn;
        this.finished = true;
        this.setDefaultText();
    }

    public setDefaultText() {
        let pimg = playerFaceImageAsString(this.pickedBy, "clicked-player-face");
        this.poolDefaultText.innerHTML = `${pimg} ${this.smallName || this.boxName} ${pimg}`;
    }

    public onMouseLeave() {
        this.poolItem.innerHTML = "";
        this.poolDefaultText.classList.remove("with-hover");
        if (this.finished) {
            this.setDefaultText();
        }
        this.poolItem.appendChild(this.poolDefaultText);
    }

    public onMouseEnter() {
        this.poolItem.innerHTML = "";
        this.poolDefaultText.classList.add("with-hover");
        if (this.finished) {
            this.poolDefaultText.innerHTML = this.boxName;
        }
        this.poolItem.appendChild(this.poolDefaultText);
        this.poolItem.appendChild(this.poolDescriptionText);
    }

    public makeDiv() {
        this.poolItem.setAttribute("data-di-id", this.id.toString());
        this.poolItem.classList.add("draft-item", "basic-box");

        this.poolDefaultText.innerHTML = this.boxName;
        this.poolItem.id = `di-${this.id}`;
        this.poolDefaultText.classList.add("draft-item");

        this.poolDescriptionText.innerHTML = this.description;
        this.poolDescriptionText.classList.add("draft-item-desc");

        this.poolItem.addEventListener("mouseenter", this.onMouseEnter.bind(this));
        this.poolItem.addEventListener("mouseleave", this.onMouseLeave.bind(this));

        this.poolItem.appendChild(this.poolDefaultText);

        return this.poolItem;
    }
}

export class DraftPool {
    public id: number;
    public items: DraftItem[] = [];

    public constructor(
        public name: string,
        public prettyName: string,
        items: DraftItem[]
    ) {
        DRAFT_COUNTER += 1;
        this.id = DRAFT_COUNTER;

        for (const it of items) {
            this.items.push(new DraftItem(it.prettyName, it.description, it.image, it.datapackModifier));
            this.items.at(-1).setFrom(it, this.name);
        }
    }

    public getDiv(): HTMLDivElement {
        return <HTMLDivElement>document.getElementById(`pool-${this.name}`);
    }

    public getHeaderDiv(): HTMLDivElement {
        return <HTMLDivElement>document.getElementById(`pool-header-${this.name}`);
    }

    public getBodyDiv(): HTMLDivElement {
        return <HTMLDivElement>document.getElementById(`pool-body-${this.name}`);
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
    "Jungle",
    "Gives jungle biomes, cookie, melon, panda, & ocelot",
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
    "Snowy",
    "Gives all snowy biomes, stray kill, & zd",
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
advancement grant @a only minecraft:story/cure_zombie_villager
        `;
        return file;
    }
);
let dMegaTaiga = new DraftItem(
    "Mega Taiga",
    "Gives all mega taiga biomes, sweet berry eat, and fox breed",
    "taiga.png",
    (file) => {
        file += `
advancement grant @a only minecraft:adventure/adventuring_time minecraft:giant_tree_taiga
advancement grant @a only minecraft:adventure/adventuring_time minecraft:giant_tree_taiga_hills
advancement grant @a only minecraft:husbandry/balanced_diet sweet_berries
advancement grant @a only minecraft:husbandry/bred_all_animals minecraft:fox
        `;
        return file;
    }
);
let dMushroomIsland = new DraftItem(
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

// Pool: Armour
let dHelmet = new DraftItem(
    "Helmet",
    "Gives fully enchanted diamond helmet",
    "helmet.png",
    (file) => {
        file += `
give @a minecraft:diamond_helmet{Enchantments:[{id:"minecraft:protection",lvl:5},{id:"minecraft:unbreaking",lvl:3},{id:"minecraft:respiration",lvl:3},{id:"minecraft:aqua_affinity",lvl:1}]}
        `;
        return file;
    }
);
let dChestplate = new DraftItem(
    "Chestplate",
    "Gives fully enchanted diamond chestplate",
    "chestplate.png",
    (file) => {
        file += `
give @a minecraft:diamond_chestplate{Enchantments:[{id:"minecraft:protection",lvl:5},{id:"minecraft:unbreaking",lvl:3}]}
        `;
        return file;
    }
);
let dLeggings = new DraftItem(
    "Leggings",
    "Gives fully enchanted diamond leggings",
    "leggings.png",
    (file) => {
        file += `
give @a minecraft:diamond_leggings{Enchantments:[{id:"minecraft:protection",lvl:5},{id:"minecraft:unbreaking",lvl:3}]}
        `;
        return file;
    }
);
let dBoots = new DraftItem(
    "Boots",
    "Gives fully enchanted diamond boots",
    "boots.png",
    (file) => {
        file += `
give @a minecraft:diamond_boots{Enchantments:[{id:"minecraft:protection",lvl:5},{id:"minecraft:unbreaking",lvl:3},{id:"minecraft:depth_strider",lvl:3}]}
        `;
        return file;
    }
);
let dBucket = new DraftItem(
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

// Pool: Tools
let dSword = new DraftItem(
    "Sword",
    "Gives fully enchanted diamond sword",
    "sword.png",
    (file) => {
        file += `
give @a minecraft:diamond_sword{Enchantments:[{id:"minecraft:smite",lvl:5},{id:"minecraft:looting",lvl:3},{id:"minecraft:unbreaking",lvl:3}]}
        `;
        return file;
    }
);
let dPickaxe = new DraftItem(
    "Pickaxe",
    "Gives fully enchanted diamond pickaxe",
    "pickaxe.png",
    (file) => {
        file += `
give @a minecraft:diamond_pickaxe{Enchantments:[{id:"minecraft:efficiency",lvl:5},{id:"minecraft:fortune",lvl:3},{id:"minecraft:unbreaking",lvl:3}]}
        `;
        return file;
    }
);
let dShovel = new DraftItem(
    "Shovel",
    "Gives fully enchanted diamond shovel",
    "shovel.png",
    (file) => {
        file += `
give @a minecraft:diamond_shovel{Enchantments:[{id:"minecraft:efficiency",lvl:5},{id:"minecraft:fortune",lvl:3},{id:"minecraft:unbreaking",lvl:3}]}
        `;
        return file;
    }
);
let dHoe = new DraftItem(
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
    "Axe",
    "Gives fully enchanted diamond axe",
    "axe.png",
    (file) => {
        file += `
give @a minecraft:diamond_axe{Enchantments:[{id:"minecraft:efficiency",lvl:5},{id:"minecraft:silk_touch",lvl:1},{id:"minecraft:unbreaking",lvl:3}]}
        `;
        return file;
    }
);
let dTrident = new DraftItem(
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

// Pool: Big
let dACC = new DraftItem(
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
dAT.smallName = "AT";
let d2b2 = new DraftItem(
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
dABD.smallName = "Balanced";

// Pool: Collectors
let dNetherite = new DraftItem(
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
    "Breeds",
    "Gives breed for horse, donkey, mule, llama, wolf, fox, & turtle",
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
dShulker.smallName = "Box";
let dBees = new DraftItem(
    "Bees",
    "Gives all bee-related requirements",
    "bees.png",
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
let dHives = new DraftItem(
    "Hives",
    "Gives the user two 3-bee hives",
    "hive.png",
    itemGiver('bee_nest{BlockEntityTag:{Bees:[{MinOccupationTicks:600,TicksInHive:500,EntityData:{Brain:{memories:{}},HurtByTimestamp:0,HasStung:0b,Attributes:[],Invulnerable:0b,FallFlying:0b,ForcedAge:0,PortalCooldown:0,AbsorptionAmount:0.0f,FallDistance:0.0f,InLove:0,DeathTime:0s,HandDropChances:[0.085f,0.085f],CannotEnterHiveTicks:0,PersistenceRequired:0b,id:"minecraft:bee",Age:0,TicksSincePollination:0,AngerTime:0,Motion:[0.0d,0.0d,0.0d],Health:10.0f,HasNectar:0b,LeftHanded:0b,Air:300s,OnGround:0b,Rotation:[1.2499212f,0.0f],HandItems:[{},{}],ArmorDropChances:[0.085f,0.085f,0.085f,0.085f],Pos:[0.0d,0.0d,0.0d],Fire:-1s,ArmorItems:[{},{},{},{}],CropsGrownSincePollination:0,CanPickUpLoot:0b,HurtTime:0s}},{MinOccupationTicks:600,TicksInHive:500,EntityData:{Brain:{memories:{}},HurtByTimestamp:0,HasStung:0b,Attributes:[],Invulnerable:0b,FallFlying:0b,ForcedAge:0,PortalCooldown:0,AbsorptionAmount:0.0f,FallDistance:0.0f,InLove:0,DeathTime:0s,HandDropChances:[0.085f,0.085f],CannotEnterHiveTicks:0,PersistenceRequired:0b,id:"minecraft:bee",Age:0,TicksSincePollination:0,AngerTime:0,Motion:[0.0d,0.0d,0.0d],Health:10.0f,HasNectar:0b,LeftHanded:0b,Air:300s,OnGround:0b,Rotation:[1.2499212f,0.0f],HandItems:[{},{}],ArmorDropChances:[0.085f,0.085f,0.085f,0.085f],Pos:[0.0d,0.0d,0.0d],Fire:-1s,ArmorItems:[{},{},{},{}],CropsGrownSincePollination:0,CanPickUpLoot:0b,HurtTime:0s}},{MinOccupationTicks:600,TicksInHive:500,EntityData:{Brain:{memories:{}},HurtByTimestamp:0,HasStung:0b,Attributes:[],Invulnerable:0b,FallFlying:0b,ForcedAge:0,PortalCooldown:0,AbsorptionAmount:0.0f,FallDistance:0.0f,InLove:0,DeathTime:0s,HandDropChances:[0.085f,0.085f],CannotEnterHiveTicks:0,PersistenceRequired:0b,id:"minecraft:bee",Age:0,TicksSincePollination:0,AngerTime:0,Motion:[0.0d,0.0d,0.0d],Health:10.0f,HasNectar:0b,LeftHanded:0b,Air:300s,OnGround:0b,Rotation:[1.2499212f,0.0f],HandItems:[{},{}],ArmorDropChances:[0.085f,0.085f,0.085f,0.085f],Pos:[0.0d,0.0d,0.0d],Fire:-1s,ArmorItems:[{},{},{},{}],CropsGrownSincePollination:0,CanPickUpLoot:0b,HurtTime:0s}}]}}', 2)
);

// Pool: misc
let dTotem = new DraftItem(
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
    "Fireworks",
    "Gives 23 gunpowder / paper",
    "firework.png",
    itemGiver("gunpowder", 23, "paper", 23),
);
let dGrace = new DraftItem(
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

let dFireRes = new DraftItem(
    "Fire Resistance",
    "Gives permanent fire resistance.",
    "fres.png",
    (file) => {
        file += `
effect give @a minecraft:fire_resistance 3600
        `;
        return file;
    }
);
dFireRes.fileQuery = "tick.mcfunction";
dFireRes.boxName = "Fire Res";
dFireRes.simpleName = "Fire Res";
let dObi = new DraftItem(
    "Obsidian",
    "Gives 10 obsidian.",
    "obi.png",
    itemGiver("obsidian", 10),
);
let dLogs = new DraftItem(
    "Logs",
    "Gives 16 oak logs.",
    "logs.png",
    itemGiver("oak_log", 16),
);
let dEyes = new DraftItem(
    "Eyes",
    "Gives 2 eyes of ender.",
    "eyes.png",
    itemGiver("ender_eye", 2),
);
let dCrossbow = new DraftItem(
    "Crossbow",
    "Gives a Piercing IV crossbow.",
    "crossbow.png",
    itemGiver('crossbow{Enchantments:[{id:"minecraft:piercing",lvl:4s}]}', 1),
);
let SHULKER_COLOUR=Math.floor(Math.random() * 17)
let dShulkerBoat = new DraftItem(
    "Shulker",
    "Grants a boated shulker at your spawn location.",
    "shulker.png",
    (file) => {
        file += `
/execute at @a run summon minecraft:boat ~ ~2 ~ {Passengers:[{id:shulker,Color:${SHULKER_COLOUR}}]}
        `;
        return file;
    }
)

let dRods = new DraftItem(
    "Rod Rates",
    "Blazes never drop 0 rods.",
    "blaze.png",
    (file) => {
        file += `
{
  "type": "minecraft:entity",
  "pools": [
    {
      "rolls": 1,
      "entries": [
        {
          "type": "minecraft:item",
          "functions": [
            {
              "function": "minecraft:set_count",
              "count": {
                "min": 1.0,
                "max": 1.0,
                "type": "minecraft:uniform"
              }
            },
            {
              "function": "minecraft:looting_enchant",
              "count": {
                "min": 0.0,
                "max": 1.0
              }
            }
          ],
          "name": "minecraft:blaze_rod"
        }
      ],
      "conditions": [
        {
          "condition": "minecraft:killed_by_player"
        }
      ]
    }
  ]
}
        `;
        return file;
    }
)
dRods.fileQuery = "draaftpack/data/minecraft/loot_tables/entities/blaze.json";

let pArmour = new DraftPool("armour", "Armour", [
    dHelmet,
    dChestplate,
    dLeggings,
    dBoots,
    dBucket,
]);

let pTools = new DraftPool("tools", "Tools", [
    dSword,
    dPickaxe,
    dShovel,
    dHoe,
    dAxe,
    dTrident,
]);

let pBiomes = new DraftPool("biomes", "Biomes", [
    dMesa,
    dJungle,
    dSnowy,
    dMegaTaiga,
    dMushroomIsland,
]);

let pCollectors = new DraftPool("collectors", "Collectors", [
    dNetherite,
    dShells,
    dSkulls,
    dBreeds,
    dShulker,
    dBees,
]);

let pBig = new DraftPool("big", "Multi-Part Advancements", [
    dACC,
    dAT,
    d2b2,
    dMH,
    dABD,
]);

let pMiscOld = new DraftPool("misc", "Misc", [dTotem, dFireworks, dGrace, dLeads]);
let pMisc = new DraftPool("misc", "Misc", [dLeads, dFireRes, dBreeds, dHives, dCrossbow, dShulkerBoat]);

let pEarly = new DraftPool("early", "Early Game", [dFireworks, dShulker, dObi, dLogs, dEyes, dRods]);

export let pools: DraftPool[] = [
    pBiomes,
    pArmour,
    pTools,
    pBig,
    pEarly,
    pMisc,
];

// Use a function for this so that we can fix this horrible implementation later.
export function getDraftItem(id: number) {
    return allItems[id - 1];
}
