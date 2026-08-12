import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export const askLLM = async (question, context, history = []) => {
  const messages = [
    {
      role: "system",
      content: `You are CodeSense AI, an expert software engineer and assistant.
Answer the user's question using the repository context provided.
The repository context is your source of truth.
Reason over the supplied code. If the context is insufficient, clearly say what is missing rather than inventing details.
Do not claim a file doesn't exist if it is present.
Use conversation history to understand follow-up questions (e.g. "this function" or "that component").`,
    },
  ];

  // Append history messages to the chat API
  history.forEach((msg) => {
    if (msg.role === "user") {
      messages.push({ role: "user", content: msg.content });
    } else if (msg.role === "assistant") {
      let assistantContent = msg.answer || "";
      if (msg.explanation) {
        assistantContent += `\n\n${msg.explanation}`;
      }
      messages.push({ role: "assistant", content: assistantContent });
    }
  });

  // Append the current active prompt with retrieved context
  const currentPrompt = `
Repository Context:
${context}

Question:
${question}
`;

  messages.push({
    role: "user",
    content: currentPrompt,
  });

  const response = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: messages,
    temperature: 0.2,
  });

  return response.choices[0].message.content;
};
