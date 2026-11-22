/** @vitest-environment jsdom */
import React from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import i18n from '../i18n';
import AdvisoryBanner from './AdvisoryBanner';

afterEach(async () => {
  cleanup();
  await i18n.changeLanguage('en');
});

function renderBanner(props = {}) {
  return render(
    <I18nextProvider i18n={i18n}>
      <AdvisoryBanner
        isOffline={false}
        isCached={false}
        isStale={false}
        staleHours={0}
        cityData={{ isLive: true, cleanestWindow: '2–4 PM' }}
        {...props}
      />
    </I18nextProvider>
  );
}

describe('AdvisoryBanner', () => {
  it('updates the visible model estimate when the selected language changes', async () => {
    await i18n.changeLanguage('hi');
    renderBanner();

    expect(screen.getByText(/Open-Meteo मॉडल अनुमान/)).toBeTruthy();
    expect(screen.getByText(/कम प्रदूषण वाला पूर्वानुमान समय/)).toBeTruthy();

    await i18n.changeLanguage('pa');
    expect(screen.getByText(/Open-Meteo ਮਾਡਲ ਅੰਦਾਜ਼ਾ/)).toBeTruthy();
    expect(screen.getByRole('button', { name: 'ਬੈਨਰ ਬੰਦ ਕਰੋ' })).toBeTruthy();
  });

  it('renders cached status with translated hours and dismisses accessibly', async () => {
    await i18n.changeLanguage('hi');
    renderBanner({ isCached: true, isStale: true, staleHours: 3, cityData: { isLive: false } });

    expect(screen.getByText('डेटा 3 घंटे पुराना है (कैश)')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'बैनर बंद करें' }));
    expect(screen.queryByText('डेटा 3 घंटे पुराना है (कैश)')).toBeNull();
  });
});
