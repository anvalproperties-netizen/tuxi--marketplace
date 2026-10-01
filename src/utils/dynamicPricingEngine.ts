// TUXI AI Dynamic Pricing & Demand Surge Engine
// Calculates real-time demand-based delivery fees and generates 24-hour surge forecasts

export type WeatherCondition = 'clear' | 'light_rain' | 'heavy_rain' | 'storm';
export type DemandZone = 'city_center' | 'east_end' | 'docklands' | 'west_end';

export interface DynamicPricingTelemetry {
  currentMultiplier: number;
  baseDeliveryFee: number;
  dynamicDeliveryFee: number;
  surgeAmount: number;
  surgeLevel: 'standard' | 'moderate' | 'high' | 'peak';
  activeOrders: number;
  availableDrivers: number;
  driverDemandRatio: number;
  weather: WeatherCondition;
  isRushHour: boolean;
  surgeReason: string;
  recommendedOrderWindow: {
    message: string;
    savingsAmount: number;
    recommendedTime: string;
  };
  forecast24h: HourlySurgeForecast[];
  forecastNext6h: HourlySurgeForecast[];
}

export interface HourlySurgeForecast {
  hourLabel: string;
  hour: number;
  multiplier: number;
  fee: number;
  demandIntensity: number; // 0 - 100%
  level: 'standard' | 'moderate' | 'high' | 'peak';
  isCurrentHour: boolean;
  isOptimal: boolean;
  eventAnnotation?: string;
}

// Current simulated state
let currentWeather: WeatherCondition = 'clear';
let simulatedOrderSurgeBoost = 0; // -1 to +2
const BASE_DELIVERY_FEE = 2.99;

type DynamicPricingListener = (telemetry: DynamicPricingTelemetry) => void;
const listeners = new Set<DynamicPricingListener>();

export function setSimulatedWeather(weather: WeatherCondition) {
  currentWeather = weather;
  notifyListeners();
}

export function setSimulatedDemandBoost(boost: number) {
  simulatedOrderSurgeBoost = boost;
  notifyListeners();
}

export function resetDynamicPricingSimulation() {
  currentWeather = 'clear';
  simulatedOrderSurgeBoost = 0;
  notifyListeners();
}

export function onDynamicPricingUpdate(listener: DynamicPricingListener): () => void {
  listeners.add(listener);
  listener(getDynamicPricingTelemetry());
  return () => {
    listeners.delete(listener);
  };
}

function notifyListeners() {
  const telemetry = getDynamicPricingTelemetry();
  listeners.forEach(fn => fn(telemetry));
}

/**
 * Calculates real-time dynamic pricing telemetry & 24h predictive surge forecast
 */
export function getDynamicPricingTelemetry(): DynamicPricingTelemetry {
  const now = new Date();
  const currentHour = now.getHours();

  // Time-of-day baseline demand curve
  let timeFactor = 0.0;
  let isRushHour = false;
  let rushLabel = 'Off-Peak Hours';

  if ((currentHour >= 12 && currentHour <= 14)) {
    timeFactor = 0.35;
    isRushHour = true;
    rushLabel = 'Lunch Rush Hour';
  } else if (currentHour >= 18 && currentHour <= 21) {
    timeFactor = 0.55;
    isRushHour = true;
    rushLabel = 'Dinner Peak Surge';
  } else if (currentHour >= 22 || currentHour <= 2) {
    timeFactor = 0.20;
    rushLabel = 'Late Night Kitchen Hours';
  } else if (currentHour >= 7 && currentHour <= 9) {
    timeFactor = 0.15;
    rushLabel = 'Morning Coffee Rush';
  }

  // Weather modifier
  let weatherFactor = 0.0;
  if (currentWeather === 'light_rain') weatherFactor = 0.25;
  if (currentWeather === 'heavy_rain') weatherFactor = 0.45;
  if (currentWeather === 'storm') weatherFactor = 0.65;

  // Driver supply vs customer order demand
  const baseActiveOrders = 42 + Math.floor(timeFactor * 40) + Math.floor(simulatedOrderSurgeBoost * 25);
  const baseAvailableDrivers = Math.max(12, 38 - Math.floor(weatherFactor * 15) - Math.floor(simulatedOrderSurgeBoost * 6));
  const ratio = baseActiveOrders / Math.max(1, baseAvailableDrivers);

  let supplyFactor = 0.0;
  if (ratio > 1.8) supplyFactor = 0.45;
  else if (ratio > 1.4) supplyFactor = 0.25;
  else if (ratio > 1.1) supplyFactor = 0.10;

  // Composite AI dynamic multiplier (min 1.0x, max 2.5x)
  let rawMultiplier = 1.0 + timeFactor + weatherFactor + supplyFactor + (simulatedOrderSurgeBoost * 0.3);
  rawMultiplier = Math.max(1.0, Math.min(2.5, Math.round(rawMultiplier * 20) / 20));

  const dynamicFee = Math.round((BASE_DELIVERY_FEE * rawMultiplier) * 100) / 100;
  const surgeAmount = Math.max(0, Math.round((dynamicFee - BASE_DELIVERY_FEE) * 100) / 100);

  let surgeLevel: 'standard' | 'moderate' | 'high' | 'peak' = 'standard';
  if (rawMultiplier >= 1.8) surgeLevel = 'peak';
  else if (rawMultiplier >= 1.4) surgeLevel = 'high';
  else if (rawMultiplier > 1.05) surgeLevel = 'moderate';

  let surgeReason = 'Optimal driver supply & normal order density.';
  if (currentWeather !== 'clear' && isRushHour) {
    surgeReason = `${rushLabel} combined with ${currentWeather.replace('_', ' ')} conditions has concentrated driver demand.`;
  } else if (currentWeather !== 'clear') {
    surgeReason = `${currentWeather.replace('_', ' ')} weather has increased courier demand and road travel times.`;
  } else if (isRushHour) {
    surgeReason = `High order volume during ${rushLabel} across central restaurant kitchens.`;
  } else if (surgeLevel !== 'standard') {
    surgeReason = 'Active orders temporarily exceeding nearby driver supply.';
  }

  // Generate 24-hour predictive forecast curve
  const forecast24h = generate24hForecast(currentHour, currentWeather);

  // Generate next 6-hour high-resolution window
  const forecastNext6h = generateNext6hForecast(currentHour, currentWeather);

  // Calculate recommended order window
  const futureHours = forecast24h.filter(h => h.hour > currentHour || (currentHour >= 22 && h.hour <= 4));
  const cheapestFuture = futureHours.reduce((min, h) => h.multiplier < min.multiplier ? h : min, futureHours[0] || forecast24h[0]);

  let savingsAmount = 0;
  let recommendedMessage = 'Current rates are at the standard baseline (1.0x). Great time to order!';
  
  if (rawMultiplier > 1.15 && cheapestFuture && cheapestFuture.multiplier < rawMultiplier) {
    savingsAmount = Math.round((dynamicFee - cheapestFuture.fee) * 100) / 100;
    recommendedMessage = `💡 AI Savings Forecast: Delivery fees drop to ${cheapestFuture.multiplier.toFixed(1)}x at ${cheapestFuture.hourLabel} (Save $${savingsAmount.toFixed(2)})`;
  } else if (rawMultiplier >= 1.0 && (currentHour === 11 || currentHour === 17)) {
    recommendedMessage = `⚡ Pro-Tip: Order now before the upcoming peak rush at ${currentHour + 1}:00 (+40% surge predicted)`;
  }

  return {
    currentMultiplier: rawMultiplier,
    baseDeliveryFee: BASE_DELIVERY_FEE,
    dynamicDeliveryFee: dynamicFee,
    surgeAmount,
    surgeLevel,
    activeOrders: baseActiveOrders,
    availableDrivers: baseAvailableDrivers,
    driverDemandRatio: Math.round(ratio * 10) / 10,
    weather: currentWeather,
    isRushHour,
    surgeReason,
    recommendedOrderWindow: {
      message: recommendedMessage,
      savingsAmount,
      recommendedTime: cheapestFuture?.hourLabel || `${(currentHour + 1) % 24}:00`
    },
    forecast24h,
    forecastNext6h
  };
}

/**
 * Builds realistic 24-hour predictive forecast curve
 */
function generate24hForecast(currentHour: number, weather: WeatherCondition): HourlySurgeForecast[] {
  const points: HourlySurgeForecast[] = [];

  for (let h = 0; h < 24; h++) {
    let multiplier = 1.0;
    let eventAnnotation: string | undefined = undefined;

    // Daily demand profile
    if (h >= 12 && h <= 14) {
      multiplier = h === 13 ? 1.55 : 1.40;
      eventAnnotation = h === 13 ? 'Lunch Peak' : undefined;
    } else if (h >= 18 && h <= 21) {
      multiplier = h === 19 ? 1.85 : h === 20 ? 1.70 : 1.45;
      eventAnnotation = h === 19 ? 'Dinner Peak' : undefined;
    } else if (h >= 22 || h <= 2) {
      multiplier = 1.20;
      eventAnnotation = h === 23 ? 'Late Night' : undefined;
    } else if (h >= 4 && h <= 7) {
      multiplier = 1.0;
      eventAnnotation = h === 5 ? 'Lowest Fee' : undefined;
    } else if (h >= 8 && h <= 10) {
      multiplier = 1.15;
    } else {
      multiplier = 1.05;
    }

    // Weather impact
    if (weather === 'light_rain') multiplier += 0.15;
    if (weather === 'heavy_rain') multiplier += 0.35;
    if (weather === 'storm') multiplier += 0.50;

    multiplier = Math.round(multiplier * 20) / 20;
    const fee = Math.round((BASE_DELIVERY_FEE * multiplier) * 100) / 100;
    const demandIntensity = Math.min(100, Math.round(((multiplier - 1.0) / 1.2) * 100));

    let level: 'standard' | 'moderate' | 'high' | 'peak' = 'standard';
    if (multiplier >= 1.7) level = 'peak';
    else if (multiplier >= 1.35) level = 'high';
    else if (multiplier > 1.05) level = 'moderate';

    points.push({
      hourLabel: `${h.toString().padStart(2, '0')}:00`,
      hour: h,
      multiplier,
      fee,
      demandIntensity,
      level,
      isCurrentHour: h === currentHour,
      isOptimal: multiplier <= 1.05,
      eventAnnotation
    });
  }

  return points;
}

/**
 * Builds next 6-hour projection for immediate decision making
 */
function generateNext6hForecast(currentHour: number, weather: WeatherCondition): HourlySurgeForecast[] {
  const full = generate24hForecast(currentHour, weather);
  const next6: HourlySurgeForecast[] = [];

  for (let i = 0; i < 7; i++) {
    const targetH = (currentHour + i) % 24;
    const found = full.find(p => p.hour === targetH);
    if (found) {
      next6.push({
        ...found,
        hourLabel: i === 0 ? 'Now' : found.hourLabel,
        isCurrentHour: i === 0
      });
    }
  }

  return next6;
}
