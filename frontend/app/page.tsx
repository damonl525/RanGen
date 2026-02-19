"use client";

import { useUIStore } from "@/lib/uiStore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, FileCode2, FlaskConical, LayoutTemplate, ShieldCheck } from "lucide-react";
import Link from "next/link";

export default function Home() {
  const { t } = useUIStore();

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-100px)] py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Hero Section */}
      <div className="text-center space-y-8 max-w-4xl animate-in fade-in slide-in-from-bottom-8 duration-700">
        <div className="inline-flex items-center rounded-full border border-slate-200 bg-white/50 px-3 py-1 text-sm font-medium text-slate-800 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/50 dark:text-slate-200">
          <span className="flex h-2 w-2 rounded-full bg-teal-500 mr-2 animate-pulse"></span>
          {t.landing.badge}
        </div>

        <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-slate-900 dark:text-white pb-2">
          {t.landing.title} <br />
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-teal-500">
            {t.landing.titleHighlight}
          </span>
        </h1>

        <p className="text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
          {t.landing.description}
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
          <Link href="/generate">
            <Button size="lg" className="h-12 px-8 text-base bg-slate-900 hover:bg-slate-800 text-white shadow-lg shadow-slate-900/20 transition-all hover:scale-105 active:scale-95">
              {t.landing.startBtn}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
          <Link href="/templates">
            <Button variant="outline" size="lg" className="h-12 px-8 text-base border-slate-200 hover:bg-slate-50 transition-all">
              {t.landing.templateBtn}
            </Button>
          </Link>
        </div>
      </div>

      {/* Feature Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-24 w-full animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-200">
        <FeatureCard
          icon={<FlaskConical className="h-6 w-6 text-blue-500" />}
          title={t.landing.features.algoTitle}
          description={t.landing.features.algoDesc}
        />
        <FeatureCard
          icon={<LayoutTemplate className="h-6 w-6 text-teal-500" />}
          title={t.landing.features.visualTitle}
          description={t.landing.features.visualDesc}
        />
        <FeatureCard
          icon={<FileCode2 className="h-6 w-6 text-indigo-500" />}
          title={t.landing.features.exportTitle}
          description={t.landing.features.exportDesc}
        />
      </div>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <Card className="border-slate-200/60 bg-white/40 dark:bg-slate-900/40 backdrop-blur-sm shadow-sm hover:shadow-md transition-all hover:-translate-y-1">
      <CardHeader>
        <div className="h-12 w-12 rounded-lg bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-700 flex items-center justify-center mb-2">
          {icon}
        </div>
        <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <CardDescription className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
          {description}
        </CardDescription>
      </CardContent>
    </Card>
  );
}
