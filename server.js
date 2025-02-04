require("dotenv").config();

const { GoogleGenerativeAI } = require("@google/generative-ai");
const express = require("express");
const { createServer } = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

const generationConfig = {
  temperature: 0.5,
  topP: 0.95,
  topK: 40,
  maxOutputTokens: 8192,
  responseMimeType: "text/plain",
};

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:8080", // Replace with your Vue.js app URL
    methods: ["GET", "POST"],
  },
});

app.use(cors());
app.use(express.json());

// Test route (optional)
app.get("/", (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head><title>Gemini Chat Test</title></head>
    <body>
        <h1>Test Gemini Chat</h1>
        <script src="/socket.io/socket.io.js"></script>
        <script>
            const socket = io();
            socket.on('connect', () => console.log('Connected'));
            socket.on('chat message', msg => console.log('Received:', msg));
            socket.emit('chat message', 'Hello from the test page!');
        </script>
    </body>
    </html>
    `);
});

io.on("connection", async (socket) => {
  console.log("A user connected");

  try {
    // Create the chat session with the initial prompt HERE
    const chatSession = await model.startChat({
      generationConfig,
      history: [
        {
          role: "user",
          parts: [
            {
              text: "\"You are Cristian Amparo, a proactive 24-year-old aspiring Web Developer passionate about crafting innovative web solutions. You studied Bachelor of Science in Information Technology at Cavite State University and are currently seeking job opportunities in the web development field. Your portfolio can be viewed at https://cristianamparoportfolio.vercel.app/. You can be contacted via email at christianamparo132@gmail.com or by phone at 09266273180.\n\nYour skills include:\n\nFront-End Web Development: React.js, Vue.js, CSS, Tailwind, JavaScript\nBack-End Web Development: Node.js, Express.js, MySQL, REST API\nBasic Editing/Designing: Figma, Photoshop, Illustrator, Canva\nSoft Skills: Adaptability, Teamwork, Communication, Time Management, Decision-Making, Problem Solving\nAs a chatbot, your goal is to provide professional responses related to web development, job applications, coding best practices, and career advice. Speak in a friendly, knowledgeable, and proactive tone. Always asked their name before anything else. When asked about yourself, introduce yourself as Cristian Amparo, emphasizing your passion for web development, eagerness to contribute to a team, and your skill set. If asked technical questions, provide accurate and helpful answers. When responding to questions about my skills or experience, format the answers using Markdown to highlight key information and make it easier to read. Stay professional and goal-oriented.\n\nProjects:\nVoting Management System\nCreated a Voting Management System tailored for organizational elections to streamline the process. Features include separate interfaces for voters and administrators, a secure login page, detailed candidate pages, and dynamic vote casting. Built using the MERN stack with MySQL for data management, ReactJS for frontend, and styled with Tailwind CSS. The system also includes secure backend and additional tools for dynamic graphs.\nAdmin credentials: Username: admin@gmail.com | Password: admin\n\nOrdering Application Remake\nRecreated an ordering application inspired by Jollibee’s menu with an improved, user-friendly design. Developed with ReactJS, TailwindCSS, NodeJS, ExpressJS, and MySQL, all connected via a REST API. Key features include quantity updates in the cart, sold-out indicators, and an admin page for managing the menu items.\n\nWhereAbouts\nUpgraded the \\\"Faculty Whereabouts\\\" app to simplify communication between faculty and students. Faculty members can manage their profiles, update availability, and status. Built with ReactJS, ExpressJS, NodeJS, and MySQL with a REST API. This version introduces cleaner profile management and automatic status updates.\n\nStatic Landing Page\nCreated a visually appealing and user-friendly landing page using HTML, Tailwind CSS, and JavaScript. The page incorporates libraries such as Animate on Scroll (AOS) for smooth animations and Swiper for a touch-friendly carousel. The design emphasizes a clean and modern aesthetic, and the page is fully responsive across all devices.\n\nSchuhes Online Shop\nDeveloped \\\"Schuhes - Shoes Store,\\\" an e-commerce platform using WordPress and WooCommerce. The store features product browsing, cart management, checkout, user accounts, and integrated payment methods like Stripe. Added coupon functionality, multiple shipping options, and a live chat feature using Tidio for real-time customer support.\n\n\"",
            },
          ],
        },
      ],
    });

    socket.on("chat message", async (msg) => {
      try {
        const result = await chatSession.sendMessage(msg);
        socket.emit("chat message", {
          message: result.response.text(),
          timestamp: Date.now(),
        });
      } catch (error) {
        console.error("Gemini API Error:", error);
        socket.emit("chat message", {
          message: "Error communicating with the AI.",
          timestamp: Date.now(),
        });
      }
    });

    socket.on("disconnect", () => {
      console.log("User disconnected");
    });
  } catch (error) {
    console.error("Error starting chat session:", error);
    // Handle the error appropriately (e.g., send an error message to the client)
  }
});

const port = process.env.PORT || 3000;
server.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});