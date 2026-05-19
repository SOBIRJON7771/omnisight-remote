/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Home } from "./pages/Home";
import { AdminTerminal } from "./pages/AdminTerminal";
import { AgentClient } from "./pages/AgentClient";

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-orange-500/30">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/admin/:sessionId" element={<AdminTerminal />} />
          <Route path="/agent" element={<AgentClient />} />
          <Route path="/agent/:sessionId" element={<AgentClient />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

