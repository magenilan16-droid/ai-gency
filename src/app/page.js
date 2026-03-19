import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <span className="text-xl font-bold text-gray-900">
            ✈️ AI-gency
          </span>
          <Link
            href="/plan"
            className="bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-full hover:bg-blue-700 transition-colors"
          >
            Plan My Trip
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-32 pb-20 px-4 sm:px-6 overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-sky-50 to-indigo-50 -z-10" />
        <div className="absolute top-20 right-10 w-72 h-72 bg-blue-200 rounded-full opacity-20 blur-3xl -z-10" />
        <div className="absolute bottom-10 left-10 w-96 h-96 bg-sky-200 rounded-full opacity-20 blur-3xl -z-10" />

        <div className="max-w-4xl mx-auto text-center">
          <span className="inline-block bg-blue-100 text-blue-700 text-sm font-medium px-4 py-1.5 rounded-full mb-6">
            Powered by Claude AI
          </span>
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-gray-900 leading-tight mb-6">
            Your Dream Trip,{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-sky-500">
              Planned in Seconds
            </span>
          </h1>
          <p className="text-xl text-gray-500 max-w-2xl mx-auto mb-10 leading-relaxed">
            Tell us where you want to go and your budget. Our AI creates a
            personalized day-by-day itinerary with real attractions, cost
            breakdowns, and local tips.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/plan"
              className="bg-blue-600 text-white text-lg font-semibold px-8 py-4 rounded-2xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 hover:shadow-xl hover:shadow-blue-300 hover:-translate-y-0.5"
            >
              Start Planning for Free →
            </Link>
            <a
              href="#how-it-works"
              className="bg-white text-gray-700 text-lg font-semibold px-8 py-4 rounded-2xl border border-gray-200 hover:border-gray-300 transition-all"
            >
              See How It Works
            </a>
          </div>

          {/* Social proof */}
          <p className="mt-8 text-sm text-gray-400">
            No account required · Instant results · 100% free
          </p>
        </div>

        {/* Hero preview card */}
        <div className="max-w-2xl mx-auto mt-16">
          <div className="bg-white rounded-3xl shadow-2xl shadow-blue-100 border border-gray-100 p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-sky-400 rounded-xl flex items-center justify-center text-white font-bold">
                🗺️
              </div>
              <div>
                <div className="font-bold text-gray-900">Tokyo, Japan</div>
                <div className="text-sm text-gray-500">7 days · $3,000 budget</div>
              </div>
              <span className="ml-auto bg-green-100 text-green-700 text-xs font-medium px-3 py-1 rounded-full">
                AI Generated
              </span>
            </div>
            <div className="space-y-3">
              {[
                { day: "Day 1", title: "Arrival & Shinjuku", cost: "$120" },
                { day: "Day 2", title: "Harajuku & Shibuya", cost: "$85" },
                { day: "Day 3", title: "Asakusa & Ueno Park", cost: "$65" },
              ].map((item) => (
                <div
                  key={item.day}
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl"
                >
                  <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded-lg w-12 text-center">
                    {item.day}
                  </span>
                  <span className="flex-1 text-sm font-medium text-gray-700">
                    {item.title}
                  </span>
                  <span className="text-sm text-gray-400 font-medium">
                    {item.cost}
                  </span>
                </div>
              ))}
              <div className="text-center text-sm text-gray-400 pt-1">
                + 4 more days...
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-24 px-4 sm:px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-gray-500 text-lg">
              Three simple steps to your perfect trip
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                icon: "📍",
                title: "Enter Your Details",
                description:
                  "Tell us your destination, travel dates, number of travelers, budget, and trip style.",
              },
              {
                step: "02",
                icon: "🤖",
                title: "AI Builds Your Plan",
                description:
                  "Our AI analyzes thousands of options and creates a personalized day-by-day itinerary just for you.",
              },
              {
                step: "03",
                icon: "🌍",
                title: "Explore & Share",
                description:
                  "Get a beautiful trip plan with budget breakdown and a shareable link to send to your travel buddies.",
              },
            ].map((item) => (
              <div
                key={item.step}
                className="relative p-8 rounded-3xl border border-gray-100 hover:border-blue-100 hover:shadow-lg hover:shadow-blue-50 transition-all group"
              >
                <span className="absolute top-6 right-6 text-5xl font-black text-gray-50 group-hover:text-blue-50 transition-colors">
                  {item.step}
                </span>
                <div className="text-4xl mb-4">{item.icon}</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {item.title}
                </h3>
                <p className="text-gray-500 leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-4 sm:px-6 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Everything You Need
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: "📅", title: "Day-by-Day Itinerary", desc: "Detailed schedule for every day of your trip" },
              { icon: "💰", title: "Budget Breakdown", desc: "See exactly how your money is allocated across categories" },
              { icon: "🏨", title: "Accommodation Tips", desc: "Best neighborhoods to stay in for your travel style" },
              { icon: "🍜", title: "Local Food Guide", desc: "Must-try dishes and restaurant recommendations" },
              { icon: "🔗", title: "Shareable Link", desc: "Share your trip plan with family and friends instantly" },
              { icon: "💡", title: "Insider Tips", desc: "Local secrets and practical advice for your destination" },
            ].map((f) => (
              <div
                key={f.title}
                className="flex gap-4 p-6 rounded-2xl bg-white border border-gray-100 hover:shadow-md transition-shadow"
              >
                <span className="text-2xl flex-shrink-0">{f.icon}</span>
                <div>
                  <div className="font-semibold text-gray-900 mb-1">{f.title}</div>
                  <div className="text-sm text-gray-500">{f.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto text-center">
          <div className="bg-gradient-to-br from-blue-600 to-sky-500 rounded-3xl p-12 text-white shadow-2xl shadow-blue-200">
            <h2 className="text-4xl font-bold mb-4">
              Ready to Plan Your Adventure?
            </h2>
            <p className="text-blue-100 text-lg mb-8">
              Join thousands of travelers who planned their dream trips with AI.
            </p>
            <Link
              href="/plan"
              className="inline-block bg-white text-blue-600 font-bold text-lg px-10 py-4 rounded-2xl hover:bg-blue-50 transition-colors shadow-lg"
            >
              Plan My Trip Now →
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-8 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-gray-900 font-bold">✈️ AI-gency</span>
          <span className="text-sm text-gray-400">
            Built with Claude AI · Travel smarter
          </span>
        </div>
      </footer>
    </main>
  );
}
