import {
  Blocks,
  Bot,
  Box,
  Gamepad2,
  Gem,
  Ghost,
  Leaf,
  Rabbit,
  Shield,
  Swords,
  Target,
  Trophy,
} from "lucide-react";

export const genres = [
  "RPG",
  "Simulator",
  "Tycoon",
  "Idle",
  "Platformer",
  "Horror",
  "Survival",
  "Farming",
  "Racing",
  "Dungeon crawler",
  "Pet game",
  "Tower defense",
  "Card game",
  "Battle arena",
];
export const artStyles = [
  "Cartoon",
  "Pixel",
  "Low-poly",
  "Realistic",
  "Fantasy",
  "Sci-fi",
  "Roblox-like",
  "Anime",
  "Dark horror",
  "Colorful",
];

export const templates = [
  {
    name: "2D RPG Starter",
    genre: "RPG",
    credits: 85,
    difficulty: "Beginner",
    icon: Swords,
    tone: "ember",
  },
  {
    name: "Pet Simulator",
    genre: "Simulator",
    credits: 120,
    difficulty: "Intermediate",
    icon: Rabbit,
    tone: "cyan",
  },
  {
    name: "Dungeon Crawler",
    genre: "RPG",
    credits: 160,
    difficulty: "Advanced",
    icon: Shield,
    tone: "violet",
  },
  {
    name: "Tower Defense",
    genre: "Strategy",
    credits: 110,
    difficulty: "Intermediate",
    icon: Target,
    tone: "gold",
  },
  {
    name: "Horror Survival",
    genre: "Horror",
    credits: 145,
    difficulty: "Advanced",
    icon: Ghost,
    tone: "rose",
  },
  {
    name: "Farming Game",
    genre: "Cozy",
    credits: 95,
    difficulty: "Beginner",
    icon: Leaf,
    tone: "lime",
  },
  {
    name: "Multiplayer Arena",
    genre: "Action",
    credits: 240,
    difficulty: "Expert",
    icon: Trophy,
    tone: "cyan",
  },
  {
    name: "Browser Tycoon",
    genre: "Tycoon",
    credits: 75,
    difficulty: "Beginner",
    icon: Gem,
    tone: "ember",
  },
];

export const fileSeed = [
  {
    path: "src/main.ts",
    language: "typescript",
    content: "// FableForge game bootstrap\nexport const game = { state: 'ready' };",
  },
  {
    path: "scenes/world.scene.json",
    language: "json",
    content: '{\n  "name": "Starter World",\n  "entities": []\n}',
  },
  {
    path: "scripts/player.ts",
    language: "typescript",
    content: "export class PlayerController {\n  speed = 6;\n}",
  },
  { path: "ui/hud.tsx", language: "typescript", content: "export function HUD() { return null; }" },
];

export const workspaceNav = [
  { label: "Projects", icon: Gamepad2 },
  { label: "Templates", icon: Blocks },
  { label: "Assets", icon: Box },
  { label: "AI Models", icon: Bot },
];
