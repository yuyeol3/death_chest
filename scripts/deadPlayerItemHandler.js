import {
    world,
    system,
    EntityInventoryComponent,
    EntityDieAfterEvent,
    BlockInventoryComponent,
    EntityEquippableComponent
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
    let targetChest = world.getDimension(playerDimension).getBlock({
        x : playerLocation.x,
        y : playerLocation.y + 1,
        z : playerLocation.z
    });

    let nearBlocks = [ targetChest?.east(), targetChest?.west(), targetChest?.south(), targetChest?.north() ];

    let replaced = false;
    let direction = 0;
    for (const block of nearBlocks) {

        if (block.isAir) {
            if (direction < 2) {
                world.getDimension(playerDimension).runCommand(
                    `setblock ${playerLocation.x} ${playerLocation.y + 1} ${playerLocation.z} chest ["minecraft:cardinal_direction" : "south"] replace`
                );
                world.getDimension(playerDimension).runCommand(
                    `setblock ${block.x} ${block.y} ${block.z} chest ["minecraft:cardinal_direction" : "south"] replace`
                );
            
            } else {
                world.getDimension(playerDimension).runCommand(
                    `setblock ${playerLocation.x} ${playerLocation.y + 1} ${playerLocation.z} chest ["minecraft:cardinal_direction" : "east"] replace`
                );
                world.getDimension(playerDimension).runCommand(
                    `setblock ${block.x} ${block.y} ${block.z} chest ["minecraft:cardinal_direction" : "east"] replace`
                );
            }   
            replaced = true;
            break;
        }
        direction++;
    }


    if (replaced === false) {
        world.getDimension(playerDimension).runCommand(
            `/setblock ${playerLocation.x} ${playerLocation.y + 1} ${playerLocation.z} chest replace`
        );

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
 * @param {import("@minecraft/server").Vector3} playerLocation
 * @param {string} playerDimension
 */
function handleDeadPlayerItem(event, playerLocation, playerDimension) {
    
    // 폭발 때문에 죽은 경우 -> 남은 폭발 때문에 생성된 상자가 터지지 않도록 처리
    if (event.damageSource.cause === "entityExplosion") {
        world.getDimension(playerDimension).runCommand(`gamerule mobgriefing false`);
        world.getDimension(playerDimension).runCommand(`gamerule tntexplodes false`);
    
        system.runTimeout(()=>{
            world.getDimension(playerDimension).runCommand(`gamerule mobgriefing true`);
            world.getDimension(playerDimension).runCommand(`gamerule tntexplodes true`);
        }, 30);
    }

    // 플레이어 인벤토리 내 아이템 이동
    /** @type {EntityInventoryComponent}*/
    const playerInventory = event.deadEntity.getComponent("minecraft:inventory");
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

    // 플레이어 장비 이동
    /**@type {EntityEquippableComponent} */
    const playerEquipment = event.deadEntity.getComponent("minecraft:equippable");
    const equipPosList = ["Head", "Chest", "Legs", "Feet", "Offhand"];
    let chestRevIdx = inventoryComponent.container.size - 1;
    for (const pos of equipPosList) {
        equipItemMove(inventoryComponent, playerEquipment, pos, chestRevIdx--);
    }

    // 레벨 구슬 생성
    for (let i = 0; i < parseInt((event.deadEntity.level * 7)/2); ++i) {
        world.getDimension(playerDimension).spawnEntity("minecraft:xp_orb", playerLocation);
    }
    playerInventory.container.clearAll();
    event.deadEntity.resetLevel();

    // 사망 위치 메시지 전송
    event.deadEntity.sendMessage(
        `Dead Location: ${parseInt(playerLocation.x)} ${parseInt(playerLocation.y)} ${parseInt(playerLocation.z)} (${playerDimension})`
    ); 

}

/**
 * 플레이어가 죽고 나서의 동작을 지정
 * @param {EntityDieAfterEvent} event 
 */
export function startAfterPlayerDeath(event) {


    if (event.deadEntity.typeId !== "minecraft:player") {
        return;
    }

    // 딜레이 때문에 플레이어가 리스폰 버튼을 빨리 누르면 다시 태어난 그 위치에 상자가 생성되는 현상 방지
    const playerDimension = event.deadEntity.dimension.id;
    const playerLocation = { ...event.deadEntity.location };
    playerLocation.y = checkYLim(playerLocation, playerDimension);

    system.runTimeout(()=>{
        try {handleDeadPlayerItem(event, playerLocation, playerDimension)} 
        catch (err) { world.sendMessage(`[death_chest.Error] ${err.toString()}`) }
    }, 20);
}