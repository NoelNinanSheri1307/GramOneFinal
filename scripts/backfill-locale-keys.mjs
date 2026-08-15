/**
 * Backfill missing i18n keys across all 13 locale files.
 * Run: node scripts/backfill-locale-keys.mjs
 */
import fs from "fs";
import path from "path";

const localesDir = path.join("web", "src", "i18n", "locales");

const patches = {
  hi: {
    status: { sponsored: "सीएसआर प्रायोजित" },
    notificationType: {
      info: "जानकारी",
      issue_status: "समस्या स्थिति",
      impact_update: "प्रभाव अपडेट",
      project_update: "परियोजना अपडेट",
      sponsorship_update: "प्रायोजन अपडेट",
    },
    timeline: {
      reportedNote: "प्रारंभिक नागरिक समस्या रिपोर्ट प्राप्त",
      reportedDesc: "नागरिक की प्राकृतिक भाषा रिपोर्ट के साथ समस्या दर्ज",
      verifiedDesc: "पंचायत संदर्भ के साथ साक्ष्य प्रणाली ने रिपोर्ट विवरण सत्यापित किए",
      assignedDesc: "पंचायत अधिकारी या क्षेत्र टीम को निर्धारित",
      inProgressDesc: "ट्रैक की गई प्रगति अपडेट के साथ मैदानी कार्य जारी",
      resolvedDesc: "समस्या समाधानित और मैदान पर प्रभाव सत्यापित",
    },
    impact: {
      defaultTitle: "रामपुर गांव जल एवं नागरिक अवसंरचना उन्नयन",
      defaultSummary:
        "सीएसआर प्रायोजन के लिए पाइपलाइन रिसाव मरम्मत और गांव स्कूल स्वच्छता सुधार को मिलाने वाला एकत्रित सामुदायिक प्रभाव केस।",
    },
  },
  ta: {
    nav: {
      lightTheme: "வெளிச்ச தீம் மாற்று",
      darkTheme: "இருள் தீம் மாற்று",
      light: "வெளிச்சம்",
      dark: "இருள்",
    },
    report: { originalLangPrefix: "மூல மொழி:" },
    status: { sponsored: "CSR நிதியுதவி" },
    notificationType: {
      info: "தகவல்",
      issue_status: "சிக்கல் நிலை",
      impact_update: "தாக்கம் புதுப்பிப்பு",
      project_update: "திட்ட புதுப்பிப்பு",
      sponsorship_update: "நிதியுதவி புதுப்பிப்பு",
    },
    timeline: {
      reportedNote: "ஆரம்ப குடிமகன் சிக்கல் அறிக்கை பெறப்பட்டது",
      reportedDesc: "இயற்கை மொழி விளக்கத்துடன் குடிமகன் பதிவு செய்த சிக்கல்",
      verifiedDesc: "பஞ்சாயத்து சூழலுடன் சான்று அமைப்பு அறிக்கை விவரங்களை சரிபார்த்தது",
      assignedDesc: "பஞ்சாயத்து அதிகாரி அல்லது களப் பணிக்குழுவுக்கு ஒதுக்கப்பட்டது",
      inProgressDesc: "கண்காணிக்கப்பட்ட முன்னேற்ற புதுப்பிப்புகளுடன் களப்பணி நடந்து கொண்டிருக்கிறது",
      resolvedDesc: "சிக்கல் தீர்க்கப்பட்டு களத்தில் தாக்கம் சரிபார்க்கப்பட்டது",
    },
    impact: {
      defaultTitle: "ராம்பூர் கிராம நீர் மற்றும் சிவிக் கட்டமைப்பு மேம்பாடு",
      defaultSummary:
        "CSR நிதியுதவிக்காக குழாய் கசிவு பழுதுபார்ப்பு மற்றும் கிராம பள்ளி சுகாதார மேம்பாடுகளை இணைக்கும் ஒருங்கிணைந்த சமூக தாக்க வழக்கு.",
    },
  },
  te: {
    nav: {
      lightTheme: "లైట్ థీమ్ మార్చు",
      darkTheme: "డార్క్ థీమ్ మార్చు",
      light: "లైట్",
      dark: "డార్క్",
    },
    report: { originalLangPrefix: "మూల భాష:" },
    status: { sponsored: "CSR స్పాన్సర్" },
    notificationType: {
      info: "సమాచారం",
      issue_status: "సమస్య స్థితి",
      impact_update: "ప్రభావ నవీకరణ",
      project_update: "ప్రాజెక్ట్ నవీకరణ",
      sponsorship_update: "ప్రాయోజన నవీకరణ",
    },
    timeline: {
      reportedNote: "ప్రారంభ పౌర సమస్య నివేదిక స్వీకరించబడింది",
      reportedDesc: "సహజ భాషా వివరణతో పౌరం నమోదు చేసిన సమస్య",
      verifiedDesc: "పంచాయతీ సందర్భంతో సాక్ష్య వ్యవస్థ నివేదిక వివరాలను ధృవీకరించింది",
      assignedDesc: "పంచాయతీ అధికారి లేదా ఫీల్డ్ బృందానికి కేటాయించబడింది",
      inProgressDesc: "ట్రాక్ చేసిన ప్రగతి నవీకరణలతో ఫీల్డ్ పని జరుగుతోంది",
      resolvedDesc: "సమస్య పరిష్కరించబడి భూమిపై ప్రభావం ధృవీకరించబడింది",
    },
    impact: {
      defaultTitle: "రాంపూర్ గ్రామ నీరు మరియు సివిక్ ఇన్ఫ్రాస్ట్రక్టర్ అప్‌గ్రేడ్",
      defaultSummary:
        "CSR ప్రాయోజనం కోసం పైప్‌లైన్ లీక్ మరమ్మతు మరియు గ్రామ పాఠశాల పారిశుద్ధ్య మెరుగుదలలను కలిపిన సమాజ ప్రభావ కేసు.",
    },
  },
  kn: {
    nav: {
      lightTheme: "ಲೈಟ್ ಥೀಮ್ ಬದಲಿಸಿ",
      darkTheme: "ಡಾರ್ಕ್ ಥೀಮ್ ಬದಲಿಸಿ",
      light: "ಲೈಟ್",
      dark: "ಡಾರ್ಕ್",
    },
    report: { originalLangPrefix: "ಮೂಲ ಭಾಷೆ:" },
    status: { sponsored: "CSR ಪ್ರಾಯೋಜಿತ" },
    notificationType: {
      info: "ಮಾಹಿತಿ",
      issue_status: "ಸಮಸ್ಯೆ ಸ್ಥಿತಿ",
      impact_update: "ಪ್ರಭಾವ ನವೀಕರಣ",
      project_update: "ಪ್ರಾಜೆಕ್ಟ್ ನವೀಕರಣ",
      sponsorship_update: "ಪ್ರಾಯೋಜನ ನವೀಕರಣ",
    },
    timeline: {
      reportedNote: "ಪ್ರಾರಂಭಿಕ ನಾಗರಿಕ ಸಮಸ್ಯೆ ವರದಿ ಸ್ವೀಕರಿಸಲಾಗಿದೆ",
      reportedDesc: "ಸ್ವಾಭಾವಿಕ ಭಾಷಾ ವಿವರಣೆಯೊಂದಿಗೆ ನಾಗರಿಕರು ನಮೂದಿಸಿದ ಸಮಸ್ಯೆ",
      verifiedDesc: "ಪಂಚಾಯತಿ ಸಂದರ್ಭದೊಂದಿಗೆ ಸಾಕ್ಷ್ಯ ವ್ಯವಸ್ಥೆ ವರದಿ ವಿವರಗಳನ್ನು ಪರಿಶೀಲಿಸಿದೆ",
      assignedDesc: "ಪಂಚಾಯತಿ ಅಧಿಕಾರಿ ಅಥವಾ ಕ್ಷೇತ್ರ ತಂಡಕ್ಕೆ ನಿಯೋಜಿಸಲಾಗಿದೆ",
      inProgressDesc: "ಟ್ರ್ಯಾಕ್ ಮಾಡಿದ ಪ್ರಗತಿ ನವೀಕರಣಗಳೊಂದಿಗೆ ಕ್ಷೇತ್ರ ಕಾರ್ಯ ನಡೆಯುತ್ತಿದೆ",
      resolvedDesc: "ಸಮಸ್ಯೆ ಪರಿಹರಿಸಲಾಗಿದೆ ಮತ್ತು ಮೈದಾನದಲ್ಲಿ ಪ್ರಭಾವ ಪರಿಶೀಲಿಸಲಾಗಿದೆ",
    },
    impact: {
      defaultTitle: "ರಾಂಪೂರ್ ಗ್ರಾಮ ನೀರು ಮತ್ತು ಸಿವಿಕ್ ಇನ್ಫ್ರಾಸ್ಟ್ರಕ್ಟರ್ ಅಪ್‌ಗ್ರೇಡ್",
      defaultSummary:
        "CSR ಪ್ರಾಯೋಜನೆಗಾಗಿ ಪೈಪ್‌ಲೈನ್ ಸೋರಿಕೆ ದುರಸ್ತಿ ಮತ್ತು ಗ್ರಾಮ ಶಾಲೆ ಸ್ವಚ್ಛತೆ ಸುಧಾರಣೆಗಳನ್ನು ಸಂಯೋಜಿಸುವ ಸಮುದಾಯ ಪ್ರಭಾವ ಪ್ರಕರಣ.",
    },
  },
  ml: {
    nav: {
      lightTheme: "ലൈറ്റ് തീം മാറ്റുക",
      darkTheme: "ഡാർക്ക് തീം മാറ്റുക",
      light: "ലൈറ്റ്",
      dark: "ഡാർക്ക്",
    },
    report: { originalLangPrefix: "മൂല ഭാഷ:" },
    status: { sponsored: "CSR സ്പോൺസർ" },
    notificationType: {
      info: "വിവരം",
      issue_status: "പ്രശ്ന നില",
      impact_update: "പ്രഭാവം അപ്‌ഡേറ്റ്",
      project_update: "പ്രോജക്റ്റ് അപ്‌ഡേറ്റ്",
      sponsorship_update: "പ്രായോജന അപ്‌ഡേറ്റ്",
    },
    timeline: {
      reportedNote: "പ്രാരംഭ പൗര പ്രശ്ന റിപ്പോർട്ട് ലഭിച്ചു",
      reportedDesc: "സ്വാഭാവിക ഭാഷാ വിവരണത്തോടെ പൗരൻ രേഖപ്പെടുത്തിയ പ്രശ്നം",
      verifiedDesc: "പഞ്ചായത്ത് സന്ദർഭത്തോടെ സാക്ഷ്യ സംവിധാനം റിപ്പോർട്ട് വിശദാംശങ്ങൾ പരിശോധിച്ചു",
      assignedDesc: "പഞ്ചായത്ത് ഉദ്യോഗസ്ഥൻ അല്ലെങ്കിൽ ഫീൽഡ് ടീമിന് നിയോഗിച്ചു",
      inProgressDesc: "ട്രാക്ക് ചെയ്ത പുരോഗതി അപ്‌ഡേറ്റുകളോടെ ഫീൽഡ് ജോലി നടക്കുന്നു",
      resolvedDesc: "പ്രശ്നം പരിഹരിച്ച് മൈതാനത്തിൽ പ്രഭാവം പരിശോധിച്ചു",
    },
    impact: {
      defaultTitle: "രാംപൂർ ഗ്രാമ ജലവും സിവിക് ഇൻഫ്രാസ്ട്രക്ടർ അപ്‌ഗ്രേഡ്",
      defaultSummary:
        "CSR പ്രായോജനത്തിനായി പൈപ്പ്‌ലൈൻ ചോർച്ച നന്നാക്കലും ഗ്രാമ സ്കൂൾ ശുചിത്വ മെച്ചപ്പെടുത്തലുകളും സംയോജിപ്പിച്ച സമൂഹ പ്രഭാവ കേസ്.",
    },
  },
  bn: {
    nav: {
      lightTheme: "লাইট থিমে পরিবর্তন",
      darkTheme: "ডার্ক থিমে পরিবর্তন",
      light: "লাইট",
      dark: "ডার্ক",
    },
    report: { originalLangPrefix: "মূল ভাষা:" },
    status: { sponsored: "CSR পৃষ্ঠপোষকতা" },
    notificationType: {
      info: "তথ্য",
      issue_status: "সমস্যার অবস্থা",
      impact_update: "প্রভাব আপডেট",
      project_update: "প্রকল্প আপডেট",
      sponsorship_update: "পৃষ্ঠপোষকতা আপডেট",
    },
    timeline: {
      reportedNote: "প্রাথমিক নাগরিক সমস্যা রিপোর্ট প্রাপ্ত",
      reportedDesc: "প্রাকৃতিক ভাষা ব্যাখ্যাসহ নাগরিকের রিপোর্ট দাখিল",
      verifiedDesc: "পঞ্চায়েত প্রসঙ্গে সাক্ষ্য ব্যবস্থা রিপোর্টের বিবরণ যাচাই করেছে",
      assignedDesc: "পঞ্চায়েত কর্মী বা ক্ষেত্র দলকে নিয়োগ",
      inProgressDesc: "ট্র্যাক করা অগ্রগতি আপডেটসহ মাঠে কাজ চলছে",
      resolvedDesc: "সমস্যা সমাধান ও মাঠে প্রভাব যাচাই সম্পন্ন",
    },
    impact: {
      defaultTitle: "রামপুর গ্রাম জল ও নাগরিক অবকাঠামো উন্নয়ন",
      defaultSummary:
        "CSR পৃষ্ঠপোষকতার জন্য পাইপলাইন লিক মেরামত ও গ্রাম স্কুল স্বচ্ছতা উন্নতি একত্রিত সামুদায়িক প্রভাব কেস।",
    },
  },
  mr: {
    nav: {
      lightTheme: "लाइट थीम बदला",
      darkTheme: "डार्क थीम बदला",
      light: "लाइट",
      dark: "डार्क",
    },
    report: { originalLangPrefix: "मूळ भाषा:" },
    status: { sponsored: "CSR प्रायोजित" },
    notificationType: {
      info: "माहिती",
      issue_status: "समस्या स्थिती",
      impact_update: "प्रभाव अद्यतन",
      project_update: "प्रकल्प अद्यतन",
      sponsorship_update: "प्रायोजन अद्यतन",
    },
    timeline: {
      reportedNote: "प्रारंभिक नागरिक समस्या अहवाल प्राप्त",
      reportedDesc: "नैसर्गिक भाषा वर्णनासह नागरिकाने नोंदवलेली समस्या",
      verifiedDesc: "पंचायत संदर्भासह साक्ष्य प्रणाली अहवाल तपशील सत्यापित केले",
      assignedDesc: "पंचायत अधिकारी किंवा क्षेत्रीय कार्यसंघाला नियुक्त",
      inProgressDesc: "ट्रॅक केलेल्या प्रगती अद्यतनांसह मैदानी काम सुरू",
      resolvedDesc: "समस्या सुटली आणि मैदानावर प्रभाव सत्यापित",
    },
    impact: {
      defaultTitle: "रामपूर गाव जल व नागरी अवसंरचना उन्नयन",
      defaultSummary:
        "CSR प्रायोजनासाठी पाइपलाइन गळती दुरुस्ती आणि गाव शाळा स्वच्छता सुधारणा एकत्रित सामुदायिक प्रभाव केस.",
    },
  },
  gu: {
    nav: {
      lightTheme: "લાઇટ થીમ બદલો",
      darkTheme: "ડાર્ક થીમ બદલો",
      light: "લાઇટ",
      dark: "ડાર્ક",
    },
    report: { originalLangPrefix: "મૂળ ભાષા:" },
    status: { sponsored: "CSR પ્રાયોજિત" },
    notificationType: {
      info: "માહિતી",
      issue_status: "સમસ્યા સ્થિતિ",
      impact_update: "પ્રભાવ અપડેટ",
      project_update: "પ્રોજેક્ટ અપડેટ",
      sponsorship_update: "પ્રાયોજન અપડેટ",
    },
    timeline: {
      reportedNote: "પ્રારંભિક નાગરિક સમસ્યા રિપોર્ટ પ્રાપ્ત",
      reportedDesc: "સ્વાભાવિક ભાષા વર્ણન સાથે નાગરિકે નોંધાવેલી સમસ્યા",
      verifiedDesc: "પંચાયત સંદર્ભ સાથે સાક્ષ્ય વ્યવસ્થા રિપોર્ટ વિગતો ચકાસી",
      assignedDesc: "પંચાયત અધિકારી અથવા ફીલ્ડ ટીમને સોંપેલ",
      inProgressDesc: "ટ્રેક કરેલી પ્રગતિ અપડેટ સાથે મેદાની કામ ચાલુ",
      resolvedDesc: "સમસ્યા ઉકેલી અને મેદાન પર પ્રભાવ ચકાસ્યો",
    },
    impact: {
      defaultTitle: "રામપુર ગામ પાણી અને સિવિક ઇન્ફ્રાસ્ટ્રક્ટર અપગ્રેડ",
      defaultSummary:
        "CSR પ્રાયોજન માટે પાઇપલાઇન લીક રિપેર અને ગામ શાળા સ્વચ્છતા સુધારણા એકીકૃત સામુદાયિક પ્રભાવ કેસ.",
    },
  },
  pa: {
    nav: {
      lightTheme: "ਲਾਈਟ ਥੀਮ ਬਦਲੋ",
      darkTheme: "ਡਾਰਕ ਥੀਮ ਬਦਲੋ",
      light: "ਲਾਈਟ",
      dark: "ਡਾਰਕ",
    },
    report: { originalLangPrefix: "ਮੂਲ ਭਾਸ਼ਾ:" },
    status: { sponsored: "CSR ਪ੍ਰਾਯੋਜਿਤ" },
    notificationType: {
      info: "ਜਾਣਕਾਰੀ",
      issue_status: "ਸਮੱਸਿਆ ਸਥਿਤੀ",
      impact_update: "ਪ੍ਰਭਾਵ ਅਪਡੇਟ",
      project_update: "ਪ੍ਰੋਜੈਕਟ ਅਪਡੇਟ",
      sponsorship_update: "ਪ੍ਰਾਯੋਜਨ ਅਪਡੇਟ",
    },
    timeline: {
      reportedNote: "ਸ਼ੁਰੂਆਤੀ ਨਾਗਰਿਕ ਸਮੱਸਿਆ ਰਿਪੋਰਟ ਪ੍ਰਾਪਤ",
      reportedDesc: "ਸਹਿਜ ਭਾਸ਼ਾ ਵਰਣਨ ਨਾਲ ਨਾਗਰਿਕ ਦੀ ਰਿਪੋਰਟ ਦਰਜ",
      verifiedDesc: "ਪੰਚਾਇਤ ਸੰਦਰਭ ਨਾਲ ਸਾਕ্ষੀ ਸਿਸਟਮ ਰਿਪੋਰਟ ਵਿਵਰਣ ਪੁਸ਼ਟੀ ਕੀਤੇ",
      assignedDesc: "ਪੰਚਾਇਤ ਅਧਿਕਾਰੀ ਜਾਂ ਫੀਲਡ ਟੀਮ ਨੂੰ ਨਿਯੁਕਤ",
      inProgressDesc: "ਟ੍ਰੈਕ ਕੀਤੇ ਪ੍ਰਗਤੀ ਅਪਡੇਟ ਨਾਲ ਮੈਦਾਨੀ ਕੰਮ ਜਾਰੀ",
      resolvedDesc: "ਸਮੱਸਿਆ ਹੱਲ ਅਤੇ ਮੈਦਾਨ ਵਿੱਚ ਪ੍ਰਭਾਵ ਪੁਸ਼ਟੀ",
    },
    impact: {
      defaultTitle: "ਰਾਮਪੁਰ ਗਾਓਂ ਪਾਣੀ ਅਤੇ ਸਿਵਿਕ ਇਨਫਰਾਸਟ੍ਰਕਟਰ ਅਪਗ੍ਰੇਡ",
      defaultSummary:
        "CSR ਪ੍ਰਾਯੋਜਨ ਲਈ ਪਾਈਪਲਾਈਨ ਲੀਕ ਮੁਰੰਮਤ ਅਤੇ ਗਾਓਂ ਸਕੂਲ ਸਫਾਈ ਸੁਧਾਰ ਮਿਲਾਉਣ ਵਾਲਾ ਸਮੁਦਾਇਕ ਪ੍ਰਭਾਵ ਕੇਸ।",
    },
  },
  or: {
    nav: {
      lightTheme: "ଲାଇଟ୍ ଥିମ୍ ବଦଳାନ୍ତୁ",
      darkTheme: "ଡାର୍କ ଥିମ୍ ବଦଳାନ୍ତୁ",
      light: "ଲାଇଟ୍",
      dark: "ଡାର୍କ",
    },
    report: { originalLangPrefix: "ମୂଳ ଭାଷା:" },
    status: { sponsored: "CSR ପ୍ରାୟୋଜିତ" },
    notificationType: {
      info: "ସୂଚନା",
      issue_status: "ସମସ୍ୟା ସ୍ଥିତି",
      impact_update: "ପ୍ରଭାବ ଅପଡେଟ୍",
      project_update: "ପ୍ରକଳ୍ପ ଅପଡେଟ୍",
      sponsorship_update: "ପ୍ରାୟୋଜନ ଅପଡେଟ୍",
    },
    timeline: {
      reportedNote: "ପ୍ରାରମ୍ଭିକ ନାଗରିକ ସମସ୍ୟା ରିପୋର୍ଟ ପ୍ରାପ୍ତ",
      reportedDesc: "ସ୍ୱାଭାବିକ ଭାଷା ବର୍ଣ୍ଣନା ସହିତ ନାଗରିକ ରିପୋର୍ଟ ଲଗ୍",
      verifiedDesc: "ପଞ୍ଚାୟତ ପରିପ୍ରେକ୍ଷ୍ୟରେ ସାକ୍ଷ୍ୟ ବ୍ୟବସ୍ଥା ରିପୋର୍ଟ ବିବରଣୀ ଯାଞ୍ଚ କରିଲା",
      assignedDesc: "ପଞ୍ଚାୟତ ଅଧିକାରୀ କିମ୍ବା କ୍ଷେତ୍ର ଟିମ୍ ନିୟୋଜିତ",
      inProgressDesc: "ଟ୍ରାକ୍ କରାଯାଇଥିବା ପ୍ରଗତି ଅପଡେଟ୍ ସହିତ ମାଇଦାନ କାର୍ଯ୍ୟ ଚାଲିଛି",
      resolvedDesc: "ସମସ୍ୟା ସମାଧାନ ଏବଂ ମାଇଦାନରେ ପ୍ରଭାବ ଯାଞ୍ଚ",
    },
    impact: {
      defaultTitle: "ରାମପୁର ଗ୍ରାମ ଜଳ ଏବଂ ସିଭିକ୍ ଇନଫ୍ରାଷ୍ଟ୍ରକ୍ଟର୍ ଅପଗ୍ରେଡ୍",
      defaultSummary:
        "CSR ପ୍ରାୟୋଜନ ପାଇଁ ପାଇପଲାଇନ୍ ଲିକ୍ ମରାମ୍ମତି ଏବଂ ଗ୍ରାମ ସ୍କୁଲ୍ ସ୍ୱଚ୍ଛତା ସୁଧାର ମିଶ୍ରିତ ସମୁଦାୟିକ ପ୍ରଭାବ କେସ୍।",
    },
  },
  as: {
    nav: {
      lightTheme: "লাইট থীম সলনি কৰক",
      darkTheme: "ডাৰ্ক থীম সলনি কৰক",
      light: "লাইট",
      dark: "ডাৰ্ক",
    },
    report: { originalLangPrefix: "মূল ভাষা:" },
    status: { sponsored: "CSR পৃষ্ঠপোষকতা" },
    notificationType: {
      info: "তথ্য",
      issue_status: "সমস্যাৰ অৱস্থা",
      impact_update: "প্ৰভাৱ আপডেট",
      project_update: "প্ৰকল্প আপডেট",
      sponsorship_update: "পৃষ্ঠপোষকতা আপডেট",
    },
    timeline: {
      reportedNote: "প্ৰাৰম্ভিক নাগৰিক সমস্যা ৰিপোৰ্ট পোৱা গৈছে",
      reportedDesc: "স্বাভাৱিক ভাষা বৰ্ণনাৰ সৈতে নাগৰিকৰ ৰিপোৰ্ট লগ",
      verifiedDesc: "পঞ্চায়ত পৰিপ্ৰেক্ষ্যত সাক্ষ্য ব্যৱস্থা ৰিপোৰ্ট বিৱৰণ পৰীক্ষা কৰিলে",
      assignedDesc: "পঞ্চায়ত বিষয়া বা ক্ষেত্ৰীয় দলক নিযুক্ত",
      inProgressDesc: "ট্ৰেক কৰা প্ৰগতি আপডেটৰ সৈতে মৈদানী কাম চলি আছে",
      resolvedDesc: "সমস্যা সমাধান আৰু মৈদানত প্ৰভাৱ পৰীক্ষা",
    },
    impact: {
      defaultTitle: "ৰামপুৰ গাঁও পানী আৰু নাগৰিক অবকাঠামো উন্নয়ন",
      defaultSummary:
        "CSR পৃষ্ঠপোষকতাৰ বাবে পাইপলাইন লিক মেৰামতি আৰু গাঁও স্কুল পৰিষ্কাৰ-সুধাৰ একত্ৰিত সমাজিক প্ৰভাৱ কেছ।",
    },
  },
  ur: {
    nav: {
      lightTheme: "لائٹ تھیم تبدیل کریں",
      darkTheme: "ڈارک تھیم تبدیل کریں",
      light: "لائٹ",
      dark: "ڈارک",
    },
    report: { originalLangPrefix: "اصل زبان:" },
    status: { sponsored: "CSR اسپانسرڈ" },
    notificationType: {
      info: "معلومات",
      issue_status: "مسئلہ کی حیثیت",
      impact_update: "اثر اپڈیٹ",
      project_update: "پروجیکٹ اپڈیٹ",
      sponsorship_update: "اسپانسرشپ اپڈیٹ",
    },
    timeline: {
      reportedNote: "ابتدائی شہری مسئلہ رپورٹ موصول",
      reportedDesc: "قدرتی زبان کی وضاحت کے ساتھ شہری کی رپورٹ درج",
      verifiedDesc: "پنچایت کے سیاق و سباق میں ثبوت نظام رپورٹ کی تفصیلات کی تصدیق",
      assignedDesc: "پنچایت افسر یا فیلڈ ٹیم کو تفویض",
      inProgressDesc: "ٹریک کی گئی پیش رفت اپڈیٹس کے ساتھ میدانی کام جاری",
      resolvedDesc: "مسئلہ حل اور میدان میں اثر کی تصدیق",
    },
    impact: {
      defaultTitle: "رامپور گاؤں پانی اور شہری انفراسٹرکٹر اپ گریڈ",
      defaultSummary:
        "CSR اسپانسرشپ کے لیے پائپ لائن لیک مرمت اور گاؤں اسکول صفائی بہتری کو ملا کر سماجی اثر کیس۔",
    },
  },
};

function deepMerge(target, source) {
  for (const [key, value] of Object.entries(source)) {
    if (value && typeof value === "object" && !Array.isArray(value)) {
      if (!target[key] || typeof target[key] !== "object") target[key] = {};
      deepMerge(target[key], value);
    } else {
      target[key] = value;
    }
  }
  return target;
}

for (const [lang, patch] of Object.entries(patches)) {
  const filePath = path.join(localesDir, lang, "common.json");
  const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
  deepMerge(data, patch);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + "\n", "utf8");
  console.log("Updated", lang);
}

console.log("Done.");
