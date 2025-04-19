export class DraftItem {
    id;
    pool;
    prettyName;
    description;
    image;
    datapackModifier;
    constructor(id, pool, prettyName, description, image, datapackModifier) {
        this.id = id;
        this.pool = pool;
        this.prettyName = prettyName;
        this.description = description;
        this.image = image;
        this.datapackModifier = datapackModifier;
    }
    makeDiv() {
        let poolItem = document.createElement("div");
        poolItem.setAttribute("data-di-id", this.id.toString());
        poolItem.classList.add("draft-item", "basic-box");
        let poolDefaultText = document.createElement("p");
        poolDefaultText.innerHTML = this.prettyName;
        poolDefaultText.id = `di-${this.id}`;
        poolDefaultText.classList.add("draft-item");
        let poolDescriptionText = document.createElement("p");
        poolDescriptionText.innerHTML = this.description;
        poolDescriptionText.classList.add("draft-item-desc");
        poolItem.addEventListener("mouseenter", () => {
            poolItem.innerHTML = "";
            poolDefaultText.classList.add("with-hover");
            poolItem.appendChild(poolDefaultText);
            poolItem.appendChild(poolDescriptionText);
        });
        /*
        poolItem.addEventListener(
            "mouseleave",
            () => {
                poolItem.innerHTML = ''
                poolDefaultText.classList.remove('with-hover');
                poolItem.appendChild(poolDefaultText)
            }
        );
        */
        poolItem.appendChild(poolDefaultText);
        return poolItem;
    }
}
export class DraftPool {
    id;
    name;
    prettyName;
    items;
    constructor(id, name, prettyName, items) {
        this.id = id;
        this.name = name;
        this.prettyName = prettyName;
        this.items = items;
    }
    makeDiv() {
        let draftPool = document.createElement("div");
        draftPool.classList.add("draft-pool", "basic-box", "flex-down");
        draftPool.id = `pool-${this.name}`;
        let poolHeader = document.createElement("div");
        poolHeader.classList.add("draft-header", "basic-box");
        poolHeader.id = `pool-header-${this.name}`;
        poolHeader.style = "text-align:center;";
        let poolHeaderText = document.createElement("p");
        poolHeaderText.classList.add("pool-header");
        poolHeaderText.innerHTML = `Pool: ${this.prettyName}`;
        poolHeader.appendChild(poolHeaderText);
        draftPool.appendChild(poolHeader);
        // Now create the pool body.
        let poolBody = document.createElement("div");
        poolBody.classList.add("draft-pool-inner", "flex-right");
        for (const di of this.items) {
            poolBody.appendChild(di.makeDiv());
        }
        draftPool.appendChild(poolBody);
        return draftPool;
    }
}
// Pool: biomes
let dMesa = new DraftItem(1, "biomes", "Mesa", "Gives all mesa biomes and cave spider kill", "mesa.png", (file) => {
    file += `
advancement grant @a only minecraft:adventure/adventuring_time minecraft:badlands
advancement grant @a only minecraft:adventure/adventuring_time minecraft:badlands_plateau
advancement grant @a only minecraft:adventure/adventuring_time minecraft:wooded_badlands_plateau
advancement grant @a only minecraft:adventure/kill_all_mobs minecraft:cave_spider
        `;
    return file;
});
let dJungle = new DraftItem(2, "biomes", "Jungle", "Gives jungle biomes, cookie & melon eat, and panda & ocelot breeds.", "jungle.png", (file) => {
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
});
let dSnowy = new DraftItem(3, "biomes", "Snowy", "Gives all snowy biomes and stray kill", "snowy.png", (file) => {
    return file;
});
let dMegaTaiga = new DraftItem(4, "biomes", "Mega Taiga", "Gives all mega taiga biomes", "taiga.png", (file) => {
    return file;
});
let dMushroomIsland = new DraftItem(5, "biomes", "Mushroom Island", "Gives all mushroom biomes and mooshroom breed", "mooshroom.png", (file) => {
    return file;
});
let pBiomes = new DraftPool(1, "biomes", "Biomes", [
    dMesa,
    dJungle,
    dSnowy,
    dMegaTaiga,
    dMushroomIsland,
]);
// Pool: Armour
let dHelmet = new DraftItem(6, "armour", "Helmet", "Gives fully enchanted netherite helmet", "helmet.png", (file) => {
    return file;
});
let dChestplate = new DraftItem(7, "armour", "Chestplate", "Gives fully enchanted netherite chestplate", "chestplate.png", (file) => {
    return file;
});
let dLeggings = new DraftItem(8, "armour", "Leggings", "Gives fully enchanted netherite leggings", "leggings.png", (file) => {
    return file;
});
let dBoots = new DraftItem(9, "armour", "Boots", "Gives fully enchanted netherite boots", "boots.png", (file) => {
    return file;
});
let dBucket = new DraftItem(10, "armour", "Bucket", "Gives a fully enchanted, max-tier bucket", "bucket.png", (file) => {
    return file;
});
let pArmour = new DraftPool(1, "armour", "Armour", [
    dHelmet,
    dChestplate,
    dLeggings,
    dBoots,
    dBucket,
]);
export let pools = [pBiomes, pArmour];
export let allItems = [];
for (const p of pools) {
    for (const i of p.items) {
        allItems.push(i);
        console.assert(allItems.length == i.id, "Oh no, not equal!!");
    }
}
