import http from 'k6/http';
import { sleep } from 'k6';

export let options = {
  scenarios: {
    constant: {
      executor: 'constant-vus',
      vus: 100,
      duration: '10m',
    },
  },
  thresholds: {
    'http_req_duration': [
      { threshold: 'p(90)<300', abortOnFail: true },
      { threshold: 'p(95)<600', abortOnFail: true },
    ],
    'http_req_failed': [
      { threshold: 'rate<0.01', abortOnFail: true },
    ],
    checks: ['rate>0.9']
  },
  summaryTrendStats: ["p(90)", "p(95)"],
  // discardResponseBodies: true,
};

export default function () {
  const url = `http://iduniti4uah5ei.local/Cities`;
  
  const start = new Date().getTime();
  const res = http.get(url);
  const end = new Date().getTime();
  const duration = end - start;
   
  console.log(`Выполняется запрос: ${res.request.method} ${url}`);
  console.log(`Статус код: ${res.status}`);
  console.log(`Время выполнения: ${duration} мс`);
   
  sleep(0.5);
}

