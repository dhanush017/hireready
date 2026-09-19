export interface ResumeProfile {
  name: string | null;
  email: string | null;
  education: string[];
  skills: string[];
  experience: string[];
  projects: string[];
  certifications: string[];
  summary: string | null;
}

export interface JobRequirements {
  title: string | null;
  company: string | null;
  required_skills: string[];
  preferred_skills: string[];
  responsibilities: string[];
  qualifications: string[];
}

export interface SkillMatch {
  skill: string;
  status: 'matched' | 'partial' | 'missing';
  weight: number;
  credit: number;
  evidence: string;
  matched_by: string | null;
}

export interface GapDetail {
  skill: string;
  status: 'partial' | 'missing';
  why_it_matters: string;
  evidence: string;
  how_to_fix: string;
  priority: 'high' | 'medium' | 'low';
}

export interface AnalysisResult {
  resume_profile: ResumeProfile;
  job_requirements: JobRequirements;
  score: number;
  score_explanation: string;
  matched_skills: SkillMatch[];
  partial_skills: SkillMatch[];
  missing_skills: SkillMatch[];
  gaps: GapDetail[];
  disclaimer: string;
}

export interface RoadmapItem {
  week: number;
  topic: string;
  reason: string;
  estimated_effort: string;
  expected_outcome: string;
}

export interface RecommendedProject {
  name: string;
  why: string;
  skills_covered: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  duration: string;
  tech_stack: string[];
}

export interface PlanResult {
  roadmap: RoadmapItem[];
  project: RecommendedProject;
}

export interface InterviewQuestion {
  id: number;
  category: 'resume' | 'technical' | 'dsa' | 'project' | 'behavioral';
  question: string;
  context: string;
}

export interface InterviewQuestionsResult {
  questions: InterviewQuestion[];
}

export interface InterviewFeedback {
  score: number;
  strengths: string[];
  improvements: string[];
  improved_answer: string;
}

export type StepState = 'idle' | 'analyzing' | 'planning' | 'results' | 'interview';
