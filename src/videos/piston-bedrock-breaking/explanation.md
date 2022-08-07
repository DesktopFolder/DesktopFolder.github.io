### Piston-Based Bedrock Breaking

Simple explanation based on the following image:

![](https://i.imgur.com/72sA6hw.jpg)

#### 1. Headless pistons can immediately destroy blocks

This is the concept at play on the right side of the image. Updating a headless piston will immediately destroy the block in front of it, replacing it with a block36 (representation of a moving block) of the piston's head. Here, we use it to destroy the extended piston by destroying its head, while also updating it, causing a retraction event to be queued at the location of the extended piston's base.

#### 2. Update order required

We shortpulse the top-right slimeblock in, allowing for the update order of (top-right slimeblock; piston; bottom slimeblock). This means that when the piston arrives and is immediately powered (by some power source, e.g. a redstone block) it is not attached to the bottom slimeblock (which has yet to arrive). It is therefore not attached to the bottom downwards facing piston, which is blocked at this point in the tick. Later in the same tick, the bottom slimeblock arrives, and even later the piston begins to extend, as at this point the extended piston at the bottom is destroyed and therefore no longer blocks the extension. (This covers 2 & 3 in the image)

#### 4. Headless sticky pistons can accelerate block36

We update the headless sticky piston, which immediately drops the block36 of the downwards facing piston at its destination. Its destination is the former location of the piston base of the extended piston, where a retraction event was queued in (1). The retraction event fires, retracting the downwards facing piston and destroying the bedrock underneath.
