import {
  Events,
  Interaction,
  ModalMessageModalSubmitInteraction,
} from "discord.js";
import { Db } from "mongodb";

export default {
  name: Events.InteractionCreate,
  async execute(
    interaction: Interaction,
    db: Db,
    slashCommands: any[],
    contextCommands: any[]
  ) {
    // Modal submit interaction
    if (interaction.isModalSubmit()) {
      // return await modalHandler(
      //   interaction as ModalMessageModalSubmitInteraction
      // );
    }

    if (interaction.isMessageContextMenuCommand()) {
      // console.log(interaction.commandName);
      const command = contextCommands.find(
        (cmd) => cmd.data.name === interaction.commandName
      );

      if (!command)
        return console.error(
          `No context command matching ${interaction.commandName} found`
        );

      try {
        // Execute the command
        await command.execute(interaction);
      } catch (error) {
        console.error(error);
      }
    }

    if (interaction.isChatInputCommand()) {
      const command = slashCommands.find(
        (cmd) => cmd.data.name === interaction.commandName
      );

      // // If the command was executed by another user, log it
      // if (interaction.user.id !== OWNER_USER_ID) {
      //   logger.log(
      //     "info",
      //     `${interaction.user.tag} executed ${
      //       interaction.commandName
      //     } with the options: ${interaction.options.data
      //       .map((option) => `${option.name}: ${option.value}`)
      //       .join(", ")}`
      //   );
      // }

      if (!command)
        return console.error(
          `No slash command matching ${interaction.commandName} found`
        );

      try {
        await command.execute(interaction, db, slashCommands, contextCommands);
      } catch (error) {
        console.error(`Error executing ${interaction.commandName}`);
        console.error(error);
      }
    }
  },
};
