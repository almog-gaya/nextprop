'use client';

import React, { createContext, useContext, useCallback, useState, useMemo, useEffect } from 'react';
import Modal, { ModalProps } from './Modal';

// Modal config without the isOpen and onClose props (which we'll manage)
export type ModalConfig = Omit<ModalProps, 'isOpen' | 'onClose'>;

// Context interface
interface ModalContextProps {
  openModal: (id: string, config: ModalConfig) => void;
  closeModal: (id: string) => void;
  updateModal: (id: string, config: Partial<ModalConfig>) => void;
  isModalOpen: (id: string) => boolean;
}

// Create the context
const ModalContext = createContext<ModalContextProps | undefined>(undefined);

// Modal state type
interface ModalState {
  [id: string]: {
    isOpen: boolean;
    config: ModalConfig;
  };
}

// Provider component
export function ModalProvider({ children }: { children: React.ReactNode }) {
  // State to track all modals
  const [modals, setModals] = useState<ModalState>({});
  const [mountedIds, setMountedIds] = useState<string[]>([]);

  // Open a modal with the given id and configuration
  const openModal = useCallback((id: string, config: ModalConfig) => {
    setModals(prev => ({
      ...prev,
      [id]: {
        isOpen: true,
        config,
      },
    }));
    
    // Add to mounted IDs if not already there
    setMountedIds(prev => prev.includes(id) ? prev : [...prev, id]);
  }, []);

  // Close a modal by id
  const closeModal = useCallback((id: string) => {
    setModals(prev => {
      if (!prev[id]) return prev;
      
      return {
        ...prev,
        [id]: {
          ...prev[id],
          isOpen: false,
        },
      };
    });
    
    // Remove from mounted after animation completes
    setTimeout(() => {
      setMountedIds(prev => prev.filter(mountedId => mountedId !== id));
    }, 300); // Slightly longer than animation duration
  }, []);

  // Update a modal's configuration
  const updateModal = useCallback((id: string, config: Partial<ModalConfig>) => {
    setModals(prev => {
      if (!prev[id]) return prev;
      
      return {
        ...prev,
        [id]: {
          ...prev[id],
          config: {
            ...prev[id].config,
            ...config,
          },
        },
      };
    });
  }, []);

  // Check if a modal is open
  const isModalOpen = useCallback((id: string) => {
    return !!modals[id]?.isOpen;
  }, [modals]);

  // Value for the context
  const contextValue = useMemo(() => ({
    openModal,
    closeModal,
    updateModal,
    isModalOpen,
  }), [openModal, closeModal, updateModal, isModalOpen]);

  return (
    <ModalContext.Provider value={contextValue}>
      {children}
      
      {/* Render all mounted modals */}
      {mountedIds.map(id => {
        const modalState = modals[id];
        if (!modalState) return null;
        
        return (
          <Modal
            key={id}
            isOpen={modalState.isOpen}
            onClose={() => closeModal(id)}
            {...modalState.config}
          />
        );
      })}
    </ModalContext.Provider>
  );
}

// Hook to use the modal context
export function useModal() {
  const context = useContext(ModalContext);
  
  if (!context) {
    throw new Error('useModal must be used within a ModalProvider');
  }
  
  return context;
}

// Convenient hook to create and manage a specific modal
export function useModalWithId(id: string) {
  const { openModal, closeModal, updateModal, isModalOpen } = useModal();
  
  const open = useCallback((config: ModalConfig) => {
    openModal(id, config);
  }, [id, openModal]);
  
  const close = useCallback(() => {
    closeModal(id);
  }, [id, closeModal]);
  
  const update = useCallback((config: Partial<ModalConfig>) => {
    updateModal(id, config);
  }, [id, updateModal]);
  
  const isOpen = useMemo(() => isModalOpen(id), [id, isModalOpen]);
  
  return { open, close, update, isOpen };
} 