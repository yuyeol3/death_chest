import { world } from "@minecraft/server";
import { startAfterPlayerDeath } from "./deadPlayerItemHandler"

world.afterEvents.entityDie.subscribe( startAfterPlayerDeath );
world.getDimension("minecraft:overworld").runCommandAsync("/gamerule keepinventory true");
world.getDimension("minecraft:nether").runCommandAsync("/gamerule keepinventory true");
world.getDimension("minecraft:the_end").runCommandAsync("/gamerule keepinventory true");
