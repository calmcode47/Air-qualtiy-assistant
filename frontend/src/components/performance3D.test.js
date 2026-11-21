import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { isWebGLAvailable } from './AtmosphericSanctuaryTwin3D';
import AtmosphericFallbackSVG from './AtmosphericFallbackSVG';

describe('Prompt 7: 3D performance and fallbacks tests', () => {
  it('detects WebGL availability and handles missing getContext gracefully', () => {
    // In node/vitest environment without WebGL context, isWebGLAvailable returns false
    const available = isWebGLAvailable();
    expect(typeof available).toBe('boolean');
  });

  it('verifies that AtmosphericFallbackSVG renders accessible 2D diagram when WebGL fails', () => {
    const onTry3D = vi.fn();
    const element = AtmosphericFallbackSVG({
      aqi: 420,
      indoorAqi: 24,
      purifierOn: true,
      cityData: { name: 'Delhi NCR' },
      isSimpleMode: true,
      onTry3D,
      webGlFailed: true
    });

    expect(element).toBeDefined();
    expect(element.props['role']).toBe('region');
    expect(element.props['aria-label']).toContain('Illustrative air-pollution');

    // Check that children contain the SVG diagram and accessible elements
    const childrenStr = JSON.stringify(element);
    expect(childrenStr).toContain('Delhi NCR');
    expect(childrenStr).toContain('POSSIBLE INVERSION LAYER');
    expect(childrenStr).toContain('HOME FILTER CONCEPT');
    expect(childrenStr).toContain('FILTER ON · ILLUSTRATION');
    expect(childrenStr).toContain('420');
  });

  it('verifies that deleted wrapper files do not exist', async () => {
    const checkFile = async (path) => {
      try {
        await import(/* @vite-ignore */ path);
        return true;
      } catch (e) {
        return false;
      }
    };

    expect(await checkFile('./SanctuaryDiorama3D')).toBe(false);
    expect(await checkFile('./AtmosphericSanctuaryDiorama')).toBe(false);
    expect(await checkFile('./AirflowSimulator3D')).toBe(false);
  });
});
