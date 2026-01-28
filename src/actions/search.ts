'use server';

import { CandidateData, findDistricts, getCandidatesMap, searchMunicipalities } from '@/lib/data';

interface ZipCloudResponse {
    message: string | null;
    results: {
        address1: string; // Prefecture
        address2: string; // City/Ward
        address3: string; // Town
        zipcode: string;
    }[] | null;
    status: number;
}

export interface ConstituencyResult {
    districtName: string;
    candidates: CandidateData;
}

export interface SearchResponse {
    success: boolean;
    results: ConstituencyResult[];
    address: string;
    error?: string;
}

export async function searchCandidates(input: string): Promise<SearchResponse> {
    let prefecture = '';
    let addressBody = '';
    let fullAddress = '';
    let districtIds: string[] = [];

    // Normalize Input:
    // 1. Full-width numbers to Half-width
    // 2. Remove all spaces
    const normalizedInput = input
        .replace(/[０-９]/g, (s) => String.fromCharCode(s.charCodeAt(0) - 0xFEE0))
        .replace(/\s+/g, '');

    // Check if input is Zip Code (7 digits)
    const zipMatch = normalizedInput.replace(/-/g, '').match(/^\d{7}$/);

    if (zipMatch) {
        try {
            const res = await fetch(`https://zipcloud.ibsnet.co.jp/api/search?zipcode=${zipMatch[0]}`);
            const data: ZipCloudResponse = await res.json();

            if (data.status !== 200 || !data.results) {
                return { success: false, results: [], address: input, error: '郵便番号が見つかりませんでした。' };
            }

            const resData = data.results[0];
            prefecture = resData.address1;
            addressBody = resData.address2 + resData.address3;
            fullAddress = `${prefecture}${addressBody}`;

            // Note: We'll call findDistricts later using these values
        } catch (e) {
            return { success: false, results: [], address: input, error: '住所検索に失敗しました。' };
        }
    } else {
        // Check for direct district input (e.g. "神奈川8区", "東京1区")
        // Allow optional "都府県" in input
        const districtMatch = normalizedInput.match(/^(.+?)(?:都|府|県)?(\d+)区$/);

        if (districtMatch) {
            const candMap = await getCandidatesMap();

            // Normalize input to CSV format: remove 都府県 (except 北海道 which is part of name)
            let key = districtMatch[1] + districtMatch[2] + "区";

            // Verify if key exists
            if (candMap[key]) {
                return {
                    success: true,
                    results: [{ districtName: key, candidates: candMap[key] }],
                    address: input
                };
            }
        }

        // Try searching for Municipality name (Fallback)
        const muniDistricts = await searchMunicipalities(normalizedInput);
        if (muniDistricts.length > 0) {
            // Found districts for this municipality
            districtIds = muniDistricts;
            fullAddress = input;
        } else {
            // Assume input is full address
            // We need to split Prefecture.
            const prefMatch = input.match(/^(東京都|北海道|(?:京都|大阪)府|.{2,3}県)(.+)/);
            if (prefMatch) {
                prefecture = prefMatch[1];
                addressBody = prefMatch[2];
                fullAddress = input;
            } else {
                return { success: false, results: [], address: input, error: '都道府県から住所を入力するか、選挙区名（例：東京1区）・市区町村名（例：札幌市）を入力してください。' };
            }
        }
    }

    // Find Districts (if not from Muni search and we have pref/addr)
    if (districtIds.length === 0 && prefecture) {
        districtIds = await findDistricts(prefecture, addressBody);
    }

    if (districtIds.length === 0) {
        return { success: false, results: [], address: fullAddress, error: '該当する選挙区が見つかりませんでした。詳細な住所を入力してみてください。' };
    }

    // Get Candidates
    const candMap = await getCandidatesMap();
    const results: ConstituencyResult[] = [];

    for (const dist of districtIds) {
        // Normalize district name to match CSV format
        let lookupKey = dist;

        // If exact match fails, try normalization
        if (!candMap[lookupKey]) {
            lookupKey = dist
                .replace('東京都', '東京')
                .replace('大阪府', '大阪')
                .replace('京都府', '京都')
                .replace('県', '');
        }

        const cands = candMap[lookupKey];
        if (cands) {
            results.push({
                districtName: lookupKey, // Display matched key e.g. "東京2区"
                candidates: cands
            });
        } else {
            // No candidates found even after normalization
            results.push({
                districtName: dist,
                candidates: { single: null, proportional: [], block: '' }
            });
        }
    }

    return { success: true, results, address: fullAddress };
}
