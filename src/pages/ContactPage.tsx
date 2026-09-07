import React, { Suspense, lazy, useState } from 'react';
import { Decor } from '../components/Decor';
import { motion } from 'motion/react';
import { 
  Phone, 
  Mail, 
  Globe, 
  CheckCircle2, 
  ArrowRight, 
  MapPin 
} from 'lucide-react';
import { canRenderWebGL } from '../lib/device';
import { useSettings } from '../lib/content';

// GhostFibers (ogl) murni dekorasi — jangan diunduh di perangkat lemah.
const GhostFibers = lazy(() => import('../components/GhostFibers'));

interface FormState {
  firstName: string;
  lastName: string;
  email: string;
  subject: string;
  message: string;
}

export const ContactPage: React.FC = () => {
  const t = useSettings();
  const [formData, setFormData] = useState<FormState>({
    firstName: '',
    lastName: '',
    email: '',
    subject: '',
    message: '',
  });

  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState('');

  // Satu INSERT ke tabel messages. Sengaja lewat fetch, bukan supabase-js:
  // menarik klien 267 KB ke chunk halaman publik demi satu POST tidak sepadan.
  // Policy messages_public_insert yang mengizinkannya; anon tetap tidak bisa
  // membaca pesan siapa pun.
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.firstName || !formData.email || !formData.message) return;

    setSending(true);
    setSendError('');
    try {
      const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/rest/v1/messages`, {
        method: 'POST',
        headers: {
          apikey: key,
          Authorization: `Bearer ${key}`,
          'Content-Type': 'application/json',
          // Pasangan tulis dari `Accept-Profile`: memilih schema untuk INSERT.
          'Content-Profile': 'web',
          Prefer: 'return=minimal',
        },
        body: JSON.stringify({
          name: [formData.firstName, formData.lastName].filter(Boolean).join(' '),
          email: formData.email,
          subject: formData.subject || null,
          message: formData.message,
          is_read: false,
        }),
      });
      if (!res.ok) throw new Error(String(res.status));
      setSubmitted(true);
    } catch {
      setSendError('Pesan gagal terkirim. Coba lagi sebentar lagi.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="relative w-full">
      {/* GhostFibers React Bits WebGL Background (fixed di belakang halaman) */}
      <div className="fixed inset-0 w-full h-full pointer-events-none z-0 overflow-hidden">
        {canRenderWebGL && (
          <Decor>
            <GhostFibers
              lineColor="#140E35"
              glowColor="#3437A0"
              speed={0.2}
              scale={2}
              rotation={0}
              rotationSpeed={0.25}
              layers={4}
              waveAmplitude={0.015}
              waveFrequency={3}
              waveSpeed={0.15}
              layerSpeed={0.08}
              twist={0.1}
              twistFrequency={5}
              twistSpeed={1.2}
              lineFrequency={5}
              lineSpacing={2}
              lineSharpness={16}
              glowFalloff={10}
              glowIntensity={1.6}
              brightness={2}
              blueBoost={1.25}
              vignette={0.8}
              grain={0.05}
              dpr={1}
            />
          </Decor>
        )}
      </div>

    <div className="relative z-10 w-full pt-16 sm:pt-20 md:pt-28 pb-14 sm:pb-20 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
      {/* SECTION 1: Form & Direct Details */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 items-start">
        {/* Left Column: Direct Info */}
        <div id="contact-info" className="lg:col-span-5 space-y-6 sm:space-y-8 scroll-mt-28">
          <div className="space-y-3 sm:space-y-4">
            <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
              {t.contact_heading}
            </h1>
            <p className="text-neutral-400 text-xs sm:text-base leading-relaxed">
              {t.contact_intro}
            </p>
          </div>

          <div className="space-y-3 sm:space-y-4 pt-1">
            <a 
              href={`tel:${t.site_phone.replace(/[^+\d]/g, '')}`} 
              className="flex items-center gap-3.5 p-2 sm:p-0 rounded-xl active:bg-neutral-900/80 text-sm sm:text-base text-neutral-300 hover:text-white transition-colors group"
            >
              <div className="w-10 h-10 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-center text-neutral-400 group-hover:text-white group-hover:border-neutral-700 transition-colors shrink-0">
                <Phone className="w-4 h-4" />
              </div>
              <span className="font-mono text-xs sm:text-sm tracking-wide">{t.site_phone}</span>
            </a>

            <a 
              href={`mailto:${t.site_email}`} 
              className="flex items-center gap-3.5 p-2 sm:p-0 rounded-xl active:bg-neutral-900/80 text-sm sm:text-base text-neutral-300 hover:text-white transition-colors group"
            >
              <div className="w-10 h-10 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-center text-neutral-400 group-hover:text-white group-hover:border-neutral-700 transition-colors shrink-0">
                <Mail className="w-4 h-4" />
              </div>
              <span className="font-mono text-xs sm:text-sm tracking-wide truncate">{t.site_email}</span>
            </a>

            <a 
              href={t.site_website_url} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="flex items-center gap-3.5 p-2 sm:p-0 rounded-xl active:bg-neutral-900/80 text-sm sm:text-base text-neutral-300 hover:text-white transition-colors group"
            >
              <div className="w-10 h-10 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-center text-neutral-400 group-hover:text-white group-hover:border-neutral-700 transition-colors shrink-0">
                <Globe className="w-4 h-4" />
              </div>
              <span className="font-mono text-xs sm:text-sm tracking-wide">{t.site_website}</span>
            </a>
          </div>
        </div>

        {/* Right Column: Send Us A Message Form */}
        <div id="contact-form" className="lg:col-span-7 scroll-mt-28">
          <div className="bg-neutral-950/90 border border-neutral-800/90 rounded-2xl sm:rounded-3xl p-5 sm:p-10 shadow-2xl backdrop-blur-sm space-y-5 sm:space-y-6">
            <div className="space-y-1">
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                {t.contact_form_heading}
              </h2>
              <p className="text-xs sm:text-sm text-neutral-400">
                {t.contact_form_note}
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
                <h3 className="text-lg sm:text-xl font-bold text-white">{t.contact_success_title}</h3>
                <p className="text-neutral-400 text-xs sm:text-sm max-w-sm mx-auto">
                  {t.contact_success_text.replace('{nama}', formData.firstName)}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSubmitted(false);
                    setFormData({ firstName: '', lastName: '', email: '', subject: '', message: '' });
                  }}
                  className="min-h-[44px] mt-3 px-6 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-xs font-semibold text-white hover:bg-neutral-800 active:scale-95 transition-all cursor-pointer"
                >
                  {t.contact_success_cta}
                </button>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* First Name & Last Name */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-neutral-300">
                      {t.contact_field_first_name} <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder={t.contact_ph_first_name}
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      className="w-full px-3.5 py-3 sm:py-2.5 bg-neutral-900/90 border border-neutral-800 rounded-xl text-base sm:text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-500 transition-colors"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-neutral-300">
                      {t.contact_field_last_name} <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder={t.contact_ph_last_name}
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      className="w-full px-3.5 py-3 sm:py-2.5 bg-neutral-900/90 border border-neutral-800 rounded-xl text-base sm:text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-500 transition-colors"
                    />
                  </div>
                </div>

                {/* Email */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-neutral-300">
                    {t.contact_field_email} <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    placeholder={t.contact_ph_email}
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3.5 py-3 sm:py-2.5 bg-neutral-900/90 border border-neutral-800 rounded-xl text-base sm:text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-500 transition-colors"
                  />
                </div>

                {/* Subject */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-neutral-300">
                    {t.contact_field_subject} <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={t.contact_ph_subject}
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className="w-full px-3.5 py-3 sm:py-2.5 bg-neutral-900/90 border border-neutral-800 rounded-xl text-base sm:text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-500 transition-colors"
                  />
                </div>

                {/* Message */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-neutral-300">
                    {t.contact_field_message} <span className="text-red-400">*</span>
                  </label>
                  <textarea
                    required
                    rows={4}
                    placeholder={t.contact_ph_message}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="w-full px-3.5 py-3 sm:py-2.5 bg-neutral-900/90 border border-neutral-800 rounded-xl text-base sm:text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-500 transition-colors resize-y"
                  />
                </div>

                {/* Submit Button */}
                {sendError && (
                  <p role="alert" className="text-xs text-red-300 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
                    {sendError}
                  </p>
                )}
                <button
                  type="submit"
                  disabled={sending}
                  className="w-full min-h-[44px] py-3 rounded-xl bg-white text-black font-semibold text-sm hover:bg-neutral-200 active:scale-[0.98] transition-all cursor-pointer shadow-lg flex items-center justify-center disabled:opacity-60"
                >
                  {sending ? t.contact_form_sending : t.contact_form_submit}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>

    {/* Mulai "Get in touch with us" ke bawah: blok hitam opak selebar layar yang
        menutupi GhostFibers, sama seperti pola "All Blogs" di halaman blog. */}
    <div className="relative z-10 w-full bg-black">
      {/* Pita gradasi yang menumpang di atas bagian formulir. Tanpa ini blok
          hitam ini memotong GhostFibers dengan satu garis lurus mendatar,
          persis masalah yang sama seperti di halaman blog. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 -top-40 sm:-top-64 h-40 sm:h-64
                   bg-gradient-to-b from-transparent to-black"
      />
      <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 sm:pt-20 md:pt-24 pb-20">
      {/* SECTION 2: Get In Touch Cards + Worldwide Map */}
      <div id="contact-cards" className="space-y-8 sm:space-y-12 scroll-mt-28">
        {/* Title */}
        <div className="space-y-1.5 sm:space-y-2">
          <p className="text-xs sm:text-sm font-medium text-neutral-400">
            {t.contact_cards_eyebrow}
          </p>
          <h2 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight">
            {t.contact_cards_heading}
          </h2>
        </div>

        {/* 3 Inquiry Category Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
          {/* Card 1: Sales */}
          <div className="p-5 sm:p-7 rounded-2xl bg-neutral-950/90 border border-neutral-800/90 hover:border-neutral-700 active:scale-[0.99] transition-all space-y-4 flex flex-col justify-between group">
            <div className="space-y-2 sm:space-y-3">
              <h3 className="text-base sm:text-lg font-bold text-white">{t.contact_sales_title}</h3>
              <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed">
                {t.contact_sales_text}
              </p>
            </div>
            <a 
              href="#form" 
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-white group-hover:text-amber-300 transition-colors cursor-pointer py-1"
            >
              <span>{t.contact_sales_cta}</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </a>
          </div>

          {/* Card 2: Support */}
          <div className="p-5 sm:p-7 rounded-2xl bg-neutral-950/90 border border-neutral-800/90 hover:border-neutral-700 active:scale-[0.99] transition-all space-y-4 flex flex-col justify-between group">
            <div className="space-y-2 sm:space-y-3">
              <h3 className="text-base sm:text-lg font-bold text-white">{t.contact_support_title}</h3>
              <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed">
                {t.contact_support_text}
              </p>
            </div>
            <a 
              href="#form" 
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-white group-hover:text-amber-300 transition-colors cursor-pointer py-1"
            >
              <span>{t.contact_support_cta}</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </a>
          </div>

          {/* Card 3: General Inquiries */}
          <div className="p-5 sm:p-7 rounded-2xl bg-neutral-950/90 border border-neutral-800/90 hover:border-neutral-700 active:scale-[0.99] transition-all space-y-4 flex flex-col justify-between group sm:col-span-2 md:col-span-1">
            <div className="space-y-2 sm:space-y-3">
              <h3 className="text-base sm:text-lg font-bold text-white">{t.contact_general_title}</h3>
              <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed">
                {t.contact_general_text}
              </p>
            </div>
            <a 
              href="#form" 
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-white group-hover:text-amber-300 transition-colors cursor-pointer py-1"
            >
              <span>{t.contact_general_cta}</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </a>
          </div>
        </div>

        {/* Real Interactive Google Map Container */}
        <div id="contact-map" className="flex flex-col gap-4 scroll-mt-28">
          <div className="relative w-full h-[320px] sm:h-[420px] md:h-[480px] rounded-2xl sm:rounded-3xl overflow-hidden border border-neutral-800/90 bg-neutral-950 shadow-2xl group">
            {/* Real Google Map Embed (Alun-Alun Batang) */}
            <iframe
              title={t.contact_map_title}
              src={`https://maps.google.com/maps?q=${t.contact_map_lat},${t.contact_map_lng}&hl=en&z=16&output=embed`}
              className="w-full h-full border-0 filter invert-[90%] hue-rotate-180 contrast-125 brightness-90 grayscale-[20%] group-hover:filter-none transition-all duration-500"
              loading="lazy"
              allowFullScreen
              referrerPolicy="no-referrer-when-downgrade"
            />

            {/* Desktop Map Info Overlay Card */}
            <div className="hidden sm:block absolute bottom-6 left-6 z-20 max-w-sm p-6 rounded-2xl bg-neutral-950/90 border border-neutral-800/90 shadow-2xl backdrop-blur-md space-y-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-amber-400">
                <MapPin className="w-4 h-4" />
                <span>{t.contact_map_label}</span>
              </div>
              
              <h4 className="text-lg font-bold text-white tracking-tight">
                {t.contact_map_title}
              </h4>
              
              <p className="text-xs text-neutral-400 leading-relaxed">
                {t.contact_map_address}
              </p>
              
              <div className="pt-2 flex items-center justify-between gap-3">
                <a 
                  href={t.contact_map_link} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white text-black text-xs font-bold hover:bg-neutral-200 transition-colors shadow-md cursor-pointer"
                >
                  <span>{t.contact_map_cta}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </a>

                <span className="text-[11px] font-mono text-neutral-500">
                  {Number(t.contact_map_lat).toFixed(4)}°, {Number(t.contact_map_lng).toFixed(4)}°
                </span>
              </div>
            </div>
          </div>

          {/* Mobile Map Info Card (Shown cleanly below map on mobile so map view is completely unobstructed) */}
          <div className="sm:hidden p-4 rounded-2xl bg-neutral-950/90 border border-neutral-800/90 shadow-lg space-y-2.5">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-400">
              <MapPin className="w-3.5 h-3.5" />
              <span>{t.contact_map_label}</span>
            </div>
            
            <h4 className="text-base font-bold text-white tracking-tight">
              {t.contact_map_title}
            </h4>
            
            <p className="text-xs text-neutral-400 leading-relaxed">
              {t.contact_map_address}
            </p>
            
            <div className="pt-1 flex items-center justify-between gap-2">
              <a 
                href={t.contact_map_link} 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white text-black text-xs font-bold active:bg-neutral-200 transition-colors shadow-md cursor-pointer"
              >
                <span>{t.contact_map_cta}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </a>

              <span className="text-[10px] font-mono text-neutral-500">
                {Number(t.contact_map_lat).toFixed(4)}°, {Number(t.contact_map_lng).toFixed(4)}°
              </span>
            </div>
          </div>
        </div>
      </div>
      </div>
    </div>
    </div>
  );
};
