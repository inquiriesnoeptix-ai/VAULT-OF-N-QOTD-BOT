const { REST, Routes } = require("discord.js");

const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;

const commands = [
  {
    name: "qotd",
    description: "Fire the daily drop to all 3 channels immediately",
  },
];

const rest = new REST({ version: "10" }).setToken(DISCORD_TOKEN);

(async () => {
  try {
    console.log("Registering /qotd command...");
    await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands });
    console.log("Done. /qotd is registered globally.");
  } catch (err) {
    console.error(err);
  }
})();
