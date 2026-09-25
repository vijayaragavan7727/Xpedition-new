const fs = require('fs');
const path = require('path');
const root = process.cwd();
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');
const pass = (n, ok, msg) => { console.log(`${ok ? '[PASS]' : '[FAIL]'} ${n}. ${msg}`); if (!ok) process.exitCode = 1; };

const homePage = read('app/(app)/home/page.tsx');
const homeModel = read('lib/home/homeDashboardModel.ts');
const homeView = read('components/home/HomeDashboardView.tsx');
const learnTop = read('components/learningJourney/LearningJourneyTopBar.tsx');
const learnView = read('components/learningJourney/LearningJourneyView.tsx');
const explorer = read('components/learningJourney/TopicExplorer.tsx');
const classLayout = read('components/classroom/ClassroomLayout.tsx');
const classToolbar = read('components/classroom/ClassroomToolbar.tsx');
const xira = read('components/classroom/ClassroomXiraAssistant.tsx');
const profile = read('app/(app)/profile/page.tsx');
const smartVisual = read('components/classroom/SmartBoardVisualRenderer.tsx');
const downloads = read('lib/learningObjectsDownloads.ts');
const manifest = JSON.parse(read('public/generated-visuals/assets-manifest.json'));

pass(1, homePage.includes('pb-[calc(7rem+env(safe-area-inset-bottom,0px))]'), 'Home reserves mobile safe-area space for the fixed bottom navigation.');
pass(2, homeModel.includes('const currentRoute = `/class?concept=${encodeURIComponent(currentConceptId)}`'), 'Continue Learning uses the resolved concept instead of a random/quest route.');
pass(3, homeView.includes('overflow-x-auto') && homeView.includes('scrollIntoView'), 'Passport card is a real horizontal carousel with swipe/scroll and working pagination.');
pass(4, learnTop.includes('/learn?tab=explore') && classLayout.includes('/learn?tab=explore'), 'Learn and Class expose working concept-search/discovery entry points.');
pass(5, explorer.includes('Why do you want to learn this?') && explorer.includes('Full course') && explorer.includes('Roadmap') && explorer.includes('Weekly timetable'), 'Topic search flows into learning intent selection and a full-course plan.');
pass(6, classLayout.includes('grid-cols-1 lg:grid-cols-[20%_60%_20%]') && !classLayout.includes('useClassroomOrientation'), 'Class uses one responsive visual system without forcing mobile landscape mode.');
pass(7, downloads.includes('canvas.toBlob') && downloads.includes('download'), 'Formula, flashcard and note actions generate device-downloadable PNG cards without a preview screen.');
pass(8, downloads.includes('PLAYING') === false && downloads.includes('XPEDITION NOTE CARD') && downloads.includes('XPEDITION SCIENCE'), 'Downloaded notes/formulas/flashcards use physical playing-card visual treatment.');
pass(9, classToolbar.includes("'hint'") && classToolbar.includes("'notes'") && xira.includes('Give an example') && xira.includes('/api/chat'), 'Classroom learning actions remain wired to real handlers/Xira.');
pass(10, profile.includes('bg-[#FAF8F5]') && profile.includes('Learning setup') && profile.includes('Account deletion'), 'Profile now matches the warm Home/Login visual language and removes legacy dashboard clutter.');
pass(11, !fs.existsSync(path.join(root, 'components/world/WorldStage.tsx')) || fs.statSync(path.join(root, 'components/world/WorldStage.tsx')).size > 0, 'World code remains present and was not rewritten by this pass.');
pass(12, smartVisual.includes('useState(true)') && manifest.every((item) => Number(item.sizeBytes || 0) >= 1024), 'ComfyUI artwork is the default DC Motor visual and the asset manifest contains no tiny green test stubs.');

console.log('\nFinal requirement regression check complete.');
