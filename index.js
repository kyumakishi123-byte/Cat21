import { Client, GatewayIntentBits } from "discord.js";
import OpenAI from "openai";
import dotenv from "dotenv";

// โหลดไฟล์ชื่อ _.env
dotenv.config({ path: "_.env" });

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

const ai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// memory: เก็บประวัติต่อช่อง
const channelMemory = new Map();

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  const channelId = message.channel.id;

  // ถ้ายังไม่มี memory ให้สร้างให้ก่อน
  if (!channelMemory.has(channelId)) {
    channelMemory.set(channelId, []);
  }

  const history = channelMemory.get(channelId);

  // บันทึกข้อความล่าสุดเข้า memory
  history.push({
    role: "user",
    content: message.content,
  });

  // ตัดประวัติให้เหลือ 15 ข้อความล่าสุด
  if (history.length > 15) history.shift();

  try {
    const response = await ai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "คุณคือบอท AI พูดจาน่ารัก อบอุ่น อธิบายง่ายๆ ช่วยเหลืออย่างอ่อนโยน ตอบเป็นภาษาไทยได้ดี มีความเป็นเพื่อนที่น่ารักของทุกคนใน Discord.",
        },
        ...history,
      ],
    });

    const reply = response.choices[0].message.content;

    // เก็บคำตอบลง memory ด้วย เพื่อให้บอทจำสิ่งที่ตัวเองพูด
    history.push({
      role: "assistant",
      content: reply,
    });

    if (history.length > 15) history.shift();

    message.reply(reply);
  } catch (err) {
    console.error(err);
    message.reply("เอ๊ะ… เกิดข้อผิดพลาดนิดหน่อย ลองอีกทีได้ไหมน้า 💦");
  }
});

// login bot
client.login(process.env.DISCORD_TOKEN);
