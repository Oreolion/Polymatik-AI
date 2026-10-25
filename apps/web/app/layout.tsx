import type { ReactNode } from 'react';
import { themes } from '../../../packages/ui-tokens/src/index';
import './globals.css';

export const metadata = {
  title: 'Discover — Polymatik AI',
  description:
    'A living atlas for curious minds. Explore a small, source-attributed collection of ideas.',
};

const declarations = (theme: typeof themes.light | typeof themes.dark) =>
  Object.entries(theme)
    .map(([name, value]) => `--${name}:${value}`)
    .join(';');
const themeStyles = `:root{color-scheme:light;${declarations(themes.light)}}@media(prefers-color-scheme:dark){:root:not([data-theme=light]){color-scheme:dark;${declarations(themes.dark)}}}html[data-theme=dark]{color-scheme:dark;${declarations(themes.dark)}}html[data-theme=light]{color-scheme:light;${declarations(themes.light)}}`;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <style>{themeStyles}</style>
      </head>
      <body>{children}</body>
    </html>
  );
}
