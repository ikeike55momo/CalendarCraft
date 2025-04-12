# Tech Stack Document

## Introduction

The application is a web-based tool designed to simplify attendance and scheduling management for a team of 10 members. It offers a personal calendar view to track individual events and a team view to monitor collective schedules. The chosen technology stack is designed to provide a smooth user experience through modern, responsive design while ensuring reliable data management and integration with external services like Google Sheets and Google Calendar. This document explains the reasoning behind each technology choice in clear, everyday language so that anyone can understand how the various components work together to achieve the project's goals.

## Frontend Technologies

The user interface is built with Next.js and styled using Tailwind CSS. Next.js provides an efficient and powerful framework that makes it easy to build dynamic web pages with fast performance. Tailwind CSS is used to craft modern, responsive designs that look great on desktops, which is a priority for this project. In addition, Typescript is used to add a layer of safety to our code by catching errors early, which makes the development process smoother and more reliable. We also use Shadcn UI, a collection of pre-built components that speeds up development while ensuring consistency in design.

## Backend Technologies

On the backend, the application originally called for a PostgreSQL database hosted on Neon to store attendance, scheduling, and task data. While the starter kit includes Supabase as a potential database option, for this project we chose Neon as it aligns better with the project requirements and our proven PostgreSQL strategies. For handling authentication, the project relies on NextAuth.js combined with Google OAuth. This choice ensures a secure and user-friendly login process by allowing users to sign in with their Google accounts. Although the starter kit originally suggested Clerk Auth, the decision here is to favor NextAuth.js to precisely match the project’s need for integration with Google accounts and role-based access control between administrators and team members.

## Infrastructure and Deployment

The application is hosted on Vercel, a platform well known for its seamless integration with Next.js apps and serverless API endpoints. Vercel supports continuous integration and deployment pipelines, ensuring that updates to the application are quickly and reliably delivered to users. Version control is managed with Git, which allows developers to track changes and collaborate efficiently. This choice of infrastructure not only improves the stability and scalability of the project but also simplifies maintenance and future enhancements.

## Third-Party Integrations

To extend the application’s functionality, several third-party integrations are utilized. The Google Sheets API is used to import schedule data automatically at midnight and via a manual trigger by the administrator. Similarly, the Google Calendar API enables users to export their upcoming 20 days of events to a new calendar in their Google account, allowing for easy synchronization of personal events. Additionally, Cursor, an advanced IDE tool with real-time AI coding suggestions, is integrated to assist developers in maintaining high-quality code and speedy development cycles. These integrations help the application connect with widely used tools, making it easier for users to manage their schedules without needing to manually input all data.

## Security and Performance Considerations

Security is a primary concern, and the app leverages NextAuth.js with Google OAuth for robust authentication. This setup ensures that only authorized users can sign in and access specific features, with strict role-based access control distinguishing administrators from general team members. Data is stored securely in a PostgreSQL database managed by Neon, with best practices in place to safeguard sensitive information. Performance is optimized through the use of Next.js, which offers features like server-side rendering and incremental static regeneration. This ensures that pages load quickly and interact smoothly even as data complexity grows over time. The choice to host on Vercel further contributes to rapid deployment and excellent overall performance.

## Conclusion and Overall Tech Stack Summary

In summary, the project leverages a well-balanced technology stack that marries modern frontend design with robust backend infrastructure and reliable third-party integrations. Next.js, Tailwind CSS, and Typescript form the cornerstone of a responsive and developer-friendly user interface, while Neon with PostgreSQL and NextAuth.js with Google OAuth ensure secure and efficient data management. Vercel’s hosting capabilities and CI/CD pipelines guarantee that the app remains stable and scalable. Additionally, integrations with the Google Sheets and Calendar APIs extend the app’s functionality, allowing seamless data import and export. By carefully choosing each technology, the project meets its goals of delivering an intuitive, secure, and efficient scheduling and attendance management system for its users.
