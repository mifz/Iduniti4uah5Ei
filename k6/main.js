import http from 'k6/http';
import { sleep } from 'k6';
import { randomIntBetween } from 'https://jslib.k6.io/k6-utils/1.1.0/index.js';
import { randomItem } from 'https://jslib.k6.io/k6-utils/1.1.0/index.js';

const weatherCondition = ['Sunny', 'Fair', 'Cloudy', 'Showers', 'Squalls', 'Thunderstorms', 'Drizzle'];

// ---

function generateCityName() {
  const cityName = `Город ${randomIntBetween(1000, 9999)}`;
  return cityName;
}

function generateTemperature() {
  const temperatureValue = `${randomIntBetween(10, 20)}`;
  return temperatureValue;
}

// ---

const cities_random = [];

for (let i = 0; i < 1000; i++) {
  cities_random.push(generateCityName());
}

export let options = {
  scenarios: {
    // Сценарий 1
//    ramping_users_cities: {
//      executor: 'ramping-vus',
//      startVUs: 0,
//      stages: [
//        { duration: '5m', target: 600 },
//        { duration: '5m', target: 600 },
//        { duration: '5m', target: 1200 },
//        { duration: '5m', target: 1200 },
//        { duration: '5m', target: 1800 },
//        { duration: '5m', target: 1800 },
//        { duration: '5m', target: 2400 },
//        { duration: '5m', target: 2400 },
//        { duration: '5m', target: 3000 },
//        { duration: '5m', target: 3000 },
//      ],
//      gracefulRampDown: '0s',
//    },
    // Сценарий 2, 3, 4
   ramping_users_weather: {
     executor: 'ramping-vus',
     startVUs: 0,
     stages: [
       { duration: '5m', target: 600 },
       { duration: '5m', target: 600 },
       { duration: '5m', target: 1200 },
       { duration: '5m', target: 1200 },
       { duration: '5m', target: 1800 },
       { duration: '5m', target: 1800 },
       { duration: '5m', target: 2400 },
       { duration: '5m', target: 2400 },
       { duration: '5m', target: 3000 },
       { duration: '5m', target: 3000 },
     ],
     gracefulRampDown: '0s',
     exec: 'getWeather',
   },   
    // Сценарий 3, 4
    post_weather: {
      executor: 'per-vu-iterations',
      vus: 100,
      iterations: 50000,
      maxDuration: '30m',
      exec: 'postWeather',
    },  
    // Сценарий 4
    post_cities: {
      executor: 'per-vu-iterations',
      vus: 10,
      iterations: 50000,
      maxDuration: '30m',    
      exec: 'postCities',
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

export function postWeather() {
  let response = http.get('http://iduniti4uah5ei.local/cities');
  let cities = response.json();

  cities.forEach(city => {
    for (let i = 0; i < 3; i++) {
      const start = new Date().getTime();      
      const url = `http://iduniti4uah5ei.local/forecast/${city.id}`;

      const payload = JSON.stringify({
        id: 0,
        cityId: `${city.id}`,
        dateTime: Date.now(),
        temperature: generateTemperature(),
        summary: randomItem(weatherCondition),
      });      

      const res = http.post(url, payload, {
        headers: {
          'Content-Type': 'application/json',
        },
      });     

      const end = new Date().getTime();
      const duration = end - start;

      // ${res.request.body}
      // console.log(`Выполняется запрос: ${res.request.method} ${url} ${res.request.body}`);
      // console.log(`Статус код: ${res.status}`);
      // console.log(`Время выполнения: ${duration} мс`);

      sleep(0.5);
    }
  });

  sleep(30);  
}

export function postCities() {
  const randomCity = randomIntBetween(0, cities_random.length - 1);
  const city = cities_random[randomCity];

  const start = new Date().getTime();       

  const url = 'http://iduniti4uah5ei.local/cities';
  const payload = JSON.stringify({
    id: 0,
    name: `${city}`,
  });

  const res = http.post(url, payload, {
    headers: {
      'Content-Type': 'application/json',
    },
  });

  const end = new Date().getTime();
  const duration = end - start;

  // console.log(`Выполняется запрос: ${res.request.method} ${url}`);
  // console.log(`Статус код: ${res.status}`);
  // console.log(`Время выполнения: ${duration} мс`);

  sleep(60);
}


export function getWeather() {
  let response = http.get('http://iduniti4uah5ei.local/cities');
  let cities = response.json();

  cities.forEach(city => {
    const url = `http://iduniti4uah5ei.local/cities/${city.id}`;
    const start = new Date().getTime();
    const res = http.get(url);
    const end = new Date().getTime();
    const duration = end - start;
   
    // console.log(`Выполняется запрос: ${res.request.method} ${url}`);
    // console.log(`Статус код: ${res.status}`);
    // console.log(`Время выполнения: ${duration} мс`);

    for (let i = 0; i < cities.length; i++) {
      const randomId = Math.floor(Math.random() * cities.length) + 1;
      const url = `http://iduniti4uah5ei.local/forecast/${randomId}`;
      const start = new Date().getTime();
      const res = http.get(url);
      const end = new Date().getTime();
      const duration = end - start;

      // console.log(`Выполняется запрос: ${res.request.method} ${url}`);
      // console.log(`Статус код: ${res.status}`);
      // console.log(`Время выполнения: ${duration} мс`);

      sleep(0.5);
    }

  });
}

export default function () {
  let response = http.get('http://iduniti4uah5ei.local/cities');
  let cities = response.json();

  cities.forEach(city => {
    const url = `http://iduniti4uah5ei.local/cities/${city.id}`;
    const start = new Date().getTime();
    const res = http.get(url);
    const end = new Date().getTime();
    const duration = end - start;
   
    // console.log(`Выполняется запрос: ${res.request.method} ${url}`);
    // console.log(`Статус код: ${res.status}`);
    // console.log(`Время выполнения: ${duration} мс`);
   
    sleep(0.5);
  });    
}

