import React from "react";
import { marked } from "marked";
import DOMPurify from "dompurify";

// ========================================
// MARKDOWN CONTENT
// ========================================

function MarkdownContent({ content, isUser = false }) {
  if (!content || typeof content !== "string") {
    return null;
  }

  const html = marked.parse(content);
  const cleanHtml = DOMPurify.sanitize(html);

  return (
    <div
      className={`
        max-w-full
        min-w-0
        break-words
        text-xs
        leading-5
        sm:text-sm
        sm:leading-6

        ${isUser ? "text-sky-950" : "text-slate-700"}

        [&_p]:mb-2.5
        [&_p:last-child]:mb-0

        [&_h1]:mb-3
        [&_h1]:text-base
        [&_h1]:font-bold
        [&_h1]:text-slate-800
        sm:[&_h1]:text-lg

        [&_h2]:mb-2
        [&_h2]:text-sm
        [&_h2]:font-bold
        [&_h2]:text-blue-700
        sm:[&_h2]:text-base

        [&_h3]:mb-2
        [&_h3]:text-sm
        [&_h3]:font-semibold
        [&_h3]:text-sky-700

        [&_strong]:font-bold
        [&_strong]:text-slate-800

        [&_ul]:mb-3
        [&_ul]:ml-4
        [&_ul]:list-disc
        sm:[&_ul]:ml-5

        [&_ol]:mb-3
        [&_ol]:ml-4
        [&_ol]:list-decimal
        sm:[&_ol]:ml-5

        [&_li]:mb-1

        [&_code]:rounded
        [&_code]:bg-sky-100
        [&_code]:px-1
        [&_code]:py-0.5
        [&_code]:font-mono
        [&_code]:text-[10px]
        [&_code]:text-blue-700
        sm:[&_code]:text-xs

        [&_blockquote]:border-l-4
        [&_blockquote]:border-sky-300
        [&_blockquote]:pl-3
        [&_blockquote]:italic
        [&_blockquote]:text-slate-500
      `}
      dangerouslySetInnerHTML={{
        __html: cleanHtml,
      }}
    />
  );
}

// ========================================
// CODE VIEWER
// ========================================

function CodeViewer({ code }) {
  if (!code || typeof code !== "string") {
    return null;
  }

  return (
    <div
      className="
        mt-3
        w-full
        max-w-full
        overflow-hidden
        rounded-lg
        border
        border-slate-700
        bg-[#080c16]

        sm:mt-4
        sm:rounded-xl
      "
    >
      {/* CODE HEADER */}

      <div
        className="
          flex
          items-center
          justify-between
          gap-2
          border-b
          border-slate-700
          bg-[#111827]
          px-3
          py-2

          sm:px-4
          sm:py-2.5
        "
      >
        <div className="flex min-w-0 items-center gap-2">
          <div className="flex shrink-0 gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-pink-400 sm:h-2 sm:w-2" />
            <span className="h-1.5 w-1.5 rounded-full bg-sky-400 sm:h-2 sm:w-2" />
            <span className="h-1.5 w-1.5 rounded-full bg-slate-500 sm:h-2 sm:w-2" />
          </div>

          <span className="text-[10px] font-semibold text-sky-300 sm:text-xs">
            Code
          </span>
        </div>

        <span className="hidden shrink-0 text-[10px] text-slate-500 xs:block">
          CodeSense AI
        </span>
      </div>

      {/* CODE */}

      <pre
        className="
          max-h-[350px]
          max-w-full
          overflow-x-auto
          overflow-y-auto
          p-3
          text-[11px]
          leading-5
          text-slate-200

          sm:max-h-[500px]
          sm:p-4
          sm:text-sm
          sm:leading-6
        "
      >
        <code className="whitespace-pre">
          {code}
        </code>
      </pre>
    </div>
  );
}

// ========================================
// MESSAGE
// ========================================

function Message({ msg }) {
  const isUser = msg.role === "user";

  return (
    <div
      className={`
        my-3
        flex
        w-full
        min-w-0
        ${isUser ? "justify-end" : "justify-start"}

        sm:my-4
      `}
    >
      <div
        className={`
          min-w-0
          max-w-[94%]
          overflow-hidden
          rounded-xl
          px-3
          py-2.5
          shadow-sm

          sm:max-w-[90%]
          sm:rounded-2xl
          sm:px-4
          sm:py-3

          ${
            isUser
              ? `
                border
                border-sky-300
                bg-gradient-to-br
                from-sky-200
                to-sky-100
                text-sky-950
                shadow-sky-200
              `
              : `
                border
                border-sky-100
                bg-white
                text-slate-700
                shadow-sky-100/70
              `
          }
        `}
      >
        {/* ==================================
            USER MESSAGE
        ================================== */}

        {isUser && (
          <MarkdownContent
            isUser
            content={
              typeof msg.content === "string"
                ? msg.content
                : String(msg.content ?? "")
            }
          />
        )}

        {/* ==================================
            ASSISTANT MESSAGE
        ================================== */}

        {!isUser && (
          <div className="min-w-0">
            {/* AI HEADER */}

            <div className="mb-2.5 flex items-center gap-2 sm:mb-3">
              <div
                className="
                  flex
                  h-7
                  w-7
                  shrink-0
                  items-center
                  justify-center
                  rounded-lg
                  bg-gradient-to-b
                  from-blue-500
                  to-sky-500
                  text-white
                  shadow-md

                  sm:h-8
                  sm:w-8
                  sm:rounded-xl
                "
              >
                <span className="text-[8px] font-bold sm:text-[9px]">
                  AI
                </span>
              </div>

              <div className="min-w-0">
                <p className="truncate text-[11px] font-bold text-blue-600 sm:text-xs">
                  CodeSense AI
                </p>

                <p className="text-[8px] font-medium text-slate-400 sm:text-[9px]">
                  Repository assistant
                </p>
              </div>
            </div>

            {/* CODE */}

            <CodeViewer
              code={
                typeof msg.code === "string"
                  ? msg.code
                  : ""
              }
            />

            {/* EXPLANATION */}

            <div className="mt-2.5 sm:mt-3">
              <MarkdownContent
                content={
                  typeof msg.explanation === "string"
                    ? msg.explanation
                    : ""
                }
              />
            </div>

            {/* ANSWER */}

            <div className="mt-2.5 sm:mt-3">
              <MarkdownContent
                content={
                  typeof msg.answer === "string"
                    ? msg.answer
                    : ""
                }
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ========================================
// MESSAGE LIST
// ========================================

export default function MessageList({ messages }) {
  return (
    <div className="w-full min-w-0 space-y-1 sm:space-y-2">
      {messages.length === 0 ? (
        <div
          className="
            rounded-xl
            border
            border-sky-200
            bg-gradient-to-br
            from-sky-50
            to-white
            px-4
            py-5
            text-center

            sm:rounded-2xl
            sm:px-5
            sm:py-6
          "
        >
          <div
            className="
              mx-auto
              mb-3
              flex
              h-10
              w-10
              items-center
              justify-center
              rounded-xl
              bg-gradient-to-b
              from-blue-500
              to-sky-500
              text-white
              shadow-md

              sm:h-11
              sm:w-11
            "
          >
            ✦
          </div>

          <p className="text-xs font-bold text-slate-700 sm:text-sm">
            Ask about your repository
          </p>

          <p className="mt-1 text-[10px] font-medium text-slate-400 sm:text-xs">
            Files, code, components, functions and more.
          </p>
        </div>
      ) : (
        messages.map((message, index) => (
          <Message
            key={index}
            msg={message}
          />
        ))
      )}
    </div>
  );
}