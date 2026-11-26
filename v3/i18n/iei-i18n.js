/* IEI site translations: engine.
   Each language lives in i18n/lang/<code>.js and is loaded only when selected.
   Interface, static sections, levers, drivers, indicators, regions and countries are translated.
   Long-form content (case studies, indicator facts, methodology notes) stays in English.
   Machine-assisted draft by Claude: wording and terminology to be validated by GSG Impact and National Partners. */
(function () {
  'use strict';
  /* code, native name, Google font for non-Latin scripts, right-to-left */
  var LANGS = [
    ['en', 'English'], ['es', 'Español'], ['pt', 'Português'], ['fr', 'Français'],
    ['de', 'Deutsch'], ['nl', 'Nederlands'], ['it', 'Italiano'], ['el', 'Ελληνικά', 'Noto Sans'],
    ['fi', 'Suomi'], ['sv', 'Svenska'], ['nb', 'Norsk'], ['tr', 'Türkçe'],
    ['he', 'עברית', 'Noto Sans Hebrew', 1], ['ja', '日本語', 'Noto Sans JP'], ['ko', '한국어', 'Noto Sans KR'],
    ['zh-Hans', '简体中文', 'Noto Sans SC'], ['zh-Hant', '繁體中文', 'Noto Sans TC'],
    ['hi', 'हिन्दी', 'Noto Sans Devanagari'], ['bn', 'বাংলা', 'Noto Sans Bengali'],
    ['si', 'සිංහල', 'Noto Sans Sinhala'], ['ta', 'தமிழ்', 'Noto Sans Tamil'],
    ['id', 'Bahasa Indonesia'], ['ms', 'Bahasa Melayu'], ['th', 'ไทย', 'Noto Sans Thai'],
    ['km', 'ខ្មែរ', 'Noto Sans Khmer'], ['sw', 'Kiswahili']
  ];
  var CODES = LANGS.map(function (l) { return l[0]; });
  function norm(v) { v = (v || '').trim().toLowerCase(); for (var i = 0; i < CODES.length; i++) if (CODES[i].toLowerCase() === v) return CODES[i]; return null; }
  var qs = new URLSearchParams(location.search), lang = norm(qs.get('lang'));
  if (!lang) { try { lang = norm(localStorage.getItem('iei-lang')); } catch (e) { } }
  if (!lang) lang = 'en';
  var META = LANGS[CODES.indexOf(lang)];
  window.IEI_LANG = lang; window.IEI_LANGS = LANGS;

  /* load the language pack synchronously while the page is still parsing, then re-run this file */
  var PK = window.IEI_PACK && window.IEI_PACK.code === lang ? window.IEI_PACK : null;
  if (lang !== 'en' && !PK && !window.__ieiPackTried && document.readyState === 'loading') {
    window.__ieiPackTried = 1;
    var me = document.currentScript, src = me ? me.src : '', base = src ? src.replace(/iei-i18n\.js.*$/, '') : 'i18n/', v = src.indexOf('?') > 0 ? src.slice(src.indexOf('?')) : '';
    document.write('<script src="' + base + 'lang/' + lang + '.js' + v + '"><\/script><script src="' + base + 'iei-i18n.js' + v + '"><\/script>');
    return;
  }

  /* English source strings; packs translate them by index */
  var K = ["Framework", "Global Insights", "Explore", "Country data", "Case Studies", "Case studies", "Get the report", "Impact Economy Index", "Prototype · draft data", "How ready is the world for an", "impact economy?", "The Impact Economy Index makes progress visible. Explore how countries are building the conditions and behaviours that put impact at the heart of every decision.", "Download the 2026 Report", "Explore the Index", "countries assessed", "policy drivers across 4 levers", "average score out of 100", "score range, lowest to highest", "Countries by readiness tier", "Early stage", "Developing", "Progressing", "Advanced", "An impact economy is an economic system where all participants put long-term economic, social and environmental value at the heart of decision making.", "While this transition is globally relevant, it will take different forms across countries depending on their development priorities and starting points. However, despite growing momentum and increasing conceptual convergence on impact economies, there is no shared framework to assess whether national systems are structured to align risk, return, and impact. The Impact Economy Index (IEI) provides the first framework to assess where and how progress towards an impact economy can be advanced. The IEI framework is designed to be meaningful across both advanced and developing economies, recognizing that the transition to an impact economy will look different depending on a country’s starting point, institutional context, and development priorities. Its goal is to generate actionable intelligence that policymakers, investors, and advocates need to accelerate the transition towards a more inclusive economic system.", "Four levers", "Accountability & Transparency", "Procurement & Demand", "Coordination & Support", "Capital Allocation & Deployment", "Accountability", "Procurement", "Coordination", "Capital", "Four levers, one bigger picture.", "The Index measures enabling conditions and behaviours across four system dimensions. Drivers describe what stakeholders do in practice.", "Select a lever to see its drivers and what they mean in practice.", "Organisations manage and account for their impact on people and planet.", "Governments, businesses and consumers choose products and services that create value.", "Institutions and intermediaries reduce barriers and align incentives.", "Funders and corporates deploy capital using impact models and practices.", "Public and private organizations manage and account for the impact of their activities on people and the planet.", "A foundational system condition of an impact economy is the availability of transparent, reliable, and decision-useful information on the social and environmental impact of organizations. Transparent information about the real costs, risks and opportunities of investment enables accountability for the impact of economic choices on people and planet. In practice, Accountability & Transparency looks like:", "These drivers of Accountability & Transparency create visibility into outcomes, strengthen trust, and help hold all economic actors responsible for delivering impact.", "See how countries score ↓", "Close ×", "Governments, businesses, and consumers procure and purchase products and services that create social and environmental value.", "Demand-side dynamics are a critical but often underleveraged driver of impact economies. Better information enables the state, consumers, and corporates to make purchasing and procurement decisions for products and services that create a positive impact. Impact-oriented Procurement & Demand looks like:", "In turn, organisations that embed social and environmental value into their products, services, and business models are rewarded with greater consumer spending, procurement opportunities, and market growth.", "Public and civil society institutions and intermediaries coordinate across sectors to reduce barriers, align incentives, and accelerate impact-driven growth.", "Institutional coordination supports re-enforcing actions across the four levers. Institutions and intermediaries enable more efficient progress by coordinating and supporting impact organizations across sectors to reduce barriers and align incentives. In practice, Coordination & Support looks like:", "These drivers strengthen the enabling ecosystem for impact, helping actors work toward shared goals while overcoming coordination failures that can slow progress.", "Funders allocate capital based on impact considerations, and corporates do business using impact models and practices.", "How capital is allocated is one of the defining features of an impact economy. Institutional investors, governments, development finance institutions, philanthropic funders, and retail savers all play a role in directing financial flows toward activities that create long-term value. Impact-oriented Capital Allocation & Deployment looks like:", "Taken together, these drivers direct capital toward activities that generate positive social and environmental outcomes, helping scale solutions and reshape incentives across the economy.", "Corporates disclose and manage sustainability impacts against verified standards", "Governments report on social, environmental, and fiscal progress on public commitments", "Private investors formally report on and are held accountable for the impact of their portfolios", "Corporate shifts in procurement to impact-oriented products and services (e.g. through corporate supply chain responsibility)", "Government procurement decisions reflective of social and environmental value (e.g. green public procurement frameworks)", "Consumer purchasing decisions informed by impact information (e.g. certified sustainable / fair-trade consumer products)", "Governments aligning priorities through national impact platforms and coordinating bodies", "Specialized service providers and intermediaries offering the expertise, networks, and market infrastructure needed to support impact-driven organizations", "Active citizen and civil society engagement on social and environmental issues", "Institutional investors funding inclusive growth through sustainable investment practices and impact management", "Private investors scaling impact through dedicated financing instruments", "Governments allocating and mobilizing capital for impact through public spending and innovative financing mechanisms", "Philanthropic funders seeding and de-risking impact-driven markets", "Corporates producing goods and services using sustainable and inclusive business models and practices", "Mandatory sustainability disclosure policy", "Corporate sustainability reporting", "Carbon pricing policy, price and coverage", "Fossil Fuel Subsidy", "Government accountability", "Subnational government climate-disclosure", "Investor fiduciary duty and Sustainabilty integration", "Investor impact management practices", "Corporate supply chain sustainability", "Socially responsible business commitments", "Green public procurement framework", "Social-value public procurement framework", "Outcomes based procurement and delivery", "Outcomes-based commissioning readiness", "Product-labelling / anti-greenwashing framework", "Certified sustainable / fair-trade consumption", "Influence of climate change on major household decisions", "Government coordination for the impact economy", "Density of impact-focused intermediaries", "Impact-related education provision", "Civil-society participation", "Investment facilitation and institutional investment regulation", "M/SME lending", "Sustainable finance taxonomy", "Corporate GSS+ debt issuance", "Private impact investment activity", "Private capital mobilized by concessional capital", "Public GSS+ debt issuance", "Effectiveness-adjusted social protection spending", "Philanthropy policies and incentives", "Concessional capital allocation", "Philanthropic funding activity", "Social-purpose enterprise legal frameworks", "Inclusive business activity", "Leading corporate enviromental practices", "Leading corporates’ social practices", "Insights", "What the data is telling us.", "Three global findings from the 2026 Index. The evidence beneath each one is calculated live from the country scores.", "Impact economies are built through both policy and practice.", "Countries with stronger enabling conditions tend to show stronger impact behaviours, but in most countries policies and rules are still ahead of what actors actually do.", "In the data", "Enabling conditions →", "↑ Behaviour", "High", "Upper-middle", "Lower-middle", "Low", "Each dot is a country, coloured by income group. Grey lines mark the averages. An association, not evidence of cause and effect.", "Progress does not follow one path.", "Income is not destiny: countries at similar income levels sit far apart on the Index, and similar totals hide different mixes of strengths across the four levers.", "Each dot is a country, coloured by tier. Hover for the name.", "Measurement is the connective tissue.", "Accountability and transparency is the most developed lever globally, but that information is not yet shaping what governments, businesses and consumers buy: procurement and demand lags furthest behind.", "Average lever score across 54 countries.", "How to read the Index", "Before the results: how the scores are built", "One score from 14 drivers · four tiers · no data is not a low score", "Show", "Score", "One score, built from 14 drivers.", "The total score runs from 0 to 100 and is the average of the", "14 equally-weighted drivers", ". The four levers group those drivers to make them easier to interpret; the total is not an average of the four lever scores.", "The four levers group the 14 drivers as 3 + 3 + 3 + 5, so Lever 4 accounts for 5 of the 14 drivers (36% of the total score).", "Tiers", "Four tiers, defined by score range.", "below 40", "60 and above", "Tier names describe score bands only. Countries within a few points of a cut-off (for example 49 and 50) are not meaningfully different.", "Gaps", "No data is not a low score.", "When a driver cannot be scored for a country it is shown as", "No data", ". It is not a zero: it is left out of averages and comparisons. Countries are compared with peers (income group, region, tier or countries you choose), not just a global league table.", "See the shades of progress.", "countries through the lens of the Index. Pick a score to recolour the map, select a country to open its profile and drivers, then sort, filter or search the ranking to see what is behind the numbers.", "Total score", "Map a single driver or indicator", "Or map a driver or indicator…", "Search countries", "Search a country…", "Region", "All regions", "Tier", "All tiers", "Income group", "All income groups", "Africa", "Asia Pacific", "Europe & Middle East", "Latin America", "North America", "Europe", "High Income", "Upper Middle Income", "Lower Middle Income", "Low Income", "High income", "Upper-middle income", "Lower-middle / low income", "Multi-country / global", "Reset", "Not in the Index", "Click a country to open its profile · drag to pan · Ctrl/⌘ + scroll to zoom", "Global snapshot", "Countries by tier", "Highest", "Lowest", "Select a country on the map or in the table to see its full profile.", "Country ranking", "Download data (CSV)", "Country", "Total", "Show all", "Download the full dataset", "All 54 economies: total score, tier, four lever scores, enabling and behaviour scores and the 14 driver scores (CSV).", "Download CSV ↓", "Ranked", "All countries", "Levers", "Show all 14 drivers", "Hide drivers", "Open full country analysis ↓", "Average of all countries", "Country Analysis", "Explore any of the 54 countries", "Pick a country to see how it scores on the four levers and fourteen drivers, and compare it with its tier, income group, region or any other country.", "Copy link", "Printable profile (PDF)", "Embed", "Link copied", "Code copied", "Average of the 14 equally-weighted drivers", "Rank", "Compare with", "Same income group", "Same tier", "Same region", "Global (all countries)", "Best in class (TBD)", "Another country…", "Country to compare", "Comparison group", "Selected country", "Global average", "Best in class", "(TBD · top 5 for now)", "Enabling conditions and behaviour", "Enabling conditions", "are the policies, rules and institutions that make an impact economy possible.", "Behaviour", "is what companies, investors, consumers and governments actually do. Each score averages the indicators of that type within each driver, then across drivers. It is a diagnostic view of the same indicators, not a separate score.", "Relative strengths", "Largest gaps", "All 14 drivers", "By lever", "Strengths", "Expand all", "Collapse all", "Drivers CSV", "Indicators CSV", "Select a driver to see its indicators, the facts behind each score and how it compares.", "Driver", "Description", "Value", "What explains the differences", "Where it leads", "More detail", "How to close the gap:", "Compare with chosen peers", "Driver scores side by side. Choose up to five countries.", "Quick picks", "Closest profile", "Clear", "Add a country", "Add a country…", "Peer avg", "Behind", "Ahead", "In line", "Countries with a similar lever profile", "Open full country profile ↗", "indicators have data ·", "Enabling", "Key impact model", "Not scored", "Details", "Methodology detail", "How to improve it", "What it measures", "How the score is derived", "Unit and calculation", "Data source", "Coverage and missing data", "Embed this country card", "on a National Partner or partner website. Copy the code below into the page.", "Copy code", "Preview card ↗", "Policies and practices behind the scores.", "Filter by country, stakeholder, driver, tier or region to see concrete examples of how countries are building the conditions for an impact economy.", "All", "Stakeholder", "Policymaker", "Investor", "Philanthropy & DFI", "Corporate", "Ecosystem builder", "Civil society & consumers", "Read the case →", "Read more →", "Working draft: first selection of case studies (November 2026). Tier is shown for countries in the 54-economy sample.", "Not scored in the Index", "Most useful for", "Region · income", "At a glance", "Where it shows up in the Index", "Source", "Open source ↗", "Report", "Get the full Impact Economy Index report.", "Methodology, country profiles and the findings behind the Index, in one document.", "Download the 2026 Report.", "Tell us a little about you. Takes ten seconds.", "First name", "Last name", "Work email", "Organisation", "I am a…", "Select", "Business", "Researcher", "Civil society", "Other", "Government", "I agree to GSG Impact contacting me about the Index.", "Download report", "Thank you!", "Your report is ready.", "Download the report", "In partnership with", "Partner logo", "The Impact Economy Index tracks how countries are building the conditions for an impact economy.", "Index", "Resources", "Download the methodology", "2026 Report", "Contact", "Press", "(TBC)", "Privacy policy", "See the full profile", "of", "score out of 100", "Draft data · GSG Impact", "Country not found. Use embed.html?c= followed by an ISO3 code, for example embed.html?c=ARG.", "its tier average", "its regional average", "its income-group average", "the all-country average", "the best-in-class group (top 5, provisional)", "Best in class (provisional): top 5 countries", "Tier average", "Region average", "Income group average", "Drivers", "Indicators", "English only", "Language", "Impact economies are taking shape.", "No country is thriving yet.", "The Impact Economy Index is the first framework to assess national economic systems. See where 54 countries stand across four levers, and where each can act next.", "What we mean by an impact economy", "In an impact economy, shared prosperity is driven by coordinated change across the whole economic system:", "Better information", "Long-term risks, costs and opportunities become visible.", "Demand signals impact", "Governments, businesses and consumers buy what creates value.", "Capital follows", "Funders make that demand investable and finance it.", "Coordination accelerates", "Institutions cut barriers, align incentives and set standards.", "Global Results", "Global results", "drivers and 38 indicators across 4 levers", "average score on a 1–100 scale", "Countries by maturity stage", "Nascent", "Emerging", "Early Developing", "Late Developing", "Thriving", "The four levers are measured through 14 drivers and 38 indicators, assessing the enabling conditions, behaviours and key impact models that underpin impact economies.", "Funders allocate capital for impact, and corporates operate using impact-oriented business models.", "Public and private organisations manage and account for the impact of their activities on people and the planet.", "Private investors report on, and are held accountable for, the impact of their portfolios", "Corporates shift procurement to impact-oriented products and services", "Governments procure for social and environmental value and outcomes", "Consumers make purchasing decisions informed by impact information", "Institutional investors fund inclusive growth", "Private investors scale impact financing instruments", "Governments allocate and catalyse capital for impact", "Philanthropic funders seed impact-driven markets", "Corporates produce goods and services with sustainable and inclusive business models and practices", "Institutional coordination supports reinforcing actions across the three levers.", "Governments align priorities through national impact platforms", "Specialised service providers are present and accessible to support impact-driven organisations", "Citizens engage on climate and social issues", "Four key messages from the 2026 Index. Where the evidence comes from the Index itself, it is calculated live from the country scores.", "Impact economies are taking shape, but no country is thriving yet.", "Every country assessed has begun to build an impact economy, yet none has reached the Thriving stage. Most Advanced countries are higher-income European economies, and all have room to strengthen the conditions and behaviours of a fully mature impact economy.", "Each dot is a country, coloured by maturity stage. Hover for the name.", "Foundations are ahead of approaches that direct capital to outcomes.", "Countries have built the transparency, accountability and integrity mechanisms that make impact credible faster than the approaches that actively direct capital and economic activity toward outcomes. The next step is to pair them with incentives that reward outcomes.", "Foundations", "Investor fiduciary duty and sustainability integration", "Directing capital and activity to outcomes", "Leading corporates’ environmental practices", "Foundations are the transparency, accountability and integrity mechanisms that make impact credible.", "Income is a strong predictor, but no guarantee.", "Scores tend to rise with income, but wide variation among high-income countries shows that wealth alone is not enough. Policy choices, institutional development and ecosystem-building can accelerate progress beyond what income would predict.", "Above income peers", "Below GDP-predicted score", "Stronger conditions go with higher-quality growth.", "Countries with higher Index scores tend to show stronger conditions for innovative, inclusive, sustainable and resilient growth, and perform better on the Social Progress Index and the Environmental Performance Index. The relationship is not fully linear.", "Above what social outcomes alone would predict", "Below the broader trendline", "Index scores compared with the Social Progress Index.", "Source: Impact Economy Index 2026 report. The Index measures conditions that may contribute to growth quality and social progress over time, not the outcomes themselves.", "One score from 14 drivers · six maturity stages · no data is not a low score", "Scores run from 1 to 100 against a fixed “plausible best” goal post: the best conditions that could realistically be observed today. The total is the average of the", "; lever scores are shown for interpretation only and are not an input to the total.", "The four levers group the 14 drivers as 3 + 3 + 5 + 3, so Capital Allocation & Deployment accounts for 5 of the 14 drivers (36% of the total score).", "Maturity stages", "Six maturity stages, defined by score range.", "Stages emphasise progress and maturity over relative ranking. Countries within a few points of a cut-off (for example 49 and 50) are not meaningfully different.", "Stage", "All stages", "All 54 economies: total score, maturity stage, four lever scores, enabling and behaviour scores and the 14 driver scores (CSV).", "Same stage", "Fossil fuel subsidy", "Density of impact-focused businesses", "Filter by country, stakeholder, driver, maturity stage or region to see concrete examples of how countries are building the conditions for an impact economy.", "Stage average", "its stage average", "Enabling condition", "Leading-edge impact model", "Presence of an Impact wholesaler", "Pick a country to see how it scores on the four levers and fourteen drivers, and compare it with its maturity stage, income group, region or any other country.", "Working draft: first selection of case studies (November 2026). Maturity stage is shown for countries in the 54-economy sample.", "Maturity stage", ". It is not a zero: it is left out of averages and comparisons. Countries are compared with peers (income group, region, maturity stage or countries you choose), not just a global league table.", "The Index connects a definition of an impact economy to the system changes required to achieve it.", "How the framework fits together", "Impact economy", "The conceptual anchor: the system the Index seeks to assess.", "The core system dimensions that must evolve for countries to transition toward an impact economy.", "The enabling conditions and behaviours, by stakeholder group, that advance each lever in practice.", "Measurable metrics that translate each driver into what the Index assesses: 35 scored indicators and 3 leading-edge impact models, recognised but not scored.", "Why does this lever have five drivers?", "Capital Allocation & Deployment covers five groups that direct capital: institutional investors, private investors, governments, philanthropic funders and corporates. The total is the average of the 14 drivers, not of the four levers, so every driver carries the same weight (about 7.1%). Weighting the levers equally would instead give each driver in the smaller levers more influence.", "Every indicator is first normalised to a common 1–100 scale against fixed goalposts: a floor and a “plausible best” ceiling set from external benchmarks or the observed frontier with headroom, not from the current best performer. This lets indicators measured in different units be combined, and keeps scores comparable over time.", "Select a layer to explore it.", "Hover a code to see what it measures; select it to see it on the map."];

  /* templates: [English pattern, template id, groups to translate] */
  var P = [
    [/^(\d+) drivers$/, 'drivers'], [/^(\d+) countries$/, 'countries'], [/^(\d+) case studies$/, 'cases'], [/^1 case study$/, 'case1'],
    [/^(\d+) cases?\. Select one for the full story and sources\.$/, 'casesSel'], [/^← Back to (\d+) cases?$/, 'back'],
    [/^(\d+) of (\d+) countries$/, 'nOfC'], [/^(\d+) of (\d+) case studies$/, 'nOfCs'], [/^(\d+) of (\d+)$/, 'nOf'], [/^of (\d+)$/, 'of'],
    [/^\+(\d+) more$/, 'more'], [/^Rank #(\d+) of (\d+) · comparison (\d+)$/, 'rankCmp'], [/^Rank #(\d+) of (\d+)$/, 'rank'],
    [/^([+−-]?\d+|±0) vs\. comparison \((\d+)\)$/, 'vsCmp'], [/^([+−-]?\d+|±0) vs\. average of all countries \((\d+)\)$/, 'vsAll'],
    [/^average across (\d+) countries$/, 'avgAcross'], [/^range (\d+)–(\d+)$/, 'range'], [/^Page (\d+) of (\d+)$/, 'page'], [/^All (\d+) countries shown$/, 'allShown'],
    [/^Lever (\d)$/, 'lever'], [/^Driver ([1-4]\.[A-E])$/, 'driver'], [/^Indicator ([1-4]\.[A-E]\.\d)$/, 'indicator'], [/^n = (\d+) · mean (\d+)$/, 'nMean'], [/^No country has reached the Thriving stage \(80 and above\); the highest score is (\d+)\.$/, 'noThriving'], [/^All (\d+) Advanced countries are high-income, yet high-income economies range from (\d+) to (\d+)\.$/, 'advIncome'], [/^Average indicator scores across (\d+) countries\.$/, 'avgInd'], [/^Stage average \((.+), (\d+)\)$/, 'stageAvg', [0]],
    [/^Learn from (.+)$/, 'learn', [0]], [/^Case studies to learn from$/, 'caseLearn'], [/^Also (.+)$/, 'also', [0]],
    [/^Total score by country \((\d)–100\)$/, 'mapTotal'], [/^Lever score by country \((\d)–100\)$/, 'mapLever'], [/^Driver score by country \((\d)–100\)$/, 'mapDriver'], [/^Indicator score by country \((\d)–100\)$/, 'mapIndicator'],
    [/^hatched = no data$/, 'hatched'], [/^Where it falls behind (.+)$/, 'behind', [0]],
    [/^The facts behind the biggest score gaps against (.+), and what would move them\. Open any driver in “All 14 drivers” to see every indicator\.$/, 'facts', [0]],
    [/^Darker blue means a higher driver score\. “Ahead” \/ “Behind” mark a gap of 5 points or more against (.+?); .+$/, 'darker', [0]],
    [/^Policy and regulatory frameworks are ahead of practice: enabling conditions score (\d+) points above behaviour\.$/, 'policyAhead'],
    [/^Practice is ahead of frameworks: behaviour scores (\d+) points above enabling conditions\.$/, 'practiceAhead'],
    [/^Frameworks and practice are broadly in step \(within 5 points\)\.$/, 'inStep'],
    [/^Enabling conditions and behaviour move together \(r = ([\d.]+)\), but in (\d+) of (\d+) countries policies are ahead of practice \(dots below the dashed line\)\.$/, 'scatter'],
    [/^High-income economies span the whole scale \((\d+–\d+)\); every income group has overlap\.$/, 'incomeSpan'],
    [/^(.+) is the weakest lever globally, (\d+) points behind the strongest\.$/, 'weakest', [0]],
    [/^Average lever score across (\d+) countries\.$/, 'avgLever'], [/^Average of all countries \((\d+)\)$/, 'avgAll'],
    [/^vs (.+)$/, 'vs', [0]],
    [/^Strong performance on average \(average score (\d+)\)$/, 'perfStrong'], [/^Moderate performance on average \(average score (\d+)\)$/, 'perfModerate'], [/^Weak performance on average \(average score (\d+)\)$/, 'perfWeak'],
    [/^Average score (\d+)$/, 'avgScore'],
    [/^ranks$/, 'ranks'], [/^of (\d+) with a total score of$/, 'withTotal'],
    [/^Relative to (.+), its strongest lever is$/, 'relStrongest', [0]], [/^It sits below (.+) on every lever: the smallest gap is on$/, 'belowAll', [0]],
    [/^It is at or above (.+) on every lever, strongest on$/, 'aboveAll', [0]], [/^Its levers are in line with (.+)\.$/, 'inLine', [0]],
    [/^\(([+−-]?\d+|±0)\) and its largest gap is$/, 'largestGap'], [/^\(([+−-]?\d+|±0)\) and the largest on$/, 'largestOn'], [/^\(([+−-]?\d+|±0)\) and narrowest on$/, 'narrowestOn']
  ];

  var E = {}, PFX = {}, FIX = [];
  if (PK) {
    K.forEach(function (k, i) { var v = PK.d[i]; if (v) E[k] = v; });
    if (E['Leading corporates’ social practices']) E["Leading corporates' social practices"] = E['Leading corporates’ social practices'];
    var D = window.IEI_DATA, names = {};
    if (D) D.countries.forEach(function (c) { names[c.id] = c.name; });
        Object.keys(PK.c || {}).forEach(function (k) { if (names[k]) E[names[k]] = PK.c[k]; });
    if (PK.c && PK.c.TUR) E['Türkiye'] = PK.c.TUR;
    if (PK.c && PK.c.KOR) E['South Korea'] = PK.c.KOR;
    Object.keys(E).forEach(function (k) {
      var m = k.match(/^(.*) \(e\.g\..*\)$/); if (m && !E[m[1]]) E[m[1]] = E[k].replace(/\s*[（(][^()（）]*[)）]\s*$/, '');
      if (k.length > 70) PFX[k.slice(0, 60)] = k;
    });
    FIX = (PK.fix || []).map(function (f) { return [new RegExp(f[0], 'g'), f[1]]; });
  }
  function ex(s) { return E[s] || null; }
  function fill(t, a) { return t.replace(/\{(\d)\}/g, function (_, i) { return a[+i] == null ? '' : a[+i]; }); }
  function fix(o) { FIX.forEach(function (f) { o = o.replace(f[0], f[1]); }); return o; }
  function low(s) { try { return s.toLocaleLowerCase(lang); } catch (e) { return s.toLowerCase(); } }

  function tr(s) {
    if (!PK || s == null) return null;
    var e = ex(s); if (e) return e;
    if (s.length > 70 && PFX[s.slice(0, 60)]) return ex(PFX[s.slice(0, 60)]);
    var T = PK.t || {}, m, i;
    m = s.match(/^Showing (\d+–\d+|0) of (\d+)( \(filtered from (\d+)\))? countries · sorted by (.+)$/);
    if (m && T.showing) { var tb = tr(m[5].charAt(0).toUpperCase() + m[5].slice(1)); return fix(fill(T.showing, [m[1], m[2], m[4] && T.filtered ? fill(T.filtered, [m[4]]) : '', tb ? low(tb) : m[5]])); }
    m = s.match(/^Lever (\d) · (\d+%)$/); if (m && T.lever) return fill(T.lever, [m[1]]) + ' · ' + m[2];
    for (i = 0; i < P.length; i++) {
      m = s.match(P[i][0]);
      if (m && T[P[i][1]] != null) {
        var g = m.slice(1);
        (P[i][2] || []).forEach(function (j) { g[j] = tr(g[j]) || g[j]; });
        return fix(fill(T[P[i][1]], g));
      }
    }
    m = s.match(/^(\d[ab]?)\. ([A-Z][A-Za-z ]+)$/); if (m && ex(m[2])) return m[1] + '. ' + ex(m[2]);
    m = s.match(/^\(([A-Za-z ]+)\)\. (.+)$/); if (m) return fill(T.tierParen || '({0}). {1}', [tr(m[1]) || m[1], (function (x) { return x.charAt(0).toLocaleUpperCase(lang) + x.slice(1); })(tr(m[2]) || m[2])]);
    m = s.match(/^([A-Z][A-Za-z .&’'-]+): (.+)$/); if (m && ex(m[1])) { var r2 = tr(m[2]); if (r2) return ex(m[1]) + ': ' + r2; }
    if (s.indexOf(' · ') > 0) {
      var parts = s.split(' · '), changed = false;
      parts = parts.map(function (p) { var t = tr(p); if (t) { changed = true; return t; } return p; });
      if (changed) return parts.join(' · ');
    }
    return null;
  }
  window.IEI_T = function (s) { return tr(s) || s; };

  /* fonts for non-Latin scripts: their glyph subsets are registered under the "Urbanist" name, so every existing rule picks them up */
  function fonts() {
    if (!META[2]) return;
    var url = 'https://fonts.googleapis.com/css2?family=' + META[2].replace(/ /g, '+') + ':wght@400;500;600;700;800&display=swap';
    fetch(url).then(function (r) { if (!r.ok) throw 0; return r.text(); }).then(function (css) {
      var out = css.split('@font-face').slice(1).map(function (b) { return '@font-face' + b; }).filter(function (b) {
        var r = b.match(/unicode-range:\s*U\+([0-9A-F]+)/i); return r && parseInt(r[1], 16) >= 0x370;
      }).map(function (b) { return b.replace(/font-family:\s*'[^']+'/, "font-family:'Urbanist'"); }).join('\n');
      var st = document.createElement('style'); st.textContent = out; document.head.appendChild(st);
    }).catch(function () {
      var l = document.createElement('link'); l.rel = 'stylesheet'; l.href = url; document.head.appendChild(l);
      var st = document.createElement('style'); st.textContent = 'body{font-family:"Urbanist","' + META[2] + '",sans-serif}'; document.head.appendChild(st);
    });
  }

  /* DOM translation (English content zones stay untouched) */
  var KEEP = '.cs-card h3,.cs-card>p,.cp-card b,.cp-b,.cp-text,.cp-glance p,.cp-src p,.cp-cap,.cp-credit,.ic-ival,.ic-gaps li>p,.ic-gact,.icm-body p,.icm-body li,.icm-body dd,.icm-body td,.icm-body code,script,style,noscript,textarea';
  var OK_IN_KEEP = /^\s*((Strong|Moderate|Weak) performance on average \(average score \d+\)|Average score \d+)\s*$/;
  function trNode(n) {
    var el = n.parentElement; if (!el) return;
    if (el.closest(KEEP) && !(el.tagName === 'I' && el.closest('.ic-gact')) && !OK_IN_KEEP.test(n.__en != null ? n.__en : n.nodeValue)) return;
    if (el.closest('.cp-head') && el.tagName === 'H3' && document.querySelector('.cp-detail')) return;
    var raw = n.__en != null ? n.__en : n.nodeValue, t = raw.replace(/\s+/g, ' ').trim();
    if (!t || /^[\d\s.,%+−\-–#/:·()×→↓↑←✓±]+$/.test(t)) return;
    var x = tr(t);
    if (x != null && x !== t) { if (n.__en == null) n.__en = raw; var lead = raw.match(/^\s*/)[0], tail = raw.match(/\s*$/)[0]; n.nodeValue = lead + x + tail; }
  }
  function walk(root) {
    if (!root) return;
    if (root.nodeType === 3) { trNode(root); return; }
    if (root.nodeType !== 1) return;
    var w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT), n; while ((n = w.nextNode())) trNode(n);
    var els = root.querySelectorAll ? root.querySelectorAll('[placeholder],optgroup[label]') : [];
    Array.prototype.forEach.call(els, function (e) {
      ['placeholder', 'label'].forEach(function (a) { var v = e.getAttribute(a); if (!v) return; if (e['__en_' + a] == null) e['__en_' + a] = v; var x = tr(e['__en_' + a]); if (x) e.setAttribute(a, x); });
    });
  }

  function switcher() {
    var ul = document.getElementById('sLinks'); if (!ul || ul.querySelector('.s-lang')) return;
    var li = document.createElement('li'); li.className = 's-lang';
    li.innerHTML = '<label title="' + (ex('Language') || 'Language') + '"><svg class="s-lang-ic" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9.2"/><path d="M2.8 12h18.4M12 2.8c2.6 2.6 3.9 5.6 3.9 9.2s-1.3 6.6-3.9 9.2M12 2.8C9.4 5.4 8.1 8.4 8.1 12s1.3 6.6 3.9 9.2"/></svg><span class="s-sr">' + (ex('Language') || 'Language') + '</span><select aria-label="Language">' + LANGS.map(function (o) {
      var code = o[0] === 'zh-Hans' ? 'ZH' : o[0] === 'zh-Hant' ? 'ZH-TW' : o[0].toUpperCase();
      return '<option value="' + o[0] + '" lang="' + o[0] + '"' + (o[0] === lang ? ' selected' : '') + '>' + code + ' · ' + o[1] + '</option>';
    }).join('') + '</select></label>';
    ul.appendChild(li);
    li.querySelector('select').addEventListener('change', function (e) {
      var v = e.target.value; try { localStorage.setItem('iei-lang', v); } catch (er) { }
      var u = new URL(location.href); if (v === 'en') u.searchParams.delete('lang'); else u.searchParams.set('lang', v); location.href = u.toString();
    });
  }
  function notice() {
    if (!PK || !PK.note) return;
    ['#ieiCases', '#ieiCountry'].forEach(function (sel) { var r = document.querySelector(sel); if (r && !r.parentNode.querySelector('.s-langnote')) { var p = document.createElement('p'); p.className = 's-langnote'; p.textContent = PK.note; r.parentNode.insertBefore(p, r); } });
  }

  function run() {
    document.documentElement.lang = lang;
    if (META[3]) document.documentElement.classList.add('iei-rtl');
    switcher();
    if (!PK) return;
    fonts(); notice(); walk(document.body);
    var busy = false;
    new MutationObserver(function (muts) {
      if (busy) return; busy = true;
      muts.forEach(function (m) {
        if (m.type === 'characterData') { var n = m.target; if (n.__en != null && n.nodeValue !== n.__en) n.__en = null; trNode(n); }
        else Array.prototype.forEach.call(m.addedNodes, walk);
      });
      busy = false;
    }).observe(document.body, { childList: true, subtree: true, characterData: true });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run); else setTimeout(run, 0);
})();
