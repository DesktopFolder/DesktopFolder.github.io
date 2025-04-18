# Folderbot Documentation (AA Paceman Extension)

Metainformation:
- All commands start with a ?
- Any command that modifies the bot's per-channel status must be done by the broadcaster (e.g. `?setplayer`)

General command format:

All stats commands generally work the same. They all allow for player filtering, and generally have default splits, but in order to specify the player, you'll have to ensure you specify all arguments to the left. For example: `?latest` gets the latest nether (default split) for the current streamer (default player); `?latest bastion` gets the latest bastion, and `?latest bastion DesktopFolder` gets the latest bastion for DesktopFolder, but `?latest DesktopFolder` will try to get the latest DesktopFolder split (not a thing). This may be improved in the future.

Because the 'empty player' is presumed to be the streamer, a different argument is required to run stats commands over the entire playerbase - this is `!total`. For example, `?count elytra !total` gets the total number of elytras.


