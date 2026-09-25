const FIREBASE_API_KEY = process.env.FIREBASE_API_KEY || "AIzaSyDJpetLrw16a7osby9SM2PEXOgSorGdD5Y";

export async function requireUser(req, res) {
  const header = req.headers?.authorization || req.headers?.Authorization || "";
  if (!header.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized" });
    return null;
  }

  const idToken = header.slice(7).trim();
  if (!idToken) {
    res.status(401).json({ error: "Unauthorized" });
    return null;
  }

  try {
    const response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(FIREBASE_API_KEY)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken })
    });

    if (!response.ok) {
      res.status(401).json({ error: "Invalid session" });
      return null;
    }

    const data = await response.json();
    const user = data?.users?.[0];
    if (!user?.localId) {
      res.status(401).json({ error: "Invalid session" });
      return null;
    }

    return {
      uid: user.localId,
      email: user.email || "",
      displayName: user.displayName || ""
    };
  } catch (error) {
    console.error("[Auth] Token verification failed", error);
    res.status(503).json({ error: "Authentication service unavailable" });
    return null;
  }
}
