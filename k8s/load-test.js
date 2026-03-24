import http from 'k6/http';
import { check, sleep } from 'k6';

// This script simulates high traffic to trigger the Horizontal Pod Autoscaler (HPA)
// It ramps up to 500 concurrent virtual users over 1 minute, holds for 3 minutes, then ramps down.
export const options = {
  stages: [
    { duration: '1m', target: 500 }, // Ramp up to 500 users
    { duration: '3m', target: 500 }, // Hold steadily at 500 users to trigger CPU/Memory scaling
    { duration: '1m', target: 0 },   // Ramp down to 0 users
  ],
};

export default function () {
  // Replace this URL with the actual endpoint of your AWS ALB once deployed.
  // For local testing, it might be the Ingress IP or 'http://localhost' if port-forwarded.
  const url = 'http://localhost/health'; 

  const res = http.get(url);

  check(res, {
    'status is 200': (r) => r.status === 200,
    'transaction time OK': (r) => r.timings.duration < 1000,
  });

  // Short sleep to simulate real user behavior and flood the server
  sleep(0.1);
}
