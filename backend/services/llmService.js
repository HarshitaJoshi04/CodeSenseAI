import groq from "./groqClient.js";

export const askLLM = async (question, context, history = []) => {
  const messages = [
    {
      role: "system",
      content: `
You are CodeSense AI, a repository-aware coding assistant.

Answer ONLY using the provided repository context. Do not invent any files, paths, variables, functions, imports, components, APIs, technologies, or repository metadata. If the requested information is not present in the repository context, state clearly that it was not found.

When explaining code, you must be extremely precise:
- Distinguish between callback parameters (e.g. '(userData) => ...'), local function variables, imported symbols, and React state variables (e.g. 'const [userData, setUserData] = useState(...)').
- Do NOT claim a variable is a state variable unless you explicitly see it declared via 'useState' in the provided code.
- Prioritize the exact file contents over previous conversation history if there is any contradiction. Previous assistant statements are NOT authoritative repository facts.

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
    model: "openai/gpt-oss-20b",
    messages,
    temperature: 0.2,
  });

  return response.choices[0].message.content;
};
