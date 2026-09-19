import type {
  AnalysisResult,
  InterviewFeedback,
  InterviewQuestionsResult,
  PlanResult,
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorMessage = `Request failed with status ${response.status}`;
    try {
      const errorData = await response.json();
      if (errorData.detail) {
        errorMessage = typeof errorData.detail === 'string' 
          ? errorData.detail 
          : JSON.stringify(errorData.detail);
      }
    } catch {
      // Use fallback status text
      errorMessage = response.statusText || errorMessage;
    }
    throw new ApiError(errorMessage, response.status);
  }

  return response.json();
}

export async function checkHealth(): Promise<{ status: string; service: string }> {
  return request('/api/health');
}

export async function analyzeResume(payload: {
  resume_text?: string;
  resume_base64?: string;
  job_description: string;
}): Promise<AnalysisResult> {
  return request('/api/analyze', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function generatePlan(analysis: AnalysisResult): Promise<PlanResult> {
  return request('/api/plan', {
    method: 'POST',
    body: JSON.stringify({
      resume_profile: analysis.resume_profile,
      job_requirements: analysis.job_requirements,
      matched_skills: analysis.matched_skills,
      partial_skills: analysis.partial_skills,
      missing_skills: analysis.missing_skills,
      gaps: analysis.gaps,
      score: analysis.score,
    }),
  });
}

export async function getInterviewQuestions(
  analysis: AnalysisResult,
  plan: PlanResult
): Promise<InterviewQuestionsResult> {
  return request('/api/interview/questions', {
    method: 'POST',
    body: JSON.stringify({
      resume_profile: analysis.resume_profile,
      job_requirements: analysis.job_requirements,
      gaps: analysis.gaps,
      roadmap: plan.roadmap,
      project: plan.project,
    }),
  });
}

export async function submitInterviewAnswer(payload: {
  question: string;
  category: string;
  student_answer: string;
  analysis: AnalysisResult;
}): Promise<InterviewFeedback> {
  return request('/api/interview/feedback', {
    method: 'POST',
    body: JSON.stringify({
      question: payload.question,
      category: payload.category,
      student_answer: payload.student_answer,
      resume_profile: payload.analysis.resume_profile,
      job_requirements: payload.analysis.job_requirements,
    }),
  });
}
