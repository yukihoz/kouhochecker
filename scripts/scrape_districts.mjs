import fs from 'fs';
import * as cheerio from 'cheerio';
import axios from 'axios';

const URL = 'https://ja.wikipedia.org/wiki/%E8%A1%86%E8%AD%B0%E9%99%A2%E5%B0%8F%E9%81%B8%E6%8C%99%E5%8C%BA%E4%B8%80%E8%A6%A7';

async function main() {
    console.log('Fetching Wikipedia page...');
    try {
        const { data } = await axios.get(URL, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.114 Safari/537.36'
            }
        });

        const $ = cheerio.load(data);
        const mapping = {};

        console.log('Parsing content...');

        $('h3').each((i, el) => {
            let $header = $(el);
            let prefecture = $header.text().replace(/\[.*?\]/g, '').trim();

            // Should end with Todofuken
            if (!prefecture.match(/(都|道|府|県)$/)) return;

            if (!mapping[prefecture]) mapping[prefecture] = {};

            // Look for the table. It might be after the h3 or its parent div.
            let $container = $header.parent().hasClass('mw-heading') ? $header.parent() : $header;

            let $next = $container.next();
            let $table = null;

            // Safety limit for traversing siblings
            let attempts = 0;
            while (attempts < 5 && $next.length) {
                if ($next.is('table')) {
                    $table = $next;
                    break;
                }
                // If we hit another header, stop
                if ($next.is('h2, h3, h4, .mw-heading')) break;
                $next = $next.next();
                attempts++;
            }

            if (!$table) {
                // console.log(`No table found for ${prefecture}`);
                return;
            }

            // Parse Rows
            $table.find('tr').each((j, row) => {
                const cols = $(row).find('td');
                if (cols.length < 2) return;

                // District Name (Col 0)
                let districtName = $(cols[0]).text().trim().replace(/\[.*?\]/g, '');
                if (!districtName) return;

                // Remove "第" for consistency with CSV (usually "北海道1区")
                // Check CSV format: "北海道1区". Wiki: "第1区" or "北海道第1区"
                // If wiki says "第1区", prepend Prefecture? 
                // Logic: "1区" -> "1区". Join later.
                // Actually best to store just "1区" and rely on Prefecture key.
                // But CSV has "北海道1区".
                // Let's store "1区" and form "Prefecture+1区" when looking up CSV?
                // No, CSV has "北海道1区". Wiki "第1区".
                // Normalize to "1区".

                let districtShort = districtName.replace('第', '');
                // If it starts with Prefecture name, strip it?
                if (districtShort.startsWith(prefecture)) {
                    districtShort = districtShort.replace(prefecture, '');
                }
                // Result: "1区"

                const fullDistrictName = prefecture + districtShort;

                // Area (Col 1)
                const areaCell = $(cols[1]);
                if (!areaCell.length) return;

                let currentPrefix = '';

                // Iterate contents to respect order and tags
                areaCell.contents().each((k, node) => {
                    if (node.type !== 'text' && node.type !== 'tag') return;

                    // Get text
                    let text = $(node).text().replace(/\[.*?\]/g, '').replace(/（.*?）/g, '').trim();
                    // Removed parentheses content for simplicity

                    if (!text) return;
                    // Clean up separators
                    text = text.replace(/・|、/g, ' ').trim();
                    if (!text) return;

                    // Split by space usually, but structure is messy.
                    // "札幌市中央区・北区" -> "札幌市" "中央区" "北区"

                    const parts = text.split(/\s+/);

                    parts.forEach(part => {
                        if (part === '・' || part === '、') return;

                        // Heuristic for Prefix (City/County)
                        if (part.endsWith('市') || part.endsWith('郡')) {
                            currentPrefix = part;
                            addMapping(mapping, prefecture, part, fullDistrictName);
                        } else if (part.endsWith('区') || part.endsWith('町') || part.endsWith('村')) {
                            // Combine with prefix
                            const full = currentPrefix + part;
                            addMapping(mapping, prefecture, full, fullDistrictName);
                            // Also add the part itself just in case? No, "中央区" is ambiguous.
                        } else {
                            // Other cases?
                            // Maybe "全域"?
                            if (part === '全域') return;
                            // Just add it purely?
                            addMapping(mapping, prefecture, currentPrefix + part, fullDistrictName);
                        }
                    });
                });
            });
        });

        console.log(`Extracted mapping for ${Object.keys(mapping).length} prefectures.`);
        fs.writeFileSync('src/data/municipality_to_district.json', JSON.stringify(mapping, null, 2));
        console.log('Saved to src/data/municipality_to_district.json');

    } catch (err) {
        console.error('Error fetching/parsing:', err);
    }
}

function addMapping(mapping, prefecture, municipality, district) {
    municipality = municipality.trim();
    if (!municipality) return;

    if (!mapping[prefecture][municipality]) {
        mapping[prefecture][municipality] = [];
    }
    if (!mapping[prefecture][municipality].includes(district)) {
        mapping[prefecture][municipality].push(district);
    }
}

main();
