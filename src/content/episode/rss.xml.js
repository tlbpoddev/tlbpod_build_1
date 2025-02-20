import xml2js from "xml2js";
import dayjs from "dayjs";
import fetch from "node-fetch";
import astropodConfig from "../../../.astropod/astropod.config.json";

const BUZZSPROUT_FEED_URL = "https://feeds.buzzsprout.com/2113477.rss";

export async function get(context) {
  let podcast = {
    rss: {
      $: {
        version: "2.0",
        "xmlns:itunes": "http://www.itunes.com/dtds/podcast-1.0.dtd",
        "xmlns:podcast": "https://github.com/Podcastindex-org/podcast-namespace/blob/main/docs/1.0.md",
        "xmlns:atom": "http://www.w3.org/2005/Atom",
        "xmlns:content": "http://purl.org/rss/1.0/modules/content/",
      },
      channel: [
        {
          title: astropodConfig.name,
          description: astropodConfig.description,
          link: astropodConfig.link,
          copyright: astropodConfig.copyright,
          author: astropodConfig.author,
          generator: ["Astropod"],
          lastBuildDate: dayjs().format("ddd, DD MMM YYYY hh:mm:ss ZZ"),
          language: astropodConfig.language,
          "itunes:author": astropodConfig.author,
          "itunes:image": { $: { href: astropodConfig.cover } },
          "itunes:summary": astropodConfig.description,
          "itunes:type": "episodic",
          "itunes:explicit": astropodConfig.explicit,
          "itunes:owner": {
            "itunes:name": astropodConfig.owner,
            "itunes:email": astropodConfig.email,
          },
          image: {
            link: astropodConfig.link,
            title: astropodConfig.name,
            url: astropodConfig.cover,
          },
          "atom:link": [
            {
              $: {
                href: `${astropodConfig.link}/rss.xml`,
                rel: "self",
                type: "application/rss+xml",
              },
            },
            {
              $: {
                href: `https://pubsubhubbub.appspot.com/`,
                rel: "hub",
                type: "application/rss+xml",
              },
            },
          ],
        },
      ],
    },
  };

  try {
    // Fetch episodes from Buzzsprout
    const response = await fetch(BUZZSPROUT_FEED_URL);
    if (!response.ok) {
      throw new Error(`Failed to fetch Buzzsprout RSS feed: ${response.statusText}`);
    }

    const rssContent = await response.text();
    const parsedFeed = await xml2js.parseStringPromise(rssContent);

    // Ensure the structure exists before mapping episodes
    const channel = parsedFeed?.rss?.channel?.[0];
    if (!channel || !channel.item) {
      throw new Error("RSS feed does not contain channel or item data.");
    }

    // Map episodes from Buzzsprout to Astropod format
    const items = channel.item.map((episode) => ({
      title: episode.title?.[0] || "Untitled Episode",
      description: episode.description?.[0] || "No description available.",
      pubDate: dayjs(episode.pubDate?.[0]).format("ddd, DD MMM YYYY hh:mm:ss ZZ"),
      link: episode.link?.[0] || "#",
      guid: episode.guid?.[0] || "#",
      "itunes:duration": episode["itunes:duration"]?.[0],
      "itunes:episode": episode["itunes:episode"]?.[0],
      "itunes:season": episode["itunes:season"]?.[0],
      "itunes:explicit": episode["itunes:explicit"]?.[0] || astropodConfig.explicit,
      enclosure: {
        $: {
          url: episode.enclosure?.[0]?.$?.url || "",
          length: episode.enclosure?.[0]?.$?.length || "",
          type: episode.enclosure?.[0]?.$?.type || "audio/mpeg",
        },
      },
      "itunes:image": {
        $: {
          href: episode["itunes:image"]?.[0]?.$?.href || astropodConfig.cover,
        },
      },
    }));

    podcast.rss.channel[0].item = items;
  } catch (error) {
    console.error("Error fetching Buzzsprout feed:", error);
  }

  // Generate XML
  const builder = new xml2js.Builder({ cdata: true });
  const xml = builder.buildObject(podcast);

  return {
    body: xml,
    headers: {
      "Content-Type": "application/rss+xml",
    },
  };
}
