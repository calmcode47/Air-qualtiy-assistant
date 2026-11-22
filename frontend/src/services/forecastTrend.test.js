import { describe, expect, it } from 'vitest';
import { getForecastTrend } from './forecastTrend';

describe('getForecastTrend', () => {
  it('summarizes a lower, higher, or similar forecast over the next points', () => {
    const start = 1_800_000_000;
    const series = (values) => values.map((aqi, index) => ({ time: start + index * 3600, aqi }));
    expect(getForecastTrend(series([160, 140, 120]))).toMatchObject({ direction: 'lower', hours: 2 });
    expect(getForecastTrend(series([100, 110, 120]))).toMatchObject({ direction: 'higher', hours: 2 });
    expect(getForecastTrend(series([100, 102, 103]))).toMatchObject({ direction: 'similar', hours: 2 });
  });

  it('ignores invalid points, sorts by forecast time, and returns null for incomplete data', () => {
    const start = 1_800_000_000;
    expect(getForecastTrend([
      { time: start + 3600, aqi: 130 },
      { time: start, aqi: 140 },
      { time: start + 7200, aqi: null }
    ])).toMatchObject({ direction: 'lower', hours: 1, firstAqi: 140, lastAqi: 130 });
    expect(getForecastTrend([{ time: start, aqi: 140 }])).toBeNull();
    expect(getForecastTrend(null)).toBeNull();
    expect(getForecastTrend([{ time: start, aqi: 140 }], 1)).toBeNull();
  });
});
