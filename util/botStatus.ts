import { ActivityType, Client } from "discord.js";
import { Db } from "mongodb";

export async function setBotStatus(client: Client, db: Db) {
  // Get number of documents that exist under the collection "khan-academy-messages"
  const collection = db.collection("khan-academy-messages");
  const count = await collection.countDocuments();

  client.user &&
    client.user.setActivity(`${count.toLocaleString()} comments`, {
      type: ActivityType.Watching,
    });
}
