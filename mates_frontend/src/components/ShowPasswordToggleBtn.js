"use client";

export default function ShowPasswordToggleBtn({ show, onToggle }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="text-xs text-blue-400 hover:text-blue-500 transition"
    >
      {show ? "Hide" : "Show"}
    </button>
  );
}
