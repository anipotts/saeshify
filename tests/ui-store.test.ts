import { describe, it, expect, beforeEach } from 'vitest';
import { useUIStore } from '@/lib/store';

describe('UI Store', () => {
  beforeEach(() => {
    // Reset store to initial state
    useUIStore.setState({
      focusedEntity: null,
      isDetailsOpen: false,
      detailsWidth: 360,
      isMobileSheetOpen: false,
      isMobileSettingsOpen: false,
    });
  });

  describe('Initial State', () => {
    it('starts with no focused entity', () => {
      expect(useUIStore.getState().focusedEntity).toBeNull();
    });

    it('starts with details panel closed', () => {
      expect(useUIStore.getState().isDetailsOpen).toBe(false);
    });

    it('starts with default details width of 360', () => {
      expect(useUIStore.getState().detailsWidth).toBe(360);
    });

    it('starts with mobile sheet closed', () => {
      expect(useUIStore.getState().isMobileSheetOpen).toBe(false);
    });

    it('starts with mobile settings closed', () => {
      expect(useUIStore.getState().isMobileSettingsOpen).toBe(false);
    });
  });

  describe('openDetails', () => {
    it('sets focused entity', () => {
      const entity = { kind: 'track' as const, id: 'abc', payload: { name: 'Test' } };
      useUIStore.getState().openDetails(entity);
      expect(useUIStore.getState().focusedEntity).toEqual(entity);
    });

    it('opens desktop details panel', () => {
      const entity = { kind: 'track' as const, id: 'abc', payload: {} };
      useUIStore.getState().openDetails(entity);
      expect(useUIStore.getState().isDetailsOpen).toBe(true);
    });

    it('opens mobile bottom sheet', () => {
      const entity = { kind: 'track' as const, id: 'abc', payload: {} };
      useUIStore.getState().openDetails(entity);
      expect(useUIStore.getState().isMobileSheetOpen).toBe(true);
    });

    it('works with album entities', () => {
      const entity = { kind: 'album' as const, id: 'album123', payload: { name: 'OK Computer' } };
      useUIStore.getState().openDetails(entity);
      expect(useUIStore.getState().focusedEntity?.kind).toBe('album');
    });

    it('works with artist entities', () => {
      const entity = { kind: 'artist' as const, id: 'artist123', payload: { name: 'Radiohead' } };
      useUIStore.getState().openDetails(entity);
      expect(useUIStore.getState().focusedEntity?.kind).toBe('artist');
    });
  });

  describe('closeDetails', () => {
    it('closes desktop panel', () => {
      useUIStore.getState().openDetails({ kind: 'track', id: 'x', payload: {} });
      useUIStore.getState().closeDetails();
      expect(useUIStore.getState().isDetailsOpen).toBe(false);
    });

    it('closes mobile sheet', () => {
      useUIStore.getState().openDetails({ kind: 'track', id: 'x', payload: {} });
      useUIStore.getState().closeDetails();
      expect(useUIStore.getState().isMobileSheetOpen).toBe(false);
    });

    it('preserves focusedEntity to prevent layout jump during animation', () => {
      const entity = { kind: 'track' as const, id: 'x', payload: {} };
      useUIStore.getState().openDetails(entity);
      useUIStore.getState().closeDetails();
      // focusedEntity should still be set (not cleared) for smooth exit animation
      expect(useUIStore.getState().focusedEntity).toEqual(entity);
    });
  });

  describe('Individual Setters', () => {
    it('setDetailsWidth updates width', () => {
      useUIStore.getState().setDetailsWidth(500);
      expect(useUIStore.getState().detailsWidth).toBe(500);
    });

    it('setMobileSettingsOpen toggles settings drawer', () => {
      useUIStore.getState().setMobileSettingsOpen(true);
      expect(useUIStore.getState().isMobileSettingsOpen).toBe(true);
      useUIStore.getState().setMobileSettingsOpen(false);
      expect(useUIStore.getState().isMobileSettingsOpen).toBe(false);
    });

    it('setFocusedEntity can clear entity', () => {
      useUIStore.getState().openDetails({ kind: 'track', id: 'x', payload: {} });
      useUIStore.getState().setFocusedEntity(null);
      expect(useUIStore.getState().focusedEntity).toBeNull();
    });
  });
});
