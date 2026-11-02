// The NUL crest as a BUILD-TIME asset, one truth for every view that shows it.
//
// Concept: a Vite asset is only guaranteed to exist in the production build
// if it is IMPORTED — assets referenced by hard-coded dev-only paths like
// "/src/assets/images/crest.png" work in `npm run dev` but 404 in the
// deployed bundle, because nothing under /src is copied into dist/. The
// import lets Vite fingerprint and bundle the file (LoginView, Header and
// DashboardView all share this single export).
import nulCrest from './nul_crest_original_themed.png';

export default nulCrest;
