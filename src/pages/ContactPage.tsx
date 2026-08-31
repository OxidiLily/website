import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Phone, 
  Mail, 
  Globe, 
  CheckCircle2, 
  ArrowRight, 
  MapPin 
} from 'lucide-react';

interface FormState {
  firstName: string;
  lastName: string;
  email: string;
  subject: string;
  message: string;
}

export const ContactPage: React.FC = () => {
  const [formData, setFormData] = useState<FormState>({
    firstName: '',
    lastName: '',
    email: '',
    subject: '',
    message: '',
  });

  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.firstName || !formData.email || !formData.message) return;
    setSubmitted(true);
  };

  return (
    <div className="w-full pt-16 sm:pt-20 md:pt-28 pb-20 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto space-y-14 sm:space-y-20 md:space-y-24">
      {/* SECTION 1: Form & Direct Details */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 items-start">
        {/* Left Column: Direct Info */}
        <div className="lg:col-span-5 space-y-6 sm:space-y-8">
          <div className="space-y-3 sm:space-y-4">
            <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
              Contact Us
            </h1>
            <p className="text-neutral-400 text-xs sm:text-base leading-relaxed">
              Building with cutting-edge design systems and Tailwind? Drop us a line if you need help architecting scalable components, 3D interactions, or wiring bespoke products.
            </p>
          </div>

          <div className="space-y-3 sm:space-y-4 pt-1">
            <a 
              href="tel:+15550102400" 
              className="flex items-center gap-3.5 p-2 sm:p-0 rounded-xl active:bg-neutral-900/80 text-sm sm:text-base text-neutral-300 hover:text-white transition-colors group"
            >
              <div className="w-10 h-10 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-center text-neutral-400 group-hover:text-white group-hover:border-neutral-700 transition-colors shrink-0">
                <Phone className="w-4 h-4" />
              </div>
              <span className="font-mono text-xs sm:text-sm tracking-wide">+1 (555) 010-2400</span>
            </a>

            <a 
              href="mailto:hello@independent-designer.com" 
              className="flex items-center gap-3.5 p-2 sm:p-0 rounded-xl active:bg-neutral-900/80 text-sm sm:text-base text-neutral-300 hover:text-white transition-colors group"
            >
              <div className="w-10 h-10 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-center text-neutral-400 group-hover:text-white group-hover:border-neutral-700 transition-colors shrink-0">
                <Mail className="w-4 h-4" />
              </div>
              <span className="font-mono text-xs sm:text-sm tracking-wide truncate">hello@independent-designer.com</span>
            </a>

            <a 
              href="https://shadcnblocks.com" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="flex items-center gap-3.5 p-2 sm:p-0 rounded-xl active:bg-neutral-900/80 text-sm sm:text-base text-neutral-300 hover:text-white transition-colors group"
            >
              <div className="w-10 h-10 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-center text-neutral-400 group-hover:text-white group-hover:border-neutral-700 transition-colors shrink-0">
                <Globe className="w-4 h-4" />
              </div>
              <span className="font-mono text-xs sm:text-sm tracking-wide">portfolio-atelier.design</span>
            </a>
          </div>
        </div>

        {/* Right Column: Send Us A Message Form */}
        <div className="lg:col-span-7">
          <div className="bg-neutral-950/90 border border-neutral-800/90 rounded-2xl sm:rounded-3xl p-5 sm:p-10 shadow-2xl backdrop-blur-sm space-y-5 sm:space-y-6">
            <div className="space-y-1">
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                Send us a message
              </h2>
              <p className="text-xs sm:text-sm text-neutral-400">
                We usually reply within one business day.
              </p>
            </div>

            {submitted ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="py-10 text-center space-y-4"
              >
                <div className="w-12 h-12 rounded-full bg-white text-black flex items-center justify-center mx-auto shadow-md">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-white">Message Received!</h3>
                <p className="text-neutral-400 text-xs sm:text-sm max-w-sm mx-auto">
                  Thank you for reaching out, {formData.firstName}. We will review your inquiry and get back to you shortly.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSubmitted(false);
                    setFormData({ firstName: '', lastName: '', email: '', subject: '', message: '' });
                  }}
                  className="min-h-[44px] mt-3 px-6 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-xs font-semibold text-white hover:bg-neutral-800 active:scale-95 transition-all cursor-pointer"
                >
                  Send another message
                </button>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* First Name & Last Name */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-neutral-300">
                      First Name <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Jordan"
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      className="w-full px-3.5 py-3 sm:py-2.5 bg-neutral-900/90 border border-neutral-800 rounded-xl text-base sm:text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-500 transition-colors"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-neutral-300">
                      Last Name <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Kim"
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      className="w-full px-3.5 py-3 sm:py-2.5 bg-neutral-900/90 border border-neutral-800 rounded-xl text-base sm:text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-500 transition-colors"
                    />
                  </div>
                </div>

                {/* Email */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-neutral-300">
                    Email <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="you@company.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3.5 py-3 sm:py-2.5 bg-neutral-900/90 border border-neutral-800 rounded-xl text-base sm:text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-500 transition-colors"
                  />
                </div>

                {/* Subject */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-neutral-300">
                    Subject <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Question about blocks / project inquiry"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className="w-full px-3.5 py-3 sm:py-2.5 bg-neutral-900/90 border border-neutral-800 rounded-xl text-base sm:text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-500 transition-colors"
                  />
                </div>

                {/* Message */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-neutral-300">
                    Message <span className="text-red-400">*</span>
                  </label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Tell us what you are building..."
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="w-full px-3.5 py-3 sm:py-2.5 bg-neutral-900/90 border border-neutral-800 rounded-xl text-base sm:text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-500 transition-colors resize-y"
                  />
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  className="w-full min-h-[44px] py-3 rounded-xl bg-white text-black font-semibold text-sm hover:bg-neutral-200 active:scale-[0.98] transition-all cursor-pointer shadow-lg flex items-center justify-center"
                >
                  Send message
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* SECTION 2: Get In Touch Cards + Worldwide Map */}
      <div className="space-y-8 sm:space-y-12">
        {/* Title */}
        <div className="space-y-1.5 sm:space-y-2">
          <p className="text-xs sm:text-sm font-medium text-neutral-400">
            Contact us
          </p>
          <h2 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight">
            Get in touch with us<br />today to learn more
          </h2>
        </div>

        {/* 3 Inquiry Category Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
          {/* Card 1: Sales */}
          <div className="p-5 sm:p-7 rounded-2xl bg-neutral-950/90 border border-neutral-800/90 hover:border-neutral-700 active:scale-[0.99] transition-all space-y-4 flex flex-col justify-between group">
            <div className="space-y-2 sm:space-y-3">
              <h3 className="text-base sm:text-lg font-bold text-white">Sales</h3>
              <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed">
                Interested in learning more about our platform? Contact our sales team for more information.
              </p>
            </div>
            <a 
              href="#form" 
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-white group-hover:text-amber-300 transition-colors cursor-pointer py-1"
            >
              <span>Request a demo</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </a>
          </div>

          {/* Card 2: Support */}
          <div className="p-5 sm:p-7 rounded-2xl bg-neutral-950/90 border border-neutral-800/90 hover:border-neutral-700 active:scale-[0.99] transition-all space-y-4 flex flex-col justify-between group">
            <div className="space-y-2 sm:space-y-3">
              <h3 className="text-base sm:text-lg font-bold text-white">Support</h3>
              <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed">
                We're here to help with any platform questions. Check out our FAQs and learn more.
              </p>
            </div>
            <a 
              href="#form" 
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-white group-hover:text-amber-300 transition-colors cursor-pointer py-1"
            >
              <span>Get support</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </a>
          </div>

          {/* Card 3: General Inquiries */}
          <div className="p-5 sm:p-7 rounded-2xl bg-neutral-950/90 border border-neutral-800/90 hover:border-neutral-700 active:scale-[0.99] transition-all space-y-4 flex flex-col justify-between group sm:col-span-2 md:col-span-1">
            <div className="space-y-2 sm:space-y-3">
              <h3 className="text-base sm:text-lg font-bold text-white">General Inquiries</h3>
              <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed">
                For general inquiries, please reach out to us using the form above.
              </p>
            </div>
            <a 
              href="#form" 
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-white group-hover:text-amber-300 transition-colors cursor-pointer py-1"
            >
              <span>Contact us</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </a>
          </div>
        </div>

        {/* Real Interactive Google Map Container */}
        <div className="flex flex-col gap-4">
          <div className="relative w-full h-[320px] sm:h-[420px] md:h-[480px] rounded-2xl sm:rounded-3xl overflow-hidden border border-neutral-800/90 bg-neutral-950 shadow-2xl group">
            {/* Real Google Map Embed (Alun-Alun Batang) */}
            <iframe
              title="Google Maps Location - Alun-Alun Batang"
              src="https://maps.google.com/maps?q=-6.9078706,109.7302222&hl=en&z=16&output=embed"
              className="w-full h-full border-0 filter invert-[90%] hue-rotate-180 contrast-125 brightness-90 grayscale-[20%] group-hover:filter-none transition-all duration-500"
              loading="lazy"
              allowFullScreen
              referrerPolicy="no-referrer-when-downgrade"
            />

            {/* Desktop Map Info Overlay Card */}
            <div className="hidden sm:block absolute bottom-6 left-6 z-20 max-w-sm p-6 rounded-2xl bg-neutral-950/90 border border-neutral-800/90 shadow-2xl backdrop-blur-md space-y-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-amber-400">
                <MapPin className="w-4 h-4" />
                <span>Studio & Headquarters</span>
              </div>
              
              <h4 className="text-lg font-bold text-white tracking-tight">
                Alun-Alun Batang, Central Java
              </h4>
              
              <p className="text-xs text-neutral-400 leading-relaxed">
                Jl. Veteran, Kauman, Kec. Batang, Kabupaten Batang, Jawa Tengah 51216, Indonesia.
              </p>
              
              <div className="pt-2 flex items-center justify-between gap-3">
                <a 
                  href="https://maps.app.goo.gl/jDBncCiGNfAWegQ66" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white text-black text-xs font-bold hover:bg-neutral-200 transition-colors shadow-md cursor-pointer"
                >
                  <span>Open in Maps</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </a>

                <span className="text-[11px] font-mono text-neutral-500">
                  -6.9078°, 109.7302°
                </span>
              </div>
            </div>
          </div>

          {/* Mobile Map Info Card (Shown cleanly below map on mobile so map view is completely unobstructed) */}
          <div className="sm:hidden p-4 rounded-2xl bg-neutral-950/90 border border-neutral-800/90 shadow-lg space-y-2.5">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-400">
              <MapPin className="w-3.5 h-3.5" />
              <span>Studio & Headquarters</span>
            </div>
            
            <h4 className="text-base font-bold text-white tracking-tight">
              Alun-Alun Batang, Central Java
            </h4>
            
            <p className="text-xs text-neutral-400 leading-relaxed">
              Jl. Veteran, Kauman, Kec. Batang, Kabupaten Batang, Jawa Tengah 51216, Indonesia.
            </p>
            
            <div className="pt-1 flex items-center justify-between gap-2">
              <a 
                href="https://maps.app.goo.gl/jDBncCiGNfAWegQ66" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white text-black text-xs font-bold active:bg-neutral-200 transition-colors shadow-md cursor-pointer"
              >
                <span>Open in Maps</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </a>

              <span className="text-[10px] font-mono text-neutral-500">
                -6.9078°, 109.7302°
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
