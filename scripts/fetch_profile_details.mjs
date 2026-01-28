
import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';
import { pipeline } from 'stream/promises';

const profilesPath = path.resolve('./src/data/candidate_profiles.json');
const imagesDir = path.resolve('./public/images/candidates');

if (!fs.existsSync(imagesDir)) {
    fs.mkdirSync(imagesDir, { recursive: true });
}

// Ensure profiles file exists or default to empty
let profiles = {};
if (fs.existsSync(profilesPath)) {
    profiles = JSON.parse(fs.readFileSync(profilesPath, 'utf-8'));
}

const updatedProfiles = {};

async function downloadImage(url, slug) {
    try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`Failed to fetch image: ${res.statusText}`);

        let ext = path.extname(url).split('?')[0] || '.jpg';
        // Handle cases where no extension in url
        if (ext === '.') ext = '.jpg';

        const filename = `${slug}${ext}`;
        const localPath = path.join(imagesDir, filename);
        // This path is relative to public/ for Next.js
        const publicPath = `/images/candidates/${filename}`;

        await pipeline(res.body, fs.createWriteStream(localPath));
        console.log(`Saved image to ${localPath}`);
        return publicPath;
    } catch (e) {
        console.error(`Error downloading image for ${slug}:`, e);
        return null;
    }
}

async function fetchProfileData(name, url) {
    if (!url) return null;
    try {
        console.log(`Fetching ${name} from ${url}...`);
        const res = await fetch(url);
        const html = await res.text();

        // Extract Image URL
        const imgMatch = html.match(/class="profile-image"[^>]*>\s*<img src="([^"]+)"/);
        let image = imgMatch ? imgMatch[1] : null;

        // Download Image if found
        let localImage = null;
        if (image) {
            // Extract slug from profile URL: .../members/slug
            const slug = url.split('/').pop();
            localImage = await downloadImage(image, slug);
        }

        // Extract Social Links
        const sns = {};
        const xMatch = html.match(/href="([^"]+)"[^>]*aria-label="X \(旧Twitter\)"/);
        if (xMatch) sns.twitter = xMatch[1];

        const instaMatch = html.match(/href="([^"]+)"[^>]*aria-label="Instagram"/);
        if (instaMatch) sns.instagram = instaMatch[1];

        const ytMatch = html.match(/href="([^"]+)"[^>]*aria-label="YouTube"/);
        if (ytMatch) sns.youtube = ytMatch[1];

        const fbMatch = html.match(/href="([^"]+)"[^>]*aria-label="Facebook"/);
        if (fbMatch) sns.facebook = fbMatch[1];

        return {
            url,
            image: localImage || image, // Prefer local, fallback to remote
            sns
        };
    } catch (e) {
        console.error(`Error fetching ${name}:`, e);
        return { url };
    }
}

async function main() {
    for (const [name, data] of Object.entries(profiles)) {
        // Run fetch again to download images
        const enhancedData = await fetchProfileData(name, data.url);
        if (enhancedData) {
            updatedProfiles[name] = enhancedData;
        } else {
            updatedProfiles[name] = data;
        }
    }

    fs.writeFileSync(profilesPath, JSON.stringify(updatedProfiles, null, 2));
    console.log('Updated profiles written to', profilesPath);
}

main();
