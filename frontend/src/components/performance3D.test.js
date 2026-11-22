import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { isWebGLAvailable } from './AtmosphericSanctuaryTwin3D';
import AtmosphericFallbackSVG from './AtmosphericFallbackSVG';

describe('3D capability and 2D fallback', () => {
  it('reports WebGL unavailable outside a browser', () => {
    expect(isWebGLAvailable()).toBe(false);
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

  it('keeps the 2D diagram usable when the location reading is missing', () => {
    const element = AtmosphericFallbackSVG({
      aqi: null,
      purifierOn: false,
      cityData: { name: 'Delhi NCR' },
      webGlFailed: true
    });
    const content = JSON.stringify(element);
    expect(content).toContain('2D Fallback Mode (WebGL Unavailable)');
    expect(content).toContain('FILTER OFF');
    expect(content).toContain('Unavailable');
  });
});
