import type { WineItem } from "types";
import { Parser } from "xml2js";

import demoWines from "./demo.json";

const parser = new Parser({ explicitArray: false });

export async function fetchWineData(username: string, password: string) {
  if (username === "demo" && password === "demo") {
    return demoWines as WineItem[];
  }

  const result = await fetch(
    `https://www.cellartracker.com/xlquery.asp?User=${username}&Password=${password}&Format=XML`,
  );
  const xml = await result.text();
  const json = await parser.parseStringPromise(xml);
  console.log(json.cellartracker);

  if (!json.cellartracker) {
    throw new Error("Invalid username or password");
  }

  return json.cellartracker.list.row as WineItem[];
}
