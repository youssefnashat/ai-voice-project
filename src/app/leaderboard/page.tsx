import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import LeaderboardTable from '@/components/LeaderboardTable';

export default async function LeaderboardPage() {
  const session = await getServerSession(authOptions);
  
  const stats = [
    { label: "Total Pitches", value: "1,247" },
    { label: "Top Score", value: "94/100" },
    { label: "Active Users", value: "89" },
  ];

  return (
    <main className="min-h-screen bg-[#050505] pt-24 pb-20">
      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Header Section */}
        <div className="text-center mb-12">
          <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent inline-block">
            Global Leaderboard
          </h1>
          <p className="text-gray-400 text-lg mt-4">
            See how you rank against other founders
          </p>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {stats.map((stat, i) => (
            <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl">
              <p className="text-gray-400 text-sm uppercase tracking-wider font-medium mb-1">{stat.label}</p>
              <p className="text-3xl font-bold text-white">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Leaderboard Table */}
        <LeaderboardTable currentUserName={session?.user?.name} />
        
        {/* CTA */}
        <div className="mt-12 text-center">
          <p className="text-gray-500 mb-4">Want to improve your rank?</p>
          <a 
            href="/pitch" 
            className="inline-block px-8 py-3 bg-white/5 border border-white/10 rounded-xl text-white font-medium hover:bg-white/10 hover:border-white/20 transition-all"
          >
            Start a New Pitch
          </a>
        </div>
      </div>
    </main>
  );
}
