import {defineConfig} from 'vite';

// Scan the actual application entry, not archived builds or generated QA pages.
export default defineConfig({
  optimizeDeps:{entries:['index.html']},
  server:{watch:{ignored:['**/.cache/**','**/public/versions/**']}},
});
