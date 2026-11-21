import React, { lazy } from 'react';
import AtmosphericFallbackSVG from './AtmosphericFallbackSVG';

function DiagramWhenSceneUnavailable({ cityData, outdoorAqi, fanSpeed }) {
  return (
    <>
      <p role="status" className="p-3 bg-[#FAF7F2] text-xs text-[#53645C]">The interactive scene could not load. The air-quality diagram is available below.</p>
      <AtmosphericFallbackSVG cityData={cityData} aqi={outdoorAqi} purifierOn={fanSpeed !== 'off'} />
    </>
  );
}

export default lazy(() => import('./AtmosphericSanctuaryTwin3D').catch(() => ({
  default: DiagramWhenSceneUnavailable
})));
