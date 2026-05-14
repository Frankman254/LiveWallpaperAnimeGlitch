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
export type { ButtonVariant, ButtonSize, ButtonDensity } from './Button';
export { default as EnumButtonGroup } from './EnumButtonGroup';
export type { EnumButtonGroupProps } from './EnumButtonGroup';

export { default as IconButton } from './IconButton';
export type {
	IconButtonSize,
	IconButtonVariant,
	IconButtonDensity
} from './IconButton';

export { default as ToggleSwitch } from './ToggleSwitch';
export type { ToggleSwitchSize } from './ToggleSwitch';

export { default as SegmentedControl } from './SegmentedControl';
export type {
	SegmentedControlSize,
	SegmentedControlDensity,
	SegmentedOption
} from './SegmentedControl';

export { default as Slider } from './Slider';
export type { SliderVariant } from './Slider';
export { default as SliderRow } from './SliderRow';
export type { SliderRowProps } from './SliderRow';

export { default as Select } from './Select';
export type { SelectOption, SelectSize, SelectDensity } from './Select';
export { default as Dropdown } from './Select';

export { default as SectionCard } from './SectionCard';
export type { SectionCardLevel } from './SectionCard';

export { default as FieldLabel } from './FieldLabel';
export { default as Caption } from './Caption';
export { default as ColorInput } from './ColorInput';
export { default as SectionDivider } from './SectionDivider';
export { default as ProfileSlotsEditor } from './ProfileSlotsEditor';
export type { ProfileSlotsEditorProps } from './ProfileSlotsEditor';
export { default as CollapsibleSection } from './CollapsibleSection';
export { default as OptionCardGrid } from './OptionCardGrid';
export type { OptionCardItem } from './OptionCardGrid';

export {
	default as Toolbar,
	ToolbarDivider,
	ToolbarGroup
} from './Toolbar';

export { default as FloatingPanel } from './FloatingPanel';

export { default as Tabs } from './Tabs';
export type { TabItem, TabsSize, TabsDensity } from './Tabs';

export { default as SidebarNav } from './SidebarNav';
export type { SidebarNavItem } from './SidebarNav';

export { cn } from './lib/cn';
export * from './tokens';
