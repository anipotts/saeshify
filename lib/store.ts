import { create } from 'zustand';

export type EntityKind = 'track' | 'artist' | 'album';

export interface FocusedEntity {
  kind: EntityKind;
  id: string;
  payload: any;
}

interface UIState {
  // Focused Entity Logic
  focusedEntity: FocusedEntity | null;
  setFocusedEntity: (entity: FocusedEntity | null) => void;

  // Desktop Details Panel
  isDetailsOpen: boolean;
  setDetailsOpen: (isOpen: boolean) => void;
  detailsWidth: number;
  setDetailsWidth: (width: number) => void;

  // Mobile Bottom Sheet
  isMobileSheetOpen: boolean;
  setMobileSheetOpen: (isOpen: boolean) => void;
  
  // Actions
  openDetails: (entity: FocusedEntity) => void;
  closeDetails: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  focusedEntity: null,
  setFocusedEntity: (entity) => set({ focusedEntity: entity }),

  isDetailsOpen: false,
  setDetailsOpen: (isOpen) => set({ isDetailsOpen: isOpen }),
  
  detailsWidth: 360,
  setDetailsWidth: (width) => set({ detailsWidth: width }),

  isMobileSheetOpen: false,
  setMobileSheetOpen: (isOpen) => set({ isMobileSheetOpen: isOpen }),

  openDetails: (entity) => set({ 
    focusedEntity: entity, 
    isDetailsOpen: true, 
    isMobileSheetOpen: true 
  }),
  
  closeDetails: () => set({ 
    isDetailsOpen: false, 
    isMobileSheetOpen: false 
    // We optionally keep focusedEntity to avoid content jumping while closing
  }),
}));
