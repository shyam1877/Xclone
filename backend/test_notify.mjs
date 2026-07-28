async function run() {
  try {
    // 1. Register a bot user if it doesn't exist
    const registerRes = await fetch("http://localhost:5000/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: "science_bot",
        displayName: "Science Channel",
        avatar: "https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=400",
        email: "bot@science-channel.org"
      })
    });
    
    const botUser = await registerRes.json();
    console.log("Registered Bot User:", botUser._id);
    
    // 2. Post a tweet containing the science keyword
    const tweetRes = await fetch("http://localhost:5000/post", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        author: botUser._id,
        content: "Breaking: Space exploration research opens new horizons in quantum science!",
        image: ""
      })
    });
    
    const tweetData = await tweetRes.json();
    console.log("Posted tweet successfully:", tweetData._id);
  } catch (error) {
    console.error("Test script failed:", error.message);
  }
}

run();
