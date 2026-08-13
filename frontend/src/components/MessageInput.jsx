import React, { useState } from "react";

export default function MessageInput({ onSend, disabled }) {
  const [text, setText] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!text.trim()) return;

    onSend(text);
    setText("");
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex min-w-0 gap-2"
    >
      {/* INPUT */}
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        className="
          min-w-0
          flex-1
          rounded-lg
          border-2
          border-cyan-200
          bg-cyan-50
          px-3
          py-2.5
          text-xs
          font-medium
          text-cyan-900
          placeholder:text-cyan-400
          outline-none
          transition

          focus:border-cyan-400
          focus:ring-2
          focus:ring-cyan-100

          disabled:cursor-not-allowed
          disabled:opacity-60

          sm:rounded-xl
          sm:px-4
          sm:py-3
          sm:text-sm

          md:focus:ring-4
        "
        placeholder={
          disabled
            ? "Thinking..."
            : "Ask about your repository..."
        }
        disabled={disabled}
        aria-label="Ask about your repository"
      />

      {/* SEND BUTTON */}
      <button
        type="submit"
        disabled={disabled || !text.trim()}
        className="
          shrink-0
          rounded-lg
          bg-gradient-to-b
          from-cyan-500
          to-sky-500
          px-3
          py-2.5
          text-xs
          font-bold
          text-white
          shadow-md
          shadow-cyan-300/30
          transition

          hover:from-cyan-600
          hover:to-sky-600
          hover:shadow-cyan-400/40

          focus:outline-none
          focus:ring-2
          focus:ring-cyan-200

          disabled:cursor-not-allowed
          disabled:opacity-50

          sm:rounded-xl
          sm:px-5
          sm:py-3
          sm:text-sm

          md:focus:ring-4
        "
      >
        {disabled ? (
          <span className="flex items-center gap-1.5 sm:gap-2">
            <span
              className="
                h-3.5
                w-3.5
                animate-spin
                rounded-full
                border-2
                border-white/40
                border-t-white

                sm:h-4
                sm:w-4
              "
            />

            {/* Mobile */}
            <span className="sm:hidden">
              Wait
            </span>

            {/* Desktop */}
            <span className="hidden sm:inline">
              Thinking...
            </span>
          </span>
        ) : (
          <span className="flex items-center gap-1.5">
            {/* Mobile */}
            <span className="sm:hidden text-base">
              ↑
            </span>

            {/* Desktop */}
            <span className="hidden sm:inline">
              🌊
            </span>

            <span className="hidden sm:inline">
              Send
            </span>
          </span>
        )}
      </button>
    </form>
  );
}