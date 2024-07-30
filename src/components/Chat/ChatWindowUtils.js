// ChatWindowUtils.js

export const formatLastLogin = (lastLogin) => {
  if (!lastLogin) return "Offline";

  const now = new Date();
  const lastLoginTime = new Date(lastLogin);

  const diffInMs = now - lastLoginTime;
  const diffInMinutes = Math.floor(diffInMs / 1000 / 60);
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);

  if (diffInMinutes < 60) {
    return `Online ${diffInMinutes} min ago`;
  } else if (diffInHours < 24) {
    return `Online ${diffInHours} hr ago`;
  } else {
    return `Online ${diffInDays} day${diffInDays > 1 ? "s" : ""} ago`;
  }
};

export const handleKeyDown = (event, handleSend) => {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault(); // Prevent newline in the input field
    handleSend();
  }
};
