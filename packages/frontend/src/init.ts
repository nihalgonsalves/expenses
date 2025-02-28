import "temporal-polyfill/global";
import "./tailwind.css";
import "./main.css";

import emojiMartData from "@emoji-mart/data";
import { init as initEmojiMart } from "emoji-mart";

import { registerSW } from "./registerSW";

await registerSW();

// TODO: Use a react-query client instead of baked-in data
await initEmojiMart({ data: emojiMartData });

import.meta.hot?.accept(() => {
  void registerSW();
});
