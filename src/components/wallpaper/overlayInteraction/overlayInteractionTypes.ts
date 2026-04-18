export type DragState =
	| {
			kind: 'overlay';
			id: string;
			pointerId: number;
			startClientX: number;
			startClientY: number;
			startPositionX: number;
			startPositionY: number;
	  }
	| {
			kind: 'track-title';
			pointerId: number;
			startClientX: number;
			startClientY: number;
			startPositionX: number;
			startPositionY: number;
	  }
	| {
			kind: 'track-time';
			pointerId: number;
			startClientX: number;
			startClientY: number;
			startPositionX: number;
			startPositionY: number;
	  }
	| {
			kind: 'spectrum';
			pointerId: number;
			startClientX: number;
			startClientY: number;
			startPositionX: number;
			startPositionY: number;
	  }
	| {
			kind: 'logo';
			pointerId: number;
			startClientX: number;
			startClientY: number;
			startPositionX: number;
			startPositionY: number;
	  };

export type PendingDragUpdate =
	| { kind: 'overlay'; id: string; positionX: number; positionY: number }
	| { kind: 'logo'; positionX: number; positionY: number }
	| { kind: 'track-title'; positionX: number; positionY: number }
	| { kind: 'track-time'; positionX: number; positionY: number }
	| { kind: 'spectrum'; positionX: number; positionY: number };

