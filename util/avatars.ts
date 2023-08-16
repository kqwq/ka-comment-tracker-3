import fs from "fs";

function checkFileExists(file: string) {
  return fs.promises
    .access(file, fs.constants.F_OK)
    .then(() => true)
    .catch(() => false);
}

export async function getAvatarAttachmentFromMessage(message: any) {
  // Extract vars
  console.log(message);
  const avatarUrlPart = message?.author?.avatar?.imageSrc;
  if (!avatarUrlPart) return null;
  const avatarImageSrc = `https://khanacademy.org${avatarUrlPart}`;
  const avatarFileName = avatarUrlPart.split("/").at(-1);

  // Check if avatarFileName exists in /images/ cache
  const avatarFilePath = `images/${avatarFileName}`;
  const exists = await checkFileExists(avatarFilePath);
  if (exists) {
    // Return cached image
    const contents = await fs.promises.readFile(avatarFilePath);
    return Buffer.from(contents);
  }

  // Download image
  const avatarImage = await fetch(avatarImageSrc);
  const contents = await avatarImage.text();
  await fs.promises.writeFile(avatarFilePath, contents);

  // Return image
  return Buffer.from(contents);
}
