import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [react()],
	build: {
		// outDir: '../backend/public',
		// emptyOutDir: true,
		rollupOptions: {
			output: {
				manualChunks: {
					// Split vendor code
					'react-vendor': ['react', 'react-dom', 'react-router-dom'],
					'three-vendor': ['three', '@react-three/fiber', '@react-three/drei', '@react-three/postprocessing'],
					'mediapipe': ['@mediapipe/tasks-vision']
				}
			}
		},
		chunkSizeWarningLimit: 1000
	},
	// If we want to build a local version (that uses local services)
	// define: {
	// 	'process.env.VITE_LOCAL': 'true'
	// }
	preview: {
		host: '0.0.0.0',
		port: process.env.PORT || 4173,
		strictPort: true,
		allowedHosts: ['instasharemotion3d.onrender.com', '.onrender.com']
	}
})
