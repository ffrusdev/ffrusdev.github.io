// One list drives the TV buttons, the channel bar, and arrow-key surfing.
// Add a page? Add a channel here and it shows up everywhere.
export const channels = [
  { num: 0, label: 'HOME', href: '/' },
  { num: 1, label: 'PROJECTS', href: '/projects/' },
  { num: 2, label: '3D MODELS', href: '/models/' },
  { num: 3, label: 'DEV LOG', href: '/devlog/' },
  { num: 4, label: 'ABOUT', href: '/about/' },
] as const;

export const chLabel = (n: number) => 'CH' + String(n).padStart(2, '0');
