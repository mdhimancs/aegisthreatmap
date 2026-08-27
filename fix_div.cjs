const fs = require('fs');
let content = fs.readFileSync('src/components/WorldThreatMapView.tsx', 'utf-8');

// I will just add an extra </div> before `{/* 7. ... */}` and see if that fixes it.
// Oh wait! The problem is that the Header `div` was not closed if I removed too much!
