import { ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Privacy Policy | GoWash",
};

export default function PrivacyPage() {
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
        <h1 className="text-5xl md:text-7xl font-sans font-bold uppercase tracking-tighter mb-4">Privacy Policy</h1>
        <p className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-12">Last updated: February 2026</p>

        <div className="space-y-10 text-base leading-relaxed font-medium">
          <section>
            <h2 className="text-2xl font-sans font-bold uppercase mb-4">1. Information We Collect</h2>
            <p>We collect information you provide when booking our services, including your name, email address, phone number, delivery address, and payment information. Payment details are processed securely by Stripe and are never stored on our servers.</p>
          </section>

          <section>
            <h2 className="text-2xl font-sans font-bold uppercase mb-4">2. How We Use Your Information</h2>
            <p>We use your information to process bookings, deliver and maintain equipment, communicate about your account, process payments, and improve our services. We do not sell your personal information to third parties.</p>
          </section>

          <section>
            <h2 className="text-2xl font-sans font-bold uppercase mb-4">3. Payment Security</h2>
            <p>All payment processing is handled by Stripe, a PCI-DSS Level 1 certified payment processor. We do not store credit card numbers or sensitive financial data on our systems.</p>
          </section>

          <section>
            <h2 className="text-2xl font-sans font-bold uppercase mb-4">4. Data Sharing</h2>
            <p>We share your information only with service providers necessary to operate our business: Stripe for payment processing, and delivery personnel for equipment installation. We may also disclose information when required by law.</p>
          </section>

          <section>
            <h2 className="text-2xl font-sans font-bold uppercase mb-4">5. Cookies</h2>
            <p>We use essential cookies to manage your booking session and authentication. We do not use tracking or advertising cookies.</p>
          </section>

          <section>
            <h2 className="text-2xl font-sans font-bold uppercase mb-4">6. Data Retention</h2>
            <p>We retain your account information for the duration of your subscription and for a reasonable period afterward for legal and business purposes. You may request deletion of your data by contacting us.</p>
          </section>

          <section>
            <h2 className="text-2xl font-sans font-bold uppercase mb-4">7. Your Rights</h2>
            <p>You have the right to access, correct, or delete your personal information. You may also opt out of non-essential communications at any time. To exercise these rights, contact us at the email below.</p>
          </section>

          <section>
            <h2 className="text-2xl font-sans font-bold uppercase mb-4">8. Changes to This Policy</h2>
            <p>We may update this privacy policy from time to time. We will notify you of material changes via email. Continued use of our services after changes constitutes acceptance.</p>
          </section>

          <section>
            <h2 className="text-2xl font-sans font-bold uppercase mb-4">9. Contact</h2>
            <p>Questions about your privacy? Email us at <a href="mailto:hello@washerdryer.com" className="text-[#0055FF] underline underline-offset-4">hello@washerdryer.com</a>.</p>
          </section>
        </div>
      </main>

      <footer className="bg-white p-8 md:p-12 border-t-4 border-black flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="text-4xl font-sans font-bold tracking-tighter uppercase">GoWash.</div>
        <div className="flex gap-8 text-base font-bold uppercase">
          <a href="/terms" className="hover:text-[#0055FF] hover:underline underline-offset-4">Terms</a>
          <span className="text-gray-400">Privacy</span>
        </div>
      </footer>
    </div>
  );
}
