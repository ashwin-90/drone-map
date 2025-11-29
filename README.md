🛰️ Drone Mapping Application

A web-based interactive map tool that allows users to search, draw, toggle layers, zoom, and interact with geographic areas — designed based on the given Figma wireframe. Built using React + TypeScript + Vite, styled with TailwindCSS, and powered by Leaflet for mapping.

🚀 Features

✔ Matches the provided Figma layout
✔ Search for cities and auto-center the map
✔ Draw shapes (polygon / free draw) on the map
✔ Toggle base map layers (Satellite / Street)
✔ Export drawn areas as GeoJSON
✔ Responsive UI (mobile + desktop friendly)
✔ Zoom controls and custom attribution
✔ Fully client-side — no backend required

🧪 Test Suite (Playwright)

This project includes 3 Playwright end-to-end tests focusing on core interactions:

Test Name	Purpose
🔍 search.spec.ts	Ensures searching a location centers the map
🗺️ layer-toggle.spec.ts	Verifies switching between satellite & street layers
➕ zoom-controls.spec.ts	Confirms zoom buttons are functional

The focus was quality over quantity, demonstrating testing reasoning rather than bulk.

🧰 Tech Stack
Category	Technology
Framework	React + TypeScript
Bundler	Vite
Styling	TailwindCSS
Mapping	Leaflet (React-Leaflet)
Testing	Playwright
🛠️ Setup Instructions

Run the following commands to install dependencies and start locally:

npm install
npm run dev


Open the local preview URL shown in your terminal.

📦 Build for Production
npm run build


To preview production:

npm run preview

🔧 Architecture Decisions

React + Vite were chosen for fast development, HMR support, and lightweight build output.

Leaflet was selected over Mapbox/Google Maps because:

Free and open-source

Lightweight

Works great with drawing tools and offline tiles

Folder structure is modular and scalable, separating:

UI components

Map logic

Styles

Tests

⚙️ Performance Considerations

Map operations are optimized using memoization and Leaflet’s internal rendering engine.

Zoom and tile loading scale efficiently even with thousands of coordinates or polygons.

Exported GeoJSON remains lightweight to ensure responsiveness.

🧪 Testing Strategy
Question	Answer
What was tested?	Core user journeys: searching, layer toggling, zooming
Why these tests?	They represent essential interactions required for a mapping app
If more time?	I would add tests for polygon drawing, GeoJSON export & UI edge cases
🔄 Trade-offs Made
Decision	Reason
Used Leaflet instead of Google Maps API	Avoid API cost + simpler for drawing tools
Simplified UI components	Faster development aligned with assignment scope
Client-only app	No backend required, easier deployment
🛠️ Production Readiness Improvements (Future Work)

Add error handling for invalid search inputs

Browser caching & offline fallback tiles

User authentication + Saved project layers

CI/CD pipelines with automated testing

⏱️ Time Breakdown
Task	Time
Research & choosing libraries	~1 hr
UI development (Figma match)	~2.5 hrs
Map integration & features	~3 hrs
Writing Playwright tests	~1 hr
README + polish + deployment	~1 hr
Total Time:	~8.5 hours
🔗 Live Demo & Repository

🌍 Live site:
https://ashwin-90.github.io/drone-map/

📦 Repository:
https://github.com/ashwin-90/drone-map

📌 License

This project is open-source and free to use.
