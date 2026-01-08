import { useState, useEffect, useRef } from "react";
import useLocalStorage from "./CustomHooks/useLocalStorage";
import "./App.css";

function App() {
  const [input, setInput] = useState("");
  // const [chatHistory, setChatHistory] = useState([]);
  const [chatHistory, setChatHistory] = useLocalStorage(
    "pixel-chat-memory",
    []
  );
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = { role: "user", content: input };
    const updatedHistoryForAPI = [...chatHistory, userMessage];

    //  Update the state (this triggers the LocalStorage save)
    //2. Update state using the FUNCTIONAL pattern
    // This ensures the user message is "locked in" immediately
    setChatHistory((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    console.log("🚀 Step 1: Sending request to Python backend...");
    const startTime = Date.now();

    try {
      const res = await fetch('https://ai-powered-friend-backend.onrender.com/chat', {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: updatedHistoryForAPI }), // Send the whole list!
      });

      console.log(
        "⏳ Step 2: Backend received request, waiting for AI to finish thinking..."
      );

      if (!res.ok) throw new Error("Backend crashed or timed out");
      const botMessage = await res.json(); // This will be {role: 'assistant', content: '...'}

      const pixelMessage = {
        role: "assistant",
        content: botMessage.response,
      };

      const endTime = Date.now();
      console.log(
        `✅ Step 3: Success! Total time: ${
          (endTime - startTime) / 1000
        } seconds.`
      );
      // Add Pixel's response to the end of history
      setChatHistory((prev) => [...prev, pixelMessage]);
    } catch (error) {
      console.error("❌ Pixel is offline!", error);
      // ✨ Create a default "Bestie" error message

      let fallbackText = "omg, something went wrong, bestie! 🌸 ☁️";
      if (!navigator.onLine) {
        fallbackText =
          "wait, i think your wifi is acting up! 📶 ✨ check your connection and let's try again? 🎀 🍵";
      } else {
        fallbackText =
          "my servers are being a bit moody right now... 🍵 🌸 give me one more sec!";
      }
      setChatHistory((prev) => [
        ...prev,
        { role: "assistant", content: fallbackText },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    setChatHistory([]); // This wipes the memory for Pixel
  };

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatHistory]);

  return (
    <div className="chat-container">
      <div className="header-area">
        <h1>Pixel 🤖✨</h1>
        <button className="clear-btn" onClick={clearChat}>
          Clear Memory
        </button>
      </div>
      <div className={`chat-window ${isLoading ? "is-thinking" : ""}`}>
        {chatHistory.map((msg, i) => (
          <div key={i} className={`message ${msg.role}`}>
            <strong>{msg.role === "user" ? "You" : "Pixel"}:</strong>{" "}
            {msg.content}
          </div>
        ))}
        {isLoading && (
          <div className="message pixel typing-indicator">
            <span>🌸</span>
            <span>✨</span>
            <span>☁️</span>
          </div>
        )}
        {isLoading && <div className="loading">Pixel is thinking...🌸</div>}
        <div ref={messagesEndRef} />
      </div>
      <div className="input-area">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && sendMessage()}
          placeholder="Say something to Pixel..."
        />
        <button className="send-btn" onClick={sendMessage} disabled={isLoading}>
          {isLoading ? "Wait... ✨" : "Send 🎀"}
        </button>
      </div>
    </div>
  );
}

export default App;
