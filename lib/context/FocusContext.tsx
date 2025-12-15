"use client";

import { createContext, useContext, useState, ReactNode } from "react";

export type EntityType = "track" | "artist" | "album";

export interface FocusedEntity {
  type: EntityType;
  data: any; // Using any for now to facilitate Spotify object flexibility
}

interface FocusContextType {
  focusedEntity: FocusedEntity | null;
  setFocusedEntity: (entity: FocusedEntity | null) => void;
  isDetailsOpen: boolean;
  setIsDetailsOpen: (isOpen: boolean) => void;
  openDetails: (entity: FocusedEntity) => void;
  closeDetails: () => void;
}

const FocusContext = createContext<FocusContextType | undefined>(undefined);

export function FocusProvider({ children }: { children: ReactNode }) {
  const [focusedEntity, setFocusedEntity] = useState<FocusedEntity | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const openDetails = (entity: FocusedEntity) => {
    setFocusedEntity(entity);
    setIsDetailsOpen(true);
  };

  const closeDetails = () => {
    setIsDetailsOpen(false);
    // Optional: clear focusedEntity after animation, but for now immediate is fine
  };

  return (
    <FocusContext.Provider
      value={{
        focusedEntity,
        setFocusedEntity,
        isDetailsOpen,
        setIsDetailsOpen,
        openDetails,
        closeDetails,
      }}
    >
      {children}
    </FocusContext.Provider>
  );
}

export function useFocus() {
  const context = useContext(FocusContext);
  if (context === undefined) {
    throw new Error("useFocus must be used within a FocusProvider");
  }
  return context;
}
