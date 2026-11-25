import React from 'react';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Clock, Home, Layers, Shield, Sparkles, Users, Wrench } from 'lucide-react';

const destinations = [
  { path: '/', label: 'overview', icon: Home },
  { path: '/advisor', label: 'advisor', icon: Sparkles },
  { path: '/routines', label: 'routines', icon: Clock },
  { path: '/hacks', label: 'hacks', icon: Wrench },
  { path: '/community', label: 'community', icon: Users },
  { path: '/impact', label: 'impact', icon: Shield },
  { path: '/home', label: 'sanctuary', icon: Layers }
];

export default function NavigationLinks({ mobile = false, onNavigate }) {
  const { t } = useTranslation();
  const spacing = mobile ? 'w-full gap-3 px-4 py-2.5' : 'gap-1.5 px-2.5 py-1.5';
  return destinations.map(({ path, label, icon: Icon }) => (
    <NavLink
      key={path}
      to={path}
      end
      onClick={onNavigate}
      className={({ isActive }) => `flex items-center rounded-xl text-xs font-semibold transition ${spacing} ${
        isActive ? 'bg-[#18261F] text-[#F4F2EC]' : 'text-[#56685F] hover:bg-white/60 hover:text-[#18261F]'
      }`}
    >
      <Icon aria-hidden="true" className={mobile ? 'h-4 w-4' : 'h-3.5 w-3.5'} />
      <span>{t(`nav.${label}`)}</span>
    </NavLink>
  ));
}
