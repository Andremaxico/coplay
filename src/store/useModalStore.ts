import { create } from 'zustand'

export type AuthModeType = 'closed' | 'login' | 'register'

interface ModalState {
  // Auth / Login Modal
  authMode: AuthModeType
  setAuthMode: (mode: AuthModeType) => void
  openLogin: () => void
  openRegister: () => void
  closeAuth: () => void

  // Create Game Modal
  isCreateGameOpen: boolean
  setCreateGameOpen: (isOpen: boolean) => void
  openCreateGame: () => void
  closeCreateGame: () => void

  // Profile Edit Modal
  isProfileEditOpen: boolean
  setProfileEditOpen: (isOpen: boolean) => void
  openProfileEdit: () => void
  closeProfileEdit: () => void
}

export const useModalStore = create<ModalState>((set) => ({
  // Auth Modal
  authMode: 'closed',
  setAuthMode: (mode) => set({ authMode: mode }),
  openLogin: () => set({ authMode: 'login' }),
  openRegister: () => set({ authMode: 'register' }),
  closeAuth: () => set({ authMode: 'closed' }),

  // Create Game Modal
  isCreateGameOpen: false,
  setCreateGameOpen: (isOpen) => set({ isCreateGameOpen: isOpen }),
  openCreateGame: () => set({ isCreateGameOpen: true }),
  closeCreateGame: () => set({ isCreateGameOpen: false }),

  // Profile Edit Modal
  isProfileEditOpen: false,
  setProfileEditOpen: (isOpen) => set({ isProfileEditOpen: isOpen }),
  openProfileEdit: () => set({ isProfileEditOpen: true }),
  closeProfileEdit: () => set({ isProfileEditOpen: false }),
}))
