import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const apiLatency = new Trend('api_latency');

// Test configuration for 100 users
export const options = {
  stages: [
    { duration: '30s', target: 20 },   // Ramp up to 20 users
    { duration: '1m', target: 50 },    // Ramp up to 50 users
    { duration: '2m', target: 100 },   // Ramp up to 100 users
    { duration: '3m', target: 100 },   // Stay at 100 users
    { duration: '1m', target: 50 },    // Ramp down to 50
    { duration: '30s', target: 0 },    // Ramp down to 0
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'],  // 95% of requests should be < 2s
    http_req_failed: ['rate<0.05'],     // Less than 5% error rate
    errors: ['rate<0.1'],               // Custom error rate < 10%
  },
};

// Replace with your actual URLs
const BASE_URL = __ENV.BASE_URL || 'https://career-forge-ai-85.lovable.app';
const SUPABASE_URL = __ENV.SUPABASE_URL || 'https://zlrendmouhlnkfdnqkto.supabase.co';
const SUPABASE_ANON_KEY = __ENV.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpscmVuZG1vdWhsbmtmZG5xa3RvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjczNzA4NDIsImV4cCI6MjA4Mjk0Njg0Mn0.P9u5WPguCcFXVFedeZw9OTj_y1TD7tP3XyZDu9KMdSo';

export default function () {
  // Test 1: Homepage Load
  group('Homepage', () => {
    const res = http.get(BASE_URL);
    check(res, {
      'homepage status is 200': (r) => r.status === 200,
      'homepage loads in < 3s': (r) => r.timings.duration < 3000,
    });
    errorRate.add(res.status !== 200);
    sleep(1);
  });

  // Test 2: Fetch Career Roles from Supabase
  group('Career Roles API', () => {
    const headers = {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
    };
    
    const start = Date.now();
    const res = http.get(`${SUPABASE_URL}/rest/v1/career_roles?select=*`, { headers });
    apiLatency.add(Date.now() - start);
    
    check(res, {
      'career_roles status is 200': (r) => r.status === 200,
      'career_roles returns data': (r) => {
        try {
          const body = JSON.parse(r.body);
          return Array.isArray(body) && body.length > 0;
        } catch {
          return false;
        }
      },
    });
    errorRate.add(res.status !== 200);
    sleep(0.5);
  });

  // Test 3: Fetch Learning Paths
  group('Learning Paths API', () => {
    const headers = {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
    };
    
    const start = Date.now();
    const res = http.get(`${SUPABASE_URL}/rest/v1/learning_paths?select=*,courses(*)`, { headers });
    apiLatency.add(Date.now() - start);
    
    check(res, {
      'learning_paths status is 200': (r) => r.status === 200,
    });
    errorRate.add(res.status !== 200);
    sleep(0.5);
  });

  // Test 4: Fetch Companies (Interview Prep)
  group('Companies API', () => {
    const headers = {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
    };
    
    const res = http.get(`${SUPABASE_URL}/rest/v1/companies?select=*`, { headers });
    
    check(res, {
      'companies status is 200': (r) => r.status === 200,
    });
    errorRate.add(res.status !== 200);
    sleep(0.5);
  });

  // Test 5: Fetch Internship Programs
  group('Internships API', () => {
    const headers = {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
    };
    
    const res = http.get(`${SUPABASE_URL}/rest/v1/internship_programs?select=*`, { headers });
    
    check(res, {
      'internships status is 200': (r) => r.status === 200,
    });
    errorRate.add(res.status !== 200);
    sleep(0.5);
  });

  // Test 6: Fetch Skills
  group('Skills API', () => {
    const headers = {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
    };
    
    const res = http.get(`${SUPABASE_URL}/rest/v1/skills?select=*`, { headers });
    
    check(res, {
      'skills status is 200': (r) => r.status === 200,
    });
    errorRate.add(res.status !== 200);
    sleep(1);
  });
}

export function handleSummary(data) {
  return {
    'k6/results/summary.json': JSON.stringify(data, null, 2),
    stdout: textSummary(data, { indent: ' ', enableColors: true }),
  };
}

function textSummary(data, options) {
  const { metrics } = data;
  let output = '\n========== LOAD TEST SUMMARY ==========\n\n';
  
  output += `Total Requests: ${metrics.http_reqs?.values?.count || 0}\n`;
  output += `Failed Requests: ${metrics.http_req_failed?.values?.passes || 0}\n`;
  output += `Avg Response Time: ${(metrics.http_req_duration?.values?.avg || 0).toFixed(2)}ms\n`;
  output += `P95 Response Time: ${(metrics.http_req_duration?.values['p(95)'] || 0).toFixed(2)}ms\n`;
  output += `Error Rate: ${((metrics.errors?.values?.rate || 0) * 100).toFixed(2)}%\n`;
  output += `API Latency (avg): ${(metrics.api_latency?.values?.avg || 0).toFixed(2)}ms\n`;
  
  output += '\n========================================\n';
  
  return output;
}
