// This will automatically use your Vercel backend URL or VITE_ prefix for Vite apps
// NEXT_PUBLIC_API_URL is commonly used in Next.js, 
// for Vite we often use VITE_API_URL but we'll follow your request pattern.
export const backendUrl = import.meta.env.VITE_API_URL || "https://dt-bug-club-mongodb.vercel.app"; 

export async function fetchBugs() {
  const response = await fetch(`${backendUrl}/api/bugs`);
  const data = await response.json();
  return data;
}

// Default export for convenience
export default backendUrl;
