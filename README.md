# Wallet-Wise (Full-Stack Expense Tracker)

A minimal personal finance tool built to handle real-world network conditions, ensuring data correctness and a reliable user experience.

## 🚀 Key Design Decisions

### 1. Data Correctness & Money Handling

* 
**Integers for Currency**: To avoid floating-point binary arithmetic errors (e.g., `0.1 + 0.2 !== 0.3`), all money values are converted to **cents (integers)** before being sent to the API and stored in the database.


* 
**Relational Persistence**: I chose **SQLite** because it provides robust data persistence and allows for efficient server-side filtering and sorting as requested.



### 2. Resilience under Real-World Conditions

* 
**Idempotency Mechanism**: To handle users clicking "Submit" multiple times or refreshing the page during a slow response, the frontend generates a unique `Idempotency-Key` (UUID) for every new entry. The backend tracks these keys to prevent duplicate records in the database.


* 
**State Management**: The UI includes **loading states** to disable the submit button while a request is in flight, preventing accidental double-submissions.



### 3. Feature Set

* 
**Dynamic Calculations**: The "Total Visible" display updates in real-time based on the user's active category filters and sort order.


* 
**Server-Side Logic**: Filtering by category and sorting by date (newest first) are handled via API query parameters to ensure the system remains performant as the data grows.



## 🛠️ Trade-offs & Omissions

* 
**Authentication**: Given the timebox, I omitted user accounts to focus on core data integrity and idempotency requirements.


* 
**Styling**: I prioritized clarity and correctness over complex animations, using a clean, modern interface powered by Tailwind CSS.


* 
**Testing**: I focused on manual edge-case testing (e.g., rapid clicks and network retries) to verify the idempotency logic.



## 🏃 How to Run Locally

### Prerequisites

* Node.js (LTS version recommended)

### 1. Setup Backend

```bash
cd server
npm install
node server.js

```

The server will run on `http://localhost:3001`.

### 2. Setup Frontend

```bash
cd client
npm install
npm run dev

```

Open `http://localhost:5173` in your browser.

---





