/** @vitest-environment jsdom */
import React from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import i18n from '../i18n';
import GroundStationCard from './GroundStationCard';

afterEach(async () => {
  cleanup();
  await i18n.changeLanguage('en');
});

function renderCard(station) {
  return render(
    <I18nextProvider i18n={i18n}>
      <GroundStationCard station={station} />
    </I18nextProvider>
  );
}

describe('GroundStationCard', () => {
  it('shows raw CPCB station measurements, distance, and source attribution', async () => {
    await i18n.changeLanguage('en');
    renderCard({
      status: 'available',
      locationName: 'Central Delhi',
      distanceKm: 2.4,
      source: 'CPCB via data.gov.in',
      sourceUrl: 'https://www.data.gov.in/resource/real-time-air-quality-index-various-locations',
      mirrorUrl: 'https://snapdata.dev/docs/datasets/aqi/',
      license: 'Government Open Data License - India',
      measurements: [
        { parameter: 'PM2.5', value: 42.5, unit: 'µg/m³', observedAt: '2026-11-22T10:00:00Z' },
        { parameter: 'PM10', value: 76, unit: 'µg/m³', observedAt: '2026-11-22T10:00:00Z' }
      ]
    });

    expect(screen.getByText('Central Delhi')).toBeTruthy();
    expect(screen.getByText('42.5 µg/m³')).toBeTruthy();
    expect(screen.getByText('76 µg/m³')).toBeTruthy();
    expect(screen.getByRole('link', { name: 'CPCB data via data.gov.in' }).getAttribute('href')).toBe('https://www.data.gov.in/resource/real-time-air-quality-index-various-locations');
    expect(screen.getByRole('link', { name: 'Feed mirror details' }).getAttribute('href')).toBe('https://snapdata.dev/docs/datasets/aqi/');
    expect(screen.getByText(/Government Open Data License - India/)).toBeTruthy();
    expect(screen.getByText(/not an AQI/)).toBeTruthy();
  });

  it('explains that CPCB station data only covers locations in India', async () => {
    await i18n.changeLanguage('pa');
    renderCard({ status: 'unsupported_region' });

    expect(screen.getByText('CPCB ਸਟੇਸ਼ਨ ਰੀਡਿੰਗਾਂ ਸਿਰਫ਼ ਭਾਰਤ ਦੇ ਟਿਕਾਣਿਆਂ ਲਈ ਉਪਲਬਧ ਹਨ।')).toBeTruthy();
  });
});
