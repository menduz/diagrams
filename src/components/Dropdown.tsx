import React, { useState, useRef, useEffect, ReactNode } from "react";

export function closeMenu() {
  document.querySelectorAll(".dropdown[open]").forEach((e) => {
    e.removeAttribute("open");
  });
}

export function DropdownShare(props: {
  className: string;
  label: string;
  children: ReactNode[] | ReactNode;
}) {
  return (
    <details className="dropdown details-reset details-overlay d-inline-block mr-2">
      <summary className={`btn ${props.className}`} aria-haspopup="true">
        {props.label}
        <div className="dropdown-caret"></div>
      </summary>

      <ul className="dropdown-menu dropdown-menu-sw" style={{ width: 200 }}>
        {props.children}
      </ul>
    </details>
  );
}
