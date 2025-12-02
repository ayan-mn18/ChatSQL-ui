# ChatSQL Dashboard Implementation Plan

## 1. Overview
Create a futuristic, dark-themed dashboard for ChatSQL that allows users to manage database connections, visualize tables, and execute SQL queries with AI assistance. The design must align with the `ChatSQLLanding` aesthetic (glassmorphism, purple accents, dark mode).

## 2. Routing Structure
We will use nested routes in `react-router-dom`.

- `/dashboard` -> `DashboardLayout` (Main Sidebar + Outlet)
  - `/dashboard` (index) -> Redirects to `/dashboard/connections` or shows Analytics summary.
  - `/dashboard/connections` -> `ConnectionsPage` (List of connections + Add button)
  - `/dashboard/analytics` -> `AnalyticsPage` (Global stats)
  - `/dashboard/settings` -> `SettingsPage`
  - `/dashboard/connection/:id` -> `ConnectionLayout` (Connection Sidebar + Outlet)
    - `/dashboard/connection/:id/overview` -> `ConnectionOverview` (Visualizer)
    - `/dashboard/connection/:id/tables/:tableName` -> `TableView` (Data grid)
    - `/dashboard/connection/:id/sql` -> `SQLEditor` (AI-powered)
    - `/dashboard/connection/:id/visualizer` -> `SchemaVisualizer` (ERD)

## 3. Component Architecture

### Layouts
1.  **DashboardLayout**:
    *   **Sidebar (Left)**:
        *   Top: ChatSQL Logo (Small).
        *   Menu: Connections, Analytics.
        *   Bottom: Settings, Notifications, User Profile.
    *   **Main Content**: Render `<Outlet />`.

2.  **ConnectionLayout**:
    *   **Sidebar (Left - Secondary)**:
        *   Top: Back to Dashboard button.
        *   Context: Current Connection Name/Status.
        *   Menu:
            *   **Tables** (Collapsible/Dropdown list of tables).
            *   **SQL Editor**.
            *   **Visualizer** (ERD).
    *   **Main Content**: Render `<Outlet />`.

### Pages & Features

1.  **ConnectionsPage**:
    *   **Empty State**: "No connections found".
    *   **Action**: "Add Connection" button (Plus icon).
    *   **Modal (Dialog)**: "Add New Connection".
        *   Form Fields: Host, Port, User, Password, Database Name.
        *   Tooltip: "Credentials are encrypted and stored locally."
        *   Actions: "Test Connection", "Save Connection".
    *   **List State**: Grid of connection cards (once added).

2.  **TableView**:
    *   **Header**: Table Name, Row Count.
    *   **Actions**: Refresh, Add Row, Delete Row (Top Right).
    *   **Grid**: Data table with sortable columns.
    *   **Footer**: Pagination controls (Bottom Left).

3.  **SQLEditor**:
    *   **Split View**:
        *   Top/Left: Code Editor (Monaco or simple textarea with highlighting).
        *   AI Input: "Ask AI to write SQL..." (Autocorrect style).
    *   **Results**: Data table below.

4.  **AnalyticsPage**:
    *   Charts showing query usage, inserts/updates count.

## 4. UI Components (Shadcn & React Bits)
We will utilize the following components:
-   **Layout**: `Sidebar`, `ResizablePanel` (for SQL editor split).
-   **Feedback**: `Dialog` (Modals), `Tooltip`, `Toast` (Notifications), `Alert`.
-   **Data Display**: `Table`, `Card`, `Badge`, `ScrollArea`.
-   **Forms**: `Input`, `Button`, `Form`, `Select`, `Label`.
-   **Navigation**: `DropdownMenu`, `Tabs`, `Breadcrumb`.
-   **Icons**: `Lucide React`.

## 5. State Management
-   **Connections Store**: Use `zustand` or React Context to manage the list of connections and the currently active connection.
-   **Mock Data**: Since there is no real backend yet, we will mock the "Test Connection" and "Execute SQL" responses.

## 6. Execution Steps

### Phase 1: Setup & Layouts
1.  Install necessary Shadcn components.
2.  Create `DashboardLayout` and `Sidebar` components.
3.  Configure Routes in `App.tsx`.

### Phase 2: Connections Management
1.  Create `ConnectionsPage`.
2.  Implement "Add Connection" Dialog with Form.
3.  Implement Mock Connection Testing & Saving.

### Phase 3: Connection Detail Views
1.  Create `ConnectionLayout` (Secondary Sidebar).
2.  Implement `TableView` (Mock data).
3.  Implement `SQLEditor` with AI input stub.

### Phase 4: Polish
1.  Apply "ChatSQL" theme (Glassmorphism, Animations).
2.  Add Analytics charts (Recharts or similar).
