/* global React */
// Animated visualizer mock — sits behind the editor as a believable backdrop.
const { useEffect, useRef } = React;

window.VisualizerMock = function VisualizerMock({
	mode = 'bars',
	accent = '#67e8f9',
	dim = false
}) {
	const ref = useRef(null);

	useEffect(() => {
		const canvas = ref.current;
		const ctx = canvas.getContext('2d');
		let raf;
		const dpr = Math.min(window.devicePixelRatio || 1, 2);

		const resize = () => {
			const r = canvas.getBoundingClientRect();
			canvas.width = r.width * dpr;
			canvas.height = r.height * dpr;
		};
		resize();
		window.addEventListener('resize', resize);

		// Fake spectrum data — sum of sinusoids + noise smoothed over time
		const bins = 96;
		const data = new Float32Array(bins);
		const target = new Float32Array(bins);

		const tick = t => {
			const time = t / 1000;
			for (let i = 0; i < bins; i++) {
				const lowFreq = Math.sin(time * 1.5 + i * 0.08) * 0.5 + 0.5;
				const midFreq = Math.sin(time * 3.2 + i * 0.14) * 0.4 + 0.4;
				const beat = Math.max(0, Math.sin(time * 2.1)) ** 4;
				const fall = Math.pow(1 - i / bins, 0.6);
				target[i] =
					(lowFreq * 0.5 + midFreq * 0.3 + beat * 0.4) *
					fall *
					(0.7 + Math.random() * 0.3);
				data[i] += (target[i] - data[i]) * 0.25;
			}

			const W = canvas.width,
				H = canvas.height;
			ctx.clearRect(0, 0, W, H);

			// Background gradient
			const grad = ctx.createRadialGradient(
				W * 0.5,
				H * 0.6,
				0,
				W * 0.5,
				H * 0.6,
				W * 0.7
			);
			grad.addColorStop(0, 'rgba(40, 80, 120, 0.35)');
			grad.addColorStop(1, 'rgba(8, 10, 18, 1)');
			ctx.fillStyle = grad;
			ctx.fillRect(0, 0, W, H);

			// Glow halo
			ctx.fillStyle = `${accent}22`;
			ctx.beginPath();
			const beat = data.reduce((a, b) => a + b, 0) / bins;
			ctx.arc(
				W * 0.5,
				H * 0.55,
				80 * dpr + beat * 240 * dpr,
				0,
				Math.PI * 2
			);
			ctx.fill();

			if (mode === 'bars') {
				const barW = W / bins;
				for (let i = 0; i < bins; i++) {
					const v = data[i];
					const h = v * H * 0.55;
					const y = H * 0.85 - h;
					const x = i * barW;
					ctx.fillStyle = `${accent}cc`;
					ctx.fillRect(x + 1 * dpr, y, barW - 2 * dpr, h);
					ctx.fillStyle = '#ffffff';
					ctx.globalAlpha = 0.9;
					ctx.fillRect(x + 1 * dpr, y, barW - 2 * dpr, 2 * dpr);
					ctx.globalAlpha = 1;
				}
			} else if (mode === 'radial') {
				ctx.save();
				ctx.translate(W * 0.5, H * 0.55);
				const R = Math.min(W, H) * 0.18;
				for (let i = 0; i < bins; i++) {
					const v = data[i];
					const a = (i / bins) * Math.PI * 2 - Math.PI / 2;
					const x1 = Math.cos(a) * R,
						y1 = Math.sin(a) * R;
					const x2 = Math.cos(a) * (R + v * R * 1.6),
						y2 = Math.sin(a) * (R + v * R * 1.6);
					ctx.strokeStyle = `${accent}cc`;
					ctx.lineWidth = 3 * dpr;
					ctx.lineCap = 'round';
					ctx.beginPath();
					ctx.moveTo(x1, y1);
					ctx.lineTo(x2, y2);
					ctx.stroke();
				}
				ctx.restore();
			} else if (mode === 'wave') {
				ctx.strokeStyle = accent;
				ctx.lineWidth = 2.5 * dpr;
				ctx.beginPath();
				for (let i = 0; i < bins; i++) {
					const x = (i / (bins - 1)) * W;
					const y =
						H * 0.55 +
						Math.sin(time * 2 + i * 0.2) * data[i] * H * 0.25;
					if (i === 0) ctx.moveTo(x, y);
					else ctx.lineTo(x, y);
				}
				ctx.stroke();
			}

			// Particles
			for (let i = 0; i < 30; i++) {
				const px = (Math.sin(time * 0.3 + i * 1.7) * 0.5 + 0.5) * W;
				const py = (Math.cos(time * 0.4 + i * 2.3) * 0.5 + 0.5) * H;
				ctx.fillStyle = `rgba(255,255,255,${0.05 + (data[i % bins] || 0) * 0.3})`;
				ctx.beginPath();
				ctx.arc(
					px,
					py,
					(1 + (data[i % bins] || 0) * 3) * dpr,
					0,
					Math.PI * 2
				);
				ctx.fill();
			}

			if (dim) {
				ctx.fillStyle = 'rgba(0,0,0,0.35)';
				ctx.fillRect(0, 0, W, H);
			}

			raf = requestAnimationFrame(tick);
		};

		raf = requestAnimationFrame(tick);
		return () => {
			cancelAnimationFrame(raf);
			window.removeEventListener('resize', resize);
		};
	}, [mode, accent, dim]);

	return (
		<canvas
			ref={ref}
			style={{ width: '100%', height: '100%', display: 'block' }}
		/>
	);
};
