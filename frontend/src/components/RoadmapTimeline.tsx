import React from 'react';
import {
  Calendar,
  Clock,
  Target,
  Code2,
  FolderGit2,
  Award,
} from 'lucide-react';
import type { PlanResult } from '../types';

interface RoadmapTimelineProps {
  plan: PlanResult;
}

export const RoadmapTimeline: React.FC<RoadmapTimelineProps> = ({ plan }) => {
  const { roadmap, project } = plan;

  const difficultyBadge = {
    beginner: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    intermediate: 'bg-brand-500/10 text-brand-400 border-brand-500/30',
    advanced: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
  }[project.difficulty] || 'bg-slate-800 text-slate-400';

  return (
    <div className="space-y-8">
      {/* 4-Week Roadmap */}
      <div>
        <div className="flex items-center gap-2.5 mb-5">
          <div className="p-2 rounded-xl bg-brand-500/10 text-brand-400 border border-brand-500/20">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white tracking-tight">
              4-Week Gap Closure Roadmap
            </h3>
            <p className="text-xs text-slate-400">
              Structured week-by-week curriculum tailored to your missing internship competencies
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {roadmap.map((item) => (
            <div
              key={item.week}
              className="glass-panel glass-panel-hover p-5 rounded-xl border border-slate-800 flex flex-col justify-between relative overflow-hidden"
            >
              <div>
                {/* Header */}
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-md bg-brand-500/20 text-brand-300 border border-brand-500/30">
                    Week {item.week}
                  </span>
                  <div className="flex items-center gap-1 text-[11px] text-slate-400 font-mono">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    <span>{item.estimated_effort}</span>
                  </div>
                </div>

                {/* Topic */}
                <h4 className="text-base font-bold text-white mb-2 leading-snug">
                  {item.topic}
                </h4>

                {/* Reason */}
                <p className="text-xs text-slate-400 leading-relaxed mb-3">
                  <strong className="text-slate-300">Why: </strong>
                  {item.reason}
                </p>
              </div>

              {/* Outcome */}
              <div className="pt-3 border-t border-slate-800/80 bg-slate-900/30 -mx-5 -mb-5 px-5 py-3 rounded-b-xl">
                <div className="flex items-start gap-2 text-xs">
                  <Target className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                  <div>
                    <span className="font-semibold text-emerald-400">Expected Outcome: </span>
                    <span className="text-slate-300">{item.expected_outcome}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recommended Capstone Project */}
      <div>
        <div className="flex items-center gap-2.5 mb-5">
          <div className="p-2 rounded-xl bg-accent-500/10 text-accent-500 border border-accent-500/20">
            <FolderGit2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white tracking-tight">
              Recommended Placement Project
            </h3>
            <p className="text-xs text-slate-400">
              One standout project on your resume that directly proves your missing skills to interviewers
            </p>
          </div>
        </div>

        <div className="glass-panel p-6 sm:p-7 rounded-2xl border border-accent-500/30 shadow-xl relative overflow-hidden bg-gradient-to-br from-slate-900/90 via-slate-900/50 to-accent-950/20">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4 pb-4 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h4 className="text-xl font-extrabold text-white tracking-tight">
                  {project.name}
                </h4>
                <span
                  className={`text-[11px] font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${difficultyBadge}`}
                >
                  {project.difficulty}
                </span>
              </div>
              <p className="text-xs text-slate-400 flex items-center gap-2">
                <Clock className="w-3.5 h-3.5" />
                <span>Estimated duration: {project.duration}</span>
              </p>
            </div>

            {/* Skills Covered Pills */}
            <div className="flex flex-wrap gap-1.5">
              {project.skills_covered.map((skill, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 text-xs font-semibold rounded-md bg-brand-500/15 text-brand-300 border border-brand-500/30"
                >
                  +{skill}
                </span>
              ))}
            </div>
          </div>

          {/* Why this project */}
          <div className="mb-4">
            <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5 text-brand-400" />
              <span>Why This Shines on Your Resume</span>
            </h5>
            <p className="text-sm text-slate-300 leading-relaxed bg-slate-950/40 p-3.5 rounded-xl border border-slate-800">
              {project.why}
            </p>
          </div>

          {/* Tech Stack */}
          <div>
            <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
              <Code2 className="w-3.5 h-3.5 text-accent-400" />
              <span>Recommended Tech Stack</span>
            </h5>
            <div className="flex flex-wrap gap-2">
              {project.tech_stack.map((tech, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 text-xs font-mono font-medium rounded-lg bg-slate-800/80 text-slate-200 border border-slate-700"
                >
                  {tech}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
