const { Client, GatewayIntentBits, EmbedBuilder } = require("discord.js");

// ─── CONFIG ───────────────────────────────────────────────────────────────────
const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const POST_HOUR = 9;
const POST_MINUTE = 0;
const GROWTH_CHANNEL_ID = "1386620798717919345";

// ─── TOPICS (randomised each day) ────────────────────────────────────────────
const ALL_TOPICS = [
  { name: "Identity", emoji: "🔥", color: 0xc8a96e, prompt: "Generate one single confrontational discussion question about identity — the gap between who a man performs versus who he actually is. No quote. No context. Just one sharp question that makes men think." },
  { name: "Discipline", emoji: "🏛️", color: 0x2c3e50, prompt: "Generate one single confrontational discussion question about discipline and showing up daily. No quote. No context. Just one sharp question that exposes whether a man is actually doing the work." },
  { name: "Stoicism", emoji: "⚔️", color: 0x8e44ad, prompt: "Generate one single discussion question rooted in stoic philosophy applied to modern life. No quote. No context. Just one sharp question." },
  { name: "Money & Execution", emoji: "💰", color: 0x1e8449, prompt: "Generate one single confrontational discussion question about money, building income, and execution in 2024-2025. No quote. No context. Just one sharp question." },
  { name: "This Generation", emoji: "⚡", color: 0xe74c3c, prompt: "Generate one single confrontational discussion question about men in this generation — the comfort trap, distraction, and what separates those who build from those who watch. No quote. No context. Just one sharp question." },
  { name: "Psychology", emoji: "🧠", color: 0x6c3483, prompt: "Generate one single discussion question about self-deception, behavioural patterns, or the mental blocks that keep men stuck. No quote. No context. Just one sharp question." },
  { name: "Legacy & Purpose", emoji: "💀", color: 0x2d2d2d, prompt: "Generate one single confrontational discussion question about legacy, purpose, and what a man is actually building with his life. No quote. No context. Just one sharp question." },
];

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

// ─── GENERATE QUESTION ────────────────────────────────────────────────────────
async function generateQuestion(topic) {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 200,
      system: `You are writing for a high-standards men's community called The Forge.
Tone: confrontational, direct, psychological. No motivation. No fluff.
Respond with ONLY the question. No preamble. No explanation. Just the question itself.`,
      messages: [{ role: "user", content: topic.prompt }],
    }),
  });

  const data = await response.json();

  if (!data.content || !data.content[0] || !data.content[0].text) {
    console.error("[BOT] Bad API response:", JSON.stringify(data));
    throw new Error("Invalid API response");
  }

  return data.content[0].text.trim();
}

// ─── SEND DAILY QUESTION ──────────────────────────────────────────────────────
async function sendDailyQuestion() {
  try {
    const topic = ALL_TOPICS[Math.floor(Math.random() * ALL_TOPICS.length)];
    console.log(`[BOT] Generating question — Topic: ${topic.name}`);

    const question = await generateQuestion(topic);

    const channel = await client.channels.fetch(GROWTH_CHANNEL_ID);
    if (!channel) return console.error("[BOT] Channel not found");

    const today = new Date().toLocaleDateString("en-AU", {
      weekday: "long", year: "numeric", month: "long", day: "numeric",
    });

    const embed = new EmbedBuilder()
      .setColor(topic.color)
      .setAuthor({ name: `${topic.emoji}  DAILY QUESTION — ${topic.name.toUpperCase()}` })
      .setTitle(question)
      .setFooter({ text: `The Forge  •  ${today}` })
      .setTimestamp();

    await channel.send({ content: `<@&1474272207667593268>`, embeds: [embed] });
    console.log(`[BOT] ✅ Sent — Topic: ${topic.name}`);
  } catch (err) {
    console.error("[BOT] Error:", err);
  }
}

// ─── SCHEDULER ────────────────────────────────────────────────────────────────
function scheduleDaily() {
  const now = new Date();
  const next = new Date();
  next.setHours(POST_HOUR, POST_MINUTE, 0, 0);
  if (now >= next) next.setDate(next.getDate() + 1);

  const msUntilNext = next - now;
  console.log(`[BOT] Next question in ${Math.round(msUntilNext / 1000 / 60)} minutes`);

  setTimeout(() => {
    sendDailyQuestion();
    setInterval(sendDailyQuestion, 24 * 60 * 60 * 1000);
  }, msUntilNext);
}

// ─── READY ────────────────────────────────────────────────────────────────────
client.once("clientReady", () => {
  console.log(`[Bot] Online as ${client.user.tag}`);
  scheduleDaily();
});

// ─── SLASH COMMAND /qotd ──────────────────────────────────────────────────────
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  if (interaction.commandName === "qotd") {
    await interaction.reply({ content: "Sending daily question...", ephemeral: true });
    await sendDailyQuestion();
  }
});

client.login(DISCORD_TOKEN);
