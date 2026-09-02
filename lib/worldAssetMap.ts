export const WORLD_ASSETS = {
  buildings: {
    learningCamp: '/world/buildings/learning-camp.png',
    projectWorkshop: '/world/buildings/project-workshop.png',
    skillLab: '/world/buildings/skill-lab.png',
    quarry: '/world/buildings/quarry.png',
    challengeArena: '/world/buildings/challenge-arena.png',
    lumberYard: '/world/buildings/lumber-yard.png',
    rewardVault: '/world/buildings/reward-vault.png',
    careerAcademy: '/world/buildings/career-academy.png',
  },

  characters: {
    learner: '/world/characters/learner.png',
    builder: '/world/characters/builder.png',
    miner: '/world/characters/miner.png',
    mentor: '/world/characters/mentor.png',
    trainer: '/world/characters/trainer.png',
  },

  props: {
    campfire: '/world/props/campfire.png',
    crates: '/world/props/crates.png',
    logs: '/world/props/logs.png',
    stonePile: '/world/props/stone-pile.png',
    treeOak: '/world/props/tree-oak.png',
    treePine: '/world/props/tree-pine.png',
  },

  terrain: {
    flowers: '/world/terrain/flowers.png',
  },
} as const;

export default WORLD_ASSETS;
