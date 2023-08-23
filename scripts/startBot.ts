// Imports
import { Client, GatewayIntentBits } from "discord.js";
import * as dotenv from "dotenv";
import { loadDatabase } from "../util/db";
import { Db } from "mongodb";
import path from "path";
import fs from "fs";

// Config
dotenv.config();

// Create client
const client = new Client({
  intents: [],
});

/**
 * Loads slash commands
 */
export async function loadSlashCommands() {
  const slashCommands: any[] = [];
  const commandsPath = path.join(__dirname, "..", "commands");
  // Return list of files ending with .ts in commandsPath
  const commandFiles = fs.readdirSync(commandsPath).filter((file) => {
    return file.endsWith(".ts");
  });
  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = await import(filePath).then((command) => command.default);
    slashCommands.push(command);
  }
  return slashCommands;
}

/**
 * Handle events
 */
export async function handleClientEvents(
  client: Client,
  // MongoDB database type
  db: Db,
  slashCommands: any[]
) {
  const eventsPath = path.join(__dirname, "..", "events");
  const eventFiles = fs
    .readdirSync(eventsPath)
    .filter((file) => file.endsWith(".ts"));
  for (const file of eventFiles) {
    const filePath = path.join(eventsPath, file);
    const event = await import(filePath).then((event) => event.default);
    if (event.once) {
      client.once(event.name, (...args) =>
        event.execute(...args, db, slashCommands)
      );
    } else {
      client.on(event.name, (...args) =>
        event.execute(...args, db, slashCommands)
      );
    }
  }
}

async function main() {
  // Load commands and event handlers
  console.log("🟡 Loading Mongo database...");
  const db = await loadDatabase();
  console.log("🟢 Connected to Mongo database");
  const slashCommands = await loadSlashCommands();
  await handleClientEvents(client, db, slashCommands);
  console.log(`🌐 Loaded ${slashCommands.length} slash commands`);

  // Log in using token
  client.login(process.env.DISCORD_TOKEN);
}

main();
