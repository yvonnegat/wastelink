import React, { useState } from "react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

export default function Layout({ children }) {
  const [activePage, setActivePage] = useState("dashboard");
  const [userRole, setUserRole] = useState("seller");

  const user = {
    name: "Amara",
    role: userRole,
  };

  return (
    <div className="app-layout">
      <Sidebar
        activePage={activePage}
        onNavigate={setActivePage}
        user={user}
      />

      <div className="main-area">
        <Topbar
          activePage={activePage}
          userRole={userRole}
          onRoleSwitch={setUserRole}
        />

        <div className="page-content">{children}</div>
      </div>
    </div>
  );
}