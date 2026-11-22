import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Compass, Home } from 'lucide-react';

export default function NotFoundPage() {
  useEffect(() => {
    document.title = 'Aura • Page Not Found';
  }, []);

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl border border-[#E6DED6] p-8 sm:p-12 max-w-md w-full paper-shadow text-center space-y-5">
        <div className="w-16 h-16 rounded-3xl bg-[#FAF7F2] text-[#3D6B56] border border-[#DDD5C7] flex items-center justify-center mx-auto text-2xl shadow-xs">
          <Compass className="w-8 h-8 text-[#56685F]" />
        </div>

        <div className="space-y-2">
          <span className="font-mono-code uppercase font-bold text-xs text-[#A94A28] tracking-wider block">
            404 • Not Found
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-serif-natural text-[#18261F]">
            The air is clearer back home
          </h1>
          <p className="text-xs sm:text-sm text-[#56685F] leading-relaxed">
            The page you were looking for doesn't exist or has moved. Return to your home sanctuary to view live air quality and tailored actions.
          </p>
        </div>

        <div className="pt-2">
          <Link
            to="/"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl bg-[#18261F] text-[#FAF8F4] text-xs font-bold hover:bg-[#2C3E33] transition shadow-xs"
          >
            <Home className="w-4 h-4 text-[#688A72]" />
            <span>Return to Clean Air Home</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
