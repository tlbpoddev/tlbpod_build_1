import fs from "fs";
import path from "path";
import xml2js from "xml2js";
import fetch from "node-fetch";

const BUZZSPROUT_FEED_URL = "https://feeds.buzzsprout.com/2113477.rss";
const OUTPUT_DIR = path.resolve("src/content/episode");

async function fetchBuzzsproutFeed() {
    const response = await fetch(BUZZSPROUT_FEED_URL);
    if (!response.ok) throw new Error(`Failed to fetch RSS feed: ${response.statusText}`);

    const rssContent = await response.text();
    const parsedFeed = await xml2js.parseStringPromise(rssContent);
    return parsedFeed.rss.channel[0].item;
}

function formatYamlBlock(fieldName, value) {
    if (value && value.trim()) {
        const sanitizedValue = value.replace(/"/g, '\\"').replace(/\n/g, "\n  ");
        return `${fieldName}: |\n  ${sanitizedValue}`;
    }
    return `${fieldName}: ""`;
}

async function generateMarkdownFiles() {
    const episodes = await fetchBuzzsproutFeed();

    if (!fs.existsSync(OUTPUT_DIR)) {
        fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }

    episodes.forEach((episode) => {
        const slug = episode.title[0].toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
        const filePath = path.join(OUTPUT_DIR, `${slug}.md`);

        // Format YAML front matter fields
        const title = `title: "${episode.title[0].replace(/"/g, '\\"')}"`;
        const description = formatYamlBlock("description", episode.description?.[0] || "");
        const pubDate = `pubDate: "${episode.pubDate[0]}"`;
        const audioUrl = `audioUrl: "${episode.enclosure[0].$.url}"`;
        const duration = `duration: "${episode["itunes:duration"]?.[0] || ""}"`;

        // Convert `explicit` to a boolean
        const explicitValue = episode["itunes:explicit"]?.[0] === "true";
        const explicit = `explicit: ${explicitValue}`;

        // Add placeholder for `size`
        const sizeValue = episode.enclosure[0].$.length || "0"; // Use enclosure size if available
        const size = `size: ${sizeValue}`;

        const markdownContent = `---
${title}
${description}
${pubDate}
${audioUrl}
${duration}
${explicit}
${size}
---

${episode.description?.[0] || "No description available."}
`;

        fs.writeFileSync(filePath, markdownContent);
        console.log(`Generated: ${filePath}`);
    });
}

generateMarkdownFiles()
    .then(() => console.log("Buzzsprout episodes synced successfully!"))
    .catch((err) => console.error("Error syncing Buzzsprout episodes:", err));
