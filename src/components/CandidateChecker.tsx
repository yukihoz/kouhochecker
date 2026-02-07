'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, MapPin, Users, Info, ChevronRight, AlertCircle, CheckCircle2, XCircle } from 'lucide-react';
import { searchCandidates, SearchResponse, ConstituencyResult } from '@/actions/search';

export default function CandidateChecker() {
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<SearchResponse | null>(null);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim()) return;

        setLoading(true);
        setData(null);
        try {
            const res = await searchCandidates(input);
            setData(res);
        } catch (err) {
            console.error(err);
            setData({ success: false, results: [], address: input, error: 'エラーが発生しました。' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full max-w-2xl mx-auto p-1.5 md:p-6">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="text-center mb-12"
            >
                <div className="mb-2">
                    <span className="text-black font-bold text-sm md:text-base">mirai checker(非公式)</span>
                </div>
                <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-brand to-teal-500 mb-4 tracking-tight">
                    チームみらいに投票できる？
                </h1>
                <p className="text-gray-600 text-lg">
                    住所などから、あなたがチームみらいに投票できるかをチェックできます。
                </p>
            </motion.div>

            {/* 投票日対応のため検索機能を一時停止 */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="relative mb-12 text-center"
            >
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-teal-100">
                    <p className="text-xl md:text-2xl font-bold text-gray-800 leading-relaxed">
                        投票日当日を迎えるにあたり、<br className="hidden md:block" />
                        機能を停止しています。<br />
                        <span className="text-brand text-2xl md:text-3xl mt-2 inline-block">2/8(日)は投票に行きましょう！</span>
                    </p>
                </div>
            </motion.div>

            {/*
            <motion.form
                onSubmit={handleSearch}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="relative mb-12 group"
            >
                <div className="absolute inset-0 bg-gradient-to-r from-brand to-teal-400 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-500"></div>
                <div className="relative bg-white rounded-2xl shadow-xl flex overflow-hidden ring-1 ring-black/5">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="例: 100-0001, 札幌市, 東京1区..."
                        className="flex-1 px-4 md:px-6 py-4 text-lg outline-none text-gray-800 placeholder-gray-400 min-w-0"
                    />
                    <button
                        type="submit"
                        disabled={loading}
                        className="bg-gray-50 px-4 md:px-8 py-4 font-medium text-gray-700 hover:bg-gray-100 transition-colors flex items-center gap-2 disabled:opacity-50 shrink-0"
                    >
                        {loading ? (
                            <div className="w-5 h-5 border-2 border-brand border-t-transparent rounded-full animate-spin" />
                        ) : (
                            <>
                                <Search size={20} />
                                <span className="hidden sm:inline">検索</span>
                            </>
                        )}
                    </button>
                </div>
            </motion.form>
            */}

            <AnimatePresence mode="wait">
                {data && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.5 }}
                    >
                        {!data.success ? (
                            <div className="bg-red-50 border border-red-100 rounded-xl p-6 text-red-800 flex items-start gap-3">
                                <AlertCircle className="shrink-0 mt-1" />
                                <div>
                                    <h3 className="font-bold mb-1">検索できませんでした</h3>
                                    <p className="text-sm opacity-90">{data.error}</p>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-8">
                                <div className="text-center">
                                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-teal-50 text-teal-700 text-sm font-medium mb-2 border border-teal-100">
                                        <MapPin size={14} />
                                        {data.address}
                                    </div>

                                    {data.results.length > 1 && (
                                        <p className="text-sm text-gray-500 mt-2">
                                            ※ 住所から複数の選挙区の可能性があります。
                                        </p>
                                    )}
                                </div>

                                {data.results.map((result, idx) => (
                                    <ConstituencyCard key={idx} result={result} />
                                ))}
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="mt-12 text-center text-xs text-gray-400">
                このサイトは公式の情報を元にサポーターが作成した非公式のものです。
            </div>
        </div>
    );
}

function ConstituencyCard({ result }: { result: ConstituencyResult }) {
    const { districtName, candidates } = result;

    return (
        <motion.div
            className="border-t-4 border-brand bg-white rounded-3xl shadow-xl overflow-hidden"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', duration: 0.6 }}
        >
            {/* Header: District Name */}
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                <h3 className="font-bold text-xl text-gray-800 flex items-center gap-2">
                    <MapPin className="text-brand" size={24} />
                    <span>{districtName}</span>
                </h3>
                <span className="text-xs font-bold bg-brand text-white px-3 py-1 rounded-full">
                    投票対象エリア
                </span>
            </div>

            <div className="p-6 md:p-8 space-y-10">
                {/* 1. Small Constituency Section */}
                <div>
                    <h4 className="flex items-center gap-2 font-bold text-lg text-gray-700 mb-4 pb-2 border-b border-gray-100">
                        <Users className="text-brand" size={20} />
                        1枚目の投票用紙：小選挙区
                    </h4>

                    {candidates.single ? (
                        <>
                            <div className="bg-teal-50 border border-teal-200 rounded-xl p-4 mb-6 text-center">
                                <div className="flex items-center justify-center gap-2 text-gray-900 font-extrabold text-lg md:text-xl mb-1">
                                    <CheckCircle2 size={24} />
                                    <span>チームみらいに投票できます！</span>
                                </div>
                            </div>

                            <div className="bg-white border border-teal-100 rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row items-center gap-6">
                                {/* Image Placeholder */}
                                <div className="w-24 h-24 sm:w-32 sm:h-32 bg-gray-200 rounded-full flex items-center justify-center shrink-0 border-4 border-white shadow-sm overflow-hidden relative">
                                    {candidates.singleProfile?.image ? (
                                        <img
                                            src={candidates.singleProfile.image}
                                            alt={candidates.single}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <Users size={32} className="text-gray-400" />
                                    )}
                                </div>

                                <div className="flex-1 text-center sm:text-left">
                                    <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-brand text-white mb-3 shadow-sm">
                                        チームみらい公認
                                    </span>
                                    <h5 className="text-3xl font-bold text-gray-900 mb-2">
                                        {candidates.single}
                                    </h5>
                                    <p className="text-lg text-gray-800 mb-4 font-bold">
                                        投票用紙には「<span className="text-gray-900 font-extrabold bg-teal-100 px-1 rounded">{candidates.single}</span>」とお書きください。
                                    </p>

                                    <div className="flex flex-wrap justify-center sm:justify-start gap-3">
                                        {candidates.singleProfile ? (
                                            <a
                                                href={candidates.singleProfile.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-sm font-bold text-gray-500 bg-gray-50 hover:bg-gray-100 px-3 py-2 rounded-lg transition border border-gray-200"
                                            >
                                                公式サイト
                                            </a>
                                        ) : (
                                            <span className="text-sm font-bold text-gray-400 bg-gray-50 px-3 py-2 rounded-lg border border-gray-100 cursor-not-allowed">
                                                公式サイト準備中
                                            </span>
                                        )}
                                        {/* SNS Links */}
                                        {candidates.singleProfile?.sns && (
                                            <>
                                                {candidates.singleProfile.sns.twitter && (
                                                    <a href={candidates.singleProfile.sns.twitter} target="_blank" rel="noopener noreferrer" className="text-sm font-bold text-gray-500 bg-gray-50 hover:bg-gray-100 px-3 py-2 rounded-lg transition border border-gray-200">X</a>
                                                )}
                                                {candidates.singleProfile.sns.instagram && (
                                                    <a href={candidates.singleProfile.sns.instagram} target="_blank" rel="noopener noreferrer" className="text-sm font-bold text-gray-500 bg-gray-50 hover:bg-gray-100 px-3 py-2 rounded-lg transition border border-gray-200">Instagram</a>
                                                )}
                                                {candidates.singleProfile.sns.facebook && (
                                                    <a href={candidates.singleProfile.sns.facebook} target="_blank" rel="noopener noreferrer" className="text-sm font-bold text-gray-500 bg-gray-50 hover:bg-gray-100 px-3 py-2 rounded-lg transition border border-gray-200">Facebook</a>
                                                )}
                                                {candidates.singleProfile.sns.youtube && (
                                                    <a href={candidates.singleProfile.sns.youtube} target="_blank" rel="noopener noreferrer" className="text-sm font-bold text-gray-500 bg-gray-50 hover:bg-gray-100 px-3 py-2 rounded-lg transition border border-gray-200">YouTube</a>
                                                )}
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="bg-gray-100 border border-gray-200 rounded-xl p-6 text-center">
                            <h5 className="flex items-center justify-center gap-2 text-lg font-bold text-gray-900 mb-1">
                                <XCircle size={24} />
                                <span>チームみらいに投票できません...</span>
                            </h5>
                            {candidates.proportional.length === 0 && (
                                <>
                                    <p className="text-sm text-gray-600 mb-4">
                                        この選挙区には公認候補がいません。<br />
                                        SNS等で他の選挙区の候補者をぜひ応援してください！
                                    </p>
                                    <a
                                        href="https://team-mir.ai/#member"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1 text-lg font-bold text-brand hover:underline"
                                    >
                                        衆院選の候補者一覧はこちら <ChevronRight size={20} />
                                    </a>
                                </>
                            )}
                        </div>
                    )}
                </div>

                {/* 2. Proportional Block Section */}
                <div>
                    <h4 className="flex items-center gap-2 font-bold text-lg text-gray-700 mb-4 pb-2 border-b border-gray-100">
                        <Users className="text-brand" size={20} />
                        2枚目の投票用紙：比例代表（{candidates.block}）
                    </h4>

                    {candidates.proportional.length > 0 ? (
                        <>
                            {/* Unified Style: Success Banner using Brand Color (Teal) as requested */}
                            <div className="bg-teal-50 border border-teal-200 rounded-xl p-4 mb-6 text-center">
                                <div className="flex items-center justify-center gap-2 text-gray-900 font-extrabold text-lg md:text-xl mb-1">
                                    <CheckCircle2 size={24} />
                                    <span>チームみらいに投票できます！</span>
                                </div>
                            </div>

                            <p className="text-lg text-gray-800 mb-4 font-bold text-center sm:text-left">
                                投票用紙には政党名「<span className="text-gray-900 font-extrabold bg-teal-100 px-1 rounded">チームみらい</span>」とお書きください。
                            </p>

                            <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
                                <h5 className="font-bold text-gray-700 mb-4 text-sm">
                                    名簿登載者一覧
                                </h5>
                                <div className="grid gap-4 sm:grid-cols-2">
                                    {candidates.proportional.map((cand, i) => {
                                        const profile = candidates.proportionalProfiles?.[cand];
                                        return (
                                            <div key={i} className="flex gap-4 p-4 rounded-xl bg-gray-50 border border-gray-100 hover:border-teal-200 transition group items-start">
                                                {/* Image */}
                                                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shrink-0 border-2 border-white shadow-sm relative">
                                                    <div className="w-full h-full rounded-full overflow-hidden flex items-center justify-center">
                                                        {profile?.image ? (
                                                            <img
                                                                src={profile.image}
                                                                alt={cand}
                                                                className="w-full h-full object-cover"
                                                            />
                                                        ) : (
                                                            <Users size={24} className="text-gray-300" />
                                                        )}
                                                    </div>
                                                    <span className="absolute -top-1 -left-1 w-6 h-6 rounded-full bg-brand text-white flex items-center justify-center font-bold text-[10px] shadow-sm z-10 border border-white">
                                                        {i + 1}
                                                    </span>
                                                </div>

                                                <div className="flex-1 min-w-0 pt-1">
                                                    <h6 className="font-bold text-gray-900 text-lg leading-tight mb-1">
                                                        {cand}
                                                    </h6>

                                                    <div className="flex flex-wrap gap-2 mt-2">
                                                        {profile ? (
                                                            <a href={profile.url} target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-gray-500 bg-white hover:bg-gray-100 px-2 py-1 rounded border border-gray-200 transition">
                                                                公式サイト
                                                            </a>
                                                        ) : (
                                                            <span className="text-xs font-bold text-gray-300 bg-gray-50 px-2 py-1 rounded border border-gray-100">
                                                                準備中
                                                            </span>
                                                        )}

                                                        {/* SNS Links */}
                                                        {profile?.sns && (
                                                            <>
                                                                {profile.sns.twitter && (
                                                                    <a href={profile.sns.twitter} target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-gray-500 bg-white hover:bg-gray-100 px-2 py-1 rounded border border-gray-200 transition">X</a>
                                                                )}
                                                                {profile.sns.instagram && (
                                                                    <a href={profile.sns.instagram} target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-gray-500 bg-white hover:bg-gray-100 px-2 py-1 rounded border border-gray-200 transition">Insta</a>
                                                                )}
                                                                {profile.sns.facebook && (
                                                                    <a href={profile.sns.facebook} target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-gray-500 bg-white hover:bg-gray-100 px-2 py-1 rounded border border-gray-200 transition">FB</a>
                                                                )}
                                                                {profile.sns.youtube && (
                                                                    <a href={profile.sns.youtube} target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-gray-500 bg-white hover:bg-gray-100 px-2 py-1 rounded border border-gray-200 transition">YT</a>
                                                                )}
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="bg-gray-100 border border-gray-200 rounded-xl p-6 text-center">
                            <h5 className="flex items-center justify-center gap-2 text-lg font-bold text-gray-900 mb-1">
                                <XCircle size={24} />
                                <span>チームみらいに投票できません...</span>
                            </h5>
                            <p className="text-sm text-gray-600 mb-4">
                                この選挙区には公認候補がいません。<br />
                                SNS等で他の候補者をぜひ応援してください！
                            </p>
                            <a
                                href="https://team-mir.ai/#member"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-lg font-bold text-brand hover:underline"
                            >
                                衆院選の候補者一覧はこちら <ChevronRight size={20} />
                            </a>
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    );
}
