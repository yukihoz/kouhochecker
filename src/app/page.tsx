import CandidateChecker from '@/components/CandidateChecker';

export default function Home() {
  return (
    <main className="min-h-screen p-4 flex flex-col items-center justify-center bg-gradient-to-br from-teal-50 via-white to-emerald-50">
      <div className="w-full absolute top-0 left-0 p-6 flex justify-between items-center opacity-50">
        <span className="font-bold text-lg tracking-tight">TEAM MIRAI</span>
      </div>

      <CandidateChecker />


    </main>
  );
}
