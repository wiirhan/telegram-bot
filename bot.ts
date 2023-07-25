import { load } from "https://deno.land/std@0.195.0/dotenv/mod.ts";
import {
  Bot,
  Context,
  session,
} from "https://deno.land/x/grammy@v1.17.2/mod.ts";
import {
  type Conversation,
  type ConversationFlavor,
  conversations,
  createConversation,
} from "https://deno.land/x/grammy_conversations@v1.1.2/mod.ts";
import getMenu from "./menu.ts";

const env = await load();
const token = env["BOT_TOKEN"];
if (token === undefined) throw new Error("Missing BOT_TOKEN");

type MyContext = Context & ConversationFlavor;
type MyConversation = Conversation<MyContext>;

const bot = new Bot<MyContext>(token);
const DefaultText = "Check out this menu:";

bot.use(session({ initial: () => ({}) }));
bot.use(conversations());

const Wallets = new Set<{ title: string; menuList: string[] }>();

async function toggleMenuText(ctx: Context) {
  const name = ctx.callbackQuery?.data?.split("-");
  if (!name) return;
  const text = name[1];
  const { title = DefaultText, menuList = [] } = Array.from(Wallets)[0] || {};
  try {
    await ctx.editMessageText(title, {
      reply_markup: getMenu(text, menuList),
    });
  } catch (error) {
    console.log(error, { ctx, location: "toggleMenuText" });
  }
  return;
}

async function handleAdd(ctx: MyContext) {
  await ctx.conversation.enter("getName");
  return;
}

async function handleReply(
  conversation: MyConversation,
  ctx: MyContext,
  option: { text: string; reg: RegExp; errorText: string },
) {
  const { text, reg, errorText } = option;
  const replay = await ctx.reply(text, {
    reply_markup: { force_reply: true },
  });
  const msg = (await conversation.waitForReplyTo(replay.message_id)).message!;
  const name = msg.text || "";
  await ctx.api.deleteMessage(ctx.chat!.id, msg.message_id).catch(() => {});
  if (!reg.test(name)) {
    await ctx.reply(errorText);
    return;
  }
  return name;
}

async function getName(conversation: MyConversation, ctx: MyContext) {
  const name = await handleReply(conversation, ctx, {
    text:
      "What would you like to name this copy trade wallet? 8 letters max, only numbers and letters.",
    reg: /^[A-Za-z]{1,8}$/,
    errorText: "Invalid name. Name must be 8 letters max.",
  });
  if (!name) {
    return;
  }
  const address = await handleReply(conversation, ctx, {
    text:
      `Reply to this message with the desired wallet address you'd like to copy trades from.`,
    reg: /^0x[a-fA-F0-9]{40}$/,
    errorText: "Invalid address.",
  });
  if (!address) {
    return;
  }
  Wallets.clear();
  const text = `wallet(${name}): ${address}`;
  Wallets.add({ title: text, menuList: [name, address] });
  toggleMenuText(ctx);
}

bot.use(createConversation(getName));

bot.command("start", async (ctx) => {
  await ctx.reply(DefaultText, { reply_markup: getMenu("Buy") });
});

bot.callbackQuery(/Switch.+/, toggleMenuText);
bot.callbackQuery("Add", handleAdd);

bot.start();
