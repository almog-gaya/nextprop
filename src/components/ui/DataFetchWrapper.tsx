'use client';

import React, { ReactNode, Suspense } from 'react';
import { useDataFetch, DataStatus } from '@/utils/data-manager';
import { useNotifications } from './NotificationSystem';
import DataTable, { Column, DataTableProps } from './DataTable';

interface DataFetchWrapperProps<T, P extends any[] = []> {
  fetcher: (...params: P) => Promise<T>;
  params?: P;
  cacheKey?: string;
  ttl?: number;
  staleWhileRevalidate?: boolean;
  loadingComponent?: ReactNode;
  errorComponent?: ReactNode | ((error: Error, retry: () => void) => ReactNode);
  emptyComponent?: ReactNode;
  children: (data: T, status: DataStatus, refresh: () => void) => ReactNode;
  showNotificationOnError?: boolean;
  suspense?: boolean;
}

export default function DataFetchWrapper<T, P extends any[] = []>({
  fetcher,
  params,
  cacheKey,
  ttl,
  staleWhileRevalidate,
  loadingComponent,
  errorComponent,
  emptyComponent,
  children,
  showNotificationOnError = true,
  suspense = false,
}: DataFetchWrapperProps<T, P>) {
  const notifications = useNotifications();
  
  const { data, status, error, refresh } = useDataFetch(fetcher, {
    cacheKey,
    ttl,
    staleWhileRevalidate,
  });
  
  // Execute the fetch if params are provided
  React.useEffect(() => {
    // Simply call refresh() without parameters
    // The actual parameters are handled inside useDataFetch
    if (params) {
      refresh();
    }
  }, [params, refresh]);
  
  // Show error notification if enabled
  React.useEffect(() => {
    if (status === 'error' && error && showNotificationOnError) {
      notifications.error(`Error: ${error.message}`);
    }
  }, [status, error, notifications, showNotificationOnError]);
  
  // If using suspense mode, wrap in Suspense
  if (suspense) {
    return (
      <Suspense fallback={loadingComponent || <DefaultLoadingComponent />}>
        {status === 'loading' ? (
          loadingComponent || <DefaultLoadingComponent />
        ) : status === 'error' ? (
          typeof errorComponent === 'function' 
            ? errorComponent(error!, refresh) 
            : errorComponent || <DefaultErrorComponent error={error!} retry={refresh} />
        ) : !data && emptyComponent ? (
          emptyComponent
        ) : (
          children(data as T, status, refresh)
        )}
      </Suspense>
    );
  }
  
  // Normal render flow (non-suspense)
  if (status === 'loading') {
    return <>{loadingComponent || <DefaultLoadingComponent />}</>;
  }
  
  if (status === 'error') {
    return <>{
      typeof errorComponent === 'function' 
        ? errorComponent(error!, refresh) 
        : errorComponent || <DefaultErrorComponent error={error!} retry={refresh} />
    }</>;
  }
  
  if (!data && emptyComponent) {
    return <>{emptyComponent}</>;
  }
  
  return <>{children(data as T, status, refresh)}</>;
}

// Default loading component
function DefaultLoadingComponent() {
  return (
    <div className="flex justify-center items-center p-8 animate-pulse">
      <div className="w-16 h-16 border-t-4 border-primary-500 border-solid rounded-full animate-spin"></div>
    </div>
  );
}

// Default error component
function DefaultErrorComponent({ error, retry }: { error: Error; retry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <svg
        className="w-16 h-16 text-error-500 mb-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
      <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Data</h3>
      <p className="text-sm text-gray-500 mb-4">{error.message}</p>
      <button
        onClick={retry}
        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
      >
        Try Again
      </button>
    </div>
  );
}

// Specialized version for lists
export function ListFetchWrapper<T, P extends any[] = []>({
  fetcher,
  params,
  cacheKey,
  ttl,
  staleWhileRevalidate,
  renderItem,
  keyExtractor,
  ...rest
}: Omit<DataFetchWrapperProps<T[], P>, 'children'> & {
  renderItem: (item: T, index: number) => ReactNode;
  keyExtractor: (item: T, index: number) => string;
}) {
  return (
    <DataFetchWrapper<T[], P>
      fetcher={fetcher}
      params={params}
      cacheKey={cacheKey}
      ttl={ttl}
      staleWhileRevalidate={staleWhileRevalidate}
      {...rest}
    >
      {(data, status, refresh) => (
        <div className="space-y-4">
          {data.map((item, index) => (
            <React.Fragment key={keyExtractor(item, index)}>
              {renderItem(item, index)}
            </React.Fragment>
          ))}
        </div>
      )}
    </DataFetchWrapper>
  );
}

// Specialized version for data tables
interface TableFetchWrapperProps<T, P extends any[] = []> extends Omit<DataFetchWrapperProps<T[], P>, 'children'> {
  columns: Column<T>[];
  keyField: DataTableProps<T>['keyField'];
  title?: string;
  subtitle?: string;
  pagination?: boolean;
  pageSize?: number;
  onRowClick?: (item: T) => void;
  className?: string;
}

export function TableFetchWrapper<T, P extends any[] = []>({
  fetcher,
  params,
  cacheKey,
  ttl,
  staleWhileRevalidate,
  columns,
  keyField,
  title,
  subtitle,
  pagination,
  pageSize,
  onRowClick,
  className,
  ...rest
}: TableFetchWrapperProps<T, P>) {
  return (
    <DataFetchWrapper<T[], P>
      fetcher={fetcher}
      params={params}
      cacheKey={cacheKey}
      ttl={ttl}
      staleWhileRevalidate={staleWhileRevalidate}
      {...rest}
    >
      {(data, status, refresh) => (
        <div className="w-full">
          <DataTable
            data={data}
            columns={columns}
            keyField={keyField}
            loading={status === 'loading'}
            title={title}
            subtitle={subtitle}
            pagination={pagination}
            pageSize={pageSize}
            onRowClick={onRowClick}
            className={className}
          />
        </div>
      )}
    </DataFetchWrapper>
  );
} 