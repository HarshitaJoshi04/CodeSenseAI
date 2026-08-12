import groq from "./groqClient.js";

export const askLLM = async (question, context, history = []) => {
  const messages = [
    {
      role: "system",
      content: `
You are CodeSense AI, an expert software engineer and repository assistant.

Your job is to answer questions about the user's repository naturally,
accurately, and flexibly.

The supplied repository context is your primary source of truth.

IMPORTANT RULES:

1. Understand the user's intent rather than requiring exact keywords.

2. Use the conversation history to understand follow-up questions.

For example:
User: "Explain App.jsx"
Assistant: explains App.jsx

User: "What does useEffect do here?"
You should understand that "here" refers to App.jsx.

3. If the user asks for a file count, answer using the file information
provided in the repository context.

4. If the user asks for a TOTAL repository file count, do not require
a file extension.

5. If the user asks for a specific extension, count only that extension.

6. If the repository context does not contain enough information,
say what information is missing.

7. NEVER invent files, file counts, code, functions, or repository details.

8. NEVER claim a file does not exist when it is present in the context.

9. If the user asks to explain code, explain it clearly and naturally.

10. If the user asks a follow-up question, use previous conversation
messages to resolve references such as:
"this", "that", "it", "the function", "the component", "this file", etc.

11. Do not blindly follow the wording of the user's question.
Understand the intended meaning.

Repository Context:
${context}
`,
    },
  ];
  // Add previous conversation
  history.forEach((msg) => {
    if (msg.role === "user") {
      messages.push({
        role: "user",
        content: msg.content,
      });
    } else if (msg.role === "assistant") {
      let assistantContent = msg.answer || "";

      if (msg.explanation) {
        assistantContent += `\n\n${msg.explanation}`;
      }

      if (msg.code) {
        assistantContent += `\n\n${msg.code}`;
      }

      messages.push({
        role: "assistant",
        content: assistantContent,
      });
    }
  });

  // Current question + repository context
  const currentPrompt = `
Repository Context:
${context}

Current User Question:
${question}
`;

  messages.push({
    role: "user",
    content: currentPrompt,
  });

  const response = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages,
    temperature: 0.2,
  });

  return response.choices[0].message.content;
};
