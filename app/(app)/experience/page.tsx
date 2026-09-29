'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, BriefcaseBusiness, GitBranch, Sparkles } from 'lucide-react';

const CareerPathPage = () => {
  return (
    <main className="min-h-screen bg-[#f8fafc] text-slate-900">
      <div className="mx-auto max-w-[1500px] px-5 py-6 sm:px-8 lg:px-12">
        <div className="flex items-center justify-between">
          <Link
            href="/premium"
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold shadow-sm transition hover:-translate-y-0.5"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Premium
          </Link>
          <span className="inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-cyan-50 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-cyan-700">
            <Sparkles className="h-4 w-4" />
            AI Career Path
          </span>
        </div>

        <header className="mx-auto max-w-4xl py-10 text-center">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-cyan-600">Xpedition Premium</p>
          <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-6xl">
            Neural Network → AI Career
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
            Explore the decision points, skills, projects, roles, companies, and career progression
            behind a modern Neural Network learning journey.
          </p>
        </header>

        <section className="grid gap-7 lg:grid-cols-2">
          <article className="overflow-hidden rounded-[30px] border border-white bg-white shadow-[0_24px_80px_rgba(15,23,42,.10)]">
            <div className="border-b border-slate-100 px-6 py-5">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-cyan-50 p-3 text-cyan-700"><GitBranch className="h-6 w-6" /></div>
                <div>
                  <h2 className="text-xl font-black">Career Decision Tree</h2>
                  <p className="text-sm text-slate-500">Choose a specialization based on what you enjoy building.</p>
                </div>
              </div>
            </div>
            <div className="relative aspect-[16/10] bg-slate-50">
              <Image
                src="/images/neural-network/step-10-transformer-block.png"
                alt="Neural network career decision visual"
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-contain p-5"
              />
            </div>
          </article>

          <article className="overflow-hidden rounded-[30px] border border-white bg-white shadow-[0_24px_80px_rgba(15,23,42,.10)]">
            <div className="border-b border-slate-100 px-6 py-5">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-violet-50 p-3 text-violet-700"><BriefcaseBusiness className="h-6 w-6" /></div>
                <div>
                  <h2 className="text-xl font-black">AI Career Path</h2>
                  <p className="text-sm text-slate-500">Follow the learning progression from foundations to AI engineering.</p>
                </div>
              </div>
            </div>
            <div className="relative aspect-[16/10] bg-slate-50">
              <Image
                src="/images/neural-network/step-01-one-neuron.png"
                alt="Neural network AI career path visual"
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-contain p-5"
              />
            </div>
          </article>
        </section>

        <section className="mx-auto mt-8 max-w-6xl rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-5">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Career progression</p>
              <h3 className="mt-2 text-2xl font-black">Foundations → Neural Networks → Deep Learning → Transformers → AI Engineering</h3>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Build the knowledge, portfolio projects, and production skills needed for roles such as
                ML Engineer, Generative AI Engineer, Computer Vision Engineer, and MLOps Engineer.
              </p>
            </div>
            <Link
              href="/learn"
              className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-3 text-sm font-bold text-white transition hover:-translate-y-0.5"
            >
              Continue Learning
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
};

export default CareerPathPage;
