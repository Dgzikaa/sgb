'use client';

import { useEffect } from 'react';

export default function AxeA11y() {
	useEffect(() => {
		// Só em desenvolvimento e no browser
		if (process.env.NODE_ENV !== 'development') return;
		if (typeof window === 'undefined') return;
		(async () => {
			try {
				const React = (await import('react')).default;
				const ReactDOM = await import('react-dom');
				const axe = (await import('@axe-core/react')).default;
				axe(React, ReactDOM, 1000);
			} catch (_e) {
				// Se não instalado, apenas ignore
			}
		})();
	}, []);

	return null;
}


