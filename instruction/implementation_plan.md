# Implementation plan

## Phase 1: Environment Setup

1.  Clone the CodeGuide Starter Pro repository from <https://github.com/codeGuide-dev/codeguide-starter-pro> into a new repo. (**Starter Kit: Repo Link**)
2.  Create two Git branches: `main` for production and `dev` for development. (**PRD Section: Project Requirements**)
3.  Verify Node.js is installed with version compatible with Next.js 14. If not, install Node.js (v20.2.1 is required if available; otherwise confirm Next.js 14 compatibility) and confirm using `node -v`. (**Tech Stack: Frontend Tools**)
4.  Ensure that Tailwind CSS, Typescript, and Shadcn UI are present in the package.json. (**Starter Kit: Tech Stack**)
5.  Remove Supabase and Clerk Auth dependencies from the project and add Neon (PostgreSQL) and NextAuth.js + Google OAuth dependencies. (**Key Differences: Database & Auth**)
6.  **Validation**: Run `npm run dev` to ensure the starter kit launches correctly.

## Phase 2: Frontend Development

1.  In `/src/pages`, create a new page `calendar.tsx` to act as the calendar view. (**PRD Section: Calendar - Key Features**)
2.  Add toggle UI elements (e.g., buttons or tabs) to switch between Personal and Team views within `calendar.tsx`. (**PRD Section: Calendar Views**)
3.  Implement the calendar display using Shadcn UI components and Tailwind CSS styling. (**Figma Design: Calendar Layout**)
4.  In `/src/components`, create a new component `EventModal.tsx` that opens as a modal for adding and editing events. (**PRD Section: Calendar Events**)
5.  Within `EventModal.tsx`, add form fields: Event name, Date/Time (start & end), Attendance type dropdown (Telework/Office), Check-in/Check-out/Break times, and Task information (Project, Tags). (**PRD Section: Calendar - Input Form Fields**)
6.  Create a dedicated page `/src/pages/tasks.tsx` for Task Management, listing tasks with capabilities to create and edit tasks. (**PRD Section: Task Management**)
7.  In the same page, add UI components for task attributes (Name, Assignee, Project, Tags, Due Date, Description) and include an indicator for completed tasks and deadline alerts. (**PRD Section: Task Management**)
8.  Build project management UI in `/src/pages/projects.tsx` with functionality for creating/managing projects (Name, Tags, Description, member assignment, search by Name or Tags). (**PRD Section: Project Management**)
9.  Integrate NextAuth.js with Google OAuth in `/src/pages/api/auth/[...nextauth].ts` following NextAuth.js documentation. (**PRD Section: Auth**)
10. **Validation**: Run `npm run dev` and manually navigate to `http://localhost:3000/calendar` and `http://localhost:3000/tasks` to verify UI component rendering and basic interactivity.

## Phase 3: Backend Development

1.  Set up the Neon PostgreSQL database connection by configuring the connection string environment variable in `.env.local`. (**Tech Stack: Database**)
2.  Create a folder `/src/server` and inside it, create modules for each domain: `events.ts`, `tasks.ts`, `projects.ts`, and `admin.ts`.
3.  Define schema migrations for tables: `events`, `tasks`, `projects`, `users`, and any join tables needed for project assignments. Use a migration tool (e.g., Prisma or similar if already in the starter kit) and confirm you are using Neon PostgreSQL. (**PRD Section: Data Models**)
4.  Implement REST API endpoints for calendar events in `/src/pages/api/events/index.ts` (GET, POST, PATCH, DELETE). (**PRD Section: Calendar Events)**
5.  Develop API endpoints for task management in `/src/pages/api/tasks/index.ts` with similar CRUD functionality. (**PRD Section: Task Management**)
6.  Implement project management API endpoints in `/src/pages/api/projects/index.ts`. (**PRD Section: Project Management**)
7.  Build an endpoint for Google Sheets import in `/src/pages/api/admin/importSheets.ts` that handles both manual button trigger and daily Cron job integration. (**PRD Section: Admin Panel & Google Sheets Import**)
8.  Create an endpoint for Google Calendar export in `/src/pages/api/admin/exportCalendar.ts` that exports upcoming 20 days events to a new Google Calendar. (**PRD Section: Google Calendar Export**)
9.  **Validation**: Use Postman or curl to test each API endpoint ensuring proper HTTP status responses and data integrity.

## Phase 4: Integration

1.  Connect the calendar UI in `/src/pages/calendar.tsx` with the `GET /api/events` endpoint using a client-side API call (e.g., using axios or fetch). (**App Flow: Calendar Integration**)
2.  Integrate event creation from the `EventModal.tsx` component with the `POST /api/events` endpoint to add events. (**App Flow: Calendar Event CRUD**)
3.  Wire up task creation forms in `/src/pages/tasks.tsx` with the `POST /api/tasks` endpoint. (**App Flow: Task Integration**)
4.  Connect project management UI with the `POST /api/projects` endpoint to create new projects and manage member assignments. (**App Flow: Project Management Integration**)
5.  Hook up NextAuth.js authentication into the front-end so that protected pages require a valid session. (**PRD Section: Auth**)
6.  Integrate Google Sheets import button in the Admin Panel (create `/src/pages/admin.tsx` if not present) that triggers a call to `/api/admin/importSheets`. (**PRD Section: Admin Panel**)
7.  Link a manual trigger UI for Google Calendar export in `/src/pages/admin.tsx` that calls `/api/admin/exportCalendar`. (**PRD Section: Google Calendar Export**)
8.  **Validation**: Simulate a full user flow by creating a dummy event, task, and project then triggering the Sheets import and Calendar export actions from the UI. Check responses and UI updates.

## Phase 5: Deployment

1.  Prepare a Vercel deployment configuration file (e.g., `vercel.json`) setting necessary routes and environment variables. (**Tech Stack: Hosting**)
2.  Set up Vercel environment variables for the Neon PostgreSQL connection string, NextAuth.js secrets, Google OAuth credentials, Google Sheets API, and Google Calendar API keys. (**PRD Section: Auth & API Integrations**)
3.  Deploy the application to Vercel ensuring that the production branch is set to `main`. (**Tech Stack: Deployment**)
4.  Configure Vercel’s Cron Jobs integration (or use Vercel Serverless Functions scheduled tasks) to hit the `/api/admin/importSheets` endpoint daily. (**PRD Section: Admin Panel - Sheets Import**)
5.  **Validation**: Visit the live URL provided by Vercel and perform end-to-end testing: log in via Google OAuth, navigate to the calendar, create events/tasks/projects, and trigger Google Sheets import and Calendar export actions.

## Additional Validation & Final Checks

1.  Perform browser compatibility tests (desktop-first) across Chrome, Firefox, and Edge. (**PRD Section: Desktop-first**)
2.  Check all form validations (e.g., correct date/time formats, required fields) and error handling on both frontend and backend. (**Q&A: Error Handling**)
3.  Ensure that all API endpoints return proper error codes when invalid data is submitted. (**PRD Section: Error Handling)**
4.  Validate local time consistency on calendar events and ensure no recurring events logic is applied. (**PRD Section: Important Requirements & Constraints**)
5.  Confirm that notifications or alerts for task deadlines function minimally as intended. (**PRD Section: Task Management**)

This plan completes the end-to-end implementation instructions for the web application based on the provided project details and requirements.
