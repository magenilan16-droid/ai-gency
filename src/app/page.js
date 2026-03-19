import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen" style={{ background: "#FFF8F0" }}>

      {/* ── Nav ─────────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-4 sm:px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between bg-white/70 backdrop-blur-xl rounded-2xl px-5 py-3 shadow-sm border border-orange-100">
          <span className="text-lg font-black tracking-tight text-gray-900">
            ✈️ <span className="gradient-text">AI-gency</span>
          </span>
          <Link
            href="/plan"
            className="text-sm font-bold px-5 py-2.5 rounded-xl text-white shadow-md shadow-orange-200"
            style={{ background: "linear-gradient(135deg, #f97316, #ec4899)" }}
          >
            Start Planning →
          </Link>
        </div>
      </nav>

      {/* ── Hero ────────────────────────────────────────── */}
      <section className="relative pt-36 pb-24 px-4 sm:px-6 overflow-hidden">

        {/* Background blobs */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full opacity-30 -z-10 blur-3xl"
          style={{ background: "radial-gradient(circle, #fdba74, #f9a8d4)" }} />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full opacity-20 -z-10 blur-3xl"
          style={{ background: "radial-gradient(circle, #fbbf24, #fb923c)" }} />

        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

            {/* Left — copy */}
            <div>
              <span className="inline-flex items-center gap-2 bg-orange-100 text-orange-600 text-xs font-bold px-4 py-2 rounded-full mb-6 uppercase tracking-widest">
                ✦ Powered by Claude AI
              </span>
              <h1 className="text-5xl sm:text-6xl font-black text-gray-900 leading-[1.05] mb-6">
                Your dream trip,{" "}
                <span className="gradient-text">
                  planned in&nbsp;seconds.
                </span>
              </h1>
              <p className="text-lg text-gray-500 leading-relaxed mb-8 max-w-md">
                Tell us your destination and budget. Our AI builds a personalized
                day-by-day itinerary — instantly.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  href="/plan"
                  className="inline-flex items-center justify-center gap-2 text-white font-bold text-base px-8 py-4 rounded-2xl shadow-xl shadow-orange-200 hover:shadow-2xl hover:shadow-orange-300 hover:-translate-y-0.5 transition-all"
                  style={{ background: "linear-gradient(135deg, #f97316, #ec4899)" }}
                >
                  Plan My Trip Free
                  <span className="text-orange-200">→</span>
                </Link>
                <a
                  href="#how"
                  className="inline-flex items-center justify-center font-semibold text-gray-600 px-8 py-4 rounded-2xl border-2 border-orange-100 hover:border-orange-200 bg-white transition-all"
                >
                  How it works
                </a>
              </div>
              <p className="mt-5 text-xs text-gray-400 font-medium">
                No signup needed · Takes 30 seconds · 100% free
              </p>
            </div>

            {/* Right — preview card */}
            <div className="relative">
              {/* Glow behind card */}
              <div className="absolute inset-4 rounded-3xl blur-2xl opacity-30"
                style={{ background: "linear-gradient(135deg, #f97316, #ec4899)" }} />

              <div className="relative bg-white rounded-3xl p-6 shadow-2xl shadow-orange-100 border border-orange-50">
                {/* Card header */}
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl"
                      style={{ background: "linear-gradient(135deg, #f97316, #ec4899)" }}>
                      🗺️
                    </div>
                    <div>
                      <div className="font-bold text-gray-900">Tokyo, Japan</div>
                      <div className="text-xs text-gray-400">7 days · $3,000</div>
                    </div>
                  </div>
                  <span className="text-xs font-bold px-3 py-1.5 rounded-full text-emerald-600 bg-emerald-50">
                    ✓ Ready
                  </span>
                </div>

                {/* Budget bar */}
                <div className="mb-5">
                  <div className="flex justify-between text-xs text-gray-400 mb-1.5">
                    <span>Budget used</span>
                    <span className="font-bold text-orange-500">$2,840 / $3,000</span>
                  </div>
                  <div className="h-2 bg-orange-50 rounded-full overflow-hidden">
                    <div className="h-full rounded-full w-[94%]"
                      style={{ background: "linear-gradient(90deg, #f97316, #ec4899)" }} />
                  </div>
                </div>

                {/* Days preview */}
                <div className="space-y-2.5">
                  {[
                    { day: "Day 1", title: "Arrival & Shinjuku Exploration", cost: "$120" },
                    { day: "Day 2", title: "Harajuku & Shibuya Crossing", cost: "$85" },
                    { day: "Day 3", title: "Asakusa Temple & Ueno Park", cost: "$65" },
                  ].map((item) => (
                    <div key={item.day}
                      className="flex items-center gap-3 p-3 rounded-2xl"
                      style={{ background: "#FFF8F0" }}>
                      <span className="text-xs font-bold text-orange-500 bg-orange-100 px-2.5 py-1 rounded-lg flex-shrink-0">
                        {item.day}
                      </span>
                      <span className="flex-1 text-sm font-medium text-gray-700 truncate">
                        {item.title}
                      </span>
                      <span className="text-xs font-bold text-gray-400">{item.cost}</span>
                    </div>
                  ))}
                  <div className="text-center text-xs text-gray-300 font-medium pt-1">
                    + 4 more days...
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── How It Works ────────────────────────────────── */}
      <section id="how" className="py-24 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs font-bold uppercase tracking-widest text-orange-400 mb-3">
              ✦ Simple Process
            </p>
            <h2 className="text-4xl sm:text-5xl font-black text-gray-900">
              Three steps to your{" "}
              <span className="gradient-text">perfect trip</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                num: "01",
                icon: "📍",
                title: "Tell us your dream",
                desc: "Destination, dates, travelers, budget, and vibe — our chatbot asks you one question at a time.",
                color: "#fff7ed",
                border: "#fed7aa",
              },
              {
                num: "02",
                icon: "🤖",
                title: "AI crafts your plan",
                desc: "Claude AI generates a personalized day-by-day itinerary with real places, timings, and costs.",
                color: "#fdf4ff",
                border: "#e9d5ff",
              },
              {
                num: "03",
                icon: "🌍",
                title: "Explore & share",
                desc: "Get a beautiful trip plan with budget breakdown and a link to share with travel buddies.",
                color: "#fff1f2",
                border: "#fecdd3",
              },
            ].map((s) => (
              <div key={s.num} className="relative p-7 rounded-3xl border-2 card-hover"
                style={{ background: s.color, borderColor: s.border }}>
                <div className="absolute top-5 right-5 text-5xl font-black opacity-10 text-gray-900">
                  {s.num}
                </div>
                <div className="text-4xl mb-4">{s.icon}</div>
                <h3 className="text-xl font-black text-gray-900 mb-2">{s.title}</h3>
                <p className="text-gray-500 leading-relaxed text-sm">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────── */}
      <section className="py-24 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs font-bold uppercase tracking-widest text-orange-400 mb-3">
              ✦ Everything Included
            </p>
            <h2 className="text-4xl sm:text-5xl font-black text-gray-900">
              What you get
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              { icon: "📅", title: "Day-by-Day Itinerary", desc: "Detailed schedule for every single day" },
              { icon: "💰", title: "Budget Breakdown", desc: "Visual chart of where your money goes" },
              { icon: "🏨", title: "Accommodation Tips", desc: "Best neighborhoods for your travel style" },
              { icon: "🍜", title: "Local Food Guide", desc: "Must-try dishes and where to find them" },
              { icon: "🔗", title: "Shareable Link", desc: "Send your plan to anyone instantly" },
              { icon: "💡", title: "Insider Tips", desc: "Local secrets and practical travel advice" },
            ].map((f) => (
              <div key={f.title}
                className="flex gap-4 p-6 rounded-2xl bg-white border border-orange-50 shadow-sm card-hover">
                <div className="w-11 h-11 rounded-2xl bg-orange-50 flex items-center justify-center text-xl flex-shrink-0">
                  {f.icon}
                </div>
                <div>
                  <div className="font-bold text-gray-900 mb-0.5">{f.title}</div>
                  <div className="text-sm text-gray-400 leading-relaxed">{f.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────── */}
      <section className="py-20 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto">
          <div className="relative rounded-3xl overflow-hidden p-10 sm:p-14 text-center text-white"
            style={{ background: "linear-gradient(135deg, #f97316 0%, #ec4899 60%, #a855f7 100%)" }}>
            {/* Noise texture overlay */}
            <div className="absolute inset-0 opacity-10"
              style={{
                backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E\")",
              }} />
            <div className="relative">
              <p className="text-orange-200 text-sm font-bold uppercase tracking-widest mb-4">
                ✦ Ready to go?
              </p>
              <h2 className="text-4xl sm:text-5xl font-black mb-4 leading-tight">
                Your next adventure<br />starts here.
              </h2>
              <p className="text-white/70 text-lg mb-8">
                Join thousands of travelers who planned smarter with AI.
              </p>
              <Link
                href="/plan"
                className="inline-block bg-white font-black text-lg px-10 py-4 rounded-2xl shadow-2xl hover:-translate-y-1 transition-all"
                style={{ color: "#f97316" }}
              >
                Plan My Trip — It's Free →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────── */}
      <footer className="border-t border-orange-100 py-8 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="font-black text-gray-900">
            ✈️ <span className="gradient-text">AI-gency</span>
          </span>
          <span className="text-sm text-gray-400">Built with Claude AI · Travel smarter ✦</span>
        </div>
      </footer>
    </main>
  );
}
