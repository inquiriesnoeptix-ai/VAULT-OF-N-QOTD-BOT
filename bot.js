const { Client, GatewayIntentBits, EmbedBuilder } = require("discord.js");

// ─── CONFIG ───────────────────────────────────────────────────────────────────
const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const POST_HOUR = 9;
const POST_MINUTE = 0;

// ─── 3 CHANNELS — each with their own ID and topic rotation ──────────────────
const CHANNELS = [
  {
    id: "1443538468037984337",
    name: "💰 Money Channel",
    topics: [
      {
        name: "This Generation & Money",
        emoji: "⚡",
        color: 0x1e8449,
        prompt:
          "Generate a sharp, confrontational insight about how men aged 18-30 are either winning or losing financially right now in 2019-2025. Talk about the new economy — reselling, content, service businesses, AI tools, outbound sales, leverage. What separates the ones building from the ones watching. No motivation. Just cold truth about money and execution in this era.",
      },
      {
        name: "Income & Leverage",
        emoji: "💰",
        color: 0x27ae60,
        prompt:
          "Generate a sharp insight about building real income through leverage — systems, digital products, AI tools, outbound, service business, or reselling. Focus on the mechanics of making money work for you instead of trading time. Practical, direct, zero fluff.",
      },
      {
        name: "AI & The New Economy",
        emoji: "🤖",
        color: 0x2980b9,
        prompt:
          "Generate an insight about AI, automation, and the new digital economy and what it means for young men right now. Who is positioned to win, who is asleep, and what moves need to happen now before the window closes. Direct and urgent.",
      },
      {
        name: "Money Psychology",
        emoji: "🧠",
        color: 0x16a085,
        prompt:
          "Generate a confrontational insight about the psychology behind why most men stay broke — scarcity mindset, undercharging, fear of selling, comfort with struggle. What beliefs are keeping them at their current income level and what has to change at the identity level before the numbers change.",
      },
      {
        name: "How To Push",
        emoji: "🔥",
        color: 0xe67e22,
        prompt:
          "Generate a raw, direct insight about what it actually takes to push through the phases where nothing is working yet — outbound, building, early business. The gap between starting and winning. What most men do wrong and what the ones who break through do differently. No inspiration. Just mechanics.",
      },
    ],
  },
  {
    id: "1443538591304257567",
    name: "🏛️ Discipline Channel",
    topics: [
      {
        name: "Discipline & Showing Up",
        emoji: "🏛️",
        color: 0x2c3e50,
        prompt:
          "Generate a confrontational insight about discipline — not motivation, not inspiration, but the actual mechanics of showing up every single day when you don't want to. What separates men who execute from men who intend to. Hard, direct, zero softness.",
      },
      {
        name: "Gym & Physical Standard",
        emoji: "💪",
        color: 0xe74c3c,
        prompt:
          "Generate a sharp insight about training, physical discipline, and what the gym actually represents beyond aesthetics — identity, standard, mental toughness, proof of self-control. Why men who don't train are losing more than just muscle. Direct and confrontational.",
      },
      {
        name: "Boxing & Combat Mindset",
        emoji: "🥊",
        color: 0xc0392b,
        prompt:
          "Generate an insight about the combat sports mindset — boxing, fighting, pressure, getting hit and continuing, the mental architecture that martial arts and combat sports build that carries into every other area of life. What training to fight teaches men about themselves.",
      },
      {
        name: "Staying Hard",
        emoji: "⚔️",
        color: 0x34495e,
        prompt:
          "Generate a raw insight about mental toughness — staying hard when life gets uncomfortable, when results aren't coming, when motivation is gone and only identity remains. What it means to be the kind of man who doesn't fold. No softness. No therapy speak. Just the standard.",
      },
      {
        name: "Systems Over Motivation",
        emoji: "⚙️",
        color: 0x7f8c8d,
        prompt:
          "Generate a direct insight about why motivation is useless and systems are everything — how to build non-negotiable daily structures that make discipline automatic instead of emotional. The difference between men who rely on feeling ready and men who built an identity that doesn't need to feel ready.",
      },
    ],
  },
  {
    id: "1443538377625567326",
    name: "🏛️ Philosophy Channel",
    topics: [
      {
        name: "Stoicism",
        emoji: "🏛️",
        color: 0x8e44ad,
        prompt:
          "Generate a deep, sharp insight from Stoic philosophy — Marcus Aurelius, Epictetus, or Seneca — framed for a modern man building himself in a world of distraction and comfort. Not a quote dump. An actual application of Stoic thinking to real life right now.",
      },
      {
        name: "Identity & Who You Are",
        emoji: "🔥",
        color: 0xc8a96e,
        prompt:
          "Generate a confrontational insight about identity — the difference between who a man performs versus who he actually is, how identity is constructed through repetition not intention, and what it means to actually change at the root level rather than the surface.",
      },
      {
        name: "Existentialism",
        emoji: "🌑",
        color: 0x1a1a2e,
        prompt:
          "Generate a sharp existentialist insight — Sartre, Camus, Nietzsche, or Frankl — applied to a man's life right now. Radical responsibility, the burden of freedom, creating your own meaning, becoming who you are. Intelligent and confrontational, not academic.",
      },
      {
        name: "Psychology & Self-Deception",
        emoji: "🧠",
        color: 0x6c3483,
        prompt:
          "Generate a deep psychological insight about self-deception, cognitive dissonance, the stories men tell themselves to stay comfortable, and the mechanisms that keep intelligent men stuck below their potential. Make it feel like a mirror, not a lecture.",
      },
      {
        name: "Deep Truth",
        emoji: "💀",
        color: 0x2d2d2d,
        prompt:
          "Generate a hard philosophical truth about life, masculinity, time, legacy, or what it means to live deliberately versus by default. The kind of insight that makes a man sit with it for a few hours. No comfort. No resolution. Just truth.",
      },
    ],
  },
];

// Track topic index separately for each channel
const topicIndexes = { 0: 0, 1: 0, 2: 0 };

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

// ─── GENERATE QOTD VIA CLAUDE ────────────────────────────────────────────────
async function generateQOTD(topic) {
  const systemPrompt = `You are writing daily drops for a high-standards men's community called The Forge.
The tone is direct, intelligent, and confrontational — not motivational, not soft, not hustle porn.
Sharp psychological and philosophical thinking applied to real life. Always grounded, never fake.
Always respond in this exact JSON format with no markdown, no backticks, no extra text:
{
  "quote": "The main insight or quote — 1-3 sentences, punchy and memorable",
  "author": "Real author name if it is a genuine quote, otherwise empty string",
  "context": "1-2 sentences expanding on the quote — sharp, not explanatory",
  "discussion": "One direct question to spark real discussion — confrontational, not safe"
}`;

  const userPrompt = `Today's topic: ${topic.name}\n\n${topic.prompt}\n\nJSON only. No markdown. No backticks.`;

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 500,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    }),
  });

  const data = await response.json();
  
  if (!data.content || !data.content[0] || !data.content[0].text) {
    console.error("[QOTD] Bad API response:", JSON.stringify(data));
    throw new Error("Invalid API response structure");
  }
  
  let text = data.content[0].text.trim();
  // Strip any markdown backticks if present
  text = text.replace(/```json|```/g, "").trim();
  return JSON.parse(text);
}

// ─── SEND TO ONE CHANNEL ──────────────────────────────────────────────────────
async function sendToChannel(channelConfig, channelIndex) {
  try {
    const topic = channelConfig.topics[topicIndexes[channelIndex] % channelConfig.topics.length];
    topicIndexes[channelIndex]++;

    console.log(`[QOTD] ${channelConfig.name} → Topic: ${topic.name}`);
    const content = await generateQOTD(topic);

    const channel = await client.channels.fetch(channelConfig.id);
    if (!channel) return console.error(`[QOTD] Channel not found: ${channelConfig.id}`);

    const today = new Date().toLocaleDateString("en-AU", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const embed = new EmbedBuilder()
      .setColor(topic.color)
      .setAuthor({ name: `${topic.emoji}  ${topic.name.toUpperCase()} — DAILY DROP` })
      .setTitle(`"${content.quote}"`)
      .setDescription(`${content.author ? `— *${content.author}*\n\n` : ""}${content.context}`)
      .addFields({ name: "💬  DROP YOUR ANSWER BELOW", value: content.discussion })
      .setFooter({ text: `The Forge  •  ${today}` })
      .setTimestamp();

    await channel.send({ content: `@everyone`, embeds: [embed] });
    console.log(`[QOTD] ✅ Sent to ${channelConfig.name}`);
  } catch (err) {
    console.error(`[QOTD] Error on ${channelConfig.name}:`, err);
  }
}

// ─── SEND TO ALL 3 CHANNELS ───────────────────────────────────────────────────
async function sendAllChannels() {
  console.log("[QOTD] Firing daily drops...");
  for (let i = 0; i < CHANNELS.length; i++) {
    await sendToChannel(CHANNELS[i], i);
    await new Promise((r) => setTimeout(r, 3000));
  }
}

// ─── SCHEDULER ───────────────────────────────────────────────────────────────
function scheduleDaily() {
  const now = new Date();
  const next = new Date();
  next.setHours(POST_HOUR, POST_MINUTE, 0, 0);
  if (now >= next) next.setDate(next.getDate() + 1);

  const msUntilNext = next - now;
  console.log(`[QOTD] Next drop in ${Math.round(msUntilNext / 1000 / 60)} minutes`);

  setTimeout(() => {
    sendAllChannels();
    setInterval(sendAllChannels, 24 * 60 * 60 * 1000);
  }, msUntilNext);
}

// ─── BOT READY ───────────────────────────────────────────────────────────────
client.once("ready", () => {
  console.log(`[Bot] Online as ${client.user.tag}`);
  scheduleDaily();
});

// ─── SLASH COMMAND: /qotd — fires all 3 channels instantly for testing ────────
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  if (interaction.commandName === "qotd") {
    await interaction.reply({ content: "Sending drops to all 3 channels...", ephemeral: true });
    await sendAllChannels();
  }
});

client.login(DISCORD_TOKEN);
