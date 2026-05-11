/**
 * Editor UI design system — single canonical import entry.
 *
 * Usage:
 *   import { Button, Slider, Select, SectionCard } from '@/ui';
 *
 * Tokens (spacing, radius, colors, glow, blur, motion, zIndex, icon size) are
 * re-exported here so a component file rarely needs more than this one import.
 */

export { default as Button } from './Button';
export type { ButtonVariant, ButtonSize } from './Button';

export { default as IconButton } from './IconButton';
export type { IconButtonSize, IconButtonVariant } from './IconButton';

export { default as ToggleSwitch } from './ToggleSwitch';
export type { ToggleSwitchSize } from './ToggleSwitch';

export { default as SegmentedControl } from './SegmentedControl';
export type {
	SegmentedControlSize,
	SegmentedOption
} from './SegmentedControl';

export { default as Slider } from './Slider';
export type { SliderVariant } from './Slider';

export { default as Select } from './Select';
export type { SelectOption, SelectSize } from './Select';

export { default as SectionCard } from './SectionCard';
export type { SectionCardLevel } from './SectionCard';

export { default as CollapsibleSection } from './CollapsibleSection';

export { default as FloatingPanel } from './FloatingPanel';

export { default as Tabs } from './Tabs';
export type { TabItem, TabsSize } from './Tabs';

export { default as SidebarNav } from './SidebarNav';
export type { SidebarNavItem } from './SidebarNav';

export { cn } from './lib/cn';
export * from './tokens';
