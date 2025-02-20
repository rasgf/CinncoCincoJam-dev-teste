'use client';

import { Fragment } from 'react';
import { Menu, Transition } from '@headlessui/react';
import { useAuthContext } from '@/contexts/AuthContext';
import Link from 'next/link';

export function UserMenu() {
  const { user, airtableUser, signOut } = useAuthContext();

  if (!user || !airtableUser) return null;

  return (
    <Menu as="div" className="relative">
      <Menu.Button className="flex items-center">
        {/* Avatar/Imagem do usuário */}
        <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
          {airtableUser.fields.profile_image ? (
            <img
              src={airtableUser.fields.profile_image}
              alt=""
              className="h-8 w-8 rounded-full object-cover"
            />
          ) : (
            <span className="text-sm font-medium text-gray-600">
              {airtableUser.fields.name?.[0]?.toUpperCase() || 'U'}
            </span>
          )}
        </div>
      </Menu.Button>

      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items className="absolute right-0 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
          <div className="px-4 py-2 border-b border-gray-100">
            <p className="text-sm font-medium text-gray-900">
              {airtableUser.fields.name}
            </p>
            <p className="text-xs text-gray-500">
              {airtableUser.fields.email}
            </p>
          </div>

          <Menu.Item>
            {({ active }) => (
              <Link
                href="/profile"
                className={`${
                  active ? 'bg-gray-100' : ''
                } block px-4 py-2 text-sm text-gray-700`}
              >
                Meu Perfil
              </Link>
            )}
          </Menu.Item>

          <Menu.Item>
            {({ active }) => (
              <button
                onClick={signOut}
                className={`${
                  active ? 'bg-gray-100' : ''
                } block w-full text-left px-4 py-2 text-sm text-gray-700`}
              >
                Sair
              </button>
            )}
          </Menu.Item>
        </Menu.Items>
      </Transition>
    </Menu>
  );
} 