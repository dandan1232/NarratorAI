import { Weather } from '../types';

const WEATHER_CACHE_TTL = 15 * 60 * 1000;
const WEATHER_CACHE_PREFIX = 'narrator-weather:';

const CITY_ALIASES: Record<string, string> = {
  北京: 'Beijing',
  上海: 'Shanghai',
  广州: 'Guangzhou',
  深圳: 'Shenzhen',
  杭州: 'Hangzhou',
  南京: 'Nanjing',
  苏州: 'Suzhou',
  成都: 'Chengdu',
  重庆: 'Chongqing',
  武汉: 'Wuhan',
  西安: "Xi'an",
  天津: 'Tianjin',
  青岛: 'Qingdao',
  厦门: 'Xiamen',
  长沙: 'Changsha',
  郑州: 'Zhengzhou',
  沈阳: 'Shenyang',
  大连: 'Dalian',
  宁波: 'Ningbo',
  福州: 'Fuzhou',
  济南: 'Jinan',
  昆明: 'Kunming',
  合肥: 'Hefei',
  香港: 'Hong Kong',
  澳门: 'Macau',
  台北: 'Taipei',
};

interface WttrWeatherResponse {
  current_condition?: Array<{
    weatherDesc?: Array<{ value?: string }>;
    lang_zh?: Array<{ value?: string }>;
  }>;
}

interface CachedWeather {
  timestamp: number;
  weather: Weather;
  cityName: string;
}

export interface WorldWeatherResult {
  weather: Weather;
  cityName: string;
}

function mapWeatherText(weatherText = ''): Weather {
  const text = weatherText.toLowerCase();
  if (weatherText.includes('雪') || text.includes('snow')) return 'snowy';
  if (weatherText.includes('雷') || weatherText.includes('暴') || text.includes('thunder') || text.includes('storm')) {
    return 'stormy';
  }
  if (weatherText.includes('雨') || text.includes('rain') || text.includes('drizzle')) return 'rainy';
  if (weatherText.includes('风') || text.includes('wind')) return 'windy';
  if (
    weatherText.includes('云') ||
    weatherText.includes('阴') ||
    text.includes('cloud') ||
    text.includes('overcast')
  ) {
    return 'cloudy';
  }
  return 'sunny';
}

function normalizeCityForWeather(cityName: string): string {
  return CITY_ALIASES[cityName] || cityName.replace(/市$/, '');
}

function getWeatherCacheKey(cityName: string): string {
  return `${WEATHER_CACHE_PREFIX}${normalizeCityForWeather(cityName).toLowerCase()}`;
}

function readCachedWeather(cityName: string): WorldWeatherResult | null {
  try {
    const raw = localStorage.getItem(getWeatherCacheKey(cityName));
    if (!raw) return null;
    const cached = JSON.parse(raw) as CachedWeather;
    if (Date.now() - cached.timestamp > WEATHER_CACHE_TTL) return null;
    return {
      weather: cached.weather,
      cityName: cached.cityName,
    };
  } catch {
    return null;
  }
}

function writeCachedWeather(cityName: string, weather: Weather) {
  try {
    const cache: CachedWeather = {
      timestamp: Date.now(),
      weather,
      cityName,
    };
    localStorage.setItem(getWeatherCacheKey(cityName), JSON.stringify(cache));
  } catch {
    // Ignore storage failures; weather is an ambient enhancement.
  }
}

export function collapseCityFromText(text: string): string | null {
  const normalizedText = text.replace(/\s+/g, '');
  const chineseCity = Object.keys(CITY_ALIASES).find((city) => normalizedText.includes(city));
  if (chineseCity) return chineseCity;

  const englishCity = Object.values(CITY_ALIASES).find((city) =>
    text.toLowerCase().includes(city.toLowerCase())
  );
  return englishCity || null;
}

export async function fetchWttrWeather(cityName: string): Promise<WorldWeatherResult | null> {
  if (!cityName.trim()) return null;

  const cached = readCachedWeather(cityName);
  if (cached) return cached;

  try {
    const wttrCity = normalizeCityForWeather(cityName);
    const response = await fetch(`https://wttr.in/${encodeURIComponent(wttrCity)}?format=j1&lang=zh`);
    const data = (await response.json()) as WttrWeatherResponse;
    const current = data.current_condition?.[0];
    const weatherText = current?.lang_zh?.[0]?.value || current?.weatherDesc?.[0]?.value || '';
    const weather = mapWeatherText(weatherText);

    writeCachedWeather(cityName, weather);

    return {
      weather,
      cityName,
    };
  } catch (error) {
    console.warn('wttr.in weather fetch failed:', error);
    return null;
  }
}
