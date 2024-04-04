import {
    world,
    system,
    EntityInventoryComponent,
    EntityDieAfterEvent,
    BlockInventoryComponent,
    EntityEquippableComponent,
} from "@minecraft/server";

/**
 * 
 * @param {BlockInventoryComponent} chestInventory 
 * @param {EntityInventoryComponent} playerEquip 
 * @param {string} equipPos 
 * @param {number} idx 
 */
function equipItemMove(chestInventory, playerEquip, equipPos, idx) {
    if (playerEquip.getEquipment(equipPos) !== undefined) {
        chestInventory.container.setItem(idx, playerEquip.getEquipment(equipPos).clone());
        playerEquip.setEquipment(equipPos, undefined);
    }


}


/**
 * 플레이어가 죽고 나서의 동작을 지정
 * @param {EntityDieAfterEvent} event 
 */
function handleDeadPlayerItem(event) {
    const playerDimension = event.deadEntity.dimension.id;  
    const playerLocation = event.deadEntity.location;

    /** @type {EntityInventoryComponent}*/
    const playerInventory = event.deadEntity.getComponent("minecraft:inventory");

    world.getDimension(playerDimension).runCommand(
        `/setblock ${playerLocation.x} ${playerLocation.y + 1} ${playerLocation.z} chest replace`
    );
    world.getDimension(playerDimension).runCommand(
        `/setblock ${playerLocation.x + 1} ${playerLocation.y + 1} ${playerLocation.z} chest replace`
    );

    const targetChest = world.getDimension(playerDimension).getBlock({
        x : playerLocation.x,
        y : playerLocation.y + 1,
        z : playerLocation.z
    });


    // world.sendMessage(targetChest.getComponent("destructible_by_explosion").typeId);

    /** @type {BlockInventoryComponent}*/
    const inventoryComponent = targetChest.getComponent("inventory");
    for (let i = 0; i < playerInventory.container.size; ++i) {

        if (playerInventory.container.getItem(i) !== undefined)
        inventoryComponent.container.setItem(i, 
            playerInventory.container.getItem(i).clone()
        );
    }


    /**@type {EntityEquippableComponent} */
    const playerEquipment = event.deadEntity.getComponent("minecraft:equippable");
    let chestRevIdx = inventoryComponent.container.size - 1;
    equipItemMove(inventoryComponent, playerEquipment, "Head", chestRevIdx--);
    equipItemMove(inventoryComponent, playerEquipment, "Chest", chestRevIdx--);
    equipItemMove(inventoryComponent, playerEquipment, "Legs", chestRevIdx--);
    equipItemMove(inventoryComponent, playerEquipment, "Feet", chestRevIdx--);
    equipItemMove(inventoryComponent, playerEquipment, "Offhand", chestRevIdx--);

    for (let i = 0; i < parseInt((event.deadEntity.level * 7)/2); ++i) {
        world.getDimension(playerDimension).spawnEntity("minecraft:xp_orb", playerLocation);
    }
    playerInventory.container.clearAll();
    event.deadEntity.resetLevel();

    event.deadEntity.sendMessage(
        `Dead Location: ${parseInt(playerLocation.x)} ${parseInt(playerLocation.y)} ${parseInt(playerLocation.z)} (${playerDimension})`
    );   
}

/**
 * 플레이어가 죽고 나서의 동작을 지정
 * @param {EntityDieAfterEvent} event 
 */
function startAfterPlayerDeath(event) {
 
    if (event.deadEntity.typeId !== "minecraft:player") {
        return;
    }

    system.runTimeout(()=>{ handleDeadPlayerItem(event) }, 40);

}


world.afterEvents.entityDie.subscribe( startAfterPlayerDeath );
world.getDimension("minecraft:overworld").runCommandAsync("/gamerule keepinventory true");
world.getDimension("minecraft:nether").runCommandAsync("/gamerule keepinventory true");
world.getDimension("minecraft:the_end").runCommandAsync("/gamerule keepinventory true");