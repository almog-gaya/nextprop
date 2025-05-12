import React, { useRef, useEffect, useState } from 'react';
import { User } from '@/contexts/AuthContext';
import { UserIcon, ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline';

interface ProfileDropdownProps {
  user: User;
  onLogout?: () => void;
}

const ProfileDropdown: React.FC<ProfileDropdownProps> = ({ user, onLogout }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        className="flex items-center gap-2 h-10 hover:bg-gray-100 px-2 rounded-lg transition-colors duration-200 focus:outline-none"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="true"
        aria-expanded={open}
      >
        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
          {user?.firstName || user?.lastName ? (
            <span className="text-xs font-medium text-gray-600">
              {user.firstName?.[0]}
              {user.lastName?.[0]}
            </span>
          ) : (
            <UserIcon className="w-5 h-5 text-gray-400" />
          )}
        </div>
        <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-100 z-50 p-6 min-w-[260px]">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 rounded-full bg-[#7c3aed] flex items-center justify-center text-white text-xl font-bold">
              {user?.firstName?.[0] || user?.name?.[0] || 'U'}
              {user?.lastName?.[0] || ''}
            </div>
            <div className='max-w-[180px] overflow-hidden'>
              <div className="text-lg font-semibold text-gray-900 truncate">
                { `${user?.firstName || ''} ${user?.lastName || ''}`.trim()}
              </div>
              <div className="text-sm text-gray-500 truncate">{user?.email}</div>
            </div>
          </div>
          <div className="space-y-2 mb-4">
            {user?.phone && (
              <div>
                <div className="text-xs text-gray-500">Phone</div>
                <div className="text-sm text-gray-900">{user.phone}</div>
              </div>
            )}
            {user?.website && (
              <div>
                <div className="text-xs text-gray-500">Website</div>
                <div className="text-sm text-gray-900">{user.website}</div>
              </div>
            )}
          </div>
          <button
            className="w-full flex items-center justify-center gap-2 py-2 mt-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium transition-colors"
            onClick={onLogout}
          >
            <ArrowRightOnRectangleIcon className="w-5 h-5" />
            Logout
          </button>
        </div>
      )}
    </div>
  );
};

export default ProfileDropdown; 