import { Link } from "react-router-dom";
import { Play, Zap, Wind, Grid, Shuffle, Sun, Footprints, Heart, Feather, Shield, Activity } from "lucide-react";

const GAMES = [
  {
    id: "chromatic-rush",
    title: "Chromatic Rush",
    desc: "Train your focus and reaction speed.",
    path: "/game",
    icon: <Zap size={32} className="text-blue-400" />,
    color: "from-blue-500/20 to-indigo-500/20",
    border: "group-hover:border-blue-500",
    tag: "ADHD Focus"
  },
  {
    id: "impulse-guard",
    title: "Impulse Guard",
    desc: "Resist the urge. Train impulse control.",
    path: "/impulse-guard",
    icon: <Shield size={32} className="text-red-400" />,
    color: "from-red-500/20 to-orange-500/20",
    border: "group-hover:border-red-500",
    tag: "Impulse Control"
  },
  {
    id: "pattern-release",
    title: "Pattern Release",
    desc: "Challenge your urge for perfection.",
    path: "/pattern-release",
    icon: <Grid size={32} className="text-emerald-400" />,
    color: "from-emerald-500/20 to-teal-500/20",
    border: "group-hover:border-emerald-500",
    tag: "OCD Exposure"
  },
  {
    id: "order-shift",
    title: "Order Shift",
    desc: "Adapt quickly to changing rules.",
    path: "/order-shift",
    icon: <Shuffle size={32} className="text-purple-400" />,
    color: "from-purple-500/20 to-pink-500/20",
    border: "group-hover:border-purple-500",
    tag: "Cognitive Flex"
  },
  {
    id: "lumina",
    title: "Lumina", // Updated from Light Builder
    desc: "Restore light to the world, one step at a time.",
    path: "/light-builder",
    icon: <Sun size={32} className="text-yellow-400" />,
    color: "from-yellow-500/20 to-orange-500/20",
    border: "group-hover:border-yellow-500",
    tag: "Depression Uplift"
  },
  {
    id: "neon-rise",
    title: "Neon Rise", // Updated from Momentum Steps
    desc: "Build motivation through small wins.",
    path: "/momentum-steps",
    icon: <Footprints size={32} className="text-indigo-400" />,
    color: "from-indigo-500/20 to-violet-500/20",
    border: "group-hover:border-indigo-500",
    tag: "Activation"
  },
  {
    id: "cosmic-flow",
    title: "Cosmic Flow", // New/Updated from Calm Path
    desc: "Find your center in a chaotic world.",
    path: "/calm-path",
    icon: <Activity size={32} className="text-blue-400" />,
    color: "from-blue-500/20 to-indigo-500/20",
    border: "group-hover:border-blue-500",
    tag: "Flow State"
  },
  {
    id: "emotion-match",
    title: "Emotion Match",
    desc: "Practice identifying facial expressions.",
    path: "/emotion-match",
    icon: <Heart size={32} className="text-rose-400" />,
    color: "from-rose-500/20 to-red-500/20",
    border: "group-hover:border-rose-500",
    tag: "Social Cues"
  },
  {
    id: "sensory-flow",
    title: "Sensory Flow",
    desc: "Calming visual drift without pressure.",
    path: "/sensory-flow",
    icon: <Feather size={32} className="text-teal-400" />,
    color: "from-teal-500/20 to-cyan-500/20",
    border: "group-hover:border-teal-500",
    tag: "Sensory Rest"
  }
];

export default function Games() {
  return (
    <div className="min-h-screen pt-8 px-6 md:px-12 pb-24 relative">
      {/* Gentle background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-1/4 left-1/4 w-80 h-80 bg-indigo-500/5 rounded-full blur-3xl animate-float" style={{ animationDelay: '3s' }}></div>
      </div>

      <div className="max-w-7xl mx-auto relative z-10">

        {/* Header */}
        <div className="mb-12 text-center animate-fade-in">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
            <span className="text-gradient">Neuro Library</span>
          </h1>
          <p className="text-gray-300 text-lg max-w-2xl mx-auto leading-relaxed">
            A collection of gentle cognitive exercises designed to support your unique mind.
            Choose a tool that resonates with your current need.
          </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {GAMES.map((game, index) => (
            <Link
              key={game.id}
              to={game.path}
              className={`card-calm group relative overflow-hidden hover-lift animate-slide-up`}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {/* Subtle animated background */}
              <div className={`absolute inset-0 bg-gradient-to-br ${game.color} opacity-0 group-hover:opacity-100 transition-all duration-700`} />

              <div className="relative z-10 flex flex-col h-full">
                <div className="flex justify-between items-start mb-6">
                  <div className="w-14 h-14 glass rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    {game.icon}
                  </div>
                  <span className="text-xs font-medium uppercase tracking-wider text-gray-400 glass px-3 py-1 rounded-full group-hover:text-white transition-colors">
                    {game.tag}
                  </span>
                </div>

                <h3 className="text-2xl font-bold text-white mb-3 group-hover:text-gradient transition-all duration-300">
                  {game.title}
                </h3>

                <p className="text-gray-300 mb-8 flex-grow group-hover:text-gray-200 transition-colors leading-relaxed">
                  {game.desc}
                </p>

                <div className="flex items-center gap-2 text-sm font-medium text-purple-300 group-hover:gap-4 transition-all duration-300">
                  Begin journey <Play size={16} fill="currentColor" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}