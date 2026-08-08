
import Groq from "groq-sdk";

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY
});

export const askLLM = async (question, context) => {

    const prompt = `
You are an expert software engineer.

Answer ONLY using the repository context.

If the answer is not present in the repository context, say:
"I couldn't find that information in the repository."

Repository Context:

${context}

Question:

${question}
`;

    const response = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",

        messages: [
            {
                role: "user",
                content: prompt
            }
        ],temperature: 0.2
    });

    return response.choices[0].message.content;
};

