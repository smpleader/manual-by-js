import { resolve } from 'path'
import { defineConfig } from 'vite'


export default defineConfig({
    root: resolve(__dirname, 'src'),
    base: './',
    build: {
        outDir: '../dist',
        rollupOptions: {
            input: {
                index: resolve(__dirname, 'src/index.html'), 
            },
            output: {
                chunkFileNames: '[name].js',
                entryFileNames: '[name].js', 
            },
        }
    },
    server: {
        port: 8808
    }
})