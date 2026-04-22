import React from "react";
import Icon from "../common/Icon";

const PAGE_TITLES = {
  dashboard: "Dashboard",
  listing: "List Waste",
  vision: "AI Verification",
  pricing: "Dynamic Pricing",
  map: "Recycler Map",
  transactions: "Transactions",
};

export default function Topbar({
  activePage,
  userRole,
  onRoleSwitch,
}) {
  return (
    <header className="topbar">
      <div className="page-title">
        {PAGE_TITLES[activePage] || "WasteLink"}
      </div>

      <div className="topbar-right">
        {/* ROLE SWITCH */}
        <div className="role-switcher">
          <button
            className={`role-btn ${
              userRole === "seller" ? "active" : ""
            }`}
            onClick={() => onRoleSwitch("seller")}
          >
            🌿 Seller
          </button>

          <button
            className={`role-btn ${
              userRole === "recycler" ? "active" : ""
            }`}
            onClick={() => onRoleSwitch("recycler")}
          >
            ♻️ Recycler
          </button>
        </div>

        {/* NOTIFICATIONS */}
        <div className="notif-btn">
          <Icon name="bell" size={18} />
          <span className="notif-dot" />
        </div>
      </div>
    </header>
  );
}