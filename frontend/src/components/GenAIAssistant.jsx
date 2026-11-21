import React, { useEffect, useRef, useState } from 'react';
import { Compass, Send, Sparkles, Users, Wind, Wrench, CheckCircle2, AlertTriangle } from 'lucide-react';
import { HOUSEHOLD_PERSONAS } from '../data/householdPersonas';
import { PERSONA_PRESETS, useProfile } from '../store/profile';
import i18n from '../i18n';
import { useSearchParams } from 'react-router-dom';
import { generateRuleBasedAdvice, isUrgentQuestion } from '../../../shared/advice.mjs';
import HowWeWorkedThisOut from './HowWeWorkedThisOut';

const COMMUNITY_PROMPT = 'Suggest practical lower-emission options for commuting and community activities.';
const MODE_LABELS = {
  gemini: 'Gemini response (schema validated)',
  'offline-demo': 'Offline demo guidance',
  'offline-guidance': 'Offline rule-based guidance',
  'safety-guidance': 'Urgent safety guidance'
};

function adviceForDisplay(advice) {
  if (!advice || typeof advice.summary !== 'string' || !Array.isArray(advice.recommendations)) {
    throw new Error('The assistant returned an invalid response.');
  }
  return advice;
}

export default function GenAIAssistant({ cityData, outdoorAqi }) {
  const { profile } = useProfile();
  const [selectedPersonaId, setSelectedPersonaId] = useState('saved');
  const [searchParams] = useSearchParams();
  const [inputQuestion, setInputQuestion] = useState(() => searchParams.get('topic') === 'community' ? COMMUNITY_PROMPT : '');
  const [isGenerating, setIsGenerating] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  const [access, setAccess] = useState(null);
  const [accessCode, setAccessCode] = useState('');
  const [accessError, setAccessError] = useState('');
  const [updatingAccess, setUpdatingAccess] = useState(false);
  const pendingRequest = useRef(null);
  const conversation = useRef(null);
  const currentPersona = HOUSEHOLD_PERSONAS.find((persona) => persona.id === selectedPersonaId);
  const householdProfile = PERSONA_PRESETS[selectedPersonaId] || profile;

  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/health', { signal: controller.signal })
      .then((response) => response.ok ? response.json() : null)
      .then((status) => { if (status) setAccess(status); })
      .catch(() => {});
    return () => {
      controller.abort();
      pendingRequest.current?.abort();
    };
  }, []);

  useEffect(() => {
    const log = conversation.current;
    if (log) log.scrollTop = log.scrollHeight;
  }, [chatHistory, isGenerating]);

  async function updateSession(event, method) {
    event.preventDefault();
    if (updatingAccess) return;
    setUpdatingAccess(true);
    setAccessError('');
    try {
      const response = await fetch('/api/session', {
        method,
        signal: AbortSignal.timeout(8000),
        ...(method === 'POST' ? {
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code: accessCode })
        } : {})
      });
      if (!response.ok) {
        setAccessError(response.status === 401 ? 'Check your access code.' : 'Access is temporarily unavailable. Try again shortly.');
        return;
      }
      setAccess((status) => ({ ...status, authenticated: method === 'POST' }));
      setAccessCode('');
    } catch {
      setAccessError('The advisor could not update your session. Check your connection.');
    } finally {
      setUpdatingAccess(false);
    }
  }
  const language = i18n.resolvedLanguage || 'en';
  const aqiLabel = cityData?.aqiSystem || 'US AQI';
  const readingStatus = cityData?.isLive
    ? 'Live model estimate'
    : cityData?.isCached
      ? `Cached estimate${cityData.staleHours ? ` · ${cityData.staleHours}h old` : ''}`
      : 'Reading unavailable';

  const renderAdvice = (advice, mode) => {
    const safeAdvice = adviceForDisplay(advice);
    const responseMode = MODE_LABELS[mode] || MODE_LABELS['offline-guidance'];
    return (
      <div className="space-y-3.5 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[10px] font-bold ${mode === 'gemini' ? 'bg-[#EAF2ED] text-[#315E48] border-[#CCE0D4]' : 'bg-[#FBF5EC] text-[#79500F] border-[#F2E0C5]'}`}>
            {mode === 'gemini' ? <Sparkles className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
            {responseMode}
          </span>
          <span className="text-[10px] text-[#56685F]">Advice is educational; impacts are not personal measurements.</span>
        </div>

        <p className="font-semibold text-sm font-serif-natural text-[#1A2922] leading-relaxed">{safeAdvice.summary}</p>

        <div className="space-y-2.5">
          {safeAdvice.recommendations.map((recommendation) => (
            <article key={recommendation.id} className="bg-white p-4 rounded-2xl border border-[#E6DED6] space-y-2.5 shadow-2xs">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#3D6B56] shrink-0 mt-0.5" />
                <h3 className="font-bold text-xs text-[#1A2922]">{recommendation.title}</h3>
              </div>
              <p className="text-[#1A2922] font-medium leading-relaxed">{recommendation.action}</p>
              <p className="text-[#53645C] text-[11px] leading-relaxed"><strong className="text-[#1A2922]">Why it may help:</strong> {recommendation.why}</p>
              <div className="bg-[#FAF7F2] p-2.5 rounded-xl border border-[#DFD6CB] text-xs">
                <strong className="text-[#315E48]">Direct impact:</strong>{' '}
                <span className="text-[#1A2922]">{recommendation.impact?.value} — {recommendation.impact?.unit}</span>
              </div>
              {recommendation.assumptions?.length > 0 && (
                <HowWeWorkedThisOut
                  title={recommendation.title}
                  formula="Qualitative estimate; no personal dose was calculated."
                  assumptions={recommendation.assumptions}
                  confidence={recommendation.impact?.confidence || 'low'}
                  source="General educational guidance; see the linked public-health sources in the project README."
                  buttonLabel="Limits and assumptions"
                />
              )}
            </article>
          ))}
        </div>

        {safeAdvice.followUp && (
          <p className="bg-[#FAF7F2] p-3 rounded-xl border border-[#DFD6CB] text-[#53645C] text-xs leading-relaxed">{safeAdvice.followUp}</p>
        )}
      </div>
    );
  };

  const handlePersonaSelect = (personaId) => {
    if (isGenerating || personaId === selectedPersonaId) return;
    setSelectedPersonaId(personaId);
    setChatHistory([]);
  };

  const processQuery = async (rawText) => {
    const message = rawText.trim().slice(0, 600);
    if (!message || isGenerating) return;

    if (pendingRequest.current) return;
    const controller = new AbortController();
    pendingRequest.current = controller;
    const priorHistory = chatHistory.slice(-6).map((item) => ({
      role: item.sender === 'user' ? 'user' : 'assistant',
      content: (item.text || [
        item.advice.summary,
        ...item.advice.recommendations.map((recommendation) => recommendation.action)
      ].join(' ')).slice(0, 1200)
    }));
    setChatHistory((previous) => [...previous, { sender: 'user', text: message }]);
    setIsGenerating(true);

    const { name, aqi, pm25, isLive, isCached, staleHours, cleanestWindow, cleanestWindowPeakAqi } = cityData || {};
    const airData = { name, aqi, pm25, isLive, isCached, staleHours, cleanestWindow, cleanestWindowPeakAqi };
    const { adults, children, elderly, conditions, commute, cookingFuel, homeType, purifierOwned, monthlyBudgetBand } = householdProfile;
    const input = {
      message,
      profile: { adults, children, elderly, conditions, commute, cookingFuel, homeType, purifierOwned, monthlyBudgetBand },
      airData,
      language,
      history: priorHistory
    };
    const addAdvice = (advice, mode) => {
      setChatHistory((previous) => [...previous, { sender: 'aura', advice, mode }]);
    };

    try {
      if (isUrgentQuestion(message)) {
        addAdvice(generateRuleBasedAdvice(input), 'safety-guidance');
        return;
      }
      const response = await fetch('/api/advice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        signal: AbortSignal.any([controller.signal, AbortSignal.timeout(15000)]),
        body: JSON.stringify(input)
      });
      if (!response.ok) throw new Error('Advice service unavailable.');
      const { mode, ...advice } = await response.json();
      controller.signal.throwIfAborted();
      if (access?.authenticated && mode === 'offline-demo') {
        setAccess((status) => ({ ...status, authenticated: false }));
      }
      addAdvice(adviceForDisplay(advice), mode);
    } catch {
      if (!controller.signal.aborted) addAdvice(generateRuleBasedAdvice(input), 'offline-guidance');
    } finally {
      if (pendingRequest.current === controller) pendingRequest.current = null;
      if (!controller.signal.aborted) setIsGenerating(false);
    }
  };

  const handleQuickPrompt = (topic) => {
    const prompts = {
      routine: `Help me plan a lower-emission daily routine in ${cityData?.name || 'my area'} using the current air-quality data.`,
      indoor: 'What practical steps can reduce particles indoors, including low-cost options?',
      community: COMMUNITY_PROMPT,
      impact: 'Explain the likely direct impact and limitations of these choices without inventing percentages.'
    };
    processQuery(prompts[topic] || prompts.routine);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const message = inputQuestion.trim();
    if (!message || isGenerating) return;
    setInputQuestion('');
    processQuery(message);
  };

  return (
    <div className="space-y-6">
      <section className="bg-white rounded-3xl border border-[#E6DED6] p-6 sm:p-7 paper-shadow space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-[#E6DED6]">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#EAF2ED] text-[#3D6B56] border border-[#CCE0D4] flex items-center justify-center"><Sparkles className="w-5 h-5" /></div>
            <div>
              <h2 className="text-lg font-serif-natural font-bold text-[#1A2922]">Personalized air-quality guidance</h2>
              <p className="text-xs text-[#53645C] mt-1">Suggestions use your selected household profile and the available location reading.</p>
            </div>
          </div>
          <div className="rounded-xl bg-[#FAF7F2] border border-[#DFD6CB] px-3 py-2 text-xs">
            <strong className="text-[#1A2922]">{cityData?.name || 'Selected location'}</strong>
            <span className="text-[#56685F]"> · {aqiLabel} {outdoorAqi != null && Number.isFinite(Number(outdoorAqi)) ? outdoorAqi : '—'}</span>
            <span className="block text-[10px] text-[#56685F] mt-0.5">{readingStatus}{cityData?.category ? ` · ${cityData.category}` : ''}</span>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-bold uppercase tracking-wider text-[#53645C] flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5" /> Household &amp; lifestyle profile
            </label>
            <span className="text-[10px] text-[#56685F]">Choose a starting profile</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
            {[{ id: 'saved', icon: '⌂', title: 'My household', subtitle: 'Use your saved household settings.' }, ...HOUSEHOLD_PERSONAS].map((persona) => (
              <button
                type="button"
                key={persona.id}
                aria-pressed={selectedPersonaId === persona.id}
                disabled={isGenerating}
                onClick={() => handlePersonaSelect(persona.id)}
                className={`p-3 text-left rounded-2xl border transition ${selectedPersonaId === persona.id ? 'bg-[#FAF7F2] border-2 border-[#1A2922]' : 'bg-white border-[#E6DED6] hover:bg-[#FAF7F2]'}`}
              >
                <span className="text-base" aria-hidden="true">{persona.icon}</span>
                <span className="block text-xs font-bold text-[#1A2922] mt-2">{persona.title}</span>
                <span className="block text-[10px] text-[#53645C] mt-0.5">{persona.subtitle}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="bg-[#FAF7F2] p-3 rounded-xl border border-[#DFD6CB] text-xs text-[#53645C]">
          <strong className="text-[#1A2922]">Active profile</strong> · {currentPersona?.title || 'My household'}. Submitting a question sends your selected profile, recent chat, and air-quality context. Keep identifying details out of the chat.
        </div>
      </section>

      <section className="bg-white rounded-3xl border border-[#E6DED6] p-6 sm:p-7 paper-shadow space-y-4">
        <div className="space-y-1.5">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#53645C]">Explore guidance by topic</h2>
          <div className="flex flex-wrap gap-2">
            {[
              ['routine', 'Lower-emission routine', Compass],
              ['indoor', 'Indoor particle reduction', Wind],
              ['community', 'Community alternatives', Users],
              ['impact', 'Direct impact and limits', Wrench]
            ].map(([topic, label, Icon]) => (
              <button key={topic} type="button" onClick={() => handleQuickPrompt(topic)} disabled={isGenerating} className="text-xs bg-[#FAF7F2] hover:bg-[#EAE1D5] disabled:opacity-50 text-[#1A2922] px-3.5 py-1.5 rounded-full border border-[#DFD6CB] transition flex items-center gap-1.5 font-medium">
                <Icon className="w-3.5 h-3.5 text-[#3D6B56]" />{label}
              </button>
            ))}
          </div>
        </div>

        {language !== 'en' && <p className="text-xs text-[#53645C]">Offline recommendation details are in English. Gemini can respond in the selected language.</p>}
        {access?.liveAdvisorEnabled && (
          <div className="rounded-xl bg-[#FAF7F2] border border-[#DFD6CB] p-3 space-y-2">
            {access.authenticated ? (
              <form onSubmit={(event) => updateSession(event, 'DELETE')} className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs font-semibold">Gemini is unlocked for this browser.</p>
                <button type="submit" disabled={updatingAccess} className="text-xs font-bold underline px-2 py-2">Sign out</button>
              </form>
            ) : (
              <form onSubmit={(event) => updateSession(event, 'POST')} className="space-y-2">
                <label htmlFor="advisor-access-code" className="block text-xs font-semibold">Gemini access code</label>
                <div className="flex flex-wrap gap-2">
                  <input id="advisor-access-code" type="password" autoComplete="current-password" value={accessCode} maxLength={256} onChange={(event) => setAccessCode(event.target.value)} required className="min-w-0 flex-1 border border-[#7F958A] rounded-lg p-2 text-sm" />
                  <button type="submit" disabled={updatingAccess} className="bg-[#1A2922] text-white px-3 py-2 rounded-lg text-xs font-semibold">Unlock Gemini</button>
                </div>
                <p className="text-xs text-[#53645C]">Offline guidance is available without an access code.</p>
              </form>
            )}
            {accessError && <p role="alert" className="text-xs text-[#7A2E3A]">{accessError}</p>}
          </div>
        )}
        <div ref={conversation} tabIndex={0} role="log" aria-label="Assistant conversation" aria-live="polite" className="bg-[#FAF7F2] rounded-2xl p-4 sm:p-6 border border-[#E6DED6] space-y-4 max-h-[520px] overflow-y-auto focus:outline-none focus:ring-1 focus:ring-[#1A2922]">
          {chatHistory.length === 0 && (
            <p className="text-xs text-[#53645C]">Ask a question or choose a topic. Aura will label live readings, cached values, and offline guidance so you can judge how current the information is.</p>
          )}
          {chatHistory.map((item, index) => (
            <div key={`${item.sender}-${index}`} className="flex items-start gap-3">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${item.sender === 'aura' ? 'bg-[#1A2922] text-[#FAF7F2]' : 'bg-[#D6B33F] text-[#18261F]'}`} aria-hidden="true">{item.sender === 'aura' ? 'A' : 'You'}</div>
              <div className="min-w-0 break-words flex-1 space-y-1 text-xs leading-relaxed text-[#1A2922]">
                {item.sender === 'user' ? <p className="font-medium">{item.text}</p> : renderAdvice(item.advice, item.mode)}
              </div>
            </div>
          ))}
          {isGenerating && (
            <div className="text-xs text-[#53645C]" role="status">Preparing guidance from the selected profile and available air-quality data…</div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="flex gap-2 pt-1">
          <input
            data-testid="advisor-input"
            type="text"
            value={inputQuestion}
            onChange={(event) => setInputQuestion(event.target.value)}
            disabled={isGenerating}
            maxLength={600}
            aria-label="Ask the air-quality assistant"
            placeholder={`Ask about ${cityData?.name || 'your area'}, home air, or commuting (max 600 characters)`}
            className="min-w-0 flex-1 bg-[#FAF7F2] border border-[#DFD6CB] rounded-xl px-4 py-3 text-xs text-[#1A2922] placeholder-[#56685F] focus:outline-none focus:ring-1 focus:ring-[#1A2922] disabled:opacity-50"
          />
          <button data-testid="advisor-submit" type="submit" disabled={isGenerating || !inputQuestion.trim()} className="bg-[#1A2922] disabled:opacity-50 text-[#FAF7F2] px-5 py-3 rounded-xl text-xs font-semibold hover:bg-[#2B3F35] transition flex items-center gap-1.5 shrink-0">
            Consult <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </section>
    </div>
  );
}
