### Infinite 3-Way Bedrock Breaker: FAQ

This page is a work in progress, along with several other planned resources.

#### How do I adjust this machine for a greater width?

As I have time / energy, I will make litematics for greater widths. If you want to adjust it yourself, I'll try and put a simple guide here soon, then make a video for it. The basic gist is that you need both minecart players to move an extra block each per block you add to the width.

#### How do I adjust this machine for a greater render distance?

You need to move all 3 players 1 chunk away from the machine per chunk added to the entity processing distance. The current download is calibrated for 7 simulation distance. It appears that on servers, this is equivalent to 8 render distance, but 9 render distance in single player. So on a server, for 16 render distance, you would need to move each player away (15 - 7 =) 8 chunks from their current position, relative to the machine. In single player, for 16 render distance, you would need to move each player (14 - 7 =) 7 chunks away.

For the two minecart players, you must also move their return stations the same distance. You must also move the player offset holder (floating machine to the left of the left player) the same distance, along with its timer observer (floating near to the holder).

For the piston placing player, you must be careful. Desu designed the instant wire such that it is very easy to extend (n) chunks. However, the item and block conveyors for the piston placing player are not set up this way. You may need to do some calculations to ensure the player is always the minimum distance away.

On 1.18.1, ensure you test any configurations carefully (16+ rows), with the correct chunk alignment (that is, the one you plan to use in survival). <s>Due to circular chunk loading, it is theoretically possible (especially at wider configurations) that the end part of the floor placer may be unloaded at some points. This should not happen with the 64 wide version, but I can't guarantee it at all simulation distance / chunk positions, due to it being extremely impractical to test it that thoroughly.</s> <b>I have been informed that chunk loading is not circular in 1.18; only chunk <em>rendering</em> is. Ensure you test, but this should be fine.</b>

#### Can I use this machine in single player?

You can run this machine with carpet bots in single player. Otherwise, you can run [the version that consumes pistons by Desu Desu](https://www.youtube.com/watch?v=Z6AU79TE_CE). The infinite bedrock breaking version requires that all pistons are reclaimed, which requires 3 players.

#### Can I use this machine in the Nether / Overworld?

Yes. This machine has not been checked for snow / thunder proofing. It is recommended that you use a bed bot or similar when running in the overworld.

#### Can I use this machine without a mob switch?

No.
