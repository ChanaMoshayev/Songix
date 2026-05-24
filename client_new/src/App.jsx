// import React from "react";
// import { BrowserRouter, Routes, Route } from "react-router-dom";
// import SongsPage from "./pages/SongsPage";
// import SongDetails from "./pages/SongDetails";
// import { MyProvider } from "./context/MyContext"; // Context מאוחד user+songs

// function Home() {
//   return <h1>ברוך הבא לדף הבית!</h1>;
// }

// function App() {
//   return (
//     <MyProvider>
//       <BrowserRouter>
//         <Routes>
//           <Route path="/" element={<SongsPage />} />
//           <Route path="/home" element={<Home />} />
//           <Route path="/songs/:id" element={<SongDetails />} />
//         </Routes>
//       </BrowserRouter>
//     </MyProvider>
//   );
// }

// export default App;


import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import SongsPage from "./pages/SongsPage.jsx";
import SongDetails from "./pages/SongDetails.jsx";
import ProfilePage from "./pages/ProfilePage.jsx";
import OnboardingPage from "./pages/OnboardingPage.jsx";
import Login from "./components/Login.jsx";
import ContestPage from "./pages/ContestPage.jsx";
import ContestNewLyricsPage from "./pages/ContestNewLyricsPage.jsx";
import ContestNewMelodyPage from "./pages/ContestNewMelodyPage.jsx";
import { MyProvider } from "./context/MyContext.jsx";
import Navbar from "./components/Navbar.jsx";
import ScrollToTop from "./components/ScrollToTop.jsx";
import AdminRoute from "./components/AdminRoute.jsx";
import AdminLayout from "./pages/admin/AdminLayout.jsx";
import AdminSongsPage from "./pages/admin/AdminSongsPage.jsx";
import AdminContestsPage from "./pages/admin/AdminContestsPage.jsx";
import AdminArtistsPage from "./pages/admin/AdminArtistsPage.jsx";
import { AuthProvider, RedirectIfAuthed } from "./components/AuthGate.jsx";

function shouldShowMainNavbar(pathname) {
  if (pathname.startsWith("/admin")) return false;
  if (pathname === "/" || pathname === "/login" || pathname === "/register") return false;
  return (
    pathname.startsWith("/songs") ||
    pathname.startsWith("/contest") ||
    pathname.startsWith("/profile")
  );
}

function AppShell() {
  const location = useLocation();
  const showNavbar = shouldShowMainNavbar(location.pathname);

  return (
    <>
      <ScrollToTop />
      {showNavbar ? <Navbar /> : null}
      <Routes>
        <Route
          path="/"
          element={
            <RedirectIfAuthed>
              <OnboardingPage />
            </RedirectIfAuthed>
          }
        />
        <Route
          path="/login"
          element={
            <RedirectIfAuthed>
              <Login />
            </RedirectIfAuthed>
          }
        />
        <Route
          path="/register"
          element={
            <RedirectIfAuthed>
              <OnboardingPage />
            </RedirectIfAuthed>
          }
        />
        <Route path="/songs" element={<SongsPage />} />
        <Route path="/contest" element={<ContestPage />} />
        <Route path="/contest/new-lyrics" element={<ContestNewLyricsPage />} />
        <Route path="/contest/new-melody" element={<ContestNewMelodyPage />} />
        <Route path="/songs/:id" element={<SongDetails />} />
        <Route path="/profile/:userId" element={<ProfilePage />} />
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminLayout />
            </AdminRoute>
          }
        >
          <Route index element={<Navigate to="songs" replace />} />
          <Route path="songs" element={<AdminSongsPage />} />
          <Route path="artists" element={<AdminArtistsPage />} />
          <Route path="contests" element={<AdminContestsPage />} />
        </Route>
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <MyProvider>
      <BrowserRouter>
        <AuthProvider>
          <AppShell />
        </AuthProvider>
      </BrowserRouter>
    </MyProvider>
  );
}
