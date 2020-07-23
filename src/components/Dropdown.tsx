import React, { useState, useRef, useEffect } from "react";

export function DropdownShare(props: {
  onReadonlyLink: any;
  onEditableLink: any;
}) {
  return (
    <details className="dropdown details-reset details-overlay d-inline-block">
      <summary className="btn btn-invisible" aria-haspopup="true">
        Share
        <div className="dropdown-caret"></div>
      </summary>

      <ul className="dropdown-menu dropdown-menu-sw">
        <li>
          <a
            className="dropdown-item"
            onClick={props.onReadonlyLink}
            href={document.location.toString()}
          >
            Copy read-only link
          </a>
        </li>
        <li>
          <a
            className="dropdown-item"
            onClick={props.onReadonlyLink}
            href={document.location.toString()}
          >
            Copy editable link
          </a>
        </li>
      </ul>
    </details>
  );
}
