import xml2js from "xml2js";
import fetch from "node-fetch";

const BUZZSPROUT_FEED_URL = "https://feeds.buzzsprout.com/2113477.rss";

export async function fetchBuzzsproutEpisodes() {
  const response = await fetch(BUZZSPROUT_FEED_URL);
  if (!response.ok) throw new Error(`Failed to fetch RSS feed: ${response.statusText}`);

  const rssContent = await response.text();
  const parsedFeed = await xml2js.parseStringPromise(rssContent);
  return parsedFeed.rss.channel[0].item;
}
