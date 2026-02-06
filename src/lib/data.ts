import fs from 'fs';
import path from 'path';
import Papa from 'papaparse';

const DATA_DIR = path.join(process.cwd(), 'src/data');

export interface CandidateProfile {
    url: string;
    image?: string;
    sns?: {
        twitter?: string;
        instagram?: string;
        facebook?: string;
        youtube?: string;
    };
}

export interface CandidateData {
    single: string | null;
    singleProfile?: CandidateProfile;
    proportional: string[];
    proportionalProfiles?: Record<string, CandidateProfile>;
    block: string;
}

// Map: District Name -> Candidate Info
let candidateCache: Record<string, CandidateData> | null = null;
let districtMapCache: Record<string, Record<string, string[]>> | null = null;
let profileCache: Record<string, CandidateProfile> | null = null;

export async function getDistrictMap(): Promise<Record<string, Record<string, string[]>>> {
    if (districtMapCache) return districtMapCache;
    const jsonPath = path.join(DATA_DIR, 'municipality_to_district.json');
    const json = fs.readFileSync(jsonPath, 'utf-8');
    districtMapCache = JSON.parse(json);
    return districtMapCache as Record<string, Record<string, string[]>>;
}

function getProfileMap(): Record<string, CandidateProfile> {
    if (profileCache) return profileCache;
    try {
        const jsonPath = path.join(DATA_DIR, 'candidate_profiles.json');
        if (fs.existsSync(jsonPath)) {
            const json = fs.readFileSync(jsonPath, 'utf-8');
            profileCache = JSON.parse(json);
        } else {
            profileCache = {};
        }
    } catch (e) {
        console.warn("Failed to load profile cache", e);
        profileCache = {};
    }
    return profileCache!;
}

export async function getCandidatesMap(): Promise<Record<string, CandidateData>> {
    if (candidateCache) return candidateCache;

    const csvPath = path.join(DATA_DIR, 'kouhosha.csv');
    const csv = fs.readFileSync(csvPath, 'utf-8');
    const profiles = getProfileMap();

    const { data } = Papa.parse<string[]>(csv, { header: false });
    // Row structure: [District, SingleCand, Block, PropCand1, PropCand2...]
    // Header: 小選挙区,候補者,比例,候補者,候補者,候補者,候補者

    const map: Record<string, CandidateData> = {};

    data.forEach((row, index) => {
        if (row.length < 3) return;
        const district = row[0];
        if (!district || district === '小選挙区' || index === 0) return; // Skip header

        const singleCandRaw = row[1] || null;
        // Filter out '山本たけよし'
        const singleCand = singleCandRaw === '山本たけよし' ? null : singleCandRaw;

        const block = row[2];
        // Filter out '山本たけよし' from proportional candidates
        const props = row.slice(3).filter(s => s && s.trim().length > 0 && s !== '山本たけよし');

        let singleProfile: CandidateProfile | undefined;
        if (singleCand && profiles[singleCand]) {
            singleProfile = profiles[singleCand];
        }

        const proportionalProfiles: Record<string, CandidateProfile> = {};
        props.forEach(p => {
            if (profiles[p]) {
                proportionalProfiles[p] = profiles[p];
            }
        });

        map[district] = {
            single: singleCand,
            singleProfile,
            proportional: props,
            proportionalProfiles,
            block
        };
    });

    candidateCache = map;
    return map;
}

export async function findDistricts(prefecture: string, address: string): Promise<string[]> {
    const map = await getDistrictMap();
    const prefMap = map[prefecture];
    if (!prefMap) return [];

    // Try longest match of municipality
    let bestMatch: string[] = [];
    let longestKeyLength = 0;

    for (const key of Object.keys(prefMap)) {
        if (address.startsWith(key)) {
            if (key.length > longestKeyLength) {
                longestKeyLength = key.length;
                bestMatch = prefMap[key];
            }
        }
    }

    return bestMatch;
}

export async function searchMunicipalities(query: string): Promise<string[]> {
    const map = await getDistrictMap();
    const districts = new Set<string>();

    // Iterate all prefectures
    for (const prefecture of Object.keys(map)) {
        const prefMap = map[prefecture];

        // Check if query exactly matches a municipality or starts with it (if query is short?)
        // Or if municipality starts with query (e.g. "札幌" -> "札幌市", "札幌市中央区")
        // User asked for "札幌市" -> corresponds to key "札幌市"

        for (const city of Object.keys(prefMap)) {
            if (city === query || city.startsWith(query)) {
                prefMap[city].forEach(d => districts.add(d));
            }
        }
    }

    return Array.from(districts);
}
