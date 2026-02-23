import { ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Terms of Service | GoWash",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white text-black font-mono">
      <nav className="flex items-center justify-between px-6 py-4 border-b-4 border-black bg-white sticky top-0 z-50">
        <a href="/" className="text-3xl font-sans font-bold tracking-tighter uppercase">GoWash</a>
        <a
          href="/"
          className="flex items-center gap-2 text-sm font-bold uppercase bg-white border-2 border-black px-4 py-2 brutal-btn"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </a>
      </nav>

      <main className="max-w-3xl mx-auto px-6 py-16 md:py-24">
        <h1 className="text-5xl md:text-7xl font-sans font-bold uppercase tracking-tighter mb-4">Terms of Service</h1>
        <p className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-12">Last updated: February 2026</p>

        <div className="space-y-10 text-base leading-relaxed font-medium">
          <section>
            <h2 className="text-2xl font-sans font-bold uppercase mb-4">1. Agreement to Terms</h2>
            <p>By accessing or using GoWash services, you agree to be bound by these Terms of Service. If you do not agree, do not use our services.</p>
          </section>

          <section>
            <h2 className="text-2xl font-sans font-bold uppercase mb-4">2. Services</h2>
            <p>GoWash provides washer and dryer appliance rental services on a subscription basis. We deliver, install, maintain, and retrieve rental appliances at your residence within our service area.</p>
          </section>

          <section>
            <h2 className="text-2xl font-sans font-bold uppercase mb-4">3. Eligibility</h2>
            <p>You must be at least 18 years old, reside within our service area, and have appropriate washer/dryer hookups at your residence. We reserve the right to verify eligibility before completing any booking.</p>
          </section>

          <section>
            <h2 className="text-2xl font-sans font-bold uppercase mb-4">4. Subscription & Payment</h2>
            <p>Subscriptions are billed monthly via the payment method on file. Your first payment, including any applicable setup fee, is charged at the time of booking. Subsequent payments are charged on the same date each month. All fees are non-refundable except as required by law.</p>
          </section>

          <section>
            <h2 className="text-2xl font-sans font-bold uppercase mb-4">5. Equipment Care</h2>
            <p>You agree to use rented appliances for their intended purpose and in accordance with manufacturer guidelines. You are responsible for damage caused by misuse, negligence, or unauthorized modifications. Normal wear and tear is covered by GoWash at no additional charge.</p>
          </section>

          <section>
            <h2 className="text-2xl font-sans font-bold uppercase mb-4">6. Maintenance & Repairs</h2>
            <p>GoWash covers all maintenance and repairs for normal wear and tear at no cost. You must report any issues promptly. We will schedule a repair or replacement at a mutually convenient time. You agree to provide reasonable access to the equipment for service.</p>
          </section>

          <section>
            <h2 className="text-2xl font-sans font-bold uppercase mb-4">7. Cancellation</h2>
            <p>You may cancel your subscription at any time after any minimum term commitment. Cancellation requires 30 days written notice. Upon cancellation, GoWash will schedule a pickup of the equipment. Early termination during a minimum term may incur an early termination fee.</p>
          </section>

          <section>
            <h2 className="text-2xl font-sans font-bold uppercase mb-4">8. Limitation of Liability</h2>
            <p>GoWash is not liable for any indirect, incidental, or consequential damages arising from the use of our services or equipment. Our total liability is limited to the amount you have paid in the preceding 12 months.</p>
          </section>

          <section>
            <h2 className="text-2xl font-sans font-bold uppercase mb-4">9. Changes to Terms</h2>
            <p>We may update these terms from time to time. Continued use of our services after changes constitutes acceptance. We will notify you of material changes via email.</p>
          </section>

          <section>
            <h2 className="text-2xl font-sans font-bold uppercase mb-4">10. Contact</h2>
            <p>Questions about these terms? Email us at <a href="mailto:hello@washerdryer.com" className="text-[#0055FF] underline underline-offset-4">hello@washerdryer.com</a>.</p>
          </section>
        </div>
      </main>

      <footer className="bg-white p-8 md:p-12 border-t-4 border-black flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="text-4xl font-sans font-bold tracking-tighter uppercase">GoWash.</div>
        <div className="flex gap-8 text-base font-bold uppercase">
          <span className="text-gray-400">Terms</span>
          <a href="/privacy" className="hover:text-[#0055FF] hover:underline underline-offset-4">Privacy</a>
        </div>
      </footer>
    </div>
  );
}
