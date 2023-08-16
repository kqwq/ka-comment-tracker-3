import { Client, Events } from "discord.js";
import { setBotStatus } from "../util/botStatus";
import { Db } from "mongodb";

export default {
  name: Events.ClientReady,
  once: true,
  execute(client: Client, db: Db) {
    console.log(`🌐 Ready! Logged in as ${client.user?.tag}`);
    setBotStatus(client, db);
  },
};
