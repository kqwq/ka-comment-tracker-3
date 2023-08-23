import { MongoClient } from "mongodb";
import { config } from "dotenv";
import { dbConstants } from "./constants";
config();

export async function loadDatabase() {
  // Load mongodb database
  const client = new MongoClient(process.env.MONGODB_URI ?? "", {});

  await client.connect();
  return client.db(dbConstants.dbName);
}
