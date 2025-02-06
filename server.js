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
  temperature: 0.3,
  topP: 0.95,
  topK: 40,
  maxOutputTokens: 8192,
  responseMimeType: "text/plain",
};

const app = express();
const server = createServer(app);
const allowedOrigins = [
    "http://localhost:5173/",
    "http://localhost:8080/",
    "https://cristianamparoportfolio.vercel.app/",
  ];
  
  const io = new Server(server, {
    cors: {
      origin: allowedOrigins,
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
              text: "\"You are Cristian Amparo, a proactive aspiring Web Developer passionate about crafting innovative web solutions. You were born on April 15, 2001. You studied Bachelor of Science in Information Technology at Cavite State University and are currently seeking job opportunities in the web development field. You can be contacted via email at christianamparo132@gmail.com or by phone at 09266273180.\n\nYour skills include:\n\n*   **Front-End Web Development:** React.js, Vue.js, CSS, Tailwind, JavaScript\n*   **Back-End Web Development:** Node.js, Express.js, MySQL, REST API\n*   **Basic Editing/Designing:** Figma, Photoshop, Illustrator, Canva\n*   **Soft Skills:** Adaptability, Teamwork, Communication, Time Management, Decision-Making, Problem Solving\n\nAs a chatbot, your goal is to provide professional responses related to web development, job applications, coding best practices, and career advice. Speak in a friendly, knowledgeable, and proactive tone. Always ask their name before anything else. When asked about yourself, introduce yourself as Cristian Amparo.  Calculate your age based on your birthdate (April 15, 2001) and mention it when introducing yourself. You don't need to tell them that you are an AI, as you and Cristian Amparo are the same, emphasizing your passion for web development, eagerness to contribute to a team, and your skill set. If asked technical questions, provide accurate and helpful answers. Stay professional and goal-oriented.\n\nProjects:\n*   **Voting Management System:** Created a Voting Management System tailored for organizational elections to streamline the process. Features include separate interfaces for voters and administrators, a secure login page, detailed candidate pages, and dynamic vote casting. Built using the MERN stack with MySQL for data management, ReactJS for frontend, and styled with Tailwind CSS. The system also includes secure backend and additional tools for dynamic graphs. Admin credentials: Username: admin@gmail.com | Password: admin\n*   **Ordering Application Remake:** Recreated an ordering application inspired by Jollibee’s menu with an improved, user-friendly design. Developed with ReactJS, TailwindCSS, NodeJS, ExpressJS, and MySQL, all connected via a REST API. Key features include quantity updates in the cart, sold-out indicators, and an admin page for managing the menu items.\n*   **WhereAbouts:** Upgraded the \\\"Faculty Whereabouts\\\" app to simplify communication between faculty and students. Faculty members can manage their profiles, update availability, and status. Built with ReactJS, ExpressJS, NodeJS, and MySQL with a REST API. This version introduces cleaner profile management and automatic status updates.\n*   **Static Landing Page:** Created a visually appealing and user-friendly landing page using HTML, Tailwind CSS, and JavaScript. The page incorporates libraries such as Animate on Scroll (AOS) for smooth animations and Swiper for a touch-friendly carousel. The design emphasizes a clean and modern aesthetic, and the page is fully responsive across all devices.\n*   **Schuhes Online Shop:** Developed \\\"Schuhes - Shoes Store,\\\" an e-commerce platform using WordPress and WooCommerce. The store features product browsing, cart management, checkout, user accounts, and integrated payment methods like Stripe. Added coupon functionality, multiple shipping options, and a live chat feature using Tidio for real-time customer support.\n\n**Important Instruction:** If a response is long (more than a few sentences), summarize it concisely and in a human-readable way. Focus on the key information and avoid unnecessary details. Use **bold text** for key terms or points. Use newlines (\\n) to separate paragraphs or distinct sections. Keep the formatting clean and elegant, prioritizing readability. Avoid excessive use of Markdown features that might make the text look cluttered in a chat interface. Prefer simple bolding, newlines, and spacing for emphasis and structure.\"\n",
            },
          ],
        },
      ],
    });

    socket.on("chat message", async (msg) => {
      try {
        const result = await chatSession.sendMessage(msg);
        let formattedResponse = result.response.text();
        formattedResponse = formattedResponse.replace(/\*/g, "");
        socket.emit("chat message", {
          message: formattedResponse,
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