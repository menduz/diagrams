import React, {
  useRef,
  useCallback,
  ReactNode,
  MouseEvent as ReactMouseEvent,
  useState,
  useEffect,
} from "react";

let isResizing = false;

export function ResizeableSidebar(props: {
  children: ReactNode[] | ReactNode;
  onResize: (size: number) => void;
  size: number;
}) {
  const [currentSize, setCurrentSize] = useState(props.size);
  const cbHandleMouseMove = useCallback(handleMousemove, []);
  const cbHandleMouseUp = useCallback(handleMouseup, []);

  function handleMousedown(e: ReactMouseEvent) {
    e.stopPropagation();
    e.preventDefault();
    // we will only add listeners when needed, and remove them afterward
    document.addEventListener("mousemove", cbHandleMouseMove);
    document.addEventListener("mouseup", cbHandleMouseUp);
    isResizing = true;
  }

  function handleMousemove(e: MouseEvent) {
    if (!isResizing) {
      return;
    }

    let size = e.clientX - document.body.offsetLeft;

    let minWidth = 150;

    if (size > minWidth) {
      setCurrentSize(size);
    } else {
      setCurrentSize(0);
    }
  }

  function handleMouseup(e: MouseEvent) {
    if (!isResizing) {
      return;
    }

    isResizing = false;
    document.removeEventListener("mousemove", cbHandleMouseMove);
    document.removeEventListener("mouseup", cbHandleMouseUp);
  }

  useEffect(() => {
    if (currentSize != props.size) {
      props.onResize(currentSize);
    }
  }, [currentSize]);

  return (
    <div className="sidebar-container">
      <div
        className={`sidebar-dragger ${isResizing ? "active" : ""}`}
        onMouseDown={handleMousedown}
        style={{ left: props.size }}
      />
      {props.children}
    </div>
  );
}
