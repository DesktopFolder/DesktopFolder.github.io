"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pools = exports.DraftPool = exports.DraftItem = void 0;
exports.hover = hover;
function hover(description, id) {
    var ele = document.getElementById(id);
    if (ele == null) {
        console.error("Uh-oh! Could not set hover text to ".concat(description, " - couldn't find ").concat(id));
    }
    else {
        ele.innerHTML = description;
    }
}
var DraftItem = /** @class */ (function () {
    function DraftItem(id, pool, prettyName, description, image, datapackModifier) {
        this.id = id;
        this.pool = pool;
        this.prettyName = prettyName;
        this.description = description;
        this.image = image;
        this.datapackModifier = datapackModifier;
    }
    DraftItem.prototype.makeDiv = function () {
        return "<div data-di-id=".concat(this.id, " class=\"draft-item basic-box\">\n            <p class=\"draft-item\" id=\"di-").concat(this.id, "\" onmouseover=\"hover('").concat(this.description, "', 'di-").concat(this.id, "')\">").concat(this.prettyName, "</p>  \n        </div>");
    };
    return DraftItem;
}());
exports.DraftItem = DraftItem;
var DraftPool = /** @class */ (function () {
    function DraftPool(id, name, prettyName, items) {
        this.id = id;
        this.name = name;
        this.prettyName = prettyName;
        this.items = items;
    }
    DraftPool.prototype.makeDiv = function () {
        var pools = [];
        for (var _i = 0, _a = this.items; _i < _a.length; _i++) {
            var di = _a[_i];
            pools.push(di.makeDiv());
        }
        return "<div class=\"draft-pool basic-box flex-down\" id=\"pool-".concat(this.name, "\">\n            <div class=\"draft-header basic-box\" id=\"pool-header-").concat(this.name, "\" style=\"text-align:center;\">\n                <p class=\"pool-header\">Pool: ").concat(this.prettyName, "</p>\n            </div>\n            <div class=\"draft-pool-inner flex-right\" id=\"pool-inner-").concat(this.name, "\">\n                ").concat(pools.join("\n"), "\n            </div>\n        </div>\n        ");
    };
    return DraftPool;
}());
exports.DraftPool = DraftPool;
// Pool: biomes
var dMesa = new DraftItem(1, "biomes", "Mesa", "Mesa - Gives all mesa biomes and cave spider kill", "mesa.png", function () { return null; });
var dJungle = new DraftItem(2, "biomes", "Jungle", "Jungle - Gives all jungle biomes, cookie and melon eat, and panda and ocelot breeds.", "jungle.png", function () { return null; });
var dSnowy = new DraftItem(3, "biomes", "Snowy", "Snowy - Gives all snowy biomes and stray kill", "snowy.png", function () { return null; });
var dMegaTaiga = new DraftItem(4, "biomes", "Mega Taiga", "Mega Taiga - Gives all mega taiga biomes", "taiga.png", function () { return null; });
var dMushroomIsland = new DraftItem(5, "biomes", "Mushroom Island", "Mushroom Island - Gives all mushroom biomes and mooshroom breed", "mooshroom.png", function () { return null; });
var pBiomes = new DraftPool(1, "biomes", "Biomes", [
    dMesa,
    dJungle,
    dSnowy,
    dMegaTaiga,
    dMushroomIsland,
]);
exports.pools = [pBiomes];
