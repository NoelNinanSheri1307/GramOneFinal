/**
 * Demo Seed Helper for GramOne Web Application
 * Enables 1-click seeding of realistic citizen reports and Panchayat demo access
 * for hackathon judges with full dynamic multilingual support.
 *
 * The pre-authored multilingual variants shipped here are real translations of
 * the demo content. They are stored server-side in the content-translation
 * cache so the original text is preserved and every UI language is supported.
 */
import { login, register } from "./auth";
import {
  interpretIssue,
  createIssueFromInterpretation,
  createIssue,
  createEvidence,
  storeTranslations,
  IssueResponse,
  IssueCategory,
} from "./api";
import { LocalizedString } from "./localize";

export const DEMO_CITIZEN_CREDENTIALS = {
  name: "Ramesh Patel",
  email: "ramesh.citizen@gramone.org",
  password: "GramOne2026!",
  role: "citizen" as const,
};

export const DEMO_PANCHAYAT_CREDENTIALS = {
  name: "Gram Panchayat Officer - Rampur",
  email: "panchayat.officer@gramone.org",
  password: "GramOne2026!",
  role: "panchayat" as const,
};

export const DEMO_CSR_CREDENTIALS = {
  name: "GreenBridge CSR Foundation",
  email: "csr.partner@gramone.org",
  password: "GramOne2026!",
  role: "csr" as const,
};

export const DEMO_EMPLOYEE_CREDENTIALS = {
  name: "Field Worker - Rampur",
  email: "employee.field@gramone.org",
  password: "GramOne2026!",
  role: "panchayat_employee" as const,
};

export const MULTILINGUAL_DEMO_ISSUES = [
  {
    title: {
      en: "Drinking Water Pipeline Leak near Rampur Primary School",
      hi: "रामपुर प्राथमिक विद्यालय के पास पेयजल आपूर्ति पाइपलाइन फटी",
      ml: "റാംപൂർ പ്രൈമറി സ്കൂളിന് സമീപമുള്ള പ്രധാന കുടിവെള്ള പൈപ്പ് പൊട്ടിയതിനാൽ ശുദ്ധജലം റോഡിലേക്കു ഒഴുകുന്നു",
      kn: "ರಾಂಪುರ ಪ್ರಾಥಮಿಕ ಶಾಲೆಯ ಬಳಿಯ ಮುಖ್ಯ ಕುಡಿಯುವ ನೀರಿನ ಪೈಪ್ ಒಡೆದು ಶುದ್ಧ ನೀರು ರಸ್ತೆಗೆ ಹರಿಯುತ್ತಿದೆ",
      ta: "ராம்பூர் தொடக்கப் பள்ளி அருகே குடிநீர் குழாய் உடைப்பு",
      te: "రాంపూర్ ప్రాథమిక పాఠశాల వద్ద తాగునీటి పైప్‌లైన్ లీకేజీ",
      bn: "রামপুর প্রাথমিক বিদ্যালয়ের কাছে পানীয় জলের পাইপলাইন লিক",
      mr: "रामपूर प्राथमिक शाळेजवळ पिण्याच्या पाण्याची पाईपलाईन फुटली",
      gu: "રામપુર પ્રાથમિક શાળા પાસે પીવાના પાણીની પાઇપલાઇન લીકેજ",
      pa: "ਰਾਮਪੁਰ ਪ੍ਰਾਇਮਰੀ ਸਕੂਲ ਨੇੜੇ ਪੀਣ ਵਾਲੇ ਪਾਣੀ ਦੀ ਪਾਈਪਲਾਈਨ ਲੀਕ",
      or: "ରାମପୁର ପ୍ରାଥମିକ ବିଦ୍ୟାଳୟ ନିକଟରେ ପାନୀୟ ଜଳ ପାଇପଲାଇନ ଲିକ",
      as: "ৰামপুৰ প্ৰাথমিক বিদ্যালয়ৰ ওচৰত খোৱাপানীৰ পাইপলাইন ফটা",
      ur: "رام پور پرائمری سکول کے قریب پینے کے پانی کی پائپ لائن میں رساؤ",
    } as LocalizedString,
    description: {
      en: "Main drinking water pipeline near Rampur Primary School has burst. Clean drinking water is spilling into dirt road and 250 families have no drinking water supply for 2 days.",
      hi: "रामपुर प्राथमिक विद्यालय के पास मुख्य पेयजल पाइपलाइन फट गई है। साफ पानी सड़क पर बह रहा है और 250 परिवारों को 2 दिनों से पानी नहीं मिला है।",
      ml: "പ്രധാന കുടിവെള്ള പൈപ്പ് പൊട്ടിയതിനാൽ 250 കുടുംബങ്ങൾക്ക് രണ്ട് ദിവസമായി കുടിവെള്ളം ലഭ്യമല്ല.",
      kn: "ಮುಖ್ಯ ಕುಡಿಯುವ ನೀರಿನ ಪೈಪ್ ಒಡೆದು 250 ಕುಟುಂಬಗಳಿಗೆ ಎರಡು ದಿನಗಳಿಂದ ಕುಡಿಯುವ ನೀರು ಲಭ್ಯವಾಗಿಲ್ಲ.",
      ta: "ராம்பூர் தொடக்கப் பள்ளி அருகே முக்கிய குடிநீர் குழாய் உடைந்து தெருவில் குடிநீர் வீணாகிறது. 250 குடும்பங்களுக்கு 2 நாட்களாக குடிநீர் விநியோகம் இல்லை.",
      te: "రాంపూర్ ప్రాథమిక పాఠశాల సమీపంలో ప్రధాన తాగునీటి పైప్‌లైన్ పగిలిపోయింది. 250 కుటుంబాలకు 2 రోజులుగా తాగునీరు అందుబాటులో లేదు.",
      bn: "রামপুর প্রাথমিক বিদ্যালয়ের কাছে প্রধান পানীয় জলের পাইপলাইন ফেটে গেছে। ২৫০টি পরিবার ২ দিন ধরে জল পাচ্ছে না।",
      mr: "रामपूर प्राथमिक शाळेजवळ मुख्य पिण्याच्या पाण्याची पाईपलाईन फुटली आहे. २५० कुटुंबांना २ दिवसांपासून पाणी नाही.",
      gu: "રામપુર પ્રાથમિક શાળા પાસે મુખ્ય પીવાના પાણીની પાઇપલાઇન તૂટી ગઈ છે. 250 પરિવારો પાસે 2 દિવસથી પાણી નથી.",
      pa: "ਰਾਮਪੁਰ ਪ੍ਰਾਇਮਰੀ ਸਕੂਲ ਨੇੜੇ ਪੀਣ ਵਾਲੇ ਪਾਣੀ ਦੀ ਮੁੱਖ ਪਾਈਪਲਾਈਨ ਫਟ ਗਈ ਹੈ। 250 ਪਰਿਵਾਰਾਂ ਕੋਲ 2 ਦਿਨਾਂ ਤੋਂ ਪਾਣੀ ਨਹੀਂ ਹੈ।",
      or: "ରାମପୁର ପ୍ରାଥମିକ ବିଦ୍ୟାଳୟ ନିକଟରେ ମୁଖ୍ୟ ପାନୀୟ ଜଳ ପାଇପଲାଇନ ଫାଟିଯାଇଛି। ୨୫୦ ପରିବାର ୨ ଦିନ ଧରି ପାଣି ପାଉନାହାଁନ୍ତି।",
      as: "ৰামপুৰ প্ৰাথমিক বিদ্যালয়ৰ ওচৰত মুখ্য খোৱাপানীৰ পাইপলাইন ফাটিছে। ২৫০টা পৰিয়ালে ২ দিন ধৰি পানী পোৱা নাই।",
      ur: "رام پور پرائمری سکول کے قریب پینے کے پانی کی مرکزی پائپ لائن پھٹ گئی۔ 250 خاندانوں کو 2 دن سے پانی نہیں مل رہا۔",
    } as LocalizedString,
    village: {
      en: "Rampur Panchayat",
      hi: "रामपुर पंचायत",
      ml: "റാംപൂർ പഞ്ചായത്ത്",
      kn: "ರಾಂಪುರ ಪಂಚಾಯತ್",
      ta: "ராம்பூர் பஞ்சாயத்து",
      te: "రాంపూర్ పంచాయతీ",
      bn: "রামপুর পঞ্চায়েত",
      mr: "रामपूर पंचायत",
      gu: "રામપુર પંચાયત",
      pa: "ਰਾਮਪੁਰ ਪੰਚਾਇਤ",
      or: "ରାମପୁର ପଞ୍ଚାୟତ",
      as: "ৰামপুৰ পঞ্চায়ত",
      ur: "رام پور پنچایت",
    } as LocalizedString,
    evidenceNote: "Photo of burst pipeline spillage taken by Ramesh",
  },
  {
    title: {
      en: "Classroom Roof Leakage in Ward 3 Primary School",
      hi: "वार्ड 3 सरकारी प्राथमिक विद्यालय की कक्षा की छत में रिसाव",
      ml: "വാർഡ് 3 സർക്കാർ പ്രൈമറി സ്കൂളിലെ ക്ലാസ് മുറിയുടെ മേൽക്കൂര ചോർച്ച",
      kn: "ವಾರ್ಡ್ 3 ಸರ್ಕಾರಿ ಪ್ರಾಥಮಿಕ ಶಾಲೆಯ ತರಗತಿಯ ಛಾವಣಿ ಸೋರಿಕೆ",
      ta: "வார்டு 3 அரசு தொடக்கப் பள்ளி வகுப்பறை கூரை கசிவு",
      te: "వార్డు 3 ప్రభుత్వ ప్రాథమిక పాఠశాల తరగతి గది పైకప్పు లీకేజీ",
      bn: "ওয়ার্ড ৩ সরকারি প্রাথমিক বিদ্যালয়ের শ্রেণীকক্ষের ছাদ লিক",
      mr: "वॉर्ड ३ शासकीय प्राथमिक शाळेच्या वर्गाच्या छताची गळती",
      gu: "વોર્ડ 3 સરકારી પ્રાથમિક શાળાના વર્ગખંડના છતનું લીકેજ",
      pa: "ਵਾਰਡ 3 ਸਰਕਾਰੀ ਪ੍ਰਾਇਮਰੀ ਸਕੂਲ ਦੇ ਕਲਾਸਰੂਮ ਦੀ ਛੱਤ ਦਾ ਲੀਕੇਜ",
      or: "ୱାର୍ଡ ୩ ସରକାରୀ ପ୍ରାଥମିକ ବିଦ୍ୟାଳୟ ଶ୍ରେଣୀଗୃହ ଛାତ ଲିକ",
      as: "ৱাৰ্ড ৩ চৰকাৰী প্ৰাথমিক বিদ্যালয়ৰ শ্ৰেণীকোঠাৰ চাল ফটা",
      ur: "وارڈ 3 سرکاری پرائمری سکول کے کلاس روم کی چھت کا رساؤ",
    } as LocalizedString,
    description: {
      en: "Classroom roof in Government Primary School Ward 3 is leaking heavily during rain. Desks and textbooks are damaged, affecting 60 students in classes 3 and 4.",
      hi: "वार्ड 3 के सरकारी प्राथमिक विद्यालय में बारिश के दौरान कक्षा की छत से भारी रिसाव हो रहा है। 60 छात्र प्रभावित हैं।",
      ml: "മഴസമയത്ത് വാർഡ് 3 സർക്കാർ പ്രൈമറി സ്കൂളിലെ ക്ലാസ് മുറിയുടെ മേൽക്കൂര ശക്തമായി ചോരുന്നു. 60 വിദ്യാർത്ഥികളെ ബാധിച്ചു.",
      kn: "ಮಳೆಯ ಸಮಯದಲ್ಲಿ ವಾರ್ಡ್ 3 ಸರ್ಕಾರಿ ಪ್ರಾಥಮಿಕ ಶಾಲೆಯ ತರಗತಿಯ ಛಾವಣಿ ತೀವ್ರವಾಗಿ ಸೋರುತ್ತಿದೆ. 60 ವಿದ್ಯಾರ್ಥಿಗಳ ಮೇಲೆ ಪರಿಣಾಮ ಬೀರಿದೆ.",
      ta: "மழையின் போது வார்டு 3 அரசு தொடக்கப் பள்ளி வகுப்பறை கூரை கடுமையாக கசிகிறது. 60 மாணவர்கள் பாதிக்கப்பட்டுள்ளனர்.",
      te: "వర్షం పడినప్పుడు వార్డు 3 ప్రభుత్వ ప్రాథమిక పాఠశాల పైకప్పు లీక్ అవుతోంది. 60 మంది విద్యార్థులు ఇబ్బంది పడుతున్నారు.",
      bn: "বৃষ্টির সময় ওয়ার্ড ৩ সরকারি প্রাথমিক বিদ্যালয়ের শ্রেণীকক্ষের ছাদ থেকে জল পড়ছে। ৬০ জন ছাত্র ক্ষতিগ্রস্ত।",
      mr: "पावसात वॉर्ड ३ मधील प्राथमिक शाळेच्या वर्गाचे छत गळत आहे. ६० विद्यार्थ्यांचे नुकसान होत आहे.",
      gu: "વરસાદ દરમિયાન વર્ગખંડના છતમાંથી પાણી ટપકે છે. 60 વિદ્યાર્થીઓને અસર થઈ છે.",
      pa: "ਮੀਂਹ ਦੌਰਾਨ ਵਾਰਡ 3 ਸਰਕਾਰੀ ਸਕੂਲ ਦੀ ਛੱਤ ਲੀਕ ਹੁੰਦੀ ਹੈ। 60 ਵਿਦਿਆਰਥੀ ਪ੍ਰਭਾਵਿਤ ਹਨ।",
      or: "ବର୍ଷା ସମୟରେ ଶ୍ରେଣୀଗୃହ ଛାତରୁ ପାଣି ଗଳୁଛି। ୬୦ ଜଣ ଛାତ୍ର ପ୍ରଭାବିତ ହୋଇଛନ୍ତି।",
      as: "বৰষুণৰ সময়ত শ্ৰেণীকোঠাৰ চালৰ পৰা পানী পৰিছে। ৬০গৰাকী ছাত্ৰ-ছাত্ৰী প্ৰভাৱিত হৈছে।",
      ur: "بارش کے دوران کلاس روم کی چھت سے پانی ٹپکتا ہے۔ 60 طلباء متاثر ہو رہے ہیں۔",
    } as LocalizedString,
    village: {
      en: "Ward 3 Rampur",
      hi: "वार्ड 3 रामपुर",
      ml: "വാർഡ് 3 റാംപൂർ",
      kn: "ವಾರ್ಡ್ 3 ರಾಂಪುರ",
      ta: "வார்டு 3 ராம்பூர்",
      te: "వార్డు 3 రాంపూర్",
      bn: "ওয়ার্ড ৩ রামপুর",
      mr: "वॉर्ड ३ रामपूर",
      gu: "વોર્ડ 3 રામપુર",
      pa: "ਵਾਰਡ 3 ਰਾਮਪੁਰ",
      or: "ୱାର୍ଡ ୩ ରାମପୁର",
      as: "ৱাৰ্ড ৩ ৰামপুৰ",
      ur: "وارڈ 3 رام پور",
    } as LocalizedString,
    evidenceNote: "Classroom roof damage report submitted by Parent-Teacher Committee",
  },
  {
    title: {
      en: "Non-functional Streetlights on Rampur Main Stretch",
      hi: "रामपुर मुख्य मार्ग पर बंद स्ट्रीटलाइट्स",
      ml: "റാംപൂർ പ്രധാന റോഡിലെ തെരുവ് വിളക്കുകൾ കേടായി",
      kn: "ರಾಂಪುರ ಮುಖ್ಯ ರಸ್ತೆಯ ಬೀದಿ ದೀಪಗಳು ಹಾಳಾಗಿವೆ",
      ta: "ராம்பூர் முக்கிய சாலையில் பழுதடைந்த தெருவிளக்குகள்",
      te: "రాంపూర్ ప్రధాన రహదారిపై విరిగిన వీధిలైట్లు",
      bn: "রামপুর প্রধান সড়কে অকেজো স্ট্রিটলাইট",
      mr: "रामपूर मुख्य रस्त्यावरील बंद पथदिवे",
      gu: "રામપુર મુખ્ય માર્ગ પર તૂટેલી સ્ટ્રીટલાઈટ",
      pa: "ਰਾਮਪੁਰ ਮੁੱਖ ਮਾਰਗ 'ਤੇ ਬੰਦ ਸਟ੍ਰੀਟ ਲਾਈਟਾਂ",
      or: "ରାମପୁର ମୁଖ୍ୟ ରାସ୍ତାରେ ଭଙ୍ଗା ଷ୍ଟ୍ରିଟଲାଇଟ",
      as: "ৰামপুৰ মুখ্য পথত ভঙা পথৰ লাইট",
      ur: "رام پور مین روڈ پر خراب اسٹریٹ لائٹس",
    } as LocalizedString,
    description: {
      en: "Street lights on main Panchayat stretch from bus stand to health center have been out of order for 3 weeks, making night travel unsafe for women and elders.",
      hi: "बस स्टैंड से स्वास्थ्य केंद्र तक मुख्य मार्ग की स्ट्रीटलाइट्स 3 सप्ताह से बंद हैं, जिससे रात की यात्रा असुरक्षित हो गई है।",
      ml: "ബസ് സ്റ്റാൻഡ് മുതൽ ഹെൽത്ത് സെന്റർ വരെയുള്ള പ്രധാന റോഡിലെ തെരുവ് വിളക്കുകൾ 3 ആഴ്ചയായി കേടാണ്, ഇത് രാത്രി യാത്ര ദുഷ്കരമാക്കുന്നു.",
      kn: "ಬಸ್ ನಿಲ್ದಾಣದಿಂದ ಆರೋಗ್ಯ ಕೇಂದ್ರದವರೆಗಿನ ಮುಖ್ಯ ರಸ್ತೆಯ ಬೀದಿ ದೀಪಗಳು 3 ವಾರಗಳಿಂದ ಕೆಲಸ ಮಾಡುತ್ತಿಲ್ಲ.",
      ta: "பேருந்து நிலையத்திலிருந்து சுகாதார மையம் வரையிலான தெருவிளக்குகள் 3 வாரங்களாக எரியவில்லை.",
      te: "బస్సు స్టాండ్ నుండి ఆరోగ్య కేంద్రం వరకు వీధిలైట్లు 3 వారాలుగా పనిచేయడం లేదు.",
      bn: "বাস স্ট্যান্ড থেকে স্বাস্থ্য কেন্দ্র পর্যন্ত স্ট্রিটলাইট ৩ সপ্তাহ ধরে বন্ধ রয়েছে।",
      mr: "बस स्थानक ते आरोग्य केंद्रापर्यंतचे पथदिवे ३ आठवड्यांपासून बंद आहेत.",
      gu: "બસ સ્ટેન્ડથી હેલ્થ સેન્ટર સુધીની સ્ટ્રીટલાઈટ 3 અઠવાડિયાથી બંધ છે.",
      pa: "ਬੱਸ ਸਟੈਂਡ ਤੋਂ ਹੈਲਥ ਸੈਂਟਰ ਤੱਕ ਸਟ੍ਰੀਟ ਲਾਈਟਾਂ 3 ਹਫ਼ਤਿਆਂ ਤੋਂ ਖ਼ਰਾਬ ਹਨ।",
      or: "ବସ ଷ୍ଟାଣ୍ଡରୁ ସ୍ୱାସ୍ଥ୍ୟ କେନ୍ଦ୍ର ପର୍ଯ୍ୟନ୍ତ ଷ୍ଟ୍ରିଟଲାଇଟ ୩ ସପ୍ତାହ ଧରି ବନ୍ଦ ଅଛି।",
      as: "বাছ আস্থানৰ পৰা স্বাস্থ্য কেন্দ্ৰলৈ পথৰ লাইট ৩ সপ্তাহ ধৰি বন্ধ হৈ আছে।",
      ur: "بس اسٹینڈ سے ہیلتھ سینٹر تک اسٹریٹ لائٹس 3 ہفتوں سے خراب ہیں۔",
    } as LocalizedString,
    village: {
      en: "Rampur Panchayat",
      hi: "रामपुर पंचायत",
      ml: "റാംപൂർ പഞ്ചായത്ത്",
      kn: "ರಾಂಪುರ ಪಂಚಾಯತ್",
      ta: "ராம்பூர் பஞ்சாயத்து",
      te: "రాంపూర్ పంచాయతీ",
      bn: "রামপুর পঞ্চায়েত",
      mr: "रामपूर पंचायत",
      gu: "રામપુર પંચાયત",
      pa: "ਰਾਮਪੁਰ ਪੰਚਾਇਤ",
      or: "ରାମପୁର ପଞ୍ଚାୟତ",
      as: "ৰামপুৰ পঞ্চায়ত",
      ur: "رام پور پنچایت",
    } as LocalizedString,
    evidenceNote: "Citizen grievance register entry #104",
  },
];

export async function seedDemoData(): Promise<void> {
  // Ensure citizen user is logged in
  try {
    await login(DEMO_CITIZEN_CREDENTIALS.email, DEMO_CITIZEN_CREDENTIALS.password);
  } catch {
    await register(
      DEMO_CITIZEN_CREDENTIALS.name,
      DEMO_CITIZEN_CREDENTIALS.email,
      DEMO_CITIZEN_CREDENTIALS.password,
      DEMO_CITIZEN_CREDENTIALS.role
    );
  }

  // Create sample issues with the full localized string objects attached.
  for (const item of MULTILINGUAL_DEMO_ISSUES) {
    try {
      const issue = await createMultilingualDemoIssue(item);
      if (issue.id) {
        // Persist the pre-authored multilingual variants in the translation
        // cache (original content in the DB columns is never modified).
        await storeTranslations("issue", issue.id, "title", "en", toRecord(item.title));
        await storeTranslations("issue", issue.id, "description", "en", toRecord(item.description));

        await createEvidence(issue.id, {
          evidence_type: "citizen_report",
          description: item.evidenceNote,
          source_reference: "Citizen App Upload",
        });
      }
    } catch (err) {
      console.warn("Demo seed item skipped:", err);
    }
  }
}

function toRecord(localized: LocalizedString): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(localized)) {
    if (typeof value === "string" && value.trim()) out[key] = value;
  }
  return out;
}

async function createMultilingualDemoIssue(item: {
  title: LocalizedString;
  description: LocalizedString;
}): Promise<IssueResponse> {
  // Preferred path: let GramOne AI interpret the English report and carry the
  // localized variants through the same flow citizens use.
  try {
    const interpretation = await interpretIssue(item.description.en);
    const payload = {
      ...interpretation,
      summary: item.title,
      original_language: "en",
      description: item.description.en,
      localized_description: toRecord(item.description),
    };
    return await createIssueFromInterpretation(payload);
  } catch {
    // Fallback when the AI service is unavailable: structured creation still
    // records the report and its translations.
    return createIssue({
      title: item.title.en,
      description: item.description.en,
      category: "water" as IssueCategory,
      original_language: "en",
    });
  }
}

export async function loginAsPanchayatDemo(): Promise<void> {
  try {
    await login(DEMO_PANCHAYAT_CREDENTIALS.email, DEMO_PANCHAYAT_CREDENTIALS.password);
  } catch {
    await register(
      DEMO_PANCHAYAT_CREDENTIALS.name,
      DEMO_PANCHAYAT_CREDENTIALS.email,
      DEMO_PANCHAYAT_CREDENTIALS.password,
      DEMO_PANCHAYAT_CREDENTIALS.role
    );
  }
}

export async function loginAsCsrDemo(): Promise<void> {
  try {
    await login(DEMO_CSR_CREDENTIALS.email, DEMO_CSR_CREDENTIALS.password);
  } catch {
    await register(
      DEMO_CSR_CREDENTIALS.name,
      DEMO_CSR_CREDENTIALS.email,
      DEMO_CSR_CREDENTIALS.password,
      DEMO_CSR_CREDENTIALS.role
    );
  }
}

export async function loginAsEmployeeDemo(): Promise<void> {
  try {
    await login(DEMO_EMPLOYEE_CREDENTIALS.email, DEMO_EMPLOYEE_CREDENTIALS.password);
  } catch {
    await register(
      DEMO_EMPLOYEE_CREDENTIALS.name,
      DEMO_EMPLOYEE_CREDENTIALS.email,
      DEMO_EMPLOYEE_CREDENTIALS.password,
      DEMO_EMPLOYEE_CREDENTIALS.role
    );
  }
}
