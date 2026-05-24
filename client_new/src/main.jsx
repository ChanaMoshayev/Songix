// // import { StrictMode } from 'react'
// // import { createRoot } from 'react-dom/client'
// // import './index.css'
// // import App from './App.jsx'

// // createRoot(document.getElementById('root')).render(
// //   <StrictMode>
// //     <App />
// //   </StrictMode>,
// // )

// // import React from 'react';
// // import ReactDOM from 'react-dom/client';
// // import App from './App';
// // import { BrowserRouter } from 'react-router-dom';

// // ReactDOM.createRoot(document.getElementById('root')).render(
// //   <BrowserRouter>
// //     <App />
// //   </BrowserRouter>
// // );


// import React from 'react';
// import ReactDOM from 'react-dom/client';
// import App from './App.jsx';
// import { MyProvider } from './context/MyContext.jsx';
// import { BrowserRouter } from 'react-router-dom';

// ReactDOM.createRoot(document.getElementById('root')).render(
//   <React.StrictMode>
//     <MyProvider>
//       <BrowserRouter>
//         <App />
//       </BrowserRouter>
//     </MyProvider>
//   </React.StrictMode>
// );

import React from "react";
import ReactDOM from "react-dom/client";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import App from "./App.jsx";
import { MyProvider } from "./context/MyContext.jsx";
import appTheme from "./theme.js";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ThemeProvider theme={appTheme}>
      <CssBaseline />
      <MyProvider>
        <App />
      </MyProvider>
    </ThemeProvider>
  </React.StrictMode>
);