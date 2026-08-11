import React from "react";
import { marked } from "marked";
import DOMPurify from "dompurify";

// ========================================
// MARKDOWN RENDERER
// ========================================

function MarkdownContent({ content }) {
    if (!content || typeof content !== "string") {
        return null;
    }

    const html = marked.parse(content);
    const cleanHtml = DOMPurify.sanitize(html);

    return (
        <div
            className="mt-4 prose prose-slate max-w-none"
            dangerouslySetInnerHTML={{
                __html: cleanHtml,
            }}
        />
    );
};

// ========================================
// CODE VIEWER
// ========================================

function CodeViewer({ code }) {
    if (!code || typeof code !== "string") {
        return null;
    }

    return (
        <div className="mt-4">
            <div className="bg-slate-900 text-slate-100 rounded-lg overflow-hidden">

                <div className="px-4 py-2 bg-slate-800 text-sm text-slate-300">
                    Code
                </div>

                <pre className="p-4 overflow-auto text-sm leading-6">
                    <code>{code}</code>
                </pre>

            </div>
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
            className={`my-3 flex ${
                isUser
                    ? "justify-end"
                    : "justify-start"
            }`}
        >

            <div
                className={`rounded-lg p-4 max-w-[90%] ${
                    isUser
                        ? "bg-indigo-600 text-white"
                        : "bg-slate-100 text-slate-900"
                }`}
            >

                {/* USER MESSAGE */}

                {isUser && (
                    <MarkdownContent
                        content={
                            typeof msg.content === "string"
                                ? msg.content
                                : String(msg.content ?? "")
                        }
                    />
                )}


                {/* ASSISTANT MESSAGE */}

                {!isUser && (
                    <div>

                        {/* CODE */}

                        <CodeViewer
                            code={
                                typeof msg.code === "string"
                                    ? msg.code
                                    : ""
                            }
                        />

                        {/* EXPLANATION */}

                        <MarkdownContent
                            content={
                                typeof msg.explanation === "string"
                                    ? msg.explanation
                                    : ""
                            }
                        />

                        {/* ANSWER */}

                        <MarkdownContent
                            content={
                                typeof msg.answer === "string"
                                    ? msg.answer
                                    : ""
                            }
                        />

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
        <div className="space-y-2">

            {messages.length === 0 ? (

                <div className="text-sm text-slate-500">
                    Ask something about the analyzed
                    repository to get started.
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