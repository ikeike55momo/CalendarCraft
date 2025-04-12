# Project Requirements Document (PRD)

---

## 1. Project Overview

This project is a web application designed to manage attendance and scheduling for a team of 10 members. The main idea is to provide two calendar views – one for individual schedules (personal calendar) and one that aggregates the entire team’s events (team calendar). Users will be able to input attendance records such as check-in/check-out times, schedule tasks, and manage projects. In addition, the app will integrate with external services like Google Sheets for import and Google Calendar for export of scheduling data, ensuring seamless data flow. The app is built on Next.js, hosted on Vercel, and uses Neon (PostgreSQL) for its database, while authentication is managed with NextAuth.js using Google OAuth.

The core purpose of the app is to simplify team scheduling and attendance management by combining various functions in one platform. It is being built to streamline operations with one intuitive interface that bridges manual inputs and automated data imports/exports. Key objectives include ease-of-use for non-technical team members, accurate and up-to-date scheduling and attendance recording, and an extensible design that can incorporate future enhancements like weekly reports and notifications.

---

## 2. In-Scope vs. Out-of-Scope

**In-Scope:**

- Calendar functionality that allows toggling between "personal" and "team" views.
- Attendance management allowing users to record planned and actual working times, including multiple break periods.
- Task management integrated with attendance, where tasks can be created and linked to projects.
- Project management module where projects (as parent entities for tasks) can be created, managed, and associated with team members.
- Integration with Google Sheets API for data import via an automated daily job at midnight and a manual import button for administrators.
- Google Calendar export that creates a new calendar and synchronizes the upcoming 20 days of events for each user.
- A dedicated admin panel for operations such as managing team members, importing spreadsheet data, and managing projects.
- Minimal task deadline reminders to alert users on pending tasks.

**Out-of-Scope:**

- Recurring events support; all events will be manually created on a one-off basis.
- Advanced mobile or tablet optimized interfaces; the primary design and usage are for desktop environments.
- Audit logs or a history tracking feature for changes in attendance, tasks, or schedule data.
- Sophisticated error handling, logging, or notifications for failed Google Sheets imports beyond basic operations.
- Two-way calendar synchronization (only one-way export to Google Calendar is implemented, without conflict resolution).
- Expansion of roles beyond "admin" and "member" (no sub-administrators for the initial release).

---

## 3. User Flow

A typical user journey begins when a user visits the application and is prompted to sign in via Google OAuth integrated through NextAuth.js. Once authenticated, the user is identified as either an administrator or a general team member. After logging in, the user is directed to the dashboard where they immediately choose between the personal and team calendar views. In the personal view, users see only their own scheduled events, attendance records, and tasks, while the team view aggregates and displays data for all team members. From here, the user can interact with the calendar, click on a specific date cell, and bring up a modal window for adding or editing events.

For administrators, the journey includes an additional layer of access dedicated to management tasks. After signing in, the admin can navigate to a specialized management panel where they can execute manual imports from Google Sheets, manage team members by adding or editing user details and roles, and oversee project configurations. Both user types can export individual schedules to Google Calendar by clicking the export button, which creates a new calendar with their upcoming events. Task deadlines trigger simple alerts, ensuring that users are reminded of pending actions, thus creating a straightforward and cohesive experience across scheduling, task management, and administrative functions.

---

## 4. Core Features

- **Calendar Functionality:**
  - Toggle between a personal view (user-specific events) and a team view (all team members' events).
  - Display attendance plans, actual attendance logs, and tasks on a per-date basis.
  - Interactive date cells that open modals/tooltips showing detailed event information.
  - Input forms within modals allowing for data entry such as event name, start and end times, attendance type (e.g., teleworking, on-site), break periods, and task details.

- **Attendance Management:**
  - Manual entry of check-in, check-out, and multiple break entries.
  - Distinct recording of planned attendance versus actual attendance.
  - Ability for users to view and edit their attendance records directly from the calendar interface.

- **Task Management:**
  - Dedicated task management screen for creating and editing tasks.
  - Tasks include fields for task name, assigned team member, linked project, tags, due dates, and detailed descriptions.
  - Notification alerts for approaching deadlines.

- **Project Management:**
  - Create and manage projects with details such as name, tags, and descriptions.
  - Associate multiple team members with projects.
  - Enable project search and filtering by name or tag.
  - Foundation for future enhancements (e.g., weekly reports per project).

- **Google Sheets Integration:**
  - Automated daily import of scheduling and attendance data at midnight via Vercel’s Cron Jobs.
  - Manual import option for the administrator from the management panel.

- **Google Calendar Export:**
  - Export individual schedules to a new Google Calendar.
  - One-way export ensuring personal schedules for the upcoming 20 days are synchronized.
  - Ability to manually re-trigger the export to update the calendar.

- **Administrative Control Panel:**
  - Access restricted to administrators.
  - Tools for managing Google Sheets imports, team member details, and project configurations.
  - User role management limited to “admin” and “member.”

- **Authentication & Security:**
  - Secure sign-in through NextAuth.js and Google OAuth.
  - Role-based access control ensuring only authorized users access administrative functionalities.

---

## 5. Tech Stack & Tools

- **Frontend Framework:** Next.js for building the comprehensive user interface.
- **Styling:** Tailwind CSS for responsive and modern designs with a focus on desktop usage.
- **Language:** Typescript to enforce strong typing and code maintainability.
- **User Interface Components:** Shadcn UI for pre-built components.
- **Authentication:** NextAuth.js paired with Google OAuth for secure sign-ins.
- **Database:** Neon (PostgreSQL) as the primary data store.
- **Hosting:** Vercel, which integrates both the frontend and serverless API endpoints.
- **APIs & External Integrations:**
  - Google Sheets API for importing spreadsheet data.
  - Google Calendar API for the export functionality.
- **Additional Tools:**
  - Cursor for advanced IDE support with real-time AI-powered suggestions.
- **Potential AI Integration:** Open AI for any future enhancements that may involve AI features.

---

## 6. Non-Functional Requirements

- **Performance:**  
  The platform is optimized for a small team (10 members) with responsive interactions on desktop. Page load and response times should be minimal, ensuring a smooth user experience.

- **Security:**  
  User authentication is strictly handled via NextAuth.js and Google OAuth, with access controls to ensure only admins perform sensitive management actions. User data is protected through the use of secure identifiers such as Google sub/email.

- **Usability:**  
  The user interface is intuitive, achieving clear separation between personal and team views. Modals for data entry and alerts for task deadlines are designed to simplify user interactions.

- **Scalability & Extensibility:**  
  Although the initial group is limited to 10 users, the code structure allows for future expansions such as weekly report creation and notification enhancements. The design is built with extensibility in mind for future features.

---

## 7. Constraints & Assumptions

- The app will strictly use local time settings for calendar displays.
- All events will be manually created; recurring events are not supported in the initial release.
- Mobile responsiveness is a lower priority; the interface is optimized for desktop usage with a recommended experience on PCs.
- Only two roles will be available: "admin" (the single project administrator) and "member" (team members).
- The system assumes basic error handling will suffice for automated tasks like the Google Sheets import, with no advanced logging required initially.
- The export to Google Calendar is one-way only, meaning no conflict resolution process is necessary.
- The development environment is predicated on the availability of Vercel’s Cron Jobs for scheduled tasks.

---

## 8. Known Issues & Potential Pitfalls

- Handling multiple break inputs in the attendance module may require careful database design to ensure data integrity.
- The minimal error handling for Google Sheets imports could lead to silent failures; while not prioritized now, a simple logging mechanism might be added later.
- The one-way Google Calendar export may lead to potential duplicate calendars if users repeatedly export without clearing previous data. Clear user guidelines and perhaps future clean-up mechanisms could mitigate this.
- Vercel’s Cron Jobs might have limitations in terms of frequency and error messaging; the design should account for these limitations during the import process.
- User role management is simple, but any change in requirements might necessitate a more robust permission framework, particularly if the team expands or additional roles are introduced in future phases.

---

This PRD serves as the comprehensive reference for this attendance and scheduling web application. All subsequent technical documents—for the tech stack, frontend guidelines, backend structure, and implementation plans—will be based on these detailed specifications to avoid any misunderstandings or ambiguities during development.