import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Clock, Shield, Sparkles, Users, Wrench } from 'lucide-react';

const tools = [
  {
    path: '/advisor',
    icon: Sparkles,
    iconStyle: 'bg-[#FBF5EC] text-[#8C5311]',
    title: 'GenAI Smog Advisor',
    description: 'Ask about daily routines, indoor particle sources, filtration choices, or how to interpret this location forecast.'
  },
  {
    path: '/routines',
    icon: Clock,
    iconStyle: 'bg-[#EAF2ED] text-[#3D6B56]',
    title: 'Hourly Air-Quality Forecast',
    description: 'Compare the available hourly pollution forecast. It does not measure local street conditions or determine a safe time to go out.'
  },
  {
    path: '/hacks',
    icon: Wrench,
    iconStyle: 'bg-[#FAF0EC] text-[#A94A28]',
    title: 'Indoor Filtration and Source Control',
    description: 'Practical steps for choosing filtration, reducing indoor particle sources, and understanding equipment limits.'
  },
  {
    path: '/community',
    icon: Users,
    iconStyle: 'bg-[#FAF7F2] text-[#18261F]',
    title: 'Community Shield',
    description: 'Zero-burn leaf composting circles, electric radiant heat replacing coal braziers, and school carpool pods.'
  },
  {
    path: '/impact',
    icon: Shield,
    iconStyle: 'bg-[#EAF2ED] text-[#3D6B56]',
    title: 'Direct Impact Ledger',
    description: 'Track household choices and review their likely environmental effects, assumptions, and evidence limits.'
  },
];

export default function AssistantTools() {
  return (
    <section className="space-y-4">
      <h2 className="text-xl sm:text-2xl font-bold font-serif-natural text-[#18261F]">
        Explore Aura’s tools
      </h2>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {tools.map(({ path, icon: Icon, iconStyle, title, description }) => (
          <Link
            key={path}
            to={path}
            className="group h-full space-y-3 rounded-3xl border border-[#E6DED6] bg-white p-6 text-left paper-shadow transition hover:border-[#18261F]"
          >
            <div className={`flex h-10 w-10 items-center justify-center rounded-2xl ${iconStyle}`}>
              <Icon aria-hidden="true" className="h-5 w-5" />
            </div>
            <h3 className="flex items-center justify-between gap-2 text-base font-bold font-serif-natural text-[#18261F] group-hover:text-[#3D6B56]">
              {title}
              <ArrowRight aria-hidden="true" className="h-4 w-4 shrink-0" />
            </h3>
            <p className="text-xs leading-relaxed text-[#56685F]">{description}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
