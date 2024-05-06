import {
    world,
    system,
    EntityInventoryComponent,
    EntityDieAfterEvent,
    BlockInventoryComponent,
    EntityEquippableComponent,
    ItemStack
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
 * 
 * @param {import("@minecraft/server").Vector3} playerLocation 
 * @param {string} playerDimension 
 */
function checkYLim(playerLocation, playerDimension) {
    if (playerDimension === "minecraft:overworld" && playerLocation.y < -64) {
        return -64;
    }
    
    
    if (playerDimension !== "minecraft:overworld" && playerLocation.y < 0) {
        return 0;
    }

    return playerLocation.y;

}


/**
 * 
 * @param {import("@minecraft/server").Vector3} playerLocation 
 * @param {string} playerDimension 
 * @returns {import("@minecraft/server").Block | undefined}
 */
function createChest(playerLocation, playerDimension) {

    world.getDimension(playerDimension).runCommand(
        `/setblock ${playerLocation.x} ${playerLocation.y + 1} ${playerLocation.z} chest replace`
    );


    let targetChest = world.getDimension(playerDimension).getBlock({
        x : playerLocation.x,
        y : playerLocation.y + 1,
        z : playerLocation.z
    });

    let nearBlocks = [ targetChest.east(), targetChest.west(), targetChest.south(), targetChest.north() ];

    let replaced = false;
    for (const block of nearBlocks) {

        if (block.isAir) {
            world.getDimension(playerDimension).runCommand(
                `/setblock ${block.x} ${block.y} ${block.z} chest replace`
            );
            replaced = !replaced;
            break;
        }
    }


    if (replaced === false) {
        world.getDimension(playerDimension).runCommand(
            `/setblock ${playerLocation.x + 1} ${playerLocation.y + 1} ${playerLocation.z} chest replace`
        );
    }



    return targetChest;

}




/**
 * 플레이어 아이템 핸들링
 * 1. 상자생성
 * 1. 아이템 복사 및 상자에 추가
 * 1. xp_orb 생성
 * 1. 플레이어 인벤토리, 아이템 초기화 
 * @param {EntityDieAfterEvent} event 
 */
function handleDeadPlayerItem(event) {

    const playerDimension = event.deadEntity.dimension.id;  
    const playerLocation = event.deadEntity.location;


    /** @type {EntityInventoryComponent}*/
    const playerInventory = event.deadEntity.getComponent("minecraft:inventory");

    playerLocation.y = checkYLim(playerLocation, playerDimension);
    const targetChest = createChest(playerLocation, playerDimension);


    /** @type {BlockInventoryComponent}*/
    const inventoryComponent = targetChest.getComponent("inventory");
    for (let i = 0; i < playerInventory.container.size; ++i) {

        if (playerInventory.container.getItem(i) !== undefined) {
            inventoryComponent.container.setItem(i, 
                playerInventory.container.getItem(i).clone()
            );
        }

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