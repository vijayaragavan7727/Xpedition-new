/**
 * Polymorphism — authored Computer Science / OOP lesson.
 *
 * Smart Board visual: deterministic dynamic-dispatch code visualiser
 * (components/classroom/visuals/PolymorphismDispatchRenderer.tsx). The code shown
 * on the board is the same TypeScript used in these steps.
 */

import type { ClassroomLesson } from '@/components/classroom/types';

export const POLYMORPHISM_LESSON: ClassroomLesson = {
  id: 'lesson_polymorphism',
  conceptId: 'polymorphism',
  topicTitle: 'Polymorphism & Dynamic Dispatch',
  subject: 'Programming',
  category: 'Object-Oriented Programming',
  gradeLevel: 'Introductory Programming (CS1/CS2)',
  estimatedMinutes: 9,
  hasFormulas: false,
  learningObjective:
    'Explain how a shared interface lets one call such as shape.area() run different implementations, and predict which implementation runs through dynamic dispatch.',
  steps: [
    {
      id: 'step_1_poly_intro',
      stepNumber: 1,
      stage: 'introduce',
      title: 'One Call, Many Behaviours',
      subtitle: 'What Polymorphism Means',
      buddyDialogue:
        'Polymorphism means "many forms". One line of code, shape.area(), can do different work depending on which object it is given. Let us see it happen on the board.',
      buddyState: 'INTRODUCING',
      boardTitle: 'Same Call, Different Behaviour',
      boardSummary:
        'Polymorphism lets code call the same method on different objects and get behaviour specific to each object’s type.',
      keyPrinciple:
        'Code is written against a shared contract (an interface or base class). Each implementation fulfils that contract in its own way.',
      visualType: 'code_visual',
      visualData: { focus: 'overview' },
      example: {
        title: 'Everyday Analogy',
        description:
          'A "Play" button works on a song, a video or a podcast. You press the same button, and each media type plays in its own way.',
      },
      tryThis: 'On the board, switch the runtime object between Circle, Rectangle and Triangle. Watch which area() runs.',
      hintText: 'Focus on the single call inside the loop. It never changes, but the output does.',
    },
    {
      id: 'step_2_poly_contract',
      stepNumber: 2,
      stage: 'explain',
      title: 'The Shared Contract',
      subtitle: 'Interfaces Define What, Not How',
      buddyDialogue:
        'The Shape interface is a promise: anything that is a Shape can report its area. It says what must exist, not how to compute it.',
      buddyState: 'EXPLAINING',
      boardTitle: 'Interfaces Define What, Not How',
      boardSummary:
        'An interface lists method signatures without bodies. `interface Shape { area(): number }` says every shape can report its area as a number.',
      keyPrinciple:
        'Callers depend on the interface, not on concrete classes: "program to an interface, not an implementation".',
      visualType: 'code_visual',
      visualData: { focus: 'interface' },
      tryThis: 'Read the Shape interface on the board. What must every class that implements it provide?',
      hintText: 'Look for the method name, its parameters and its return type.',
    },
    {
      id: 'step_3_poly_implementations',
      stepNumber: 3,
      stage: 'show',
      title: 'Many Implementations',
      subtitle: 'Same Signature, Different Bodies',
      buddyDialogue:
        'Circle, Rectangle and Triangle all implement Shape. Same method name, same signature, but each area() uses its own formula.',
      predict: {
        dialogue:
          'Circle, Rectangle and Triangle all implement Shape, and each area() uses its own formula. Compare the three methods on the board: what has to stay identical so code written for Shape can call any of them?',
      },
      buddyState: 'EXPLAINING',
      boardTitle: 'Three Classes, One Contract',
      boardSummary:
        'Each class implements area() differently: Circle uses π·r², Rectangle uses w·h and Triangle uses ½·b·h.',
      keyPrinciple:
        'Implementations must match the contract’s signature exactly (name, parameters, return type). Only the body differs.',
      visualType: 'code_visual',
      visualData: { focus: 'implementations' },
      checkQuestion: {
        id: 'q_poly_step_signature',
        prompt: 'Circle, Rectangle and Triangle all implement Shape. What must be the same in all three area() methods?',
        options: [
          { id: 'poly_a1', text: 'The method name and signature', isCorrect: true, feedback: 'Correct. The contract fixes the name, parameters and return type. The body is free.' },
          { id: 'poly_a2', text: 'The formula inside the method', isCorrect: false, feedback: 'The formulas differ. That is the point of polymorphism.' },
          { id: 'poly_a3', text: 'The number of lines of code', isCorrect: false, feedback: 'Length does not matter. Only the signature is part of the contract.' },
          { id: 'poly_a4', text: 'The class name', isCorrect: false, feedback: 'Each class has its own name. They share the interface, not the name.' },
        ],
      },
      tryThis: 'Compare the three area() bodies on the board. Which parts are identical, and which differ?',
      commonMistake:
        'Implementing an interface does not copy behaviour. Each class must supply its own method body.',
      hintText: 'What does the interface itself specify?',
    },
    {
      id: 'step_4_poly_dispatch',
      stepNumber: 4,
      stage: 'interact',
      title: 'Dynamic Dispatch',
      subtitle: 'Decided at Runtime',
      buddyDialogue:
        'Here is the key idea. The variable is typed as Shape, but at runtime the program looks at the actual object and calls that class’s area(). That is dynamic dispatch.',
      buddyState: 'THINKING',
      boardTitle: 'The Object Decides at Runtime',
      boardSummary:
        'When shapes[i].area() runs, the runtime checks the actual object stored in shapes[i] and calls that class’s implementation.',
      keyPrinciple:
        'The declared type (Shape) decides which methods may be called. The runtime type (Circle, Rectangle, …) decides which implementation actually runs.',
      visualType: 'code_visual',
      visualData: { focus: 'dispatch' },
      checkQuestion: {
        id: 'q_poly_step_dispatch',
        prompt: 'const s: Shape = new Rectangle(2, 3); What does s.area() return?',
        options: [
          { id: 'poly_b1', text: '6', isCorrect: true, feedback: 'Correct. The object is a Rectangle, so Rectangle.area() runs: 2 × 3 = 6.' },
          { id: 'poly_b2', text: 'An error, because Shape.area() has no body', isCorrect: false, feedback: 'The call is dispatched to the object’s own implementation, Rectangle.area().' },
          { id: 'poly_b3', text: 'π × 2², about 12.57', isCorrect: false, feedback: 'That is the Circle formula, but the object is a Rectangle.' },
          { id: 'poly_b4', text: '3', isCorrect: false, feedback: 'That is the Triangle formula (½ × 2 × 3), but the object is a Rectangle.' },
        ],
      },
      tryThis: 'Select each object in the list and predict its output before you press Run.',
      commonMistake:
        'The declared type does not choose the method body. The actual object does.',
      hintText: 'Ignore the variable’s type. Which constructor created the object?',
    },
    {
      id: 'step_5_poly_extension',
      stepNumber: 5,
      stage: 'reward',
      title: 'Why It Matters',
      subtitle: 'Extend Without Rewriting',
      buddyDialogue:
        'Here is why it matters: because totalArea() only depends on Shape, you can add a Hexagon tomorrow and the loop keeps working without a single change.',
      buddyState: 'EXPLAINING',
      boardTitle: 'Open for Extension',
      boardSummary:
        'Adding a new Shape class needs no change to totalArea(): the loop already works with any object that honours the Shape contract.',
      keyPrinciple:
        'Polymorphism supports the open/closed principle: code is open for extension (new classes) but closed for modification (existing callers stay unchanged).',
      visualType: 'code_visual',
      visualData: { focus: 'extension' },
      tryThis: 'Describe what a new Square class must implement so that totalArea() still works unchanged.',
      hintText: 'Only the contract matters to the caller.',
    },
  ],
  questions: [
    {
      id: 'q_poly_1',
      lessonId: 'lesson_polymorphism',
      conceptId: 'polymorphism',
      prompt: 'What is dynamic dispatch?',
      type: 'multiple_choice',
      difficulty: 'EASY',
      options: [
        { id: 'q_poly_1a', text: 'Choosing which method implementation to run based on the object’s runtime type', isCorrect: true, feedback: 'Correct. The decision happens while the program runs.' },
        { id: 'q_poly_1b', text: 'Sending messages between computers', isCorrect: false, feedback: 'That is networking, not method dispatch.' },
        { id: 'q_poly_1c', text: 'Choosing a method from the variable’s declared type at compile time', isCorrect: false, feedback: 'That describes static binding. Dynamic dispatch uses the runtime type.' },
      ],
      explanation: 'With dynamic dispatch, a call such as shape.area() is bound to an implementation at runtime, based on the object actually stored in the variable.',
      misconceptionTag: 'declared_vs_runtime_type',
      hint: {
        id: 'hint_poly_1',
        conceptId: 'polymorphism',
        hints: [
          'Dispatch means deciding which code to run.',
          'Dynamic means the decision is made while the program runs.',
          'The object’s runtime type picks the implementation.',
        ],
      },
    },
    {
      id: 'q_poly_2',
      lessonId: 'lesson_polymorphism',
      conceptId: 'polymorphism',
      prompt: 'shapes = [new Circle(1), new Rectangle(2, 5)]. How many different area() implementations run when the loop calls shape.area() on each item?',
      type: 'application',
      difficulty: 'MEDIUM',
      options: [
        { id: 'q_poly_2a', text: 'Two: Circle.area() then Rectangle.area()', isCorrect: true, feedback: 'Correct. Each element dispatches to its own class.' },
        { id: 'q_poly_2b', text: 'One: Shape.area() for both', isCorrect: false, feedback: 'Shape only declares area(). It has no body to run.' },
        { id: 'q_poly_2c', text: 'Zero, because the list type is Shape[]', isCorrect: false, feedback: 'The list type restricts what you may call, not which body runs.' },
      ],
      explanation: 'Each object carries its own class, so the same call dispatches to Circle.area() and then Rectangle.area().',
      misconceptionTag: 'interface_has_implementation',
      hint: {
        id: 'hint_poly_2',
        conceptId: 'polymorphism',
        hints: [
          'Look at the class of each object in the list.',
          'Does the interface itself contain any code to run?',
          'Each class supplies its own area().',
        ],
      },
    },
    {
      id: 'q_poly_3',
      lessonId: 'lesson_polymorphism',
      conceptId: 'polymorphism',
      prompt: 'You add a Hexagon class that implements Shape. What must change in totalArea(shapes: Shape[])?',
      type: 'conceptual',
      difficulty: 'HARD',
      options: [
        { id: 'q_poly_3a', text: 'Nothing: it already works with any Shape', isCorrect: true, feedback: 'Correct. That is the open/closed benefit of polymorphism.' },
        { id: 'q_poly_3b', text: 'Add an if-statement that checks for Hexagon', isCorrect: false, feedback: 'Type checks like this are what polymorphism removes.' },
        { id: 'q_poly_3c', text: 'Change the parameter type to Hexagon[]', isCorrect: false, feedback: 'That would break the function for every other shape.' },
      ],
      explanation: 'totalArea depends only on the Shape contract, so any new implementation plugs in without modifying existing callers.',
      misconceptionTag: 'type_switch_instead_of_dispatch',
      hint: {
        id: 'hint_poly_3',
        conceptId: 'polymorphism',
        hints: [
          'What does totalArea know about each element?',
          'It only calls area(), which every Shape provides.',
          'No change is needed.',
        ],
      },
    },
  ],
  flashcards: [
    { id: 'fc_poly_1', conceptId: 'polymorphism', front: 'Polymorphism', back: 'One interface, many implementations: the same call behaves differently for different object types.', category: 'Definition' },
    { id: 'fc_poly_2', conceptId: 'polymorphism', front: 'Interface', back: 'A contract of method signatures with no bodies, e.g. interface Shape { area(): number }.', category: 'Syntax' },
    { id: 'fc_poly_3', conceptId: 'polymorphism', front: 'Dynamic dispatch', back: 'Selecting the method body at runtime from the object’s actual class.', category: 'Runtime' },
    { id: 'fc_poly_4', conceptId: 'polymorphism', front: 'Open/closed principle', back: 'Open for extension (add new classes), closed for modification (existing callers unchanged).', category: 'Design' },
  ],
  sources: [
    {
      id: 'src_poly_1',
      title: 'TypeScript Handbook: Classes (implements clauses)',
      authorOrPublisher: 'Microsoft / TypeScript team',
      url: 'https://www.typescriptlang.org/docs/handbook/2/classes.html',
      type: 'oer',
      note: 'How classes implement interfaces in TypeScript.',
    },
    {
      id: 'src_poly_2',
      title: 'The Java Tutorials: Polymorphism',
      authorOrPublisher: 'Oracle',
      url: 'https://docs.oracle.com/javase/tutorial/java/IandI/polymorphism.html',
      type: 'oer',
      note: 'Runtime method selection based on the object type.',
    },
  ],
  initialNotes:
    'Polymorphism Notes:\n• Interface = contract (what), class = implementation (how).\n• Declared type limits what you can call; runtime type picks the body.\n• Dynamic dispatch happens at runtime.\n• New classes plug in without changing callers.',
  buddyScript: {
    introduction: 'Today’s idea is polymorphism: one call, many behaviours. Let us watch the same line of code do different work.',
    revisionIntroduction:
      'Revision: polymorphism. Quick recall: contract, implementations, dynamic dispatch, and why callers never need to change.',
    correct: 'Correct! You traced the dispatch exactly like the runtime does.',
    incorrect: 'Not quite. Look at which class actually created the object, not the variable’s type.',
    hint: 'Ask yourself: which constructor made this object?',
    transition: 'Nice. Let us see what the runtime does with that.',
    completion: 'Great work! You can explain interfaces, implementations and dynamic dispatch, and why they make code easy to extend.',
  },
  xiraPrompts: {
    why: 'Why does the object, not the variable type, decide which method runs?',
    simpler: 'Explain polymorphism in the simplest possible terms.',
    example: 'Give me a real-world software example of polymorphism.',
    hint: 'Give me a hint for predicting which area() runs.',
    deeper: 'How do languages implement dynamic dispatch internally (for example with vtables)?',
  },
};
