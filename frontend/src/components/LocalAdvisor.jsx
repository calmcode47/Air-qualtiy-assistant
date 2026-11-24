import React, { useEffect, useRef, useState } from 'react';
import { Compass, Send, Users, Wind, Wrench, CheckCircle2 } from 'lucide-react';
import { HOUSEHOLD_PERSONAS } from '../data/householdPersonas';
import { PERSONA_PRESETS, useProfile } from '../store/profile';
import i18n from '../i18n';
import { useSearchParams } from 'react-router-dom';
import { ADVICE_QUESTION_LIMIT, createAdviceInput, requestAdvice } from '../services/advisor';
import AdviceReply from './AdviceReply';

const COMMUNITY_PROMPT = 'Suggest practical lower-emission options for commuting and community activities.';

export default function LocalAdvisor({ cityData, outdoorAqi, groundMonitor }) {
  const { profile } = useProfile();
  const [selectedPersonaId, setSelectedPersonaId] = useState('saved');
  const [searchParams] = useSearchParams();
  const [inputQuestion, setInputQuestion] = useState(() => searchParams.get('topic') === 'community' ? COMMUNITY_PROMPT : '');
  const [isGenerating, setIsGenerating] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  const pendingRequest = useRef(null);
  const conversation = useRef(null);
  const currentPersona = HOUSEHOLD_PERSONAS.find((persona) => persona.id === selectedPersonaId);
  const householdProfile = PERSONA_PRESETS[selectedPersonaId] || profile;

  useEffect(() => {
    return () => {
      pendingRequest.current?.abort();
    };
  }, []);

  useEffect(() => {
    const log = conversation.current;
    if (log) log.scrollTop = log.scrollHeight;
  }, [chatHistory, isGenerating]);

  const language = i18n.resolvedLanguage || 'en';
  const aqiLabel = cityData?.aqiSystem || 'US AQI';
  const readingStatus = cityData?.isLive
    ? 'Live model estimate'
    : cityData?.isCached
      ? `Cached estimate${cityData.staleHours ? ` · ${cityData.staleHours}h old` : ''}`
      : 'Reading unavailable';

  const handlePersonaSelect = (personaId) => {
    if (isGenerating || personaId === selectedPersonaId) return;
    setSelectedPersonaId(personaId);
    setChatHistory([]);
  };

  const processQuery = async (rawText) => {
    const message = rawText.trim().slice(0, ADVICE_QUESTION_LIMIT);
    if (!message || pendingRequest.current) return;

    const controller = new AbortController();
    pendingRequest.current = controller;
    const input = createAdviceInput({ message, householdProfile, cityData, groundMonitor, language, chatHistory });
    setChatHistory((previous) => [...previous, { sender: 'user', text: message }]);
    setIsGenerating(true);

    try {
      const reply = await requestAdvice(input, controller.signal);
      if (reply && !controller.signal.aborted) {
        const { advice, mode } = reply;
        setChatHistory((previous) => [...previous, { sender: 'aura', advice, mode, language }]);
      }
    } finally {
      pendingRequest.current = null;
      if (!controller.signal.aborted) {
        setIsGenerating(false);
      }
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
            <div className="w-10 h-10 rounded-2xl bg-[#EAF2ED] text-[#3D6B56] border border-[#CCE0D4] flex items-center justify-center"><CheckCircle2 className="w-5 h-5" /></div>
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

        <div ref={conversation} tabIndex={0} role="log" aria-label="Assistant conversation" aria-live="polite" className="bg-[#FAF7F2] rounded-2xl p-4 sm:p-6 border border-[#E6DED6] space-y-4 max-h-[520px] overflow-y-auto focus:outline-none focus:ring-1 focus:ring-[#1A2922]">
          {chatHistory.length === 0 && (
            <p className="text-xs text-[#53645C]">Ask a question or choose a topic. Aura will label live readings, cached values, and offline guidance so you can judge how current the information is.</p>
          )}
          {chatHistory.map((item, index) => (
            <div key={`${item.sender}-${index}`} className="flex items-start gap-3">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${item.sender === 'aura' ? 'bg-[#1A2922] text-[#FAF7F2]' : 'bg-[#D6B33F] text-[#18261F]'}`} aria-hidden="true">{item.sender === 'aura' ? 'A' : 'You'}</div>
              <div className="min-w-0 break-words flex-1 space-y-1 text-xs leading-relaxed text-[#1A2922]">
                {item.sender === 'user'
                  ? <p className="font-medium">{item.text}</p>
                  : <AdviceReply advice={item.advice} mode={item.mode} language={item.language} />}
              </div>
            </div>
          ))}
          {isGenerating && (
            <div className="space-y-1 text-xs text-[#53645C]">
              <div role="status">Preparing guidance from the selected profile and available air-quality data…</div>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="flex gap-2 pt-1">
          <input
            data-testid="advisor-input"
            type="text"
            value={inputQuestion}
            onChange={(event) => setInputQuestion(event.target.value)}
            disabled={isGenerating}
            maxLength={ADVICE_QUESTION_LIMIT}
            aria-label="Ask the air-quality assistant"
            placeholder={`Ask about ${cityData?.name || 'your area'}, home air, or commuting (max ${ADVICE_QUESTION_LIMIT} characters)`}
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
