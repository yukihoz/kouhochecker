const problems = [
    "京都1区",
    "東京都1区",
    "京都府1区",
    "大阪1区",
    "大阪府1区",
    "神奈川1区",
    "神奈川県1区"
];

problems.forEach(input => {
    // Current Regex
    const match = input.match(/^(.+?)(?:都|府|県)?(\d+)区$/);
    if (match) {
        const key = match[1] + match[2] + "区";
        console.log(`Input: ${input} -> Key: ${key} (Match1: ${match[1]}, Suffix consumed? ${match[0].includes(match[1])})`);
    } else {
        console.log(`Input: ${input} -> No match`);
    }
});
