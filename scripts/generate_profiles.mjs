import fs from 'fs';
import path from 'path';

// Raw text from the scrape result (Chunk 1)
const rawText = `
稲原いなはらむねよし
比例北海道ブロック
エンジニア
[プロフィール](https://team-mir.ai/election/shugiin-2026/members/muneyoshi-inahara)
林はやしたくみ
比例東北ブロック
学校職員
[プロフィール](https://team-mir.ai/election/shugiin-2026/members/takumi-hayashi)
武藤むとうかず子
比例北関東ブロック
元コンサル会社社員
[プロフィール](https://team-mir.ai/election/shugiin-2026/members/kazuko-muto)
河合かわいみちお
比例南関東ブロック
教育関係会社員
[プロフィール](https://team-mir.ai/election/shugiin-2026/members/michio-kawai)
小林こばやししゅうへい
比例南関東ブロック小選挙区重複千葉5区
エンジニア
[プロフィール](https://team-mir.ai/election/shugiin-2026/members/syuhei-kobayashi)
山田やまだえり
比例南関東ブロック
前川崎市議会議員
[プロフィール](https://team-mir.ai/election/shugiin-2026/members/eri-yamada)
うさみ登のぼる
比例東京ブロック小選挙区重複東京26区
元衆議院議員
[プロフィール](https://team-mir.ai/election/shugiin-2026/members/noboru-usami)
高山たかやまさとし
比例東京ブロック
党幹事長
[プロフィール](https://team-mir.ai/election/shugiin-2026/members/satoshi-takayama)
土橋どばしあきひろ
比例東京ブロック小選挙区重複東京2区
脚本家・小説家
[プロフィール](https://team-mir.ai/election/shugiin-2026/members/akihiro-dobashi)
みねしま侑也ゆうや
比例東京ブロック小選挙区重複東京7区
元IT企業役員
[プロフィール](https://team-mir.ai/election/shugiin-2026/members/yuya-mineshima)
須田すだえいたろう
比例東海ブロック
党選挙対策委員長
[プロフィール](https://team-mir.ai/election/shugiin-2026/members/eitaro-suda)
酒井さかいゆうすけ
比例近畿ブロック小選挙区重複京都2区
ITコンサル
[プロフィール](https://team-mir.ai/election/shugiin-2026/members/yusuke-sakai)
堀場ほりばさち子
比例近畿ブロック小選挙区重複京都1区
前衆議院議員
[プロフィール](https://team-mir.ai/election/shugiin-2026/members/sachiko-horiba)
山本やまもとたけよし
比例近畿ブロック
上場企業執行役員
[プロフィール](https://team-mir.ai/election/shugiin-2026/members/takeyoshi-yamamoto)
古川ふるかわあおい
比例九州ブロック
エンジニア
[プロフィール](https://team-mir.ai/election/shugiin-2026/members/aoi-furukawa)
`;

// Helper to remove furigana (hiragana between Kanji or mixed)
// A heuristic: The name in CSV is like "稲原むねよし".
// The raw text has "稲原いなはらむねよし".
// It seems "稲原" + "いなはら" + "むねよし"?
// Actually the CSV names are standardized.
// Let's create a manual mapping or simple heuristic.
// CSV Name Example: "稲原むねよし", "林たくみ"
// Scraped Name: "稲原いなはらむねよし", "林はやしたくみ"
// It seems the scraped name INTERLEAVES furigana? Or just appends?
// "Hayashi" (林) + "Hayashi" (はやし) + "Takumi" (たくみ) -> "林はやしたくみ"
// It looks like "Last Kanji" + "Last Furigana" + "First" ...?
// Actually simpler: The text includes everything.
// But the CSV uses a specific format.
// Validating against CSV:
// CSV: 稲原むねよし, 林たくみ, 武藤かず子, 河合みちお, 小林しゅうへい, 山田えり, うさみ登, 高山さとし, 土橋あきひろ, みねしま侑也, 須田えいたろう, 酒井ゆうすけ, 堀場さち子, 山本たけよし, 古川あおい

// Approach: Map based on phonetic or visual similarity, OR just manual mapping since the list is short (15 people).
// Manual is safest and fastest for 15 info.

const mapping = {
    "稲原むねよし": { url: "https://team-mir.ai/election/shugiin-2026/members/muneyoshi-inahara" },
    "林たくみ": { url: "https://team-mir.ai/election/shugiin-2026/members/takumi-hayashi" },
    "武藤かず子": { url: "https://team-mir.ai/election/shugiin-2026/members/kazuko-muto" },
    "河合みちお": { url: "https://team-mir.ai/election/shugiin-2026/members/michio-kawai" },
    "小林しゅうへい": { url: "https://team-mir.ai/election/shugiin-2026/members/syuhei-kobayashi" },
    "山田えり": { url: "https://team-mir.ai/election/shugiin-2026/members/eri-yamada" },
    "うさみ登": { url: "https://team-mir.ai/election/shugiin-2026/members/noboru-usami" },
    "高山さとし": { url: "https://team-mir.ai/election/shugiin-2026/members/satoshi-takayama" },
    "土橋あきひろ": { url: "https://team-mir.ai/election/shugiin-2026/members/akihiro-dobashi" },
    "みねしま侑也": { url: "https://team-mir.ai/election/shugiin-2026/members/yuya-mineshima" },
    "須田えいたろう": { url: "https://team-mir.ai/election/shugiin-2026/members/eitaro-suda" },
    "酒井ゆうすけ": { url: "https://team-mir.ai/election/shugiin-2026/members/yusuke-sakai" },
    "堀場さち子": { url: "https://team-mir.ai/election/shugiin-2026/members/sachiko-horiba" },
    "山本たけよし": { url: "https://team-mir.ai/election/shugiin-2026/members/takeyoshi-yamamoto" },
    "古川あおい": { url: "https://team-mir.ai/election/shugiin-2026/members/aoi-furukawa" }
};

const outputPath = path.resolve('./src/data/candidate_profiles.json');
fs.writeFileSync(outputPath, JSON.stringify(mapping, null, 2));
console.log('Profile data written to', outputPath);
