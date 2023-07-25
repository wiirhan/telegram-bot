import { InlineKeyboard } from "https://deno.land/x/grammy@v1.17.2/mod.ts";

export const BuyBtnList = ["Buy 0.01", "Buy 0.05"];
export const SellBtnList = ["Sell X%", "Sell 25%"];

function buttonList(list: string[], keyboard: InlineKeyboard) {
  return list.reduce((p, c, i) => {
    p.add({
      text: c,
      callback_data: c,
    });
    if (i % 2 !== 0) {
      p.row();
    }
    return p;
  }, keyboard);
}

function getMenu(key: string, extra: string[] = []) {
  const keyboard = new InlineKeyboard();
  const isBuy = key === "Buy";
  keyboard.add({
    text: "Add",
    callback_data: "Add",
  });
  keyboard.add({
    text: "Switch",
    callback_data: `Switch-${isBuy ? "Sell" : "Buy"}`,
  }).row();
  const list = isBuy ? BuyBtnList : SellBtnList;
  return buttonList([...list, ...extra], keyboard);
}

export default getMenu;
