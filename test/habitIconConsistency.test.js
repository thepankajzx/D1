import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  getCanonicalHabitIconConfig,
  canonicalizeHabit,
  resolveHabitColor,
  resolveHabitIcon,
  getReadableIconColor,
  getCanonicalRgbaColors
} from '../src/lib/habitColors.js';

describe('D1 — Global Habit Icon Consistency & Anti-Regression Suite', () => {

  describe('Test A: Multi-Screen Render Consistency', () => {
    it('generates identical canonical icon config regardless of consuming screen', () => {
      const customHabit = {
        id: 'habit-water-custom-1',
        name: 'Morning Hydration',
        icon: 'drop',
        color: '#06b6d4',
        scoringType: 'numeric'
      };

      // Screen 1: Dashboard reads config
      const dashboardConfig = getCanonicalHabitIconConfig(customHabit);

      // Screen 2: Analytics reads config
      const analyticsConfig = getCanonicalHabitIconConfig(customHabit);

      // Screen 3: Resilience Hub reads config
      const resilienceConfig = getCanonicalHabitIconConfig(customHabit);

      // Screen 4: All Streaks Compare Matrix reads config
      const matrixConfig = getCanonicalHabitIconConfig(customHabit);

      // All screens must receive identical canonical configuration
      assert.deepStrictEqual(dashboardConfig, analyticsConfig);
      assert.deepStrictEqual(analyticsConfig, resilienceConfig);
      assert.deepStrictEqual(resilienceConfig, matrixConfig);

      assert.equal(dashboardConfig.iconId, 'drop');
      assert.equal(dashboardConfig.icon, 'drop');
      assert.equal(dashboardConfig.color, '#06b6d4');
      assert.equal(dashboardConfig.iconColor, '#06b6d4');
      assert.ok(dashboardConfig.iconBackgroundColor.startsWith('rgba('));
      assert.ok(dashboardConfig.borderColor.startsWith('rgba('));
    });

    it('rejects screen-specific recoloring classes and keeps canonical colors intact', () => {
      const habit = {
        id: 'habit-screen-override-test',
        name: 'Deep Reading',
        icon: 'book_2',
        color: '#8b5cf6'
      };

      const config = getCanonicalHabitIconConfig(habit);
      assert.equal(config.iconColor, '#8b5cf6');
      assert.notEqual(config.iconColor, '#ffffff', 'Should never be forced to white');
      assert.notEqual(config.iconColor, '#10b981', 'Should never be forced to green');
    });
  });

  describe('Test B: Custom Habit Persistence & Rendering', () => {
    it('correctly canonicalizes custom habit with custom icon, name, and color', () => {
      const customHabit = {
        id: 'custom-night-walk-99',
        name: 'Night Sky Walk',
        icon: 'sparkle',
        color: '#8b5cf6',
        category: 'Wellness',
        goalValue: 30
      };

      const canonical = canonicalizeHabit(customHabit);

      assert.equal(canonical.id, 'custom-night-walk-99');
      assert.equal(canonical.name, 'Night Sky Walk');
      assert.equal(canonical.icon, 'sparkle');
      assert.equal(canonical.iconId, 'sparkle');
      assert.equal(canonical.color, '#8b5cf6');
      assert.equal(canonical.iconColor, '#8b5cf6');
      assert.ok(canonical.iconBackgroundColor);
      assert.ok(canonical.borderColor);
      assert.equal(canonical.iconStyle, 'circle');
    });
  });

  describe('Test C: Offline & Cache Invariance', () => {
    it('maintains 100% identical icon config through JSON serialization and localStorage restore', () => {
      const originalHabit = canonicalizeHabit({
        id: 'offline-habit-cache',
        name: 'Cold Shower',
        icon: 'shower',
        color: '#0284c7'
      });

      // Simulate saving to localStorage
      const serialized = JSON.stringify(originalHabit);

      // Simulate loading from localStorage / IndexedDB while offline
      const parsed = JSON.parse(serialized);
      const restored = canonicalizeHabit(parsed);

      assert.equal(restored.icon, originalHabit.icon);
      assert.equal(restored.iconId, originalHabit.iconId);
      assert.equal(restored.color, originalHabit.color);
      assert.equal(restored.iconColor, originalHabit.iconColor);
      assert.equal(restored.iconBackgroundColor, originalHabit.iconBackgroundColor);
      assert.equal(restored.borderColor, originalHabit.borderColor);
      assert.equal(restored.iconStyle, originalHabit.iconStyle);
    });
  });

  describe('Test D: Firebase Sync Invariance', () => {
    it('preserves canonical icon identity when syncing non-icon field updates from remote', () => {
      const existingHabit = canonicalizeHabit({
        id: 'h-sync-1',
        name: 'Morning Meditation',
        icon: 'self_improvement',
        color: '#10b981',
        streak: 15
      });

      // Remote update only modifies streak and lastCompleted
      const remoteUpdate = {
        ...existingHabit,
        streak: 16,
        lastCompleted: '2026-10-22'
      };

      const synced = canonicalizeHabit(remoteUpdate);

      assert.equal(synced.iconId, 'self_improvement');
      assert.equal(synced.iconColor, '#10b981');
      assert.equal(synced.streak, 16);
      assert.equal(synced.lastCompleted, '2026-10-22');
    });

    it('updates icon identity cleanly when user deliberately changes icon via picker payload', () => {
      const existingHabit = canonicalizeHabit({
        id: 'h-sync-2',
        name: 'Daily Journal',
        icon: 'edit_note',
        color: '#f59e0b'
      });

      // User picks new icon 'auto_stories' and color '#ec4899'
      const updatedViaPicker = canonicalizeHabit({
        ...existingHabit,
        icon: 'auto_stories',
        iconId: 'auto_stories',
        color: '#ec4899',
        iconColor: '#ec4899',
        updatedAt: new Date().toISOString()
      });

      assert.equal(updatedViaPicker.iconId, 'auto_stories');
      assert.equal(updatedViaPicker.icon, 'auto_stories');
      assert.equal(updatedViaPicker.color, '#ec4899');
      assert.equal(updatedViaPicker.iconColor, '#ec4899');
      assert.ok(updatedViaPicker.updatedAt);
    });
  });

  describe('Test E: Habit Edit / Update Flow', () => {
    it('synchronizes all canonical icon fields when updating habit in selector/modal', () => {
      const habit = canonicalizeHabit({
        id: 'h-edit-1',
        name: 'Late Night Coding',
        icon: 'moon',
        color: '#8b5cf6'
      });

      assert.equal(habit.iconId, 'moon');
      assert.equal(habit.color, '#8b5cf6');

      // Edit to Flame / Orange
      const edited = canonicalizeHabit({
        ...habit,
        icon: 'local_fire_department',
        iconId: 'local_fire_department',
        color: '#f97316',
        iconColor: '#f97316'
      });

      assert.equal(edited.iconId, 'local_fire_department');
      assert.equal(edited.icon, 'local_fire_department');
      assert.equal(edited.color, '#f97316');
      assert.equal(edited.iconColor, '#f97316');

      // Colors should be recalculated for orange tint
      const colors = getCanonicalRgbaColors('#f97316');
      assert.equal(edited.iconBackgroundColor, colors.bgRgba);
      assert.equal(edited.borderColor, colors.borderRgba);
    });
  });

  describe('Test F: Anti-Guessing Invariant (User Choice ALWAYS Wins)', () => {
    it('NEVER replaces custom icon or color based on habit name keywords', () => {
      // 1. Gym keyword with Book icon & Pink color
      const gymWithBook = canonicalizeHabit({
        id: 'gym-book-test',
        name: 'Heavy Gym Workout Session',
        icon: 'book_2',
        color: '#ec4899'
      });
      assert.equal(gymWithBook.icon, 'book_2', 'Must NOT guess dumbbell/fitness_center');
      assert.equal(gymWithBook.color, '#ec4899', 'Must NOT override pink with red/orange preset');

      // 2. Water keyword with Laptop icon & Violet color
      const waterWithLaptop = canonicalizeHabit({
        id: 'water-laptop-test',
        name: 'Drink 3L Cold Water',
        icon: 'laptop',
        color: '#8b5cf6'
      });
      assert.equal(waterWithLaptop.icon, 'laptop', 'Must NOT guess water_drop');
      assert.equal(waterWithLaptop.color, '#8b5cf6', 'Must NOT override violet with cyan preset');

      // 3. Sleep keyword with Flame icon & Green color
      const sleepWithFire = canonicalizeHabit({
        id: 'sleep-fire-test',
        name: 'Sleep 8 Hours by 10 PM',
        icon: 'local_fire_department',
        color: '#10b981'
      });
      assert.equal(sleepWithFire.icon, 'local_fire_department', 'Must NOT guess bed/nightlight');
      assert.equal(sleepWithFire.color, '#10b981', 'Must NOT override green with purple preset');

      // 4. resolveHabitIcon directly
      assert.equal(resolveHabitIcon({ name: 'Gym Training', icon: 'favorite' }), 'favorite');
      assert.equal(resolveHabitIcon({ name: 'Hydration Station', icon: 'alarm' }), 'alarm');

      // 5. resolveHabitColor directly
      assert.equal(resolveHabitColor({ name: 'Gym Training', color: '#14b8a6' }), '#14b8a6');
      assert.equal(resolveHabitColor({ name: 'Hydration Station', color: '#eab308' }), '#eab308');
    });
  });

  describe('Contrast & Readability Helper Tests', () => {
    it('ensures dark colors are visible on dark mode and light colors on light mode', () => {
      // Pure black or near black adjusted for visibility
      const nearBlack = getReadableIconColor('#000000');
      assert.equal(nearBlack, '#38bdf8'); // fallbacks to bright sky

      // Valid vivid colors are preserved
      assert.equal(getReadableIconColor('#10b981'), '#10b981');
      assert.equal(getReadableIconColor('#3b82f6'), '#3b82f6');
    });
  });
});
