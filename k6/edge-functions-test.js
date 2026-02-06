import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('edge_function_errors');
const aiLatency = new Trend('ai_response_latency');

// Configuration for Edge Functions load testing
export const options = {
  stages: [
    { duration: '20s', target: 10 },   // Warm up
    { duration: '1m', target: 30 },    // Moderate load
    { duration: '2m', target: 50 },    // High load
    { duration: '1m', target: 100 },   // Peak load (100 users)
    { duration: '30s', target: 0 },    // Cool down
  ],
  thresholds: {
    http_req_duration: ['p(95)<10000'],  // AI calls can be slow, 10s threshold
    http_req_failed: ['rate<0.1'],       // Less than 10% error rate
    edge_function_errors: ['rate<0.15'], // Custom error rate
  },
};

const SUPABASE_URL = __ENV.SUPABASE_URL || 'https://zlrendmouhlnkfdnqkto.supabase.co';
const SUPABASE_ANON_KEY = __ENV.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpscmVuZG1vdWhsbmtmZG5xa3RvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjczNzA4NDIsImV4cCI6MjA4Mjk0Njg0Mn0.P9u5WPguCcFXVFedeZw9OTj_y1TD7tP3XyZDu9KMdSo';

export default function () {
  const headers = {
    'apikey': SUPABASE_ANON_KEY,
    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    'Content-Type': 'application/json',
  };

  // Test 1: AI Sensei Edge Function (lightweight request)
  group('AI Sensei - Quick Query', () => {
    const payload = JSON.stringify({
      messages: [
        { role: 'user', content: 'What is a frontend developer?' }
      ],
      context: { roleTitle: 'Frontend Developer' },
      type: 'role_exploration',
    });

    const start = Date.now();
    const res = http.post(
      `${SUPABASE_URL}/functions/v1/ai-sensei`,
      payload,
      { headers, timeout: '30s' }
    );
    aiLatency.add(Date.now() - start);

    check(res, {
      'ai-sensei responds': (r) => r.status === 200 || r.status === 429 || r.status === 402,
      'ai-sensei not server error': (r) => r.status < 500,
    });
    
    errorRate.add(res.status >= 500);
    sleep(2); // Rate limiting buffer
  });

  // Test 2: Fetch Jobs Edge Function
  group('Fetch Jobs', () => {
    const payload = JSON.stringify({
      role: 'Frontend Developer',
      location: 'Bangalore',
      fresherOnly: true,
    });

    const res = http.post(
      `${SUPABASE_URL}/functions/v1/fetch-jobs`,
      payload,
      { headers, timeout: '15s' }
    );

    check(res, {
      'fetch-jobs status ok': (r) => r.status === 200,
      'fetch-jobs returns jobs': (r) => {
        try {
          const body = JSON.parse(r.body);
          return body.jobs && Array.isArray(body.jobs);
        } catch {
          return false;
        }
      },
    });
    
    errorRate.add(res.status !== 200);
    sleep(1);
  });

  // Test 3: Resume Analyzer (if user wants to test AI-heavy endpoint)
  group('Resume Analyzer - Skills Only', () => {
    const payload = JSON.stringify({
      skills: ['JavaScript', 'React', 'Node.js', 'Python'],
      careerRoles: [
        { id: '1', title: 'Frontend Developer', description: 'Build UIs' },
        { id: '2', title: 'Full Stack Developer', description: 'End to end' },
      ],
    });

    const start = Date.now();
    const res = http.post(
      `${SUPABASE_URL}/functions/v1/analyze-resume`,
      payload,
      { headers, timeout: '30s' }
    );
    aiLatency.add(Date.now() - start);

    check(res, {
      'analyze-resume responds': (r) => r.status === 200 || r.status === 429 || r.status === 402,
      'analyze-resume not server error': (r) => r.status < 500,
    });
    
    errorRate.add(res.status >= 500);
    sleep(3); // Longer pause for AI endpoints
  });
}

export function handleSummary(data) {
  return {
    'k6/results/edge-functions-summary.json': JSON.stringify(data, null, 2),
  };
}
