# Folderbot Documentation (AA Paceman Extension)

**To join the bot to your channel, click: https://folderbot.disrespec.tech/oauth?scopes=channel:bot**

**There is currently no way to remove the bot (I guess you could just ban it lol)**

Commands List:

## Configuration / Setup Commands

#### `?setplayer` (**broadcaster only**)

Set the default Minecraft username for your channel. e.g. after `?setplayer NOHACKSJUSTTIGER`, running a stats command like `?latest` by itself will assume you want the latest AA Paceman data for the user `NOHACKSJUSTTIGER`.

#### `?restrict` (**broadcaster only**)

Restrict ***all bot output*** to be produced only for commands from moderators or only the broadcaster. To see valid options:

```
DesktopFolder: ?restrict invalid_value
folderbot: Invalid restriction "invalid_value". Valid options: none, moderator, broadcaster
```

Example: `?restrict moderator` means that any non-moderator chatter runnning `?info` (or any other command) will get absolutely no bot output, including errors.

## Statistics Commands

*Note: For commands where it makes sense (& is implemented properly haha), !total instead of a playername will give the result for all players combined.*

*Note 2: For commands where it makes sense, the default split is `nether`, and the default player is the `?setplayer` player (or the channel name if `?setplayer` has not been used).*

*Note 3: All stats commands support time ranges. A variety of formats are accepted, but the easiest is just NdNhNmNs, i.e. 3h1s is 3 hours & 1 second, or 7d10m is 7 days and 10 minutes, etc. A few commands have ordering specifics for time ranges due to requiring time ranges for the commands themselves; these commands have explicit documentation below.*

*Note 4: All splits made available from the Paceman API can be used: `['nether', 'bastion', 'fortress', 'first_portal', 'stronghold', 'end', 'elytra', 'credits', 'finish']`*

#### `?aalb`

Queries **Totorewa**'s AA Leaderboard API to get *[unverified AA leaderboard](https://docs.google.com/spreadsheets/d/107ijqjELTQQ29KW4phUmtvYFTX9-pfHsjb18TKoWACk/)* information. This is the leaderboard used by most players & AA community members.

The syntax for this is quite powerful, but as the API is not mine, I can't really fully document it here. (it is really cool though, shoutout to Totorewa). Here are some examples:

```
DesktopFolder: ?aalb
folderbot: AA RSG #15: DesktopFolder (2:51:06)
DesktopFolder: ?aalb top 10
folderbot: AA RSG #1: Feinberg (2:05:48) | CroProYT (2:17:28) | Oxidiot (2:19:57) | DoyPingu (2:21:25) | infume (2:21:33) | snakezy (2:22:20) | cooshW (2:28:24) | Xia_Wen (2:28:29) | dbowzer (2:32:27) | Thunderstorming (2:34:35)
DesktopFolder: ?aalb thunderless
folderbot: Sub-3 Thunderless #15: DesktopFolder (2:50:26)
DesktopFolder: ?aalb 41
folderbot: AA RSG #41: okrzej_ (3:32:24)
```

#### `?average`

Get average time for a split. Examples:

```
DesktopFolder: ?average elytra
folderbot: Average AA elytra for DesktopFolder: 24:40 (sample: 79) (median: 25:05)
DesktopFolder: ?average !total
folderbot: Average AA nether for Playerbase: 04:13 (sample: 25312) (median: 04:03)
```

#### `?conversion`

Get conversion between two splits. **Two splits are required. They must come first in the arguments list (i.e. `?conversion 10d end elytra` is invalid, you must instead do `?conversion end elytra 10d`.**

Example:

```
DesktopFolder: ?conversion bastion first_portal doypingu
folderbot: 51.31% (548 / 1068) of doypingu's AA bastion splits lead to starting first_portal splits.
DesktopFolder: ?conversion elytra credits feinberg 72d
folderbot: 92.86% (26 / 28) of feinberg's AA elytra splits lead to starting credits splits. (in the last 1728:00:00)
```

#### `?count`

Counts the number of instances of a split.

```
DesktopFolder: ?count elytra
folderbot: DesktopFolder has 79 known elytra times. Fastest: 18:55
DesktopFolder: ?count bastion !total
folderbot: There are 14596 known bastion times. Fastest: 01:11 (by Ravalle)
```

#### `?pb`

Prints the best time for a split. *Note: this command's default split is `finish`, not `nether`.*

```
DesktopFolder: ?pb
folderbot: Best known finish: 2:51:06 (125 days, 3:31:51 ago)
DesktopFolder: ?pb !total
folderbot: Best known finish: 2:05:48 (by Feinberg) (60 days, 4:13:31 ago)
DesktopFolder: ?pb !total 30d
folderbot: Best known finish (in the last 720:00:00): 3:05:07 (by DesktopFolder) (1 day, 9:44:29 ago)
```

#### `?lb`

Gets top Paceman times for a split. *Note: this command's default split is `finish`, not `nether`.

```
DesktopFolder: ?lb elytra 30d
folderbot: Top 5 elytra times for Playerbase: 1. 0:12:46 (DoyPingu), 2. 0:14:37 (CroProYT), 3. 0:14:45 (DoyPingu), 4. 0:15:01 (DoyPingu), 5. 0:15:11 (Feinberg)
```

#### `?countlt`

Counts instances of a split that are slower than or equal to a specific time. **This time must be specified as the first argument. All other arguments (including the optional time range) are parsed as normal as long as they go after.** The format for the time (*not the time range*) here is somewhat pickier (must be either a number, which will be parsed as minutes, number:number, which will be parsed as minutes:seconds, or number:number:number, which will be parsed as hours:minutes:seconds)

```
DesktopFolder: ?countlt 25 elytra !total 100d
folderbot: There are 898 known elytra times faster than 25:00. (in the last 2400:00:00)
DesktopFolder: ?countlt 3:30 nether 100d
folderbot: DesktopFolder has 26 known nether times faster than 03:30. (in the last 2400:00:00) 
```

#### `?countgt`

Counts instances of a split that are strictly faster than a specific time. This command is essentially identical to `?countlt`, so please read its documentation instead, thank you!

#### `?latest`

Finally a normal Paceman style command. Just does the normal thing and prints your latest tracked run. Still takes all the normal parameters if you want.

```
DesktopFolder: ?latest doypingu
folderbot: Latest nether for doypingu: nether: 03:42 (23:33 ago)
DesktopFolder: ?latest doypingu bastion
folderbot: Latest bastion for doypingu: nether: 03:52, bastion: 04:32 (1 day, 0:12 ago)
DesktopFolder: ?latest doypingu bastion 1d
folderbot: Could not find any bastion in the last 24:00:00 for the player doypingu
```

#### `?trend`

Mediocre attempt at doing trend analysis. Just read the example, it's not too crazy.

```
DesktopFolder: ?trend elytra 100d
folderbot: All-time average elytra split (in the last 2400:00:00) for DesktopFolder is 24:21 (sample: 16). Last 5 average is 24:37. That is roughly 00:16 slower.
```

Yikes!! Look away, here's another example:

```
DesktopFolder: ?trend elytra 300d doypingu
folderbot: All-time average elytra split (in the last 7200:00:00) for doypingu is 17:51 (sample: 175). Last 50 average is 16:39. That is roughly 01:12 faster, nice!
```

#### `?session`

does this one even need documentation it's just a session command. I guess there's a lot of code in here which I should probably mention edge cases for but frankly, do you care? I didn't think so. but I guess I should mention, the bot doesn't know anything about your actual session. it just cuts you a new session if there's a 3+ hour gap between nether enters. frankly if you go that long, you should take a break anyways. get up, walk around, go for a hike or a bike ride, get some sun, it's good for you. *please note: this piece of documentation is not targeted at anyone in particular.*

#### `?bastion_breakdown`

The first real stats command I made for this thing. It's kind of useless but it's cute in like a, aww, I'm sure you'll be useful to someone some day kind of way, you know?

```
DesktopFolder: ?bastion_breakdown
folderbot: Bastion conversion breakdown for DesktopFolder: Conversion for < 3:30 nethers: 62.5% (56) | Conversion for 3:30-4:00 nethers: 66.67% (102) | Conversion for 4:00-4:30 nethers: 65.64% (163) | Conversion for 4:30-5:00 nethers: 65.47% (139) | Conversion for > 5:00 nethers: 58.68% (121) 
```

Basically, this gives you "% conversion rate nether -> bastion based on nether enter". e.g. in the command above, we see that 62.5% of my 3:30 nether enters lead to a bastion enter. That's a big number! Somehow it's smaller than 4:30-5:00 nethers, which is probably because Minecraft auto-detects good pace and actually removes structures from the nether. As this information is written in a piece of documentation, you must now trust it.

## Help / Documentation Commands

#### `?aapaceman`

Sends the setup link for AA paceman. [You can just click here instead.](https://discord.com/channels/835893596992438372/835893596992438375/1330305232516677733)

#### `?botdiscord`

Sends the link to my Discord where you can ask questions, mention bot issues, etc etc. Or you can just ping me somewhere else, I don't care, it's your life.

#### `?paceman`

Prints a link to the Paceman AA page for a player. <s>this is useful because it's really annoying to get there otherwise like seriously where is this linked on the main page</s>

#### `?about`

Says, and I do quote here: "Made by DesktopFolder. Uses stats from Jojoe's Paceman AA API. Uses local caching to reduce API calls." Fascinating, I know.

#### `?info`

Unlike the rest of this section, potentially useful. I mean, it prints metainformation about the bot:

```
DesktopFolder: ?info
folderbot: Time since update: 0:00:01. (0:43:12 before this command) Bot knows of 26 channels (20 joined). 25312 known AA runs. Latest nether: 03:42 by Queenkac (0:11:42 ago). ~2724 total statistics queries made. 
```

#### `?help`

Prints arbitrary help information based on what I thought was most useful to stuff into a small chat response. Not necessarily helpful.

#### `?statcommands`

Lists (some of?) the commands that do stats-related things, I guess.

#### `?all`

Lists ""all"" of the commands.

#### `?join`

Prints the link from the top of this page, which allows you to join the bot to your channel. To check that it worked properly, please try a command like `?info` in your chat. It may take a few minutes for the bot to be properly added, however, if there is still no output from `?info`, feel free to send a message.

#### `?test_parse`

Shows how your command arguments parse to Folderbot. Generally, all commands will "figure out" what you want, however there can be unexpected side effects of this, so `?test_parse` can help clarify unexpected behaviour. Example:

```
DesktopFolder: ?test_parse john 7d
folderbot: Parsed player as john, time range as 168:00:00, and split as nether
DesktopFolder: ?test_parse 7w elytra
folderbot: Parsed player as 7w, time range as None, and split as elytra 
```

Here, we see that `7d` is parsed as a time range (168 hours), whereas `7w` is parsed as a player name (because `w` is not a valid time range specifier at present). This is the same parsing logic used for all stats commands.

## Metainformation

General command format:

All stats commands generally work the same. They all allow for player filtering, and generally have default splits, but in order to specify the player, you'll have to ensure you specify all arguments to the left. For example: `?latest` gets the latest nether (default split) for the current streamer (default player); `?latest bastion` gets the latest bastion, and `?latest bastion DesktopFolder` gets the latest bastion for DesktopFolder, but `?latest DesktopFolder` will try to get the latest DesktopFolder split (not a thing). This may be improved in the future.

Because the 'empty player' is presumed to be the streamer, a different argument is required to run stats commands over the entire playerbase - this is `!total`. For example, `?count elytra !total` gets the total number of elytras.


