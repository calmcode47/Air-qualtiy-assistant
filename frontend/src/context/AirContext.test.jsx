/** @vitest-environment jsdom */
import React from 'react';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { AirProvider, useAir } from './AirContext';
import { fetchAirData } from '../services/airData';
import { fetchNearbyGroundStation } from '../services/groundStation';

vi.mock('../services/airData', async (importOriginal) => ({
  ...await importOriginal(),
  fetchAirData: vi.fn()
}));
vi.mock('../services/groundStation', () => ({ fetchNearbyGroundStation: vi.fn() }));

afterEach(() => {
  cleanup();
  localStorage.clear();
  vi.resetAllMocks();
  vi.useRealTimers();
});

function Reading() {
  const { airData, groundStation, selectLocation, staleHours } = useAir();
  return (
    <>
      <output>{airData.name} / {groundStation.status} / {staleHours}h</output>
      <button onClick={() => selectLocation('lahore')}>Select Lahore</button>
    </>
  );
}

it('keeps the selected city when its predecessor finishes loading later', async () => {
  const oldAir = Promise.withResolvers();
  const oldStation = Promise.withResolvers();
  fetchAirData.mockReturnValueOnce(oldAir.promise).mockResolvedValueOnce({ name: 'Lahore' });
  fetchNearbyGroundStation.mockReturnValueOnce(oldStation.promise).mockResolvedValueOnce({ status: 'unsupported_region' });
  render(<AirProvider><Reading /></AirProvider>);

  await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Select Lahore' })); });
  expect(fetchAirData.mock.calls[0][1].aborted).toBe(true);
  await act(async () => {
    oldAir.resolve({ name: 'Delhi NCR' });
    oldStation.resolve({ status: 'available' });
  });
  expect(screen.getByRole('status').textContent).toBe('Lahore / unsupported_region / 0h');
});

it('ages cached readings while the page remains open', async () => {
  vi.useFakeTimers();
  const now = new Date('2026-11-23T00:00:00Z');
  vi.setSystemTime(now);
  fetchAirData.mockResolvedValue({ name: 'Delhi NCR', isCached: true, timestamp: now.getTime() - 30 * 60000, staleHours: 1 });
  fetchNearbyGroundStation.mockResolvedValue({ status: 'unavailable' });
  await act(async () => { render(<AirProvider><Reading /></AirProvider>); });
  expect(screen.getByRole('status').textContent).toBe('Delhi NCR / unavailable / 1h');

  await act(async () => { await vi.advanceTimersByTimeAsync(31 * 60000); });
  expect(screen.getByRole('status').textContent).toBe('Delhi NCR / unavailable / 2h');
});
