import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

const errorRate = new Rate('errors');

// Stress test - find breaking point
export const options = {
  stages: [
    { duration: '2m', target: 100 },   // Ramp to 100 users
    { duration: '5m', target: 100 },   // Stay at 100
    { duration: '2m', target: 200 },   // Push to 200 users
    { duration: '5m', target: 200 },   // Stay at 200
    { duration: '2m', target: 300 },   // Push to 300 users
    { duration: '5m', target: 300 },   // Stay at 300
    { duration: '2m', target: 0 },     // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(99)<5000'], // 99% of requests < 5s
    http_req_failed: ['rate<0.1'],     // Error rate < 10%
  },
};

const SUPABASE_URL = __ENV.SUPABASE_URL || 'https://zlrendmouhlnkfdnqkto.supabase.co';
const SUPABASE_ANON_KEY = __ENV.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpscmVuZG1vdWhsbmtmZG5xa3RvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjczNzA4NDIsImV4cCI6MjA4Mjk0Njg0Mn0.P9u5WPguCcFXVFedeZw9OTj_y1TD7tP3XyZDu9KMdSo';
const BASE_URL = __ENV.BASE_URL || 'https://career-forge-ai-85.lovable.app';

export default function () {
  const headers = {
    'apikey': SUPABASE_ANON_KEY,
    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    'Content-Type': 'application/json',
  };

  // Simulate user journey
  const responses = http.batch([
    ['GET', BASE_URL, null, { tags: { name: 'Homepage' } }],
    ['GET', `${SUPABASE_URL}/rest/v1/career_roles?select=id,title,slug,category`, { headers }, { tags: { name: 'CareerRoles' } }],
    ['GET', `${SUPABASE_URL}/rest/v1/skills?select=id,name,category`, { headers }, { tags: { name: 'Skills' } }],
    ['GET', `${SUPABASE_URL}/rest/v1/companies?select=id,name,industry`, { headers }, { tags: { name: 'Companies' } }],
  ]);

  responses.forEach((res, index) => {
    check(res, {
      'status is 200': (r) => r.status === 200,
    });
    errorRate.add(res.status !== 200);
  });

  sleep(Math.random() * 2 + 1); // Random 1-3 second pause
}
