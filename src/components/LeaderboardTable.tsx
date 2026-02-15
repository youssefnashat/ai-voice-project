'use client';

import { motion } from 'framer-motion';
import { Trophy, Medal, Eye } from 'lucide-react';

const leaderboardData = [
  { rank: 1, username: "sarah_chen", score: 96, investor: "Marcus Chen", duration: "4:32", avatar: "SC" },
  { rank: 2, username: "alex_startup", score: 94, investor: "Marcus Chen", duration: "3:45", avatar: "AS" },
  { rank: 3, username: "founder_mike", score: 91, investor: "Marcus Chen", duration: "4:12", avatar: "FM" },
  { rank: 4, username: "tech_guru", score: 88, investor: "Marcus Chen", duration: "2:58", avatar: "TG" },
  { rank: 5, username: "venture_lisa", score: 85, investor: "Marcus Chen", duration: "3:22", avatar: "VL" },
  { rank: 6, username: "startup_dev", score: 82, investor: "Marcus Chen", duration: "4:05", avatar: "SD" },
  { rank: 7, username: "pitch_master", score: 79, investor: "Marcus Chen", duration: "3:18", avatar: "PM" },
  { rank: 8, username: "founder_alex", score: 76, investor: "Marcus Chen", duration: "2:45", avatar: "FA" },
];

export default function LeaderboardTable({ currentUserName }: { currentUserName?: string | null }) {
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl backdrop-blur-xl overflow-hidden shadow-2xl">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-white/5 border-b border-white/10">
              <th className="px-6 py-4 text-gray-400 text-sm font-medium uppercase tracking-wider">Rank</th>
              <th className="px-6 py-4 text-gray-400 text-sm font-medium uppercase tracking-wider">Username</th>
              <th className="px-6 py-4 text-gray-400 text-sm font-medium uppercase tracking-wider">Score</th>
              <th className="px-6 py-4 text-gray-400 text-sm font-medium uppercase tracking-wider hidden md:table-cell">Investor</th>
              <th className="px-6 py-4 text-gray-400 text-sm font-medium uppercase tracking-wider hidden md:table-cell">Duration</th>
              <th className="px-6 py-4 text-gray-400 text-sm font-medium uppercase tracking-wider text-right">View</th>
            </tr>
          </thead>
          <motion.tbody
            variants={container}
            initial="hidden"
            animate="show"
          >
            {leaderboardData.map((row) => {
              const isCurrentUser = currentUserName?.toLowerCase() === row.username.toLowerCase();
              return (
                <motion.tr
                  key={row.rank}
                  variants={item}
                  whileHover={{ scale: 1.005, backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
                  className={`border-b border-white/5 transition-colors ${
                    isCurrentUser ? 'border-l-4 border-l-cyan-500 bg-cyan-500/5' : ''
                  }`}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {row.rank === 1 && <Trophy size={18} className="text-yellow-400" />}
                      {row.rank === 2 && <Medal size={18} className="text-gray-300" />}
                      {row.rank === 3 && <Medal size={18} className="text-amber-600" />}
                      <span className={`font-bold ${
                        row.rank === 1 ? 'text-yellow-400' :
                        row.rank === 2 ? 'text-gray-300' :
                        row.rank === 3 ? 'text-amber-600' : 'text-gray-500'
                      }`}>
                        #{row.rank}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold">
                        {row.avatar}
                      </div>
                      <span className="text-white font-medium flex items-center gap-2">
                        {row.username}
                        {isCurrentUser && <span className="text-[10px] bg-cyan-500/20 text-cyan-400 px-1.5 py-0.5 rounded uppercase font-bold">You</span>}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1.5">
                      <span className="text-cyan-400 font-bold text-lg">{row.score}</span>
                      <div className="w-24 h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-cyan-400 to-purple-500"
                          style={{ width: `${row.score}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-300 hidden md:table-cell">{row.investor}</td>
                  <td className="px-6 py-4 text-gray-400 font-mono text-sm hidden md:table-cell">{row.duration}</td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => alert('Feature coming soon!')}
                      className="border border-cyan-500/50 text-cyan-400 px-3 py-1 rounded-lg text-sm hover:bg-cyan-500/20 transition-all flex items-center gap-1.5 ml-auto"
                    >
                      <Eye size={14} />
                      View
                    </button>
                  </td>
                </motion.tr>
              );
            })}
          </motion.tbody>
        </table>
      </div>
    </div>
  );
}
