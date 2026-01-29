import CandidateChecker from '@/components/CandidateChecker';

export default function Home() {
  return (
    <main className="min-h-screen p-1 md:p-4 flex flex-col items-center justify-center bg-gradient-to-br from-teal-50 via-white to-emerald-50 relative">
      <div className="absolute top-2 left-2 md:top-4 md:left-4">
        <span className="text-black font-bold text-sm md:text-base">mirai checker(非公式)</span>
      </div>

      <CandidateChecker />


    </main>
  );
}
