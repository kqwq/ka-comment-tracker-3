import {
  AttachmentBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
  SlashCommandBuilder,
  User,
} from "discord.js";
import { Db } from "mongodb";
import { getAvatarAttachmentFromMessage } from "../util/avatars";
import { friendlyFeedbackTypes } from "../util/constants";

export default {
  data: new SlashCommandBuilder()
    .setName("search")
    .setDescription("Search for messages on Khan Academy")

    // // Content
    .addStringOption((option) =>
      option.setName("content").setDescription("Message contents to search for")
    )

    // Discussion type
    .addStringOption((option) =>
      option
        .setName("feedback_type")
        .setDescription("Filter by discussion type")
        .addChoices(
          { name: "Reply", value: "REPLY" },
          { name: "Answer", value: "ANSWER" },
          { name: "Comment", value: "COMMENT" },
          { name: "Question", value: "QUESTION" },
          { name: "Project help question", value: "PROJECT_HELP_QUESTION" }
        )
    )

    // Author
    .addStringOption((option) =>
      option
        .setName("author")
        .setDescription(
          "Filter by KAID (e.g. kaid_79492645558798574591143) or username (e.g. pamela)"
        )
    )

    // Program ID
    .addStringOption((option) =>
      option
        .setName("program_id")
        .setDescription("Filter by program ID (e.g. 5647155001376768)")
    )

    // After date
    .addStringOption((option) =>
      option
        .setName("after_date")
        .setDescription(
          "Parsed as `new Date(after)` e.g. 1671723951, Sep 5 2020"
        )
    )

    // Before date
    .addStringOption((option) =>
      option
        .setName("before_date")
        .setDescription(
          "Parsed as `new Date(before)` e.g. 1671723951, Sep 5 2020"
        )
    )

    //Sort by
    .addStringOption((option) =>
      option
        .setName("sort_by")
        .setDescription("Sort results by")
        .addChoices(
          { name: "Date (Newest) - Default", value: "date-new" },
          { name: "Date (Oldest)", value: "date-old" },
          { name: "Length (Shortest)", value: "length-short" },
          { name: "Length (Longest)", value: "length-long" },
          { name: "Upvotes (Most)", value: "upvotes-most" },
          { name: "Upvotes (Least)", value: "upvotes-least" },
          { name: "Replies (Most)", value: "replies-most" },
          { name: "Randomized", value: "random" },
          { name: "Low quality score (Lowest)", value: "lqs-low" },
          { name: "Low quality score (Highest)", value: "lqs-high" }
        )
    ),

  async execute(interaction: ChatInputCommandInteraction, db: Db) {
    // Defer interaction
    await interaction.deferReply();

    // Get options
    const content = interaction.options.getString("content");
    const feedbackType = interaction.options.getString("feedback_type");
    const author = interaction.options.getString("author");
    const programID = interaction.options.getString("program_id");
    const afterDate = interaction.options.getString("after_date");
    const beforeDate = interaction.options.getString("before_date");
    const sortBy = interaction.options.getString("sort_by");

    // Set up mongo query
    const queryDescription = ["Find all comments"];
    const messages = db.collection("khan-academy-messages");
    const query: any = {};
    const options: any = {
      projection: {
        author: 1,
        content: 1,
        date: 1,
        definitelyNotSpam: 1,
        feedbackType: 1,
        focus: 1,
        focusUrl: 1,
        key: 1,
        lowQualityScore: 1,
        replyCount: 1,
        replyExpandKeys: 1,
      },
    };

    // Content
    if (content) {
      // Query by phrase
      query.$text = { $search: `"${content}"` };
      queryDescription.push(`containing \`${content}\``);
    }

    // Feedback type
    if (feedbackType) {
      query.feedbackType = feedbackType;
      queryDescription.push(`of type \`${feedbackType}\``);
    }

    // Author
    if (author) {
      query.author = author;
      queryDescription.push(`by \`${author}\``);
    }

    // Program ID
    if (programID) {
      query.programID = programID;
      queryDescription.push(`on program \`${programID}\``);
    }

    // After date
    if (afterDate) {
      query.date = { $gte: new Date(afterDate) };
      queryDescription.push(`after \`${afterDate}\``);
    }

    // Before date
    if (beforeDate) {
      query.date = { $lte: new Date(beforeDate) };
      queryDescription.push(`before \`${beforeDate}\``);
    }

    // Sort by
    if (sortBy) {
      switch (sortBy) {
        case "date-new":
          options.sort = { date: -1 };
          queryDescription.push(`sorted by date (newest)`);
          break;
        case "date-old":
          options.sort = { date: 1 };
          queryDescription.push(`sorted by date (oldest)`);
          break;
        case "length-short":
          options.sort = { length: 1 };
          queryDescription.push(`sorted by length (shortest)`);
          break;
        case "length-long":
          options.sort = { length: -1 };
          queryDescription.push(`sorted by length (longest)`);
          break;
        case "upvotes-most":
          options.sort = { sumVotesIncremented: -1 };
          queryDescription.push(`sorted by upvotes (most)`);
          break;
        case "upvotes-least":
          options.sort = { sumVotesIncremented: 1 };
          queryDescription.push(`sorted by upvotes (least)`);
          break;
        case "replies-most":
          options.sort = { numReplies: -1 };
          queryDescription.push(`sorted by replies (most)`);
          break;
        case "random":
          queryDescription.push(`sorted randomly (not IMPLEMENTED)`);
          break;
        case "lqs-low":
          options.sort = { lowQualityScore: 1 };
          queryDescription.push(`sorted by low quality score (lowest)`);
          break;
        case "lqs-high":
          options.sort = { lowQualityScore: -1 };
          queryDescription.push(`sorted by low quality score (highest)`);
          break;
      }
    }

    // Set description
    const queryDescriptionStr = queryDescription.join(" ") + ".";
    await interaction.editReply({ content: queryDescriptionStr });

    // Find number of collections
    console.log("query", query);
    const documentCount = await messages.countDocuments(query);

    // Find one
    const message: any = await messages.findOne(query, options);

    // Cache image
    const avatarImg = await getAvatarAttachmentFromMessage(message);

    // Create embed
    const embed = new EmbedBuilder()
      .setTitle(`1 of ${documentCount}`)
      .setDescription(message?.content?.slice(0, 4096))
      .setColor("Random")
      .setTimestamp(message?.date)
      .setFooter({
        text: `${friendlyFeedbackTypes[message?.feedbackType]} by ${
          message?.author?.nickname
        }`,
        iconURL: "attachment://avatar.svg",
      })
      .addFields
      // { name: "Author", value: `[${messag}]`, inline: true },
      // { name: "Program ID", value: message?.programID, inline: true },
      ();

    const attachment = new AttachmentBuilder(avatarImg ?? "").setName(
      "avatar.svg"
    );

    // Send embed
    await interaction.editReply({ embeds: [embed], files: [attachment] });
  },
};
