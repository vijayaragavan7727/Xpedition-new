/**
 * The Industrial Revolution — authored History lesson.
 *
 * Smart Board visual: deterministic chronological timeline (TimelineRenderer)
 * driven by the lesson-level `visualData.milestones` below. Each step
 * highlights the milestones it discusses via `visualData.highlight`.
 */

import type { ClassroomLesson } from '@/components/classroom/types';

export interface TimelineMilestone {
  id: string;
  year: string;
  title: string;
  desc: string;
}

export const INDUSTRIAL_REVOLUTION_MILESTONES: TimelineMilestone[] = [
  { id: 'newcomen', year: '1712', title: 'Newcomen Engine', desc: 'Atmospheric steam engine pumps water out of mines.' },
  { id: 'jenny', year: 'c. 1764', title: 'Spinning Jenny', desc: 'Hargreaves’ machine spins many threads at once.' },
  { id: 'watt', year: '1769', title: 'Watt’s Condenser', desc: 'Separate condenser makes steam engines far more efficient.' },
  { id: 'cromford', year: '1771', title: 'Cromford Mill', desc: 'Arkwright’s water-powered cotton mill, an early factory.' },
  { id: 'loom', year: '1785', title: 'Power Loom', desc: 'Cartwright patents a mechanised loom.' },
  { id: 'stockton', year: '1825', title: 'Stockton & Darlington', desc: 'First public railway to use steam locomotives.' },
  { id: 'lmr', year: '1830', title: 'Liverpool & Manchester', desc: 'First inter-city steam railway.' },
  { id: 'factory_act', year: '1833', title: 'Factory Act', desc: 'Limits child labour in textile mills and creates inspectors.' },
  { id: 'bessemer', year: '1856', title: 'Bessemer Process', desc: 'Cheap mass production of steel.' },
];

export const INDUSTRIAL_REVOLUTION_LESSON: ClassroomLesson = {
  id: 'lesson_industrial_revolution',
  conceptId: 'industrial_revolution',
  topicTitle: 'The Industrial Revolution',
  subject: 'History',
  category: 'Modern World History',
  gradeLevel: 'Secondary School History',
  estimatedMinutes: 10,
  hasFormulas: false,
  learningObjective:
    'Describe the chronological development of the Industrial Revolution, explain how mechanisation, steam power and factories transformed production, and evaluate its social and economic effects.',
  visualData: { milestones: INDUSTRIAL_REVOLUTION_MILESTONES },
  steps: [
    {
      id: 'step_1_ir_intro',
      stepNumber: 1,
      stage: 'introduce',
      title: 'From Workshop to Factory',
      subtitle: 'A Revolution in Making Things',
      buddyDialogue:
        'Around 1760, Britain began changing how goods were made: from hand tools at home to machines in factories. Let us follow it along the timeline.',
      buddyState: 'INTRODUCING',
      boardTitle: 'From Hand Tools to Machines',
      boardSummary:
        'Beginning in Britain in the mid-1700s, the Industrial Revolution moved production from hand tools and home workshops to machines, factories and new sources of power.',
      keyPrinciple:
        'Historians usually date the first Industrial Revolution to roughly 1760–1840. It began in Britain, then spread to Europe and North America.',
      visualType: 'timeline',
      visualData: { highlight: ['newcomen', 'jenny', 'watt'] },
      tryThis: 'Scan the timeline. Which invention comes first, and what problem was it built to solve?',
      hintText: 'Read the timeline from left to right. The earliest date is on the left.',
    },
    {
      id: 'step_2_ir_why_britain',
      stepNumber: 2,
      stage: 'explain',
      title: 'Why Britain First?',
      subtitle: 'Resources, Capital and Markets',
      buddyDialogue:
        'Why Britain? It had coal and iron, money from trade, a growing workforce, and markets hungry for goods. Coal was especially important because it fuelled steam engines.',
      buddyState: 'EXPLAINING',
      boardTitle: 'Why It Started in Britain',
      boardSummary:
        'Britain combined large coal and iron deposits, capital from overseas trade, a growing population, access to colonial markets and a culture of practical invention.',
      keyPrinciple:
        'Agricultural improvements produced more food with fewer workers, freeing labour for towns. Rivers, canals and ports moved raw materials and finished goods.',
      visualType: 'timeline',
      visualData: { highlight: ['newcomen', 'watt'] },
      checkQuestion: {
        id: 'q_ir_step_coal',
        prompt: 'Which resource was most important for powering steam engines in early industrial Britain?',
        options: [
          { id: 'ir_a1', text: 'Coal', isCorrect: true, feedback: 'Correct. Britain’s abundant coal fuelled steam engines and iron-making.' },
          { id: 'ir_a2', text: 'Oil', isCorrect: false, feedback: 'Oil became important much later, in the late nineteenth and twentieth centuries.' },
          { id: 'ir_a3', text: 'Electricity', isCorrect: false, feedback: 'Electric power spread in the late nineteenth century, part of the second industrial wave.' },
          { id: 'ir_a4', text: 'Natural gas', isCorrect: false, feedback: 'Coal gas was used for lighting, but coal itself powered the engines.' },
        ],
      },
      tryThis: 'List two factors that made Britain a likely starting point, then check them against the board.',
      commonMistake:
        'The Industrial Revolution did not have a single cause. Several conditions came together.',
      hintText: 'What did steam engines burn?',
    },
    {
      id: 'step_3_ir_mechanisation',
      stepNumber: 3,
      stage: 'show',
      title: 'Machines & Mechanisation',
      subtitle: 'Textiles and Steam',
      buddyDialogue:
        'Textiles were mechanised first. The spinning jenny, Arkwright’s mill and the power loom made cloth faster than any hand worker could. Watt’s improved steam engine then freed factories from rivers.',
      buddyState: 'EXPLAINING',
      boardTitle: 'Textiles Mechanise First',
      boardSummary:
        'The spinning jenny (c. 1764), Arkwright’s water-powered Cromford Mill (1771) and Cartwright’s power loom (1785) transformed cloth-making.',
      keyPrinciple:
        'Watt’s separate condenser (patented 1769) made steam engines far more efficient. Steam-powered factories no longer had to be built beside fast-flowing rivers.',
      visualType: 'timeline',
      visualData: { highlight: ['jenny', 'watt', 'cromford', 'loom'] },
      tryThis: 'Put the three textile milestones in order on the timeline, then say what each one automated.',
      hintText: 'Spinning makes thread; weaving makes cloth from thread.',
    },
    {
      id: 'step_4_ir_transport',
      stepNumber: 4,
      stage: 'interact',
      title: 'Railways & Industrial Cities',
      subtitle: 'Moving Goods and People',
      buddyDialogue:
        'Steam locomotives changed transport. Railways moved coal, goods and people faster and cheaper than canals, and factory towns grew fast around them.',
      buddyState: 'ENCOURAGING',
      boardTitle: 'Railways and Rapid Urbanisation',
      boardSummary:
        'The Stockton & Darlington Railway (1825) and the Liverpool & Manchester Railway (1830) showed that steam railways could carry goods and passengers at scale.',
      keyPrinciple:
        'Factories drew workers from the countryside. Towns such as Manchester grew rapidly, often with crowded housing and poor sanitation.',
      visualType: 'timeline',
      visualData: { highlight: ['stockton', 'lmr'] },
      checkQuestion: {
        id: 'q_ir_step_order',
        prompt: 'Which of these came first?',
        options: [
          { id: 'ir_b1', text: 'Watt’s separate condenser', isCorrect: true, feedback: 'Correct. Watt patented it in 1769, decades before the railways.' },
          { id: 'ir_b2', text: 'The Liverpool & Manchester Railway', isCorrect: false, feedback: 'That opened in 1830.' },
          { id: 'ir_b3', text: 'The Factory Act', isCorrect: false, feedback: 'That was passed in 1833.' },
          { id: 'ir_b4', text: 'The Bessemer process', isCorrect: false, feedback: 'Bessemer patented it in 1856.' },
        ],
      },
      tryThis: 'How many years separate Watt’s condenser and the first inter-city steam railway?',
      commonMistake:
        'The Industrial Revolution was not one invention or one year. It was a process that unfolded over decades.',
      hintText: 'Compare the years on the timeline.',
    },
    {
      id: 'step_5_ir_effects',
      stepNumber: 5,
      stage: 'practice',
      title: 'Social & Economic Effects',
      subtitle: 'Winners, Losers and Reform',
      buddyDialogue:
        'Industrialisation made far more goods, but early factory work was harsh: long hours, dangerous machines and child labour. Reformers pushed back.',
      buddyState: 'THINKING',
      boardTitle: 'Costs, Gains and Reform',
      boardSummary:
        'Output rose and, over the long run, living standards improved. Early factory workers, including children, faced long hours, dangerous machinery and low pay.',
      keyPrinciple:
        'Reform followed. Britain’s Factory Act of 1833 restricted the working hours of children in textile mills and appointed factory inspectors to enforce the rules.',
      visualType: 'timeline',
      visualData: { highlight: ['factory_act'] },
      checkQuestion: {
        id: 'q_ir_step_factory_act',
        prompt: 'What did Britain’s Factory Act of 1833 do?',
        options: [
          { id: 'ir_c1', text: 'Restricted children’s working hours in textile mills and created factory inspectors', isCorrect: true, feedback: 'Correct. It was an early step in regulating industrial labour.' },
          { id: 'ir_c2', text: 'Banned all factory work', isCorrect: false, feedback: 'Factories kept operating. The Act regulated conditions.' },
          { id: 'ir_c3', text: 'Gave all factory workers the vote', isCorrect: false, feedback: 'Voting reform was separate and came gradually over the century.' },
          { id: 'ir_c4', text: 'Nationalised the railways', isCorrect: false, feedback: 'British railways were privately owned in this period.' },
        ],
      },
      tryThis: 'Weigh one economic gain against one social cost of early industrialisation.',
      commonMistake:
        'Effects were not all positive or all negative. Historians weigh long-term gains against severe short-term hardship.',
      hintText: 'Focus on who the Act protected.',
    },
    {
      id: 'step_6_ir_legacy',
      stepNumber: 6,
      stage: 'reward',
      title: 'A Second Industrial Wave',
      subtitle: 'Steel, Chemicals and Electricity',
      buddyDialogue:
        'Well done! From about 1870 a second wave of steel, chemicals and electricity pushed industrialisation further. Its effects still shape how we live and work today.',
      buddyState: 'CELEBRATING',
      boardTitle: 'Legacy of Industrialisation',
      boardSummary:
        'Cheap steel from the Bessemer process (1856), then chemicals, electricity and oil, drove a second industrial revolution from around 1870.',
      keyPrinciple:
        'Industrialisation changed where people lived, how they worked and how economies grew, and its effects still shape the modern world.',
      visualType: 'timeline',
      visualData: { highlight: ['bessemer'] },
      tryThis: 'Explain one long-term effect of industrialisation that you can still see today.',
      hintText: 'Think about cities, factories and transport around you.',
    },
  ],
  questions: [
    {
      id: 'q_ir_1',
      lessonId: 'lesson_industrial_revolution',
      conceptId: 'industrial_revolution',
      prompt: 'In which country did the first Industrial Revolution begin?',
      type: 'multiple_choice',
      difficulty: 'EASY',
      options: [
        { id: 'q_ir_1a', text: 'Britain', isCorrect: true, feedback: 'Correct.' },
        { id: 'q_ir_1b', text: 'France', isCorrect: false, feedback: 'France industrialised later and more gradually.' },
        { id: 'q_ir_1c', text: 'The United States', isCorrect: false, feedback: 'The US industrialised rapidly in the nineteenth century, after Britain.' },
      ],
      explanation: 'The first Industrial Revolution began in Britain in the mid-eighteenth century.',
      misconceptionTag: 'origin_country',
      hint: {
        id: 'hint_ir_1',
        conceptId: 'industrial_revolution',
        hints: ['Where were the Newcomen and Watt engines built?', 'Cromford Mill is in Derbyshire.', 'It began in Britain.'],
      },
    },
    {
      id: 'q_ir_2',
      lessonId: 'lesson_industrial_revolution',
      conceptId: 'industrial_revolution',
      prompt: 'Why did Watt’s improved steam engine matter for where factories were built?',
      type: 'conceptual',
      difficulty: 'MEDIUM',
      options: [
        { id: 'q_ir_2a', text: 'Factories no longer had to sit beside fast-flowing rivers for water power', isCorrect: true, feedback: 'Correct. Efficient steam power let factories locate near coal, workers and markets.' },
        { id: 'q_ir_2b', text: 'It allowed factories to run on electricity', isCorrect: false, feedback: 'Electric power came much later.' },
        { id: 'q_ir_2c', text: 'It removed the need for workers', isCorrect: false, feedback: 'Factories still needed large workforces.' },
      ],
      explanation: 'Early mills relied on water wheels. Efficient steam engines freed factories to be built in towns.',
      misconceptionTag: 'water_to_steam_location',
      hint: {
        id: 'hint_ir_2',
        conceptId: 'industrial_revolution',
        hints: ['What powered Cromford Mill?', 'Water power ties a mill to a river.', 'Steam power removed that constraint.'],
      },
    },
    {
      id: 'q_ir_3',
      lessonId: 'lesson_industrial_revolution',
      conceptId: 'industrial_revolution',
      prompt: 'Which statement best describes the social effects of early industrialisation?',
      type: 'conceptual',
      difficulty: 'HARD',
      options: [
        { id: 'q_ir_3a', text: 'Output grew, but many workers faced long hours, unsafe conditions and crowded towns, which led to reforms', isCorrect: true, feedback: 'Correct. A balanced judgement recognises both gains and hardships.' },
        { id: 'q_ir_3b', text: 'Living conditions improved immediately for everyone', isCorrect: false, feedback: 'Early urban conditions were often very poor.' },
        { id: 'q_ir_3c', text: 'It had no effect on where people lived', isCorrect: false, feedback: 'It drove rapid urbanisation.' },
      ],
      explanation: 'Industrialisation brought long-run economic growth alongside severe early hardships, prompting reforms such as the 1833 Factory Act.',
      misconceptionTag: 'one_sided_effects',
      hint: {
        id: 'hint_ir_3',
        conceptId: 'industrial_revolution',
        hints: ['Consider both economic gains and social costs.', 'What did reformers respond to?', 'The best answer is balanced.'],
      },
    },
  ],
  flashcards: [
    { id: 'fc_ir_1', conceptId: 'industrial_revolution', front: 'When and where did the first Industrial Revolution begin?', back: 'Britain, roughly 1760–1840.', category: 'Chronology' },
    { id: 'fc_ir_2', conceptId: 'industrial_revolution', front: 'Watt’s separate condenser (1769)', back: 'Made steam engines far more efficient, so factories could run on steam instead of water power.', category: 'Technology' },
    { id: 'fc_ir_3', conceptId: 'industrial_revolution', front: 'Liverpool & Manchester Railway', back: 'Opened 1830: the first inter-city steam railway.', category: 'Transport' },
    { id: 'fc_ir_4', conceptId: 'industrial_revolution', front: 'Factory Act 1833', back: 'Restricted child labour in textile mills and created factory inspectors.', category: 'Reform' },
  ],
  sources: [
    {
      id: 'src_ir_1',
      title: 'The Industrial Revolution (overview)',
      authorOrPublisher: 'UK National Archives, Education Service',
      url: 'https://www.nationalarchives.gov.uk/education/',
      type: 'curriculum',
      note: 'Primary-source classroom resources on industrial Britain.',
    },
    {
      id: 'src_ir_2',
      title: 'Factory Act 1833',
      authorOrPublisher: 'UK Parliament: Living Heritage',
      url: 'https://www.parliament.uk/about/living-heritage/transformingsociety/livinglearning/19thcentury/overview/factoryact/',
      type: 'curriculum',
      note: 'Parliament’s account of the 1833 Act and factory inspection.',
    },
  ],
  initialNotes:
    'Industrial Revolution Notes:\n• Began in Britain c. 1760–1840.\n• Textiles mechanised first; Watt’s condenser 1769.\n• Railways: 1825 Stockton & Darlington, 1830 Liverpool & Manchester.\n• Effects: urbanisation, child labour → Factory Act 1833.',
  buddyScript: {
    introduction: 'Welcome to the Industrial Revolution. We will follow how machines, steam and factories changed the way people lived and worked.',
    revisionIntroduction:
      'Revision: the Industrial Revolution. Recall the key dates, the inventions, the railways and the social effects, then test your timeline knowledge.',
    correct: 'Correct! Your chronology and reasoning are spot on.',
    incorrect: 'Not quite. Check the dates on the timeline and think about cause and effect.',
    hint: 'Use the timeline: earlier events sit to the left.',
    transition: 'Good. Let us move forward in time.',
    completion: 'Excellent! You can place the key developments in order and weigh their economic and social effects.',
  },
  xiraPrompts: {
    why: 'Why did the Industrial Revolution begin in Britain?',
    simpler: 'Explain the Industrial Revolution in the simplest possible terms.',
    example: 'Give me an example of how industrialisation changed daily life.',
    hint: 'Give me a hint for ordering these events on the timeline.',
    deeper: 'How do historians debate whether living standards rose or fell in early industrial Britain?',
  },
};
