# Real-Time Collaborative Document Editor

## 1. Project Overview
I built a simple real-time document editor to explore how collaborative apps work for my CSI application. The goal was to let multiple people type in the same doc and see changes instantly. I kept everything minimal so I could focus on understanding real-time behavior, room isolation, and the basic client/server flow.

## 2. Core Features
- Real-time collaborative editing using Socket.IO.
- Room-based documents at `/doc/:id` (each doc is its own room).
- Create Room: enter a name, get redirected to `/doc/:docId`, doc is created if missing.
- Join Room: enter an existing doc code (and passkey), join the same live doc.
- Leave Room: exits the Socket.IO room and returns to home; the doc is not deleted.
- Username-based authentication (MVP, client-side only) to gate home and docs.
- Works in the browser; testable across multiple tabs or different browsers.

## 3. System Architecture
- Client: Plain HTML + JavaScript for the UI and Socket.IO client for realtime events.
- Server: Node.js + Express to serve static pages and simple REST endpoints.
- Real-time: Socket.IO manages rooms per document so updates stay scoped.
- Source of truth: The server keeps the document state in memory and broadcasts changes.
- Isolation: Each `/doc/:id` maps to a Socket.IO room; events stay inside that room.

## 4. Authentication (MVP)
I use a simple username prompt stored in `sessionStorage`. There is no password, database, or OAuth. Protected pages (home and any `/doc/:id`) check for a username on load; if missing, the user is redirected to `login.html`. This keeps the flow realistic without overbuilding auth.

## 5. Consistency & Real-Time Behavior
- Real-time sync: When I type, the client emits a change event to the server; the server updates its copy and broadcasts to others in the same room.
- Read-your-writes: I see my own edits immediately because the local input is updated before/while the server echoes to others.
- Propagation: Other users receive the update through Socket.IO and apply it to their editor, so everyone converges on the same text.

## 6. Design Decisions & Trade-offs
- In-memory storage: Simpler for an MVP and easy to reason about; trades off persistence.
- Minimal UI

## 7. How to Run the Project
1. Install dependencies: `npm install`
2. Start the server: `node server.js`
3. Open the browser: go to `http://localhost:3000/login.html`
4. Test with multiple tabs or browsers: log in as different usernames and join the same `/doc/:id`.

## 8. Future Scope
- Persistent database storage so docs survive server restarts.
- Proper authentication (e.g., OAuth or password-based) with server-side sessions.
- Rich text or block-based editing for more flexible documents.
- Permissions/ownership controls for safer collaboration.