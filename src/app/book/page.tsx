"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { motion } from "motion/react";
import { ArrowRight } from "lucide-react";

const fadeInUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" as const } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.2 } }
};

export default function BookPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startBooking = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/bookings", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to start booking");
        setLoading(false);
        return;
      }
      router.push(`/book/${data.bookingId}`);
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-black font-mono flex flex-col overflow-x-hidden">
      {/* Navigation */}
      <nav className="flex items-center justify-between px-6 py-4 border-b-4 border-black bg-white sticky top-0 z-50">
        <div className="text-3xl font-sans font-bold tracking-tighter uppercase">WashGo</div>
        <div className="flex items-center gap-6 text-sm font-bold uppercase">
          <button
            onClick={startBooking}
            disabled={loading}
            className="bg-[#0055FF] text-white px-6 py-2 border-2 border-black brutal-btn font-sans tracking-wide"
          >
            {loading ? "Starting..." : "Book Now"}
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col">
        <div 
          className="relative min-h-[calc(100vh-76px)] px-6 py-12 flex flex-col items-center justify-center border-b-4 border-black bg-cover bg-center overflow-hidden"
          style={{ backgroundImage: "url('/hero-bg.png')" }}
        >
          {/* Background Image */}
          <div
            className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: "url('/hero-laundry.jpg')" }}
          />

          <div className="relative z-10 w-full max-w-7xl mx-auto flex flex-col h-full justify-center flex-1">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-8 items-center my-auto">
              
              {/* Left Side: Massive Text */}
              <div className="flex flex-col items-start pt-12 lg:pt-0">
                <motion.div
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, type: "spring" }}
                >
                  <div className="inline-block bg-[#0055FF] text-white px-4 py-2 border-2 border-black font-bold uppercase tracking-widest text-sm mb-6 lg:mb-8 brutal-shadow">
                    The Modern Way
                  </div>
                  <h1 
                    className="text-[20vw] lg:text-[12rem] font-sans font-black leading-[0.8] tracking-tighter lowercase mb-6 lg:mb-8 text-[#F2F0E6]"
                    style={{ textShadow: "4px 4px 0px #000, 8px 8px 0px #000" }}
                  >
                    washgo
                  </h1>
                  <motion.div
                    initial={{ opacity: 0, x: -50, rotate: -2 }}
                    animate={{ opacity: 1, x: 0, rotate: -1 }}
                    transition={{ duration: 0.8, delay: 0.2, type: "spring", bounce: 0.4 }}
                    className="inline-block bg-[#0055FF] text-white px-4 md:px-5 py-2 md:py-3 border-2 md:border-4 border-black font-mono font-bold uppercase tracking-widest text-xs md:text-sm mt-4 md:mt-6 brutal-shadow"
                  >
                    <span className="text-yellow-400 mr-2">⭐</span> Premium laundry. Zero commitment.
                  </motion.div>
                </motion.div>
              </div>

              {/* Right Side: Floating Brutalist Cards */}
              <div className="relative h-[450px] lg:h-[600px] flex items-center justify-center lg:justify-end w-full max-w-lg mx-auto lg:max-w-none">
                
                {/* Free Delivery Card */}
                <motion.div
                  initial={{ opacity: 0, x: 100, rotate: 15 }}
                  animate={{ opacity: 1, x: 0, rotate: 8 }}
                  transition={{ duration: 0.8, delay: 0.2, type: "spring", bounce: 0.4 }}
                  className="absolute z-20 top-0 lg:top-16 right-4 lg:right-24 bg-white border-4 border-black p-6 w-56 lg:w-64 brutal-card group hover:rotate-0 transition-transform cursor-default"
                >
                  <div className="w-12 h-12 bg-[#0055FF] rounded-full border-2 border-black mb-4 flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                    <span className="text-white font-bold text-xl">&#10003;</span>
                  </div>
                  <h3 className="font-sans font-bold text-xl uppercase mb-2">Free Delivery<br/>& Install</h3>
                  <p className="text-sm font-medium text-gray-600">Done in 30 minutes.</p>
                </motion.div>

                {/* Pricing Card */}
                <motion.div
                  initial={{ opacity: 0, y: 100, rotate: -8 }}
                  animate={{ opacity: 1, y: 0, rotate: -4 }}
                  transition={{ duration: 0.8, delay: 0.4, type: "spring", bounce: 0.4 }}
                  className="absolute z-30 bottom-12 lg:bottom-16 right-4 lg:right-12 bg-[#0055FF] text-white border-4 border-black p-6 lg:p-8 w-72 lg:w-80 brutal-card group hover:rotate-0 transition-transform cursor-default"
                >
                  <div className="text-sm font-bold uppercase tracking-widest text-white/80 mb-2">Washer & Dryer Set</div>
                  <div className="text-6xl lg:text-7xl font-sans font-bold leading-none mb-1">$59<span className="text-2xl">/mo</span></div>
                  <div className="text-xs font-bold uppercase tracking-wider text-white/60 mb-5">12-month plan</div>
                  
                  <button
                    onClick={startBooking}
                    disabled={loading}
                    className="w-full bg-white text-black hover:bg-black hover:text-white transition-colors py-4 font-sans font-bold text-xl uppercase border-2 border-black brutal-btn flex items-center justify-center gap-2"
                  >
                    {loading ? "Starting..." : "Book Now"}
                    <ArrowRight className="w-6 h-6" />
                  </button>
                </motion.div>
                
              </div>
            </div>

            {/* Scroll Indicator */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.5, duration: 1 }}
              className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3 text-black"
            >
              <span className="text-[10px] lg:text-xs font-bold uppercase tracking-widest">Scroll to explore</span>
              <motion.div 
                animate={{ y: [0, 8, 0] }} 
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                className="w-1 h-12 lg:h-16 bg-black relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-full h-1/2 bg-[#0055FF]"></div>
              </motion.div>
            </motion.div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border-b-4 border-black px-6 py-4 text-center">
            <p className="text-red-700 font-bold">{error}</p>
          </div>
        )}

        {/* Features Grid */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-1 md:grid-cols-4 border-b-4 border-black bg-white"
        >
          {[
            { num: "01", title: "FREE DELIVERY", desc: "Next-day available. We bring it right to your laundry room." },
            { num: "02", title: "FREE INSTALL", desc: "Done in 30 mins. Hoses and vents included. No headaches." },
            { num: "03", title: "MAINTENANCE", desc: "Covered forever. If it breaks, we fix or replace it for free." },
            { num: "04", title: "FLEXIBLE", desc: "Cancel anytime. We'll come pick it up when you're done." },
          ].map((feat, i) => (
            <motion.div
              variants={fadeInUp}
              key={i}
              className={`p-8 md:p-10 ${i !== 0 ? "border-t-4 md:border-t-0 md:border-l-4" : ""} border-black flex flex-col h-full hover:bg-[#0055FF] hover:text-white transition-colors duration-300 group`}
            >
              <div className="text-lg font-bold mb-8 opacity-50 group-hover:opacity-100">/{feat.num}</div>
              <h3 className="text-3xl md:text-4xl font-sans font-bold uppercase mb-6 leading-none">{feat.title}</h3>
              <p className="text-base leading-relaxed mt-auto font-medium">{feat.desc}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* How it works */}
        <div className="py-32 px-6 border-b-4 border-black bg-white overflow-hidden">
          <div className="max-w-7xl mx-auto">
            <motion.h2
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-7xl md:text-9xl font-sans font-bold uppercase text-center mb-24 tracking-tighter"
            >
              How it works.
            </motion.h2>

            <motion.div
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8"
            >
              {[
                { step: "1", title: "SELECT", desc: "Choose your machines and plan. No credit check required." },
                { step: "2", title: "SCHEDULE", desc: "Pick a delivery date. We handle the heavy lifting." },
                { step: "3", title: "RELAX", desc: "Enjoy premium laundry from the comfort of your home." },
              ].map((item, i) => (
                <motion.div variants={fadeInUp} key={i} className="border-4 border-black brutal-card bg-white flex flex-col h-full group relative overflow-hidden">
                  {/* Giant faded background number */}
                  <div className="absolute -bottom-8 -right-8 text-[12rem] font-sans font-bold text-gray-100 group-hover:text-[#0055FF]/10 transition-colors duration-500 pointer-events-none leading-none z-0 select-none">
                    {item.step}
                  </div>
                  
                  <div className="bg-[#0055FF] text-white p-6 border-b-4 border-black flex justify-between items-center relative z-10">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-white text-black rounded-full flex items-center justify-center font-bold text-2xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] group-hover:-translate-y-1 transition-transform">
                        {item.step}
                      </div>
                      <span className="text-lg font-bold tracking-widest uppercase">Step {item.step}</span>
                    </div>
                  </div>
                  
                  <div className="p-8 md:p-10 flex-1 flex flex-col relative z-10">
                    <h3 className="text-4xl font-sans font-bold uppercase mb-4 text-black group-hover:text-[#0055FF] transition-colors">{item.title}</h3>
                    <p className="text-lg font-medium leading-relaxed text-gray-700">{item.desc}</p>
                    
                    <div className="mt-12 flex items-center gap-4">
                      <div className="h-1.5 bg-black w-8 group-hover:w-full transition-all duration-500 ease-out"></div>
                      <ArrowRight className="w-8 h-8 text-black opacity-0 group-hover:opacity-100 -translate-x-4 group-hover:translate-x-0 transition-all duration-300" />
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>

        {/* Comparison */}
        <div className="grid grid-cols-1 lg:grid-cols-12 border-b-4 border-black bg-white">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="lg:col-span-4 p-10 lg:p-16 border-b-4 lg:border-b-0 lg:border-r-4 border-black flex flex-col justify-center"
          >
            <h2 className="text-7xl md:text-8xl font-sans font-bold uppercase leading-[0.85] mb-10 tracking-tighter">
              The<br />Rival.
            </h2>
            <p className="text-lg font-medium leading-relaxed">
              Buying machines is the old way. You pay thousands upfront, deal with repairs, and have to move them when you leave.
            </p>
          </motion.div>

          <div className="lg:col-span-8 p-6 md:p-12 lg:p-16 flex items-center justify-center bg-[#f8f8f8]">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="w-full max-w-5xl flex flex-col md:flex-row border-4 border-black brutal-card bg-white"
            >
              <div className="flex-1 p-8 md:p-12 border-b-4 md:border-b-0 md:border-r-4 border-black">
                <div className="text-sm font-bold uppercase text-gray-500 mb-4 tracking-wider">The Old Way</div>
                <h3 className="text-5xl font-sans font-bold mb-8">Buying</h3>
                <div className="text-3xl font-sans font-bold mb-2 line-through text-gray-400">$1,500+</div>
                <div className="text-sm font-bold uppercase text-gray-500 mb-10">Upfront Cost</div>
                <ul className="space-y-6 text-base font-medium">
                  <li className="flex gap-4 items-center"><span className="text-red-500 font-sans font-bold text-xl">X</span> Huge upfront cost</li>
                  <li className="flex gap-4 items-center"><span className="text-red-500 font-sans font-bold text-xl">X</span> You pay for repairs</li>
                  <li className="flex gap-4 items-center"><span className="text-red-500 font-sans font-bold text-xl">X</span> Heavy to move</li>
                </ul>
              </div>
              <div className="flex-1 bg-[#0055FF] text-white p-8 md:p-12 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-bl-full opacity-20"></div>
                <div className="relative z-10">
                  <div className="text-sm font-bold uppercase text-white mb-4 tracking-wider">The Solution</div>
                  <h3 className="text-5xl font-sans font-bold text-white mb-8">WashGo</h3>
                  <div className="text-3xl font-sans font-bold text-white mb-2">$59</div>
                  <div className="text-sm font-bold uppercase text-white/80 mb-10">From / Month (12mo plan)</div>
                  <ul className="space-y-6 text-base font-medium">
                    <li className="flex gap-4 items-center"><span className="text-white font-sans font-bold text-xl">&#10003;</span> Zero upfront cost</li>
                    <li className="flex gap-4 items-center"><span className="text-white font-sans font-bold text-xl">&#10003;</span> Free maintenance</li>
                    <li className="flex gap-4 items-center"><span className="text-white font-sans font-bold text-xl">&#10003;</span> We move it for you</li>
                  </ul>
                  <div className="mt-12 pt-8 border-t-2 border-white/20">
                    <div className="text-sm font-bold uppercase text-white/80 mb-2">Yearly Savings</div>
                    <div className="text-5xl font-sans font-bold text-white">$800+</div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Quote */}
        <div className="bg-[#0055FF] text-white py-32 px-6 border-b-4 border-black flex flex-col items-center text-center relative overflow-hidden">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative z-10 flex flex-col items-center"
          >
            <h2 className="text-4xl md:text-6xl lg:text-7xl font-sans font-bold uppercase max-w-6xl leading-[1.1] mb-16 tracking-tighter">
              &ldquo;I built WashGo because I got tired of lugging quarters to the laundromat. Laundry should be easy.&rdquo;
            </h2>
            <div className="border-4 border-white px-8 py-3 font-bold uppercase tracking-widest text-lg brutal-shadow-white bg-[#0055FF]">
              - Founder
            </div>
          </motion.div>
        </div>

        {/* CTA */}
        <div className="py-40 px-6 bg-white flex flex-col items-center text-center border-b-4 border-black relative overflow-hidden">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", bounce: 0.5 }}
            viewport={{ once: true }}
            className="relative z-10 flex flex-col items-center"
          >
            <h2 className="text-[15vw] md:text-[12rem] font-sans font-bold uppercase leading-none tracking-tighter mb-8">
              Try It.
            </h2>
            <p className="text-2xl md:text-3xl mb-16 font-medium">No credit check. Cancel anytime.</p>
            <button
              onClick={startBooking}
              disabled={loading}
              className="bg-[#0055FF] text-white px-12 py-8 font-sans font-bold text-3xl uppercase border-4 border-black brutal-btn"
            >
              {loading ? "Starting..." : "Start Booking"}
            </button>
          </motion.div>
        </div>

        {/* Footer */}
        <footer className="bg-white p-8 md:p-12 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-4xl font-sans font-bold tracking-tighter uppercase">WashGo.</div>
          <div className="flex gap-8 text-base font-bold uppercase">
            <a href="#" className="hover:text-[#0055FF] hover:underline underline-offset-4">Terms</a>
            <a href="#" className="hover:text-[#0055FF] hover:underline underline-offset-4">Privacy</a>
          </div>
        </footer>
      </main>
    </div>
  );
}
