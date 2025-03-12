'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';

const apps = [
  {
    name: 'ScaleClock',
    description: 'O número 1 em escalas musicais no Brasil! Aprenda a lógica por trás do sistema musical, entenda e pratique intervalos e escalas.',
    icon: '/images/apps-pro/scaleclock.webp?v=1',
    googlePlayLink: 'https://play.google.com/store/apps/details?id=com.scaleclock',
    appStoreLink: 'https://apps.apple.com/br/app/scaleclock/id1491556307',
  },
  {
    name: 'eBatuque',
    description: 'Um app com diversos loops de percussão brasileira, gravados por percussionistas renomados, para você estudar seu instrumento de uma maneira musical e divertida.',
    icon: '/images/apps-pro/ebatuque.webp?v=1',
    googlePlayLink: 'https://play.google.com/store/apps/details?id=br.com.ebatuque.full',
    appStoreLink: 'https://apps.apple.com/br/app/ebatuque/id1554007194',
  },
];

export default function AppsPro() {
  const [hoveredApp, setHoveredApp] = useState<string | null>(null);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8 text-center dark:text-gray-100">Apps PRO</h1>
      <div className="grid md:grid-cols-2 gap-8">
        {apps.map((app) => (
          <div 
            key={app.name}
            className={`
              bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 
              transform transition-all duration-300 
              ${hoveredApp === app.name ? 'scale-105' : 'scale-100'}
              hover:shadow-xl
            `}
            onMouseEnter={() => setHoveredApp(app.name)}
            onMouseLeave={() => setHoveredApp(null)}
          >
            <div className="flex items-center mb-4">
              <div className="w-20 h-20 mr-4 flex items-center justify-center">
                <Image 
                  key={`${app.name}-icon-${Date.now()}`}
                  src={app.icon} 
                  alt={`${app.name} icon`} 
                  width={80} 
                  height={80}
                  priority
                  className="rounded-lg object-contain max-w-full max-h-full"
                  unoptimized
                />
              </div>
              <div>
                <h2 className="text-2xl font-semibold dark:text-gray-100">{app.name}</h2>
              </div>
            </div>
            <p className="text-gray-600 dark:text-gray-300 mb-4">{app.description}</p>
            <div className="flex justify-center space-x-4">
              <Link 
                href={app.googlePlayLink} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center bg-gray-100 dark:bg-gray-700 p-3 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                <div className="w-12 h-12 flex items-center justify-center">
                  <Image 
                    src="/images/store-icons/google-play.png" 
                    alt="Google Play Store" 
                    width={48} 
                    height={48} 
                    className="object-contain max-w-full max-h-full"
                    unoptimized
                  />
                </div>
              </Link>
              <Link 
                href={app.appStoreLink} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center bg-gray-100 dark:bg-gray-700 p-3 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                <div className="w-12 h-12 flex items-center justify-center">
                  <Image 
                    src="/images/store-icons/app-store.svg" 
                    alt="Apple App Store" 
                    width={48} 
                    height={48} 
                    className="object-contain max-w-full max-h-full"
                    unoptimized
                  />
                </div>
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 