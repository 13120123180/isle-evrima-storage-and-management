# Isle Evrima Storage And Management

This project provides a comprehensive backend and frontend solution for the "Isle Evrima" game server. It includes features like player authentication, character management, and server administration.

## Features

- **Player Authentication:** Secure login for players.
- **Character Management:** View, delete, sell, and grow in-game characters.
- **Daily Check-in:** Players can check in daily to earn points.
- **Ban System:** Propose, vote on, and manage player bans.
- **Admin Panel:** A private GUI for server management.
- **RCON Integration:** Execute server commands remotely.
- **KOOK Integration:** Send server announcements to KOOK.
- **Scheduled Tasks:** Automatic server restarts and cleanup.
- **API Documentation:** Detailed API docs for public and private endpoints.

## Project Structure

The project is a monorepo with the following packages:

- `packages/backend`: Node.js backend server.
- `packages/private_gui`: Vue.js frontend for the admin panel.
- `packages/public_gui`: Vue.js frontend for the public-facing player portal.

## Installation

1. **Clone the repository:**

   ```bash
   git clone https://github.com/your-username/isle-evrima-storage-and-management.git
   cd isle-evrima-storage-and-management
   ```

2. **Install dependencies for all packages:**
   ```bash
   yarn install
   ```

## Configuration

1. **Backend:**

   - Navigate to `packages/backend`.
   - Create a `.env.prod` file by copying `.env.dev`.
   - Update the environment variables in `.env.prod` with your server configuration.

2. **Frontend:**
   - The frontend applications are configured to connect to the backend API.

## Running the Application

1. **Start the backend server:**

   ```bash
   cd packages/backend
   yarn start
   ```

2. **Build and serve the frontend applications:**

   - **Private GUI (Admin Panel):**
     ```bash
     cd packages/private_gui
     yarn build
     # Serve the 'dist' folder with a static server.
     ```
   - **Public GUI (Player Portal):**
     ```bash
     cd packages/public_gui
     yarn build
     # Serve the 'dist' folder with a static server.
     ```

3. **Register as a Windows service:**

   ```bash
   yarn install
   yarn uninstall
   ```

4. **Manage the Windows service:**

   - **PowerShell**

     ```bash
     net start iesam
     net stop iesam
     ```

   - **CMD**
     ```bash
     sc start iesam
     sc stop iesam
     ```

## API Documentation

- **Public API:** See `docs/API_DOC_PUBLIC.md`
- **Private API:** See `docs/API_DOC_PRIVATE.md`
