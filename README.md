## Death Chest

This code is designed to handle player deaths in a Minecraft Bedrock environment. It consists of several functions and event subscriptions aimed at managing player inventory and equipment upon death.

### Functionality

1. **Player Death Handling (`handleDeadPlayerItem` function):**
   - When a player dies, this function is called.
   - It creates a chest at the death location and moves the player's inventory and equipped items into the chest.
   - Experience orbs are spawned based on the player's level.
   - The player's level is reset.
   - A message indicating the death location is sent to the player.

1. **Item Movement (`equipItemMove` function):**
   - This function moves items from a specific equipment slot of the player to the chest.

1. **Experience Orb Generation:**
   - Experience orbs are spawned based on the player's level.

1. **Death Location Message:**
   - Sends a message to the player indicating the location of death.


### Usage

To use this code:

1. Install the necessary modules using `npm i`.
1. Compress all files within the project directory and change the extension to `.mcpack`.
1. Execute the resulting file to install the Behavior Pack.

### Notes

- This code assumes a certain server environment and utilizes specific Minecraft server API components such as `@minecraft/server`.
- Ensure that appropriate permissions are set for executing commands and accessing player inventories.
- Customize the message formats and any additional behaviors as needed for your server's gameplay.

### Dependencies

- `@minecraft/server`: This dependency provides access to Minecraft server API components necessary for interacting with entities, inventories, and events.

### Compatibility

- This code is designed to work within a Minecraft Bedrock Edition

