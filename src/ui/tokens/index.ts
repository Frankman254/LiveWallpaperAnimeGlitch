export { SPACING, type SpacingToken } from './spacing';
export { RADIUS, type RadiusToken } from './radius';
export { TYPE, WEIGHT, type TypeToken, type WeightToken } from './type';
export { UI_COLORS, FONT, type UIColorToken } from './colors';
export { GLOW, type GlowToken } from './glow';
export { BLUR, type BlurToken } from './blur';
export {
	MOTION,
	transition,
	type DurationToken,
	type EasingToken
} from './motion';
export { Z_INDEX, type ZIndexToken } from './zIndex';

export const ICON_SIZE = {
	xs: 11,
	sm: 13,
	md: 14,
	lg: 16,
	xl: 18
} as const;

export type IconSizeToken = keyof typeof ICON_SIZE;
