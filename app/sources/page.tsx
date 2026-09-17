'use client';

/**
 * Xpedition Source Attribution & Licensing Directory
 * Route: /sources
 *
 * Provides full transparency on authoritative Open Educational Resources (OER),
 * scientific repositories, textbooks, and interactive simulations used by Xpedition.
 */

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { LEGAL_CONFIG } from '@/lib/legal/legalConfig';
import { SourceRegistry } from '@/lib/intelligence/sources/sourceRegistry';
import { SourceLicensePolicy } from '@/lib/intelligence/sources/sourceLicense';
import { EducationalSource } from '@/lib/intelligence/sources/sourceTypes';
import {
  BookOpen,
  ArrowLeft,
  ExternalLink,
  ShieldCheck,
  Search,
  Filter,
  CheckCircle2,
  Info,
  Layers,
  Scale
} from 'lucide-react';

export default function SourcesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLicense, setSelectedLicense] = useState<string>('all');

  const allSources: EducationalSource[] = useMemo(() => {
    return SourceRegistry.getAllSources();
  }, []);

  const filteredSources = useMemo(() => {
    return allSources.filter((source) => {
      const matchesSearch =
        source.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        source.publisher.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (source.author && source.author.toLowerCase().includes(searchQuery.toLowerCase())) ||
        source.topics.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesLicense =
        selectedLicense === 'all' || source.license === selectedLicense;

      return matchesSearch && matchesLicense;
    });
  }, [allSources, searchQuery, selectedLicense]);

  // Helper to determine how Xpedition uses the source
  const getUsageDescription = (source: EducationalSource): string => {
    const details = SourceLicensePolicy.getLicenseDetails(source.license);
    if (source.license === 'CC-BY' || source.license === 'PublicDomain' || source.license === 'CC0') {
      return 'Transformative interactive simulations, concept grounding, and curriculum decomposition with full attribution.';
    } else if (source.license === 'CC-BY-NC-SA' || source.license === 'CC-BY-SA') {
      return 'Non-commercial conceptual structuring, reference grounding, and factual verification under ShareAlike guidelines.';
    } else if (source.license === 'FairUseReference' || source.license === 'RestrictedAllRightsReserved') {
      return 'Reference only — factual citation and direct links to original materials. Body text is never ingested wholesale.';
    } else {
      return 'Reference only — reuse/adaptation rights require verification.';
    }
  };

  const uniqueLicenses = useMemo(() => {
    const licenses = new Set(allSources.map((s) => s.license));
    return ['all', ...Array.from(licenses)];
  }, [allSources]);

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 p-4 sm:p-8 font-sans flex flex-col items-center">
      <div className="max-w-4xl w-full space-y-8 py-6">
        {/* Navigation / Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <Link
            href="/trust"
            className="inline-flex items-center gap-2 text-xs font-mono text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-cyan-400" />
            <span>Trust Center</span>
          </Link>
          <span className="font-mono text-[10px] uppercase text-cyan-400 font-bold tracking-widest">
            SOURCE ATTRIBUTION • v{LEGAL_CONFIG.policyVersion}
          </span>
        </div>

        {/* Title */}
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <BookOpen className="w-8 h-8 text-cyan-400" />
            <h1 className="text-3xl font-extrabold text-white tracking-tight">
              Educational Sources & Attribution
            </h1>
          </div>
          <p className="text-xs text-slate-400 font-mono">
            Authoritative Knowledge Foundation • Last Verified: {LEGAL_CONFIG.lastUpdated}
          </p>
          <p className="text-sm text-slate-300 leading-relaxed pt-2">
            {LEGAL_CONFIG.productName} grounds its visual teaching plans, interactive mechanics, and diagnostic assessments
            in authoritative Open Educational Resources (OER), university courseware, and verified scientific repositories.
            We honor intellectual property, open access licenses, and attribution standards.
          </p>
        </div>

        {/* Licensing Policy Summary Card */}
        <div className="p-6 rounded-2xl bg-gradient-to-r from-cyan-950/40 via-slate-900/60 to-indigo-950/40 border border-cyan-500/20 space-y-3">
          <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm">
            <Scale className="w-4 h-4" />
            <span>Our Attribution Commitment</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            We operate on the strict principle: <em className="text-white">“Never assume publicly visible = free to copy.”</em> Content is only transformed into interactive simulations when explicitly allowed by permissive open licenses (such as CC-BY, CC0, or Public Domain). For all other educational resources, materials remain strictly <span className="font-semibold text-amber-300">Reference Only</span> with direct links to the publisher.
          </p>
        </div>

        {/* Filter / Search Bar */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by topic, publisher, or subject (e.g., physics, OpenStax, MIT)..."
              className="w-full pl-9 pr-4 py-2.5 bg-slate-900/80 border border-white/10 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-400"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={selectedLicense}
              onChange={(e) => setSelectedLicense(e.target.value)}
              aria-label="Filter sources by license"
              className="bg-slate-900/80 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-400"
            >
              {uniqueLicenses.map((lic) => (
                <option key={lic} value={lic}>
                  {lic === 'all' ? 'All Licenses' : lic}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Source Cards List */}
        <div className="space-y-4">
          {filteredSources.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-white/10 rounded-2xl">
              <p className="text-xs text-slate-400">No educational sources match your search query.</p>
            </div>
          ) : (
            filteredSources.map((source) => {
              const details = SourceLicensePolicy.getLicenseDetails(source.license);
              const usage = getUsageDescription(source);
              const isRestricted = source.license === 'Unknown' || source.license === 'RestrictedAllRightsReserved';

              return (
                <article
                  key={source.id}
                  className="p-5 rounded-2xl bg-slate-900/60 border border-white/10 hover:border-cyan-500/30 transition-all space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-base font-bold text-white tracking-tight">
                          {source.title}
                        </h3>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 uppercase">
                          {source.category.replace('_', ' ')}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400">
                        Published by <span className="text-slate-200 font-medium">{source.publisher}</span>
                        {source.author && <span> • Authors: {source.author}</span>}
                      </p>
                    </div>

                    <a
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300 transition-colors font-medium self-start shrink-0"
                    >
                      <span>Official Source</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>

                  {/* Excerpt / Concept grounding */}
                  {source.excerpt && (
                    <blockquote className="text-xs text-slate-300 italic bg-black/30 p-3 rounded-lg border-l-2 border-cyan-400/50">
                      &ldquo;{source.excerpt}&rdquo;
                    </blockquote>
                  )}

                  {/* Metadata Row: License, Attribution, Usage */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs border-t border-white/5">
                    {/* License Details */}
                    <div className="space-y-1">
                      <span className="text-[10px] font-mono uppercase text-slate-400 block">License Classification</span>
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-slate-200">{source.license}</span>
                        {source.verifiedOpenAccess && (
                          <span title="Verified Open Access" className="inline-flex items-center">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400">{details.usageGuideline}</p>
                    </div>

                    {/* Attribution Requirement */}
                    <div className="space-y-1">
                      <span className="text-[10px] font-mono uppercase text-slate-400 block">Attribution Requirement</span>
                      <div className="flex items-center gap-1 text-slate-300">
                        {details.attributionRequired ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
                            <span>Attribution Required</span>
                          </>
                        ) : (
                          <>
                            <Info className="w-3.5 h-3.5 text-slate-400" />
                            <span>Public Domain / Optional</span>
                          </>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400">
                        Cited in all associated interactive teaching plans.
                      </p>
                    </div>

                    {/* How Xpedition Uses It */}
                    <div className="space-y-1">
                      <span className="text-[10px] font-mono uppercase text-slate-400 block">How Xpedition Uses This Source</span>
                      <p className={`text-[11px] leading-relaxed ${isRestricted ? 'text-amber-300 font-medium' : 'text-slate-300'}`}>
                        {usage}
                      </p>
                    </div>
                  </div>

                  {/* Topic Badges */}
                  {source.topics && source.topics.length > 0 && (
                    <div className="flex items-center gap-1.5 flex-wrap pt-1">
                      <span className="text-[10px] font-mono text-slate-400">Mapped Topics:</span>
                      {source.topics.map((topic) => (
                        <span
                          key={topic}
                          className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/5 text-slate-300 border border-white/5"
                        >
                          #{topic}
                        </span>
                      ))}
                    </div>
                  )}
                </article>
              );
            })
          )}
        </div>

        {/* Footer info & inquiries */}
        <div className="p-6 rounded-2xl bg-slate-900/40 border border-white/5 space-y-3 text-xs text-slate-400">
          <h4 className="text-white font-bold text-sm">Publisher and Rights Inquiries</h4>
          <p className="leading-relaxed">
            If you are an educational publisher, author, or copyright holder with inquiries or updates regarding source metadata or attribution details, please contact us at{' '}
            <a href={`mailto:${LEGAL_CONFIG.supportEmail}`} className="text-cyan-400 hover:underline">
              {LEGAL_CONFIG.supportEmail}
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
