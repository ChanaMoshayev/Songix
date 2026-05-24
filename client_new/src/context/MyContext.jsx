// // // context/MyContext.jsx
// // import { createContext, useContext, useEffect, useState } from "react";
// // import { getSongs } from "../services/songService";

// // export const MyContext = createContext();

// // export function MyProvider({ children }) {
// //   // ===== USER =====
// //   const [user, setUser] = useState(null);
// //   const login = (username, password) => {
// //     if (username === "admin" && password === "1234") {
// //       const userData = { username };
// //       setUser(userData);
// //       localStorage.setItem("user", JSON.stringify(userData));
// //       return true;
// //     }
// //     return false;
// //   };
// //   const logout = () => {
// //     setUser(null);
// //     localStorage.removeItem("user");
// //   };
// //   useEffect(() => {
// //     const savedUser = localStorage.getItem("user");
// //     if (savedUser) setUser(JSON.parse(savedUser));
// //   }, []);

// //   // ===== SONGS =====
// //   const [songs, setSongs] = useState([]);
// //   const [loading, setLoading] = useState(true);
// //   const [error, setError] = useState("");

// //   useEffect(() => {
// //     getSongs()
// //       .then(res => setSongs(res.data))
// //       .catch(err => setError(err.message))
// //       .finally(() => setLoading(false));
// //   }, []);

// //   return (
// //     <MyContext.Provider
// //       value={{
// //         user,
// //         login,
// //         logout,
// //         songs,
// //         setSongs,
// //         loading,
// //         error,
// //       }}
// //     >
// //       {children}
// //     </MyContext.Provider>
// //   );
// // }

// // export function useAppContext() {
// //   return useContext(MyContext);
// // }


// // context/MyContext.jsx
// import { createContext, useContext, useEffect, useState } from "react";
// import { getSongs } from "../services/songService";

// export const MyContext = createContext();

// export function MyProvider({ children }) {
//   // USER
//   const [user, setUser] = useState(null);
//   const login = (username, password) => {
//     if (username === "admin" && password === "1234") {
//       const userData = { username };
//       setUser(userData);
//       localStorage.setItem("user", JSON.stringify(userData));
//       return true;
//     }
//     return false;
//   };
//   const logout = () => {
//     setUser(null);
//     localStorage.removeItem("user");
//   };
//   useEffect(() => {
//     const savedUser = localStorage.getItem("user");
//     if (savedUser) setUser(JSON.parse(savedUser));
//   }, []);

//   // SONGS
//   const [songs, setSongs] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState("");

//   useEffect(() => {
//     getSongs()
//       .then(res => setSongs(res.data))
//       .catch(err => setError(err.message))
//       .finally(() => setLoading(false));
//   }, []);

//   return (
//     <MyContext.Provider value={{ user, login, logout, songs, setSongs, loading, error }}>
//       {children}
//     </MyContext.Provider>
//   );
// }

// export function useAppContext() {
//   return useContext(MyContext);
// }



import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { friendlyApiMessage, fetchSongsPageFeatured, fetchSongsList } from "../utils/apiBase.js";

export const MyContext = createContext();

export function MyProvider({ children }) {
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [songsPageFeatured, setSongsPageFeatured] = useState(null);

  const refreshSongs = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [songsList, featuredData] = await Promise.all([
        fetchSongsList(),
        fetchSongsPageFeatured().catch(() => null),
      ]);
      setSongs(songsList);
      setSongsPageFeatured(featuredData?.kind === "contest" ? featuredData : null);
    } catch (e) {
      setSongs([]);
      setError(friendlyApiMessage(e?.message) || "שגיאה בטעינת שירים");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const ac = new AbortController();

    async function loadSongs() {
      setLoading(true);
      setError("");
      try {
        fetchSongsPageFeatured()
          .then(data => {
            if (ac.signal.aborted) return;
            setSongsPageFeatured(data?.kind === "contest" ? data : null);
          })
          .catch(() => {
            if (!ac.signal.aborted) setSongsPageFeatured(null);
          });

        const songsList = await fetchSongsList(ac.signal);
        if (ac.signal.aborted) return;
        setSongs(songsList);
      } catch (e) {
        if (e?.name === "AbortError") return;
        setSongs([]);
        setSongsPageFeatured(null);
        setError(friendlyApiMessage(e?.message) || "שגיאה בטעינת שירים");
      } finally {
        if (!ac.signal.aborted) setLoading(false);
      }
    }

    loadSongs();
    return () => ac.abort();
  }, []);

  return (
    <MyContext.Provider
      value={{ songs, setSongs, loading, error, refreshSongs, songsPageFeatured, setSongsPageFeatured }}
    >
      {children}
    </MyContext.Provider>
  );
}

export function useAppContext() {
  return useContext(MyContext);
}