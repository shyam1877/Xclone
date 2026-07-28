import React, { useEffect, useState, useRef } from "react";
import { Tabs, TabsList, TabsTrigger } from "./ui/tabs";
import { Card, CardContent } from "./ui/card";
import LoadingSpinner from "./loading-spinner";
import TweetCard from "./TweetCard";
import TweetComposer from "./TweetComposer";
import axiosInstance from "@/lib/axiosInstance";
import { useAuth } from "@/context/AuthContext";

interface Tweet {
  id: string;
  author: {
    id: string;
    username: string;
    displayName: string;
    avatar: string;
    verified?: boolean;
  };
  content: string;
  timestamp: string;
  likes: number;
  retweets: number;
  comments: number;
  liked?: boolean;
  retweeted?: boolean;
  image?: string;
}
const tweets: Tweet[] = [
  {
    id: "1",
    author: {
      id: "2",
      username: "elonmusk",
      displayName: "Elon Musk",
      avatar:
        "https://images.pexels.com/photos/2379005/pexels-photo-2379005.jpeg?auto=compress&cs=tinysrgb&w=400",
      verified: true,
    },
    content:
      "Just had an amazing conversation about the future of AI. The possibilities are endless!",
    timestamp: "2h",
    likes: 1247,
    retweets: 324,
    comments: 89,
    liked: false,
    retweeted: false,
  },
  {
    id: "2",
    author: {
      id: "3",
      username: "sarahtech",
      displayName: "Sarah Johnson",
      avatar:
        "https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=400",
      verified: false,
    },
    content:
      "Working on some exciting new features for our app. Can't wait to share what we've been building! 🚀",
    timestamp: "4h",
    likes: 89,
    retweets: 23,
    comments: 12,
    liked: true,
    retweeted: false,
  },
  {
    id: "3",
    author: {
      id: "4",
      username: "designguru",
      displayName: "Alex Chen",
      avatar:
        "https://images.pexels.com/photos/1681010/pexels-photo-1681010.jpeg?auto=compress&cs=tinysrgb&w=400",
      verified: true,
    },
    content:
      "The new design system is finally complete! It took 6 months but the results are incredible. Clean, consistent, and accessible.",
    timestamp: "6h",
    likes: 456,
    retweets: 78,
    comments: 34,
    liked: false,
    retweeted: true,
    image:
      "https://images.pexels.com/photos/196645/pexels-photo-196645.jpeg?auto=compress&cs=tinysrgb&w=800",
  },
];
const Feed = () => {
  const { user } = useAuth();
  const [tweets, setTweets] = useState<any>([]);
  const [loading, setloading] = useState(false);
  const latestTweetTimeRef = useRef<string | null>(null);

  const fetchTweets = async () => {
    try {
      setloading(true);
      const res = await axiosInstance.get("/post");
      setTweets(res.data);
      if (res.data && res.data.length > 0) {
        latestTweetTimeRef.current = res.data[0].timestamp;
      } else {
        latestTweetTimeRef.current = new Date().toISOString();
      }
    } catch (error) {
      console.error(error);
    } finally {
      setloading(false);
    }
  };

  const pollTweets = async () => {
    try {
      const res = await axiosInstance.get("/post");
      const fetchedTweets = res.data;

      if (fetchedTweets && fetchedTweets.length > 0) {
        const latestSeenTime = latestTweetTimeRef.current;

        if (latestSeenTime) {
          // Find tweets newer than the latest seen timestamp
          const newTweets = fetchedTweets.filter((tweet: any) => {
            return new Date(tweet.timestamp) > new Date(latestSeenTime);
          });

          if (newTweets.length > 0) {
            // Check preferences & permissions
            if (
              user?.notificationsEnabled &&
              typeof window !== "undefined" &&
              "Notification" in window &&
              Notification.permission === "granted"
            ) {
              newTweets.forEach((tweet: any) => {
                const contentLower = tweet.content.toLowerCase();
                if (contentLower.includes("cricket") || contentLower.includes("science")) {
                  const keyword = contentLower.includes("cricket") ? "cricket" : "science";

                  // Trigger Browser Popup
                  new Notification(tweet.author.displayName || "Twiller", {
                    body: tweet.content,
                    icon: tweet.author.avatar || "",
                  });

                  // Log notification to localStorage
                  const currentLogs = localStorage.getItem("twiller-notification-logs");
                  let logs = [];
                  if (currentLogs) {
                    try {
                      logs = JSON.parse(currentLogs);
                    } catch (e) {
                      logs = [];
                    }
                  }
                  const newLog = {
                    id: Math.random().toString(36).substr(2, 9),
                    keyword,
                    timestamp: new Date().toISOString(),
                    tweet: {
                      _id: tweet._id,
                      content: tweet.content,
                      timestamp: tweet.timestamp,
                      author: {
                        displayName: tweet.author.displayName,
                        username: tweet.author.username,
                        avatar: tweet.author.avatar,
                      },
                    },
                  };
                  localStorage.setItem("twiller-notification-logs", JSON.stringify([newLog, ...logs]));
                }
              });
            }

            // Append unique new tweets to the feed list
            setTweets((prev: any) => {
              const existingIds = new Set(prev.map((t: any) => t._id));
              const uniqueNew = newTweets.filter((t: any) => !existingIds.has(t._id));
              return [...uniqueNew, ...prev];
            });
          }
        }

        // Update latest timestamp to the newest tweet
        latestTweetTimeRef.current = fetchedTweets[0].timestamp;
      }
    } catch (error) {
      console.error("Polling error:", error);
    }
  };

  useEffect(() => {
    fetchTweets();
  }, []);

  // Poll for new tweets every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      pollTweets();
    }, 10000);

    return () => clearInterval(interval);
  }, [user?.notificationsEnabled]);

  const handlenewtweet = (newtweet: any) => {
    setTweets((prev: any) => [newtweet, ...prev]);
    if (newtweet.timestamp) {
      latestTweetTimeRef.current = newtweet.timestamp;
    }
  };
  return (
    <div className="min-h-screen">
      <div className="sticky top-0 bg-black/90 backdrop-blur-md border-b border-gray-800 z-10">
        <div className="px-4 py-3">
          <h1 className="text-xl font-bold text-white">Home</h1>
        </div>

        <Tabs defaultValue="foryou" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-transparent border-b border-gray-800 rounded-none h-auto">
            <TabsTrigger
              value="foryou"
              className="data-[state=active]:bg-transparent data-[state=active]:text-white data-[state=active]:border-b-1 data-[state=active]:border-blue-100 data-[state=active]:rounded-none text-gray-400 hover:bg-gray-900/50 py-4 font-semibold"
            >
              For you
            </TabsTrigger>
            <TabsTrigger
              value="following"
              className="data-[state=active]:bg-transparent data-[state=active]:text-white data-[state=active]:border-b-1 data-[state=active]:border-blue-100 data-[state=active]:rounded-none text-gray-400 hover:bg-gray-900/50 py-4 font-semibold"
            >
              Following
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      <TweetComposer onTweetPosted={handlenewtweet}/>
      <div className="divide-y divide-gray-800">
        {loading ? (
          <Card className="bg-black border-none">
            <CardContent className="py-12 text-center">
              <div className="text-gray-400 mb-4">
                <LoadingSpinner size="lg" className="mx-auto mb-4" />
                <p>Loading tweets...</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          tweets.map((tweet: any) => <TweetCard key={tweet._id} tweet={tweet} />)
        )}
      </div>
    </div>
  );
};

export default Feed;
