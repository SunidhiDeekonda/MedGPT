# MedGPT

MedGPT is a beginner-friendly full-stack web app for symptom-based health chat guidance. It uses a React frontend, an Express backend, MongoDB for saved users and chat history, and Groq for AI replies.

## Folder Structure In Simple Words

### Root folder

- `backend/`: the server side of the app
- `medgpt-frontend/`: the website users open in the browser
- `package.json`: small helper scripts to run frontend or backend from the root

### `backend/`

- `server.js`: starts the Express server and connects all routes
- `routes/authRoutes.js`: signup, login, reset password, verify email, profile
- `routes/chatRoutes.js`: sends messages to Groq and returns AI responses
- `routes/chatHistoryRoutes.js`: saves and loads old chats from MongoDB
- `models/User.js`: describes how user data is stored
- `models/Chat.js`: describes how chat history is stored
- `middleware/authMiddleware.js`: checks whether the user is logged in
- `config/db.js`: connects to MongoDB
- `config/env.js`: loads environment variables from `.env`
- `utils/`: helper code for validation, tokens, links, and formatting

### `medgpt-frontend/`

- `src/App.js`: frontend route setup
- `src/pages/Login.js`: login page
- `src/pages/Signup.js`: signup page
- `src/pages/Chat.js`: main chat screen
- `src/pages/Profile.js`: profile page
- `src/pages/ForgotPassword.js`: request reset link
- `src/pages/ResetPassword.js`: set a new password
- `src/pages/VerifyEmail.js`: verify account token
- `src/utils/auth.js`: save and clear JWT auth in the browser
- `src/config.js`: tells the frontend where the backend API lives

## Recommended Auth System

The easiest auth system to keep for this project is the built-in email/password JWT flow.

Why this is the best beginner option:

- the whole logic is inside your project
- it already supports signup, login, password reset, email verification, and profile editing
- it is easier to deploy because the app can run without Clerk configuration

## How The App Works

1. A user signs up or logs in from the frontend.
2. The backend returns a JWT token after login.
3. The frontend stores that token in `localStorage`.
4. Protected requests send the token in the `Authorization` header.
5. The backend checks that token before allowing private routes.
6. Chat requests go to `/api/chat`.
7. Saved conversation history goes to MongoDB through `/api/history`.

## Local Setup

### 1. Install dependencies

```bash
npm install
npm --prefix backend install
npm --prefix medgpt-frontend install
```

### 2. Create environment files

```bash
cp backend/.env.example backend/.env
cp medgpt-frontend/.env.example medgpt-frontend/.env
```

### 3. Fill in your environment variables

Backend `backend/.env`

- `MONGO_URI`: your MongoDB connection string
- `GROQ_API_KEY`: your Groq API key
- `JWT_SECRET`: a long random secret
- `FRONTEND_URL`: usually `http://localhost:3000`
- `PORT`: usually `5001`

Frontend `medgpt-frontend/.env`

- `REACT_APP_API_BASE_URL`: usually `http://localhost:5001/api`

### 4. Start the app

Backend:

```bash
npm run start:backend
```

Frontend:

```bash
npm run start:frontend
```

Open [http://localhost:3000](http://localhost:3000).

## GitHub

Your repo remote is already connected to:

- `https://github.com/SunidhiDeekonda/MedGPT.git`

To push your project:

```bash
git add .
git commit -m "Prepare MedGPT for GitHub and deployment"
git push origin main
```

## Public Website Link

To make the site accessible from any device, the simplest setup is:

- frontend on Vercel
- backend on Render
- database on MongoDB Atlas

### Deploy backend on Render

1. Push this repo to GitHub.
2. In Render, create a new Web Service.
3. Connect the GitHub repo.
4. Set the service root directory to `backend`.
5. Use:

```bash
Build Command: npm install
Start Command: npm start
```

6. Add the environment variables from `backend/.env.example`.
7. After deployment, Render will give you a backend URL such as:
   `https://medgpt-api.onrender.com`

### Deploy frontend on Vercel

1. Import the GitHub repo into Vercel.
2. Set the root directory to `medgpt-frontend`.
3. Add this environment variable:

```text
REACT_APP_API_BASE_URL=https://your-render-backend-url/api
```

4. Deploy.
5. Vercel will give you a public website link that works on phones, laptops, and tablets.

## Important Before Pushing

- do not commit real `.env` files
- do not commit `node_modules`
- if any secret was ever uploaded before, rotate it

## Good Next Improvements

- add backend tests for auth and chat routes
- add request rate limiting
- improve medical safety rules for risky prompts
- replace dev-only reset and verification links with real email sending
- later migrate the frontend from Create React App to Vite
