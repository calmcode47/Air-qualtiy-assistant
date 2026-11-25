// @ts-check

/** @typedef {'en' | 'hi' | 'pa'} AdviceLanguage */

/** User-facing copy for deterministic advice. Hindi and Punjabi need native-speaker review. */
/** @type {Record<AdviceLanguage, any>} */
export const ADVICE_TEMPLATES = {
  en: {
    categories: {
      unavailable: 'Unavailable', good: 'Good', moderate: 'Moderate', sensitive: 'Unhealthy for Sensitive Groups',
      unhealthy: 'Unhealthy', veryUnhealthy: 'Very Unhealthy', hazardous: 'Hazardous'
    },
    messages: {
      urgentSummary: 'If someone has severe breathing difficulty, chest pain, or bluish lips, contact local emergency services now.',
      liveData: 'Live model estimate for {{city}}: US AQI {{aqi}} ({{category}}){{pm25}}.',
      cachedData: 'No live reading is available for {{city}}; the cached estimate is {{age}} hours old, so use a current local advisory for decisions.',
      unavailableData: 'No live reading is available for {{city}}. Check a current local advisory before making time-sensitive decisions.',
      pm25: ' and PM2.5 {{value}} µg/m³',
      sensitiveHousehold: 'People in this household may be more sensitive to particle pollution; use extra caution and follow any personal care plan.',
      generalHousehold: 'Use current local guidance and adjust activity based on conditions and how you feel.',
      lowerWindow: ' The comparatively lower period is {{window}}, with a forecast peak US AQI of {{peak}} ({{category}}). Recheck local guidance before leaving. {{guidance}}',
      knownConditionFollowUp: 'For a known heart or lung condition, follow your clinician-provided action plan.',
      generalFollowUp: 'Would you like suggestions focused on commuting, cooking, or setting up a cleaner-air room?',
      stationDistance: ', {{km}} km away',
      groundMonitor: 'Nearby CPCB station {{name}}{{distance}} reported {{values}}. This is a station measurement, not a reading at your location.',
      urgentAssumption: 'This is general safety guidance, not a diagnosis.'
    },
    recommendations: {
      'urgent-help': {
        title: 'Get urgent medical help',
        action: 'Contact your local emergency service now. Follow any existing clinician-provided emergency plan while help is on the way.',
        why: 'These symptoms can require urgent in-person assessment; an air-quality assistant cannot determine their cause.',
        impact: { metric: 'Expected effect', value: 'No health outcome can be estimated by this assistant.', unit: 'Qualitative guidance' },
        assumptions: ['This is general safety guidance, not a diagnosis.']
      },
      'plants-and-filtration': {
        title: 'Do not rely on houseplants as an air cleaner',
        action: 'Do not rely on houseplants as a particle cleaner. Prioritize reducing indoor sources and, when practical, use a properly sized mechanical air cleaner or HVAC filter. Keep filters maintained and avoid devices that intentionally produce ozone.',
        why: 'A room air cleaner moves air through filter media; ordinary potted plants are not a substitute for source control, ventilation when outdoor air is cleaner, or filtration.',
        impact: { metric: 'Expected effect', value: 'Mechanical filtration can reduce airborne particles in the served space; the amount depends on room size, clean-air delivery, run time, and leakage.', unit: 'Qualitative guidance' },
        assumptions: ['No indoor particle monitor reading or room dimensions were supplied.']
      },
      'cleaner-indoor-air': {
        title: 'Make one room easier to keep clean',
        action: {
          withoutEquipment: 'If buying equipment is not feasible, start with no-cost source control: avoid indoor smoking, incense, and candles; avoid dry sweeping; and close windows while outdoor particle pollution is high when temperature and other conditions make that safe. When outdoor air improves, ventilate briefly.',
          withEquipment: 'Run a particle air cleaner in the room where people spend the most time. Choose a unit sized for that room, keep its airflow clear, and replace filters as directed. Avoid devices that intentionally produce ozone.'
        },
        why: 'Source control and particle filtration can reduce indoor particle levels. No single air cleaner removes every pollutant, and outdoor-air ventilation is useful when outdoor air is cleaner.',
        impact: { metric: 'Expected effect', value: 'Can lower airborne particles in the room when source control and a suitable filter are used; no personal reduction is measured here.', unit: 'Qualitative guidance' },
        assumptions: ['Actual indoor benefit depends on room size, filter performance, use, maintenance, and outdoor-air leakage.']
      },
      'plan-outdoor-time': {
        title: 'Plan around current air-quality guidance',
        why: 'Reducing the time or intensity of outdoor exertion during higher particle pollution reduces the amount of polluted air inhaled. A forecast is not a street-level measurement.',
        impact: { metric: 'Expected effect', value: 'Less time outdoors during a higher-pollution period means less opportunity for exposure; this app cannot calculate a personal dose.', unit: 'Qualitative guidance' },
        assumptions: { live: 'AQI and hourly values are model estimates for the selected location.', unavailable: 'No current live AQI was available; check an official local advisory.' }
      },
      'lower-emission-routine': {
        title: 'Make one trip produce less traffic pollution',
        action: {
          activeCommute: 'When practical, choose a route away from busy roads or shift to public transit or a shared trip. During high pollution, reduce outdoor exertion and time near traffic.',
          otherCommute: 'Combine errands or share a trip when practical. Avoid idling and choose public transit for trips where it is a workable alternative.'
        },
        why: 'Replacing or combining private-vehicle trips can reduce household vehicle use and traffic emissions. Personal exposure depends on route, vehicle, ventilation, and time spent outside.',
        impact: { metric: 'Expected effect', value: 'Can reduce private-vehicle trips and their emissions; the amount depends on the vehicle and trip distance.', unit: 'Qualitative guidance' },
        assumptions: ['Vehicle details, route, and trip distance affect the result.']
      },
      'cooking-source-control': {
        title: 'Limit particles from cooking',
        action: 'Use a kitchen exhaust hood vented outdoors if available, and avoid burning incense or candles indoors. Do not use an unvented combustion heater as an air-cleaning measure.',
        why: 'Cooking and indoor combustion can add particles. Exhaust ventilation and avoiding unnecessary indoor burning reduce indoor sources.',
        impact: { metric: 'Expected effect', value: 'Reduces avoidable indoor particle sources; no home measurement was supplied.', unit: 'Qualitative guidance' },
        assumptions: ['The advice assumes an outdoor-vented hood is available; recirculating hoods do not vent outdoors.']
      },
      'coordinate-community-action': {
        title: 'Coordinate a shared commute or no-idling pickup',
        action: 'Ask your building group, workplace, or school to pilot a no-idling pickup area or coordinate shared trips. Share the latest official advisory with your group when conditions change.',
        why: 'Group coordination makes it easier for people to change pickup and travel habits.',
        impact: { metric: 'Expected effect', value: 'Can reduce idling or the number of separate vehicle trips.', unit: 'Qualitative guidance' },
        assumptions: ['Local rules, accessibility needs, and travel patterns vary.']
      }
    }
  },
  hi: {
    categories: {
      unavailable: 'उपलब्ध नहीं', good: 'अच्छी', moderate: 'मध्यम', sensitive: 'संवेदनशील लोगों के लिए अस्वास्थ्यकर',
      unhealthy: 'अस्वास्थ्यकर', veryUnhealthy: 'बहुत अस्वास्थ्यकर', hazardous: 'खतरनाक'
    },
    messages: {
      urgentSummary: 'अगर किसी को साँस लेने में बहुत कठिनाई हो, सीने में दर्द हो या होंठ नीले पड़ रहे हों, तो अभी स्थानीय आपातकालीन सेवा से संपर्क करें।',
      liveData: '{{city}} के लिए लाइव मॉडल अनुमान: US AQI {{aqi}} ({{category}}){{pm25}}।',
      cachedData: '{{city}} के लिए लाइव रीडिंग उपलब्ध नहीं है; सहेजा गया अनुमान {{age}} घंटे पुराना है। निर्णय लेने के लिए स्थानीय ताज़ा सलाह देखें।',
      unavailableData: '{{city}} के लिए लाइव रीडिंग उपलब्ध नहीं है। समय-संवेदनशील निर्णय से पहले स्थानीय ताज़ा सलाह देखें।',
      pm25: ' और PM2.5 {{value}} µg/m³',
      sensitiveHousehold: 'इस घर के कुछ लोग कण प्रदूषण से अधिक प्रभावित हो सकते हैं। अतिरिक्त सावधानी रखें और अपनी व्यक्तिगत देखभाल योजना का पालन करें।',
      generalHousehold: 'स्थानीय ताज़ा सलाह देखें और परिस्थितियों तथा अपनी तबीयत के अनुसार गतिविधि बदलें।',
      lowerWindow: ' तुलनात्मक रूप से कम प्रदूषण का समय {{window}} है; उस अवधि का अनुमानित अधिकतम US AQI {{peak}} ({{category}}) है। निकलने से पहले स्थानीय सलाह फिर देखें। {{guidance}}',
      knownConditionFollowUp: 'यदि हृदय या फेफड़ों की कोई ज्ञात समस्या है, तो डॉक्टर की दी हुई कार्ययोजना का पालन करें।',
      generalFollowUp: 'क्या आप यात्रा, खाना पकाने या घर में एक साफ़ हवा वाला कमरा बनाने के बारे में सुझाव चाहते हैं?',
      stationDistance: ', {{km}} किमी दूर',
      groundMonitor: 'नज़दीकी CPCB स्टेशन {{name}}{{distance}} ने {{values}} की रिपोर्ट दी। यह स्टेशन की माप है, आपके स्थान की रीडिंग नहीं।',
      urgentAssumption: 'यह सामान्य सुरक्षा सलाह है, निदान नहीं।'
    },
    recommendations: {
      'urgent-help': {
        title: 'तुरंत चिकित्सा सहायता लें',
        action: 'अभी स्थानीय आपातकालीन सेवा से संपर्क करें। मदद आने तक डॉक्टर की दी हुई आपातकालीन योजना का पालन करें।',
        why: 'इन लक्षणों में तुरंत प्रत्यक्ष चिकित्सा जाँच की ज़रूरत हो सकती है; वायु गुणवत्ता सहायक इनका कारण तय नहीं कर सकता।',
        impact: { metric: 'संभावित प्रभाव', value: 'यह सहायक किसी स्वास्थ्य परिणाम का अनुमान नहीं लगा सकता।', unit: 'गुणात्मक मार्गदर्शन' },
        assumptions: ['यह सामान्य सुरक्षा सलाह है, निदान नहीं।']
      },
      'plants-and-filtration': {
        title: 'हवा साफ़ करने के लिए घरेलू पौधों पर निर्भर न रहें',
        action: 'कणों को हटाने के लिए घरेलू पौधों पर निर्भर न रहें। घर के भीतर प्रदूषण के स्रोत कम करें और जहाँ संभव हो, कमरे के आकार के अनुसार यांत्रिक एयर क्लीनर या HVAC फ़िल्टर इस्तेमाल करें। फ़िल्टर का रखरखाव करें और ओज़ोन बनाने वाले उपकरणों से बचें।',
        why: 'कमरे का एयर क्लीनर फ़िल्टर के ज़रिए हवा गुज़ारता है। साधारण गमले के पौधे स्रोत नियंत्रण, बाहर की हवा साफ़ होने पर वेंटिलेशन या फ़िल्ट्रेशन का विकल्प नहीं हैं।',
        impact: { metric: 'संभावित प्रभाव', value: 'यांत्रिक फ़िल्ट्रेशन इस्तेमाल वाले कमरे में हवा के कण घटा सकता है; असर कमरे के आकार, स्वच्छ हवा की आपूर्ति, चलने के समय और हवा के रिसाव पर निर्भर करता है।', unit: 'गुणात्मक मार्गदर्शन' },
        assumptions: ['घर के भीतर कणों की रीडिंग या कमरे का आकार नहीं दिया गया है।']
      },
      'cleaner-indoor-air': {
        title: 'एक कमरे की हवा साफ़ रखना आसान बनाएँ',
        action: {
          withoutEquipment: 'अगर उपकरण खरीदना संभव न हो, तो बिना खर्च के स्रोत नियंत्रण से शुरू करें: घर के अंदर धूम्रपान, अगरबत्ती और मोमबत्तियाँ न जलाएँ; सूखी झाड़ू से बचें; और बाहर कण प्रदूषण अधिक होने पर, यदि तापमान और अन्य स्थितियाँ सुरक्षित हों, खिड़कियाँ बंद रखें। बाहर की हवा बेहतर होने पर थोड़ी देर वेंटिलेशन करें।',
          withEquipment: 'जिस कमरे में लोग सबसे अधिक समय बिताते हैं, वहाँ कणों को छानने वाला एयर क्लीनर चलाएँ। कमरे के आकार के अनुकूल उपकरण चुनें, हवा का रास्ता खुला रखें और निर्देशानुसार फ़िल्टर बदलें। ओज़ोन बनाने वाले उपकरणों से बचें।'
        },
        why: 'स्रोत नियंत्रण और कणों का फ़िल्ट्रेशन घर के भीतर कणों का स्तर घटा सकते हैं। कोई एक एयर क्लीनर हर प्रदूषक नहीं हटाता। बाहर की हवा साफ़ होने पर वेंटिलेशन उपयोगी है।',
        impact: { metric: 'संभावित प्रभाव', value: 'स्रोत नियंत्रण और उपयुक्त फ़िल्टर से कमरे में हवा के कण कम हो सकते हैं; यहाँ किसी व्यक्ति के लिए कमी नहीं मापी गई है।', unit: 'गुणात्मक मार्गदर्शन' },
        assumptions: ['घर के भीतर वास्तविक लाभ कमरे के आकार, फ़िल्टर के प्रदर्शन, उपयोग, रखरखाव और बाहर की हवा के रिसाव पर निर्भर करता है।']
      },
      'plan-outdoor-time': {
        title: 'मौजूदा वायु गुणवत्ता सलाह के अनुसार योजना बनाएँ',
        why: 'कण प्रदूषण अधिक होने पर बाहर व्यायाम का समय या तीव्रता घटाने से साँस के साथ अंदर जाने वाली प्रदूषित हवा कम होती है। पूर्वानुमान सड़क-स्तर की माप नहीं है।',
        impact: { metric: 'संभावित प्रभाव', value: 'अधिक प्रदूषण के समय बाहर कम रहने से संपर्क का अवसर घटता है; यह ऐप किसी व्यक्ति की खुराक नहीं मापता।', unit: 'गुणात्मक मार्गदर्शन' },
        assumptions: { live: 'चुने गए स्थान के AQI और प्रति घंटा मान मॉडल अनुमान हैं।', unavailable: 'मौजूदा लाइव AQI उपलब्ध नहीं था; स्थानीय आधिकारिक सलाह देखें।' }
      },
      'lower-emission-routine': {
        title: 'एक यात्रा से होने वाला यातायात प्रदूषण घटाएँ',
        action: {
          activeCommute: 'जहाँ संभव हो, व्यस्त सड़कों से दूर रास्ता चुनें या सार्वजनिक परिवहन अथवा साझा यात्रा करें। प्रदूषण अधिक हो तो बाहर मेहनत कम करें और यातायात के पास कम समय बिताएँ।',
          otherCommute: 'जहाँ संभव हो, काम एक साथ करें या यात्रा साझा करें। वाहन चालू रखकर इंतज़ार न करें और जहाँ व्यावहारिक हो, सार्वजनिक परिवहन चुनें।'
        },
        why: 'निजी वाहन यात्राओं को साझा या एक साथ करने से घर के वाहन उपयोग और यातायात उत्सर्जन में कमी आ सकती है। व्यक्तिगत संपर्क रास्ते, वाहन, वेंटिलेशन और बाहर बिताए समय पर निर्भर करता है।',
        impact: { metric: 'संभावित प्रभाव', value: 'निजी वाहन यात्राएँ और उनसे होने वाला उत्सर्जन घट सकता है; मात्रा वाहन और दूरी पर निर्भर करती है।', unit: 'गुणात्मक मार्गदर्शन' },
        assumptions: ['वाहन, रास्ते और यात्रा की दूरी से परिणाम बदलता है।']
      },
      'cooking-source-control': {
        title: 'खाना पकाने से उठने वाले कण कम करें',
        action: 'यदि उपलब्ध हो, तो बाहर हवा निकालने वाला रसोई एग्ज़ॉस्ट चलाएँ और घर के अंदर अगरबत्ती या मोमबत्ती जलाने से बचें। बिना वेंट वाला ईंधन हीटर हवा साफ़ करने के लिए न चलाएँ।',
        why: 'खाना पकाने और घर के अंदर ईंधन जलाने से कण बढ़ सकते हैं। एग्ज़ॉस्ट वेंटिलेशन और अनावश्यक धुआँ न करने से घर के भीतर स्रोत कम होते हैं।',
        impact: { metric: 'संभावित प्रभाव', value: 'घर के भीतर टाले जा सकने वाले कण स्रोत घटते हैं; घर की कोई माप उपलब्ध नहीं है।', unit: 'गुणात्मक मार्गदर्शन' },
        assumptions: ['यह सलाह मानती है कि बाहर हवा निकालने वाला एग्ज़ॉस्ट उपलब्ध है; हवा को वापस कमरे में घुमाने वाला हुड बाहर नहीं निकालता।']
      },
      'coordinate-community-action': {
        title: 'साझा यात्रा या बिना इंजन चालू रखे पिकअप की योजना बनाएँ',
        action: 'अपनी बिल्डिंग, कार्यस्थल या स्कूल समूह से बिना इंजन चालू रखे पिकअप क्षेत्र आज़माने या साझा यात्राएँ तय करने को कहें। परिस्थितियाँ बदलने पर समूह में ताज़ा आधिकारिक सलाह साझा करें।',
        why: 'समूह मिलकर काम करे तो पिकअप और यात्रा की आदतें बदलना आसान होता है।',
        impact: { metric: 'संभावित प्रभाव', value: 'इंजन चालू रखकर इंतज़ार या अलग-अलग वाहन यात्राएँ घट सकती हैं।', unit: 'गुणात्मक मार्गदर्शन' },
        assumptions: ['स्थानीय नियम, पहुँच की ज़रूरतें और यात्रा के तरीके अलग-अलग होते हैं।']
      }
    }
  },
  pa: {
    categories: {
      unavailable: 'ਉਪਲਬਧ ਨਹੀਂ', good: 'ਚੰਗੀ', moderate: 'ਦਰਮਿਆਨੀ', sensitive: 'ਸੰਵੇਦਨਸ਼ੀਲ ਲੋਕਾਂ ਲਈ ਨੁਕਸਾਨਦੇਹ',
      unhealthy: 'ਨੁਕਸਾਨਦੇਹ', veryUnhealthy: 'ਬਹੁਤ ਨੁਕਸਾਨਦੇਹ', hazardous: 'ਖ਼ਤਰਨਾਕ'
    },
    messages: {
      urgentSummary: 'ਜੇ ਕਿਸੇ ਨੂੰ ਸਾਹ ਲੈਣ ਵਿੱਚ ਬਹੁਤ ਮੁਸ਼ਕਲ ਹੋਵੇ, ਛਾਤੀ ਵਿੱਚ ਦਰਦ ਹੋਵੇ ਜਾਂ ਬੁੱਲ੍ਹ ਨੀਲੇ ਪੈ ਰਹੇ ਹੋਣ, ਤਾਂ ਹੁਣੇ ਸਥਾਨਕ ਐਮਰਜੈਂਸੀ ਸੇਵਾ ਨਾਲ ਸੰਪਰਕ ਕਰੋ।',
      liveData: '{{city}} ਲਈ ਲਾਈਵ ਮਾਡਲ ਅੰਦਾਜ਼ਾ: US AQI {{aqi}} ({{category}}){{pm25}}।',
      cachedData: '{{city}} ਲਈ ਲਾਈਵ ਰੀਡਿੰਗ ਉਪਲਬਧ ਨਹੀਂ ਹੈ; ਸੰਭਾਲਿਆ ਅੰਦਾਜ਼ਾ {{age}} ਘੰਟੇ ਪੁਰਾਣਾ ਹੈ। ਫ਼ੈਸਲਿਆਂ ਲਈ ਸਥਾਨਕ ਤਾਜ਼ਾ ਸਲਾਹ ਵੇਖੋ।',
      unavailableData: '{{city}} ਲਈ ਲਾਈਵ ਰੀਡਿੰਗ ਉਪਲਬਧ ਨਹੀਂ ਹੈ। ਸਮੇਂ-ਸੰਵੇਦਨਸ਼ੀਲ ਫ਼ੈਸਲੇ ਤੋਂ ਪਹਿਲਾਂ ਸਥਾਨਕ ਤਾਜ਼ਾ ਸਲਾਹ ਵੇਖੋ।',
      pm25: ' ਅਤੇ PM2.5 {{value}} µg/m³',
      sensitiveHousehold: 'ਇਸ ਘਰ ਦੇ ਕੁਝ ਲੋਕ ਕਣ ਪ੍ਰਦੂਸ਼ਣ ਨਾਲ ਵਧੇਰੇ ਪ੍ਰਭਾਵਿਤ ਹੋ ਸਕਦੇ ਹਨ। ਵਾਧੂ ਸਾਵਧਾਨੀ ਵਰਤੋ ਅਤੇ ਆਪਣੀ ਨਿੱਜੀ ਦੇਖਭਾਲ ਯੋਜਨਾ ਦੀ ਪਾਲਣਾ ਕਰੋ।',
      generalHousehold: 'ਸਥਾਨਕ ਤਾਜ਼ਾ ਸਲਾਹ ਵੇਖੋ ਅਤੇ ਹਾਲਾਤਾਂ ਤੇ ਆਪਣੀ ਤਬੀਅਤ ਮੁਤਾਬਕ ਸਰਗਰਮੀ ਬਦਲੋ।',
      lowerWindow: ' ਤੁਲਨਾਤਮਕ ਤੌਰ ’ਤੇ ਘੱਟ ਪ੍ਰਦੂਸ਼ਣ ਵਾਲਾ ਸਮਾਂ {{window}} ਹੈ; ਉਸ ਸਮੇਂ ਦਾ ਅੰਦਾਜ਼ਿਤ ਵੱਧ ਤੋਂ ਵੱਧ US AQI {{peak}} ({{category}}) ਹੈ। ਨਿਕਲਣ ਤੋਂ ਪਹਿਲਾਂ ਸਥਾਨਕ ਸਲਾਹ ਮੁੜ ਵੇਖੋ। {{guidance}}',
      knownConditionFollowUp: 'ਜੇ ਦਿਲ ਜਾਂ ਫੇਫੜਿਆਂ ਦੀ ਕੋਈ ਜਾਣੀ ਸਮੱਸਿਆ ਹੈ, ਤਾਂ ਡਾਕਟਰ ਵੱਲੋਂ ਦਿੱਤੀ ਕਾਰਜ-ਯੋਜਨਾ ਦੀ ਪਾਲਣਾ ਕਰੋ।',
      generalFollowUp: 'ਕੀ ਤੁਸੀਂ ਆਉਣ-ਜਾਣ, ਖਾਣਾ ਪਕਾਉਣ ਜਾਂ ਘਰ ਵਿੱਚ ਸਾਫ਼ ਹਵਾ ਵਾਲਾ ਕਮਰਾ ਬਣਾਉਣ ਬਾਰੇ ਸੁਝਾਅ ਚਾਹੁੰਦੇ ਹੋ?',
      stationDistance: ', {{km}} ਕਿਮੀ ਦੂਰ',
      groundMonitor: 'ਨੇੜਲੇ CPCB ਸਟੇਸ਼ਨ {{name}}{{distance}} ਨੇ {{values}} ਦੀ ਰਿਪੋਰਟ ਦਿੱਤੀ। ਇਹ ਸਟੇਸ਼ਨ ਦੀ ਮਾਪ ਹੈ, ਤੁਹਾਡੇ ਸਥਾਨ ਦੀ ਰੀਡਿੰਗ ਨਹੀਂ।',
      urgentAssumption: 'ਇਹ ਆਮ ਸੁਰੱਖਿਆ ਸਲਾਹ ਹੈ, ਨਿਦਾਨ ਨਹੀਂ।'
    },
    recommendations: {
      'urgent-help': {
        title: 'ਤੁਰੰਤ ਡਾਕਟਰੀ ਮਦਦ ਲਵੋ',
        action: 'ਹੁਣੇ ਸਥਾਨਕ ਐਮਰਜੈਂਸੀ ਸੇਵਾ ਨਾਲ ਸੰਪਰਕ ਕਰੋ। ਮਦਦ ਪਹੁੰਚਣ ਤੱਕ ਡਾਕਟਰ ਵੱਲੋਂ ਦਿੱਤੀ ਐਮਰਜੈਂਸੀ ਯੋਜਨਾ ਦੀ ਪਾਲਣਾ ਕਰੋ।',
        why: 'ਇਨ੍ਹਾਂ ਲੱਛਣਾਂ ਲਈ ਤੁਰੰਤ ਸਾਹਮਣੇ ਬੈਠ ਕੇ ਡਾਕਟਰੀ ਜਾਂਚ ਦੀ ਲੋੜ ਹੋ ਸਕਦੀ ਹੈ; ਹਵਾ ਦੀ ਗੁਣਵੱਤਾ ਵਾਲਾ ਸਹਾਇਕ ਇਨ੍ਹਾਂ ਦਾ ਕਾਰਨ ਨਹੀਂ ਦੱਸ ਸਕਦਾ।',
        impact: { metric: 'ਸੰਭਾਵੀ ਅਸਰ', value: 'ਇਹ ਸਹਾਇਕ ਕਿਸੇ ਸਿਹਤ ਨਤੀਜੇ ਦਾ ਅੰਦਾਜ਼ਾ ਨਹੀਂ ਲਗਾ ਸਕਦਾ।', unit: 'ਗੁਣਾਤਮਕ ਸਲਾਹ' },
        assumptions: ['ਇਹ ਆਮ ਸੁਰੱਖਿਆ ਸਲਾਹ ਹੈ, ਨਿਦਾਨ ਨਹੀਂ।']
      },
      'plants-and-filtration': {
        title: 'ਹਵਾ ਸਾਫ਼ ਕਰਨ ਲਈ ਘਰੇਲੂ ਬੂਟਿਆਂ ’ਤੇ ਭਰੋਸਾ ਨਾ ਕਰੋ',
        action: 'ਕਣ ਹਟਾਉਣ ਲਈ ਘਰੇਲੂ ਬੂਟਿਆਂ ’ਤੇ ਭਰੋਸਾ ਨਾ ਕਰੋ। ਘਰ ਅੰਦਰ ਪ੍ਰਦੂਸ਼ਣ ਦੇ ਸਰੋਤ ਘਟਾਓ ਅਤੇ ਜਿੱਥੇ ਸੰਭਵ ਹੋਵੇ, ਕਮਰੇ ਦੇ ਆਕਾਰ ਮੁਤਾਬਕ ਮਕੈਨੀਕਲ ਏਅਰ ਕਲੀਨਰ ਜਾਂ HVAC ਫ਼ਿਲਟਰ ਵਰਤੋ। ਫ਼ਿਲਟਰਾਂ ਦੀ ਦੇਖਭਾਲ ਕਰੋ ਅਤੇ ਓਜ਼ੋਨ ਬਣਾਉਣ ਵਾਲੇ ਉਪਕਰਣਾਂ ਤੋਂ ਬਚੋ।',
        why: 'ਕਮਰੇ ਦਾ ਏਅਰ ਕਲੀਨਰ ਫ਼ਿਲਟਰ ਰਾਹੀਂ ਹਵਾ ਲੰਘਾਉਂਦਾ ਹੈ। ਆਮ ਗਮਲੇ ਵਾਲੇ ਬੂਟੇ ਸਰੋਤ-ਨਿਯੰਤਰਣ, ਬਾਹਰਲੀ ਹਵਾ ਸਾਫ਼ ਹੋਣ ’ਤੇ ਹਵਾਦਾਰੀ ਜਾਂ ਫ਼ਿਲਟਰੇਸ਼ਨ ਦਾ ਬਦਲ ਨਹੀਂ ਹਨ।',
        impact: { metric: 'ਸੰਭਾਵੀ ਅਸਰ', value: 'ਮਕੈਨੀਕਲ ਫ਼ਿਲਟਰੇਸ਼ਨ ਵਰਤੇ ਜਾ ਰਹੇ ਕਮਰੇ ਵਿੱਚ ਹਵਾ ਦੇ ਕਣ ਘਟਾ ਸਕਦੀ ਹੈ; ਅਸਰ ਕਮਰੇ ਦੇ ਆਕਾਰ, ਸਾਫ਼ ਹਵਾ ਦੀ ਸਪਲਾਈ, ਚੱਲਣ ਦੇ ਸਮੇਂ ਅਤੇ ਹਵਾ ਦੇ ਰਿਸਾਅ ’ਤੇ ਨਿਰਭਰ ਕਰਦਾ ਹੈ।', unit: 'ਗੁਣਾਤਮਕ ਸਲਾਹ' },
        assumptions: ['ਘਰ ਅੰਦਰ ਕਣਾਂ ਦੀ ਰੀਡਿੰਗ ਜਾਂ ਕਮਰੇ ਦਾ ਆਕਾਰ ਨਹੀਂ ਦਿੱਤਾ ਗਿਆ।']
      },
      'cleaner-indoor-air': {
        title: 'ਇੱਕ ਕਮਰੇ ਦੀ ਹਵਾ ਸਾਫ਼ ਰੱਖਣੀ ਆਸਾਨ ਬਣਾਓ',
        action: {
          withoutEquipment: 'ਜੇ ਉਪਕਰਣ ਖਰੀਦਣਾ ਸੰਭਵ ਨਾ ਹੋਵੇ, ਤਾਂ ਬਿਨਾਂ ਖ਼ਰਚੇ ਦੇ ਸਰੋਤ-ਨਿਯੰਤਰਣ ਨਾਲ ਸ਼ੁਰੂ ਕਰੋ: ਘਰ ਅੰਦਰ ਸਿਗਰਟ, ਧੂਪ ਅਤੇ ਮੋਮਬੱਤੀਆਂ ਨਾ ਸਾੜੋ; ਸੁੱਕੀ ਝਾੜੂ ਤੋਂ ਬਚੋ; ਅਤੇ ਬਾਹਰ ਕਣ ਪ੍ਰਦੂਸ਼ਣ ਵੱਧ ਹੋਣ ’ਤੇ, ਜੇ ਤਾਪਮਾਨ ਤੇ ਹੋਰ ਹਾਲਾਤ ਸੁਰੱਖਿਅਤ ਹੋਣ, ਖਿੜਕੀਆਂ ਬੰਦ ਰੱਖੋ। ਬਾਹਰਲੀ ਹਵਾ ਸੁਧਰਨ ’ਤੇ ਥੋੜ੍ਹੀ ਦੇਰ ਹਵਾਦਾਰੀ ਕਰੋ।',
          withEquipment: 'ਜਿਸ ਕਮਰੇ ਵਿੱਚ ਲੋਕ ਸਭ ਤੋਂ ਵੱਧ ਸਮਾਂ ਬਿਤਾਉਂਦੇ ਹਨ, ਉੱਥੇ ਕਣਾਂ ਨੂੰ ਫ਼ਿਲਟਰ ਕਰਨ ਵਾਲਾ ਏਅਰ ਕਲੀਨਰ ਚਲਾਓ। ਕਮਰੇ ਦੇ ਆਕਾਰ ਮੁਤਾਬਕ ਉਪਕਰਣ ਚੁਣੋ, ਹਵਾ ਦਾ ਰਸਤਾ ਖੁੱਲ੍ਹਾ ਰੱਖੋ ਅਤੇ ਹਦਾਇਤਾਂ ਮੁਤਾਬਕ ਫ਼ਿਲਟਰ ਬਦਲੋ। ਓਜ਼ੋਨ ਬਣਾਉਣ ਵਾਲੇ ਉਪਕਰਣਾਂ ਤੋਂ ਬਚੋ।'
        },
        why: 'ਸਰੋਤ-ਨਿਯੰਤਰਣ ਅਤੇ ਕਣਾਂ ਦੀ ਫ਼ਿਲਟਰੇਸ਼ਨ ਘਰ ਅੰਦਰ ਕਣਾਂ ਦਾ ਪੱਧਰ ਘਟਾ ਸਕਦੇ ਹਨ। ਕੋਈ ਇੱਕ ਏਅਰ ਕਲੀਨਰ ਹਰ ਪ੍ਰਦੂਸ਼ਕ ਨਹੀਂ ਹਟਾਉਂਦਾ। ਬਾਹਰਲੀ ਹਵਾ ਸਾਫ਼ ਹੋਣ ’ਤੇ ਹਵਾਦਾਰੀ ਲਾਭਦਾਇਕ ਹੈ।',
        impact: { metric: 'ਸੰਭਾਵੀ ਅਸਰ', value: 'ਸਰੋਤ-ਨਿਯੰਤਰਣ ਅਤੇ ਢੁਕਵੇਂ ਫ਼ਿਲਟਰ ਨਾਲ ਕਮਰੇ ਵਿੱਚ ਹਵਾ ਦੇ ਕਣ ਘਟ ਸਕਦੇ ਹਨ; ਇੱਥੇ ਕਿਸੇ ਵਿਅਕਤੀ ਲਈ ਕਮੀ ਨਹੀਂ ਮਾਪੀ ਗਈ।', unit: 'ਗੁਣਾਤਮਕ ਸਲਾਹ' },
        assumptions: ['ਘਰ ਅੰਦਰ ਅਸਲ ਲਾਭ ਕਮਰੇ ਦੇ ਆਕਾਰ, ਫ਼ਿਲਟਰ ਦੀ ਕਾਰਗੁਜ਼ਾਰੀ, ਵਰਤੋਂ, ਦੇਖਭਾਲ ਅਤੇ ਬਾਹਰਲੀ ਹਵਾ ਦੇ ਰਿਸਾਅ ’ਤੇ ਨਿਰਭਰ ਕਰਦਾ ਹੈ।']
      },
      'plan-outdoor-time': {
        title: 'ਮੌਜੂਦਾ ਹਵਾ-ਗੁਣਵੱਤਾ ਸਲਾਹ ਮੁਤਾਬਕ ਯੋਜਨਾ ਬਣਾਓ',
        why: 'ਕਣ ਪ੍ਰਦੂਸ਼ਣ ਵੱਧ ਹੋਣ ਵੇਲੇ ਬਾਹਰ ਕਸਰਤ ਦਾ ਸਮਾਂ ਜਾਂ ਤੀਬਰਤਾ ਘਟਾਉਣ ਨਾਲ ਸਾਹ ਰਾਹੀਂ ਅੰਦਰ ਜਾਣ ਵਾਲੀ ਪ੍ਰਦੂਸ਼ਿਤ ਹਵਾ ਘਟਦੀ ਹੈ। ਪੂਰਵ-ਅਨੁਮਾਨ ਗਲੀ ਪੱਧਰ ਦੀ ਮਾਪ ਨਹੀਂ ਹੈ।',
        impact: { metric: 'ਸੰਭਾਵੀ ਅਸਰ', value: 'ਵੱਧ ਪ੍ਰਦੂਸ਼ਣ ਦੌਰਾਨ ਬਾਹਰ ਘੱਟ ਸਮਾਂ ਰਹਿਣ ਨਾਲ ਸੰਪਰਕ ਦਾ ਮੌਕਾ ਘਟਦਾ ਹੈ; ਇਹ ਐਪ ਕਿਸੇ ਵਿਅਕਤੀ ਦੀ ਖੁਰਾਕ ਨਹੀਂ ਮਾਪ ਸਕਦੀ।', unit: 'ਗੁਣਾਤਮਕ ਸਲਾਹ' },
        assumptions: { live: 'ਚੁਣੇ ਸਥਾਨ ਲਈ AQI ਅਤੇ ਘੰਟਾਵਾਰ ਮੁੱਲ ਮਾਡਲ ਅੰਦਾਜ਼ੇ ਹਨ।', unavailable: 'ਮੌਜੂਦਾ ਲਾਈਵ AQI ਉਪਲਬਧ ਨਹੀਂ ਸੀ; ਸਰਕਾਰੀ ਸਥਾਨਕ ਸਲਾਹ ਵੇਖੋ।' }
      },
      'lower-emission-routine': {
        title: 'ਇੱਕ ਯਾਤਰਾ ਨਾਲ ਹੋਣ ਵਾਲਾ ਟ੍ਰੈਫ਼ਿਕ ਪ੍ਰਦੂਸ਼ਣ ਘਟਾਓ',
        action: {
          activeCommute: 'ਜਿੱਥੇ ਸੰਭਵ ਹੋਵੇ, ਭੀੜ ਵਾਲੀਆਂ ਸੜਕਾਂ ਤੋਂ ਦੂਰ ਰਸਤਾ ਚੁਣੋ ਜਾਂ ਜਨਤਕ ਆਵਾਜਾਈ ਜਾਂ ਸਾਂਝੀ ਯਾਤਰਾ ਕਰੋ। ਪ੍ਰਦੂਸ਼ਣ ਵੱਧ ਹੋਣ ਵੇਲੇ ਬਾਹਰਲੀ ਕਸਰਤ ਘਟਾਓ ਅਤੇ ਟ੍ਰੈਫ਼ਿਕ ਕੋਲ ਘੱਟ ਸਮਾਂ ਰਹੋ।',
          otherCommute: 'ਜਿੱਥੇ ਸੰਭਵ ਹੋਵੇ, ਕੰਮ ਇਕੱਠੇ ਨਿਪਟਾਓ ਜਾਂ ਯਾਤਰਾ ਸਾਂਝੀ ਕਰੋ। ਵਾਹਨ ਬਿਨਾਂ ਲੋੜ ਚਾਲੂ ਨਾ ਰੱਖੋ ਅਤੇ ਜਿੱਥੇ ਵਰਤੋਂਯੋਗ ਹੋਵੇ, ਜਨਤਕ ਆਵਾਜਾਈ ਚੁਣੋ।'
        },
        why: 'ਨਿੱਜੀ ਵਾਹਨ ਯਾਤਰਾਵਾਂ ਸਾਂਝੀਆਂ ਜਾਂ ਇਕੱਠੀਆਂ ਕਰਨ ਨਾਲ ਘਰੇਲੂ ਵਾਹਨ ਵਰਤੋਂ ਅਤੇ ਟ੍ਰੈਫ਼ਿਕ ਨਿਕਾਸ ਘਟ ਸਕਦਾ ਹੈ। ਨਿੱਜੀ ਸੰਪਰਕ ਰਸਤੇ, ਵਾਹਨ, ਹਵਾਦਾਰੀ ਅਤੇ ਬਾਹਰ ਬਿਤਾਏ ਸਮੇਂ ’ਤੇ ਨਿਰਭਰ ਕਰਦਾ ਹੈ।',
        impact: { metric: 'ਸੰਭਾਵੀ ਅਸਰ', value: 'ਨਿੱਜੀ ਵਾਹਨ ਯਾਤਰਾਵਾਂ ਅਤੇ ਉਨ੍ਹਾਂ ਦਾ ਨਿਕਾਸ ਘਟ ਸਕਦਾ ਹੈ; ਮਾਤਰਾ ਵਾਹਨ ਅਤੇ ਦੂਰੀ ’ਤੇ ਨਿਰਭਰ ਕਰਦੀ ਹੈ।', unit: 'ਗੁਣਾਤਮਕ ਸਲਾਹ' },
        assumptions: ['ਵਾਹਨ, ਰਸਤਾ ਅਤੇ ਯਾਤਰਾ ਦੀ ਦੂਰੀ ਨਤੀਜੇ ਨੂੰ ਬਦਲਦੇ ਹਨ।']
      },
      'cooking-source-control': {
        title: 'ਖਾਣਾ ਪਕਾਉਣ ਨਾਲ ਪੈਦਾ ਹੋਣ ਵਾਲੇ ਕਣ ਘਟਾਓ',
        action: 'ਜੇ ਉਪਲਬਧ ਹੋਵੇ, ਤਾਂ ਬਾਹਰ ਹਵਾ ਕੱਢਣ ਵਾਲਾ ਰਸੋਈ ਐਗਜ਼ੌਸਟ ਚਲਾਓ ਅਤੇ ਘਰ ਅੰਦਰ ਧੂਪ ਜਾਂ ਮੋਮਬੱਤੀਆਂ ਸਾੜਨ ਤੋਂ ਬਚੋ। ਬਿਨਾਂ ਹਵਾਦਾਰੀ ਵਾਲਾ ਬਾਲਣ ਹੀਟਰ ਹਵਾ ਸਾਫ਼ ਕਰਨ ਲਈ ਨਾ ਵਰਤੋ।',
        why: 'ਖਾਣਾ ਪਕਾਉਣ ਅਤੇ ਘਰ ਅੰਦਰ ਬਾਲਣ ਸਾੜਨ ਨਾਲ ਕਣ ਵੱਧ ਸਕਦੇ ਹਨ। ਐਗਜ਼ੌਸਟ ਹਵਾਦਾਰੀ ਅਤੇ ਬੇਲੋੜਾ ਧੂੰਆਂ ਨਾ ਕਰਨ ਨਾਲ ਘਰ ਅੰਦਰਲੇ ਸਰੋਤ ਘਟਦੇ ਹਨ।',
        impact: { metric: 'ਸੰਭਾਵੀ ਅਸਰ', value: 'ਘਰ ਅੰਦਰ ਟਾਲੇ ਜਾ ਸਕਣ ਵਾਲੇ ਕਣ ਸਰੋਤ ਘਟਦੇ ਹਨ; ਘਰ ਦੀ ਕੋਈ ਮਾਪ ਨਹੀਂ ਦਿੱਤੀ ਗਈ।', unit: 'ਗੁਣਾਤਮਕ ਸਲਾਹ' },
        assumptions: ['ਇਹ ਸਲਾਹ ਮੰਨਦੀ ਹੈ ਕਿ ਬਾਹਰ ਹਵਾ ਕੱਢਣ ਵਾਲਾ ਹੁੱਡ ਮੌਜੂਦ ਹੈ; ਹਵਾ ਮੁੜ ਕਮਰੇ ਵਿੱਚ ਭੇਜਣ ਵਾਲੇ ਹੁੱਡ ਬਾਹਰ ਹਵਾ ਨਹੀਂ ਕੱਢਦੇ।']
      },
      'coordinate-community-action': {
        title: 'ਸਾਂਝੀ ਯਾਤਰਾ ਜਾਂ ਇੰਜਣ ਬੰਦ ਰੱਖ ਕੇ ਪਿਕਅੱਪ ਦੀ ਯੋਜਨਾ ਬਣਾਓ',
        action: 'ਆਪਣੀ ਇਮਾਰਤ, ਕੰਮਕਾਜ ਵਾਲੀ ਥਾਂ ਜਾਂ ਸਕੂਲ ਦੇ ਗਰੁੱਪ ਨੂੰ ਇੰਜਣ ਬੰਦ ਰੱਖ ਕੇ ਪਿਕਅੱਪ ਖੇਤਰ ਅਜ਼ਮਾਉਣ ਜਾਂ ਸਾਂਝੀਆਂ ਯਾਤਰਾਵਾਂ ਤੈਅ ਕਰਨ ਲਈ ਕਹੋ। ਹਾਲਾਤ ਬਦਲਣ ’ਤੇ ਗਰੁੱਪ ਵਿੱਚ ਤਾਜ਼ਾ ਸਰਕਾਰੀ ਸਲਾਹ ਸਾਂਝੀ ਕਰੋ।',
        why: 'ਗਰੁੱਪ ਮਿਲ ਕੇ ਕੰਮ ਕਰੇ ਤਾਂ ਪਿਕਅੱਪ ਅਤੇ ਯਾਤਰਾ ਦੀਆਂ ਆਦਤਾਂ ਬਦਲਣੀਆਂ ਆਸਾਨ ਹੁੰਦੀਆਂ ਹਨ।',
        impact: { metric: 'ਸੰਭਾਵੀ ਅਸਰ', value: 'ਇੰਜਣ ਚਾਲੂ ਰੱਖ ਕੇ ਉਡੀਕ ਜਾਂ ਵੱਖ-ਵੱਖ ਵਾਹਨ ਯਾਤਰਾਵਾਂ ਘਟ ਸਕਦੀਆਂ ਹਨ।', unit: 'ਗੁਣਾਤਮਕ ਸਲਾਹ' },
        assumptions: ['ਸਥਾਨਕ ਨਿਯਮ, ਪਹੁੰਚ ਦੀਆਂ ਲੋੜਾਂ ਅਤੇ ਯਾਤਰਾ ਦੇ ਤਰੀਕੇ ਵੱਖਰੇ ਹੁੰਦੇ ਹਨ।']
      }
    }
  }
};

const CATEGORY_KEYS = new Map([
  ['Good', 'good'], ['Moderate', 'moderate'], ['Unhealthy for Sensitive Groups', 'sensitive'],
  ['Unhealthy', 'unhealthy'], ['Very Unhealthy', 'veryUnhealthy'], ['Hazardous', 'hazardous'], ['Unavailable', 'unavailable']
]);

/** @param {string} category @param {AdviceLanguage} [language] */
export function localizeCategory(category, language = 'en') {
  const locale = ADVICE_TEMPLATES[language] || ADVICE_TEMPLATES.en;
  const key = CATEGORY_KEYS.get(category);
  return key ? locale.categories[key] : category;
}

/** @param {string} template @param {Record<string, string | number>} [values] */
export function interpolate(template, values = {}) {
  return template.replace(/\{\{(\w+)\}\}/gu, (_, key) => String(values[key] ?? ''));
}

/** @param {number | null} aqi @param {boolean} sensitive @param {AdviceLanguage} [language] */
export function localizedOutdoorGuidance(aqi, sensitive, language = 'en') {
  const languageKey = ADVICE_TEMPLATES[language] ? language : 'en';
  if (languageKey === 'en') return englishOutdoorGuidance(aqi, sensitive);
  if (aqi === null) {
    return languageKey === 'hi'
      ? 'कठिन बाहरी गतिविधि की योजना बनाने से पहले स्थानीय ताज़ा वायु गुणवत्ता सलाह देखें।'
      : 'ਬਾਹਰ ਔਖੀ ਕਸਰਤ ਦੀ ਯੋਜਨਾ ਬਣਾਉਣ ਤੋਂ ਪਹਿਲਾਂ ਸਥਾਨਕ ਤਾਜ਼ਾ ਹਵਾ-ਗੁਣਵੱਤਾ ਸਲਾਹ ਵੇਖੋ।';
  }
  if (aqi > 300) {
    return languageKey === 'hi'
      ? 'बाहर व्यायाम न करें। घर के अंदर गतिविधि कम रखें और उपलब्ध हो तो साफ़ हवा वाला कमरा इस्तेमाल करें। स्थानीय चेतावनियाँ देखें और घर के अंदर गर्मी तथा अन्य जोखिमों का भी ध्यान रखें।'
      : 'ਬਾਹਰ ਕਸਰਤ ਨਾ ਕਰੋ। ਘਰ ਅੰਦਰ ਸਰਗਰਮੀ ਘੱਟ ਰੱਖੋ ਅਤੇ ਉਪਲਬਧ ਹੋਵੇ ਤਾਂ ਸਾਫ਼ ਹਵਾ ਵਾਲਾ ਕਮਰਾ ਵਰਤੋ। ਸਥਾਨਕ ਚੇਤਾਵਨੀਆਂ ਵੇਖੋ ਅਤੇ ਘਰ ਅੰਦਰ ਗਰਮੀ ਤੇ ਹੋਰ ਖ਼ਤਰਿਆਂ ਦਾ ਵੀ ਧਿਆਨ ਰੱਖੋ।';
  }
  if (aqi > 200) {
    if (sensitive) return languageKey === 'hi'
      ? 'संवेदनशील घर के सदस्य बाहर व्यायाम न करें। अन्य लोग भी लंबे समय या कठिन व्यायाम से बचें।'
      : 'ਸੰਵੇਦਨਸ਼ੀਲ ਘਰ ਦੇ ਮੈਂਬਰ ਬਾਹਰ ਕਸਰਤ ਨਾ ਕਰਨ। ਹੋਰ ਲੋਕ ਵੀ ਲੰਮੇ ਸਮੇਂ ਜਾਂ ਔਖੀ ਕਸਰਤ ਤੋਂ ਬਚਣ।';
    return languageKey === 'hi'
      ? 'लंबे समय या कठिन बाहरी व्यायाम से बचें और व्यायाम को घर के अंदर करने पर विचार करें।'
      : 'ਲੰਮੇ ਸਮੇਂ ਜਾਂ ਔਖੀ ਬਾਹਰੀ ਕਸਰਤ ਤੋਂ ਬਚੋ ਅਤੇ ਕਸਰਤ ਘਰ ਅੰਦਰ ਕਰਨ ਬਾਰੇ ਸੋਚੋ।';
  }
  if (aqi > 150) {
    if (sensitive) return languageKey === 'hi'
      ? 'संवेदनशील घर के सदस्य लंबे समय या कठिन बाहरी व्यायाम से बचें। अन्य लोग इसे कम करें और विराम लें।'
      : 'ਸੰਵੇਦਨਸ਼ੀਲ ਘਰ ਦੇ ਮੈਂਬਰ ਲੰਮੀ ਜਾਂ ਔਖੀ ਬਾਹਰੀ ਕਸਰਤ ਤੋਂ ਬਚਣ। ਹੋਰ ਲੋਕ ਇਸਨੂੰ ਘਟਾਉਣ ਅਤੇ ਵਿਰਾਮ ਲੈਣ।';
    return languageKey === 'hi'
      ? 'लंबे समय या कठिन बाहरी व्यायाम को कम करें और विराम लें।'
      : 'ਲੰਮੀ ਜਾਂ ਔਖੀ ਬਾਹਰੀ ਕਸਰਤ ਘਟਾਓ ਅਤੇ ਵਿਰਾਮ ਲਵੋ।';
  }
  if (aqi > 100) {
    if (sensitive) return languageKey === 'hi'
      ? 'संवेदनशील घर के सदस्य बाहर कम समय बिताएँ, गतिविधि की तीव्रता घटाएँ और अधिक विराम लें।'
      : 'ਸੰਵੇਦਨਸ਼ੀਲ ਘਰ ਦੇ ਮੈਂਬਰ ਬਾਹਰ ਘੱਟ ਸਮਾਂ ਰਹਿਣ, ਸਰਗਰਮੀ ਦੀ ਤੀਬਰਤਾ ਘਟਾਉਣ ਅਤੇ ਵੱਧ ਵਿਰਾਮ ਲੈਣ।';
    return languageKey === 'hi'
      ? 'स्थानीय सलाह का पालन करें। इस स्तर पर मुख्य रूप से संवेदनशील समूह प्रभावित हो सकते हैं।'
      : 'ਸਥਾਨਕ ਸਲਾਹ ਦੀ ਪਾਲਣਾ ਕਰੋ। ਇਸ ਪੱਧਰ ’ਤੇ ਮੁੱਖ ਤੌਰ ’ਤੇ ਸੰਵੇਦਨਸ਼ੀਲ ਸਮੂਹ ਪ੍ਰਭਾਵਿਤ ਹੋ ਸਕਦੇ ਹਨ।';
  }
  return languageKey === 'hi'
    ? 'स्थानीय ताज़ा सलाह देखें और अपनी तबीयत के अनुसार बाहरी गतिविधि बदलें।'
    : 'ਸਥਾਨਕ ਤਾਜ਼ਾ ਸਲਾਹ ਵੇਖੋ ਅਤੇ ਆਪਣੀ ਤਬੀਅਤ ਮੁਤਾਬਕ ਬਾਹਰਲੀ ਸਰਗਰਮੀ ਬਦਲੋ।';
}

function englishOutdoorGuidance(aqi, sensitive) {
  if (aqi === null) return 'Check a current local air-quality advisory before planning strenuous outdoor activity.';
  if (aqi > 300) return 'Avoid outdoor physical activity. Keep activity low indoors and use a cleaner-air room if available. Check local alerts and account for heat and other indoor risks.';
  if (aqi > 200) return sensitive
    ? 'Sensitive household members should avoid outdoor physical activity. Others should avoid prolonged or strenuous outdoor activity.'
    : 'Avoid prolonged or strenuous outdoor activity and consider moving exercise indoors.';
  if (aqi > 150) return sensitive
    ? 'Sensitive household members should avoid prolonged or strenuous outdoor activity. Others should reduce it and take breaks.'
    : 'Reduce prolonged or strenuous outdoor activity and take breaks.';
  if (aqi > 100) return sensitive
    ? 'Sensitive household members should shorten outdoor activities, reduce intensity, and take more breaks.'
    : 'Follow local guidance. This level primarily affects sensitive groups.';
  return 'Use current local guidance and adjust outdoor activity based on how you feel.';
}
