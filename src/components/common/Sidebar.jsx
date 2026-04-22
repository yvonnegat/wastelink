import React from "react";
import Icon from "../common/Icon";

const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", icon: "home" },
  { id: "listing", label: "List Waste", icon: "list" },
  { id: "vision", label: "AI Verification", icon: "eye" },
  { id: "pricing", label: "Pricing", icon: "dollar" },
  { id: "map", label: "Find Recyclers", icon: "map" },
  { id: "transactions", label: "Transactions", icon: "txn", badge: "5" },
];

export default function Sidebar({ activePage, onNavigate, user }) {
  const initials = user?.name
    ? user.name
        .split(" ")
        .map((w) => w[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "WL";

  return (
    <aside className="sidebar">
      {/* LOGO */}
      <div>
        <div className="logo-icon">
          <Icon name="leaf" size={20} />
        </div>

        <div className="logo-text">WasteLink</div>
        <div className="logo-sub">RECYCLING MARKETPLACE</div>
      </div>

      {/* NAV */}
      <nav className="nav">
        <div className="nav-section">Main Menu</div>

        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            className={`nav-item ${
              activePage === item.id ? "active" : ""
            }`}
            onClick={() => onNavigate(item.id)}
          >
            <Icon name={item.icon} size={16} />
            <span>{item.label}</span>

            {item.badge && (
              <span className="nav-badge">{item.badge}</span>
            )}
          </button>
        ))}
      </nav>

      {/* USER */}
      <div className="sidebar-user">
        <div className="user-avatar">{initials}</div>

        <div>
          <div className="user-name">{user?.name || "Guest"}</div>

          <span
            className={`role-badge ${
              user?.role === "recycler"
                ? "role-recycler"
                : "role-seller"
            }`}
          >
            {user?.role}
          </span>
        </div>
      </div>
    </aside>
  );
}