import {
  ApplicationCommand,
  ApplicationCommandType,
  ContextMenuCommandBuilder,
  REST,
  Routes,
} from "discord.js";
import fs from "node:fs";
import dotenv from "dotenv";
import { developmentGuildId } from "../util/constants";
dotenv.config();

// and deploy your commands!
(async () => {
  const commands: any[] = [];
  // Grab all the command files from the commands directory you created earlier
  const commandFiles = fs
    .readdirSync("commands")
    .filter((file) => file.endsWith(".ts"));

  // Grab the SlashCommandBuilder#toJSON() output of each command's data for deployment
  for (const file of commandFiles) {
    await import(`../commands/${file}`).then((command) => {
      commands.push(command.default.data.toJSON());
    });
  }

  // // Do the same for context commands
  // const contextCommandFiles = fs
  //   .readdirSync("src/contextCommands")
  //   .filter((file) => file.endsWith(".ts"));

  // for (const file of contextCommandFiles) {
  //   await import(`../contextCommands/${file}`).then((command) => {
  //     commands.push(command.default.data.toJSON());
  //   });
  // }

  // Construct and prepare an instance of the REST module
  const rest = new REST({ version: "10" }).setToken(
    process.env.DISCORD_TOKEN as string
  );

  try {
    console.log(
      `Started refreshing ${commands.length} application (/) commands.`
    );

    // The put method is used to fully refresh all commands in the guild with the current set
    const data: any = await rest.put(
      Routes.applicationGuildCommands(
        process.env.DISCORD_CLIENT_ID ?? "",
        developmentGuildId
      ),
      { body: commands }
    );

    const data2: any = await rest.put(
      Routes.applicationCommands(process.env.DISCORD_CLIENT_ID ?? ""),
      {
        body: commands,
      }
    );

    console.log(
      `Successfully reloaded ${data.length} application (/) commands.`
    );
    console.log(`Successfully reloaded ${data2.length} global (/) commands.`);
  } catch (error) {
    // And of course, make sure you catch and log any errors!
    console.error(error);
  }
})();
