            <div>
              <div className="text-lg font-semibold text-gray-900 truncate max-w-[150px]">
                {user?.name || `${user?.firstName || ''} ${user?.lastName || ''}`.trim()}
              </div>
              <div className="text-sm text-gray-500 truncate max-w-[150px]">{user?.email}</div>
            </div> 