const { Client, GatewayIntentBits, EmbedBuilder } = require("discord.js");

// ─── CONFIG ───────────────────────────────────────────────────────────────────
const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const POST_HOUR = 9;
const POST_MINUTE = 0;
const GROWTH_CHANNEL_ID = "1386620798717919345";

// ─── 21 TOPICS ────────────────────────────────────────────────────────────────
const ALL_TOPICS = [
  { name: "Identity Gap", emoji: "🔥", color: 0xc8a96e, prompt: "Generate one confrontational question about the gap between who a man claims to be and who he actually is when no one is watching." },
  { name: "Self-Deception", emoji: "🧠", color: 0x6c3483, prompt: "Generate one confrontational question about how men lie to themselves to stay comfortable and avoid real change." },
  { name: "Discipline vs Motivation", emoji: "🏛️", color: 0x2c3e50, prompt: "Generate one confrontational question about why men rely on motivation instead of building systems that force them to show up." },
  { name: "The Comfort Trap", emoji: "⚡", color: 0xe74c3c, prompt: "Generate one confrontational question about how comfort is quietly destroying a man's potential without him realising it." },
  { name: "Stoicism in Real Life", emoji: "⚔️", color: 0x8e44ad, prompt: "Generate one question applying stoic philosophy to a real situation modern men face — not academic, not a quote. Practical and sharp." },
  { name: "Money & Identity", emoji: "💰", color: 0x1e8449, prompt: "Generate one confrontational question about how a man's identity and self-worth are connected to his relationship with money and why most men stay broke." },
  { name: "Building vs Watching", emoji: "📈", color: 0x27ae60, prompt: "Generate one confrontational question about the difference between men who are actively building something and men who are consuming content about building." },
  { name: "Legacy", emoji: "💀", color: 0x2d2d2d, prompt: "Generate one confrontational question about what a man is actually leaving behind — not what he says he wants to leave, but what his daily actions are building toward." },
  { name: "The Mirror Test", emoji: "🪞", color: 0x95a5a6, prompt: "Generate one question that forces a man to be brutally honest with himself about one specific area of his life he has been avoiding." },
  { name: "Execution", emoji: "⚙️", color: 0x7f8c8d, prompt: "Generate one confrontational question about the gap between knowing what to do and actually doing it — and what that gap reveals about a man." },
  { name: "This Generation", emoji: "📱", color: 0xd35400, prompt: "Generate one confrontational question about how men in this generation are being softened, distracted, and outcompeted without realising it." },
  { name: "AI & The Future", emoji: "🤖", color: 0x2980b9, prompt: "Generate one sharp question about what AI and the new economy mean for men who are not paying attention right now." },
  { name: "Relationships & Standards", emoji: "🤝", color: 0x8e44ad, prompt: "Generate one confrontational question about the standards a man holds in his relationships — friendships, romantic, professional — and what those standards say about him." },
  { name: "Fear & Avoidance", emoji: "😶", color: 0x34495e, prompt: "Generate one confrontational question about what a man is avoiding in his life and what that avoidance is costing him." },
  { name: "Physical Standard", emoji: "💪", color: 0xe74c3c, prompt: "Generate one sharp question about a man's physical standard — not aesthetics, but what his relationship with his body says about his relationship with discipline." },
  { name: "Mental Toughness", emoji: "🥊", color: 0xc0392b, prompt: "Generate one confrontational question about mental toughness — what it actually looks like versus what men tell themselves it looks like." },
  { name: "Purpose & Direction", emoji: "🧭", color: 0x16a085, prompt: "Generate one confrontational question about whether a man actually knows where he is going and whether his daily actions prove it." },
  { name: "Ego & Growth", emoji: "👁️", color: 0xf39c12, prompt: "Generate one confrontational question about how a man's ego is blocking his growth — specifically the ways he refuses to admit he is wrong or needs to change." },
  { name: "Consistency", emoji: "📅", color: 0x1abc9c, prompt: "Generate one confrontational question about consistency — not the idea of it, but the specific place where a man always falls off and what that pattern reveals." },
  { name: "Time & Priority", emoji: "⏱️", color: 0xe67e22, prompt: "Generate one sharp question about how a man spends his time and whether those choices match what he claims to value." },
  { name: "Existentialism", emoji: "🌑", color: 0x1a1a2e, prompt: "Generate one existentialist question about radical personal responsibility — the idea that a man's life is entirely a result of his choices and what that means for where he is right now." },
];

// ─── ROTATION TRACKER ─────────────────────────────────────────────────────────
// Tracks which topics have been used in the current cycle
let usedTopicIndexes = [];

function getNextTopic() {
  // If all topics used, reset the cycle
  if (usedTopicIndexes.length >= ALL_TOPICS.length) {
    console.log("[BOT] All topics used — resetting cycle");
    usedTopicIndexes = [];
  }

  // Get unused topics
  const unusedIndexes = ALL_TOPICS
    .map((_, i) => i)
    .filter((i) => !usedTopicIndexes.includes(i));

  // Pick random unused topic
  const randomIndex = unusedIndexes[Math.floor(Math.random() * unusedIndexes.length)];
  usedTopicIndexes.push(randomIndex);

  console.log(`[BOT] Topic selected: ${ALL_TOPICS[randomIndex].name} (${usedTopicIndexes.length}/${ALL_TOPICS.length} used this cycle)`);
  return ALL_TOPICS[randomIndex];
}

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
Tone: confrontational, direct, psychological. No motivation. No fluff. No therapy speak.
Respond with ONLY the question. No preamble. No explanation. No quotation marks. Just the raw question.`,
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
    const topic = getNextTopic();
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
