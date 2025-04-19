tellraw @a {"text": "AAEventMod datapack is enabled.", "color": "#00aa00"}

execute as @e[type=cat,sort=nearest,limit=1] run data merge entity @s {CatType:10}
advancement grant @p only minecraft:nether/create_full_beacon
gamerule keepInventory true