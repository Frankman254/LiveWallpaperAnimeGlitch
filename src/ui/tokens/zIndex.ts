export const Z_INDEX = {
	base: 0,
	raised: 10,
	sticky: 20,
	dragOverlay: 40,
	panel: 50,
	popover: 200,
	modal: 1000,
	toast: 2000,
	max: 9999
} as const;

export type ZIndexToken = keyof typeof Z_INDEX;
