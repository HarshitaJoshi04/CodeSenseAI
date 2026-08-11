import dns from "dns";

dns.setServers(["8.8.8.8", "1.1.1.1"]);

await import("dotenv/config");
const { default: app } = await import("./app.js");

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
    console.log(`Server running on ${PORT}`);
});