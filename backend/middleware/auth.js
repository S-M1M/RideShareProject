import jwt from "jsonwebtoken";

const auth = (req, res, next) => {
  const token = req.header("Authorization")?.replace("Bearer ", "");

  if (!token) {
    console.log("No token");
    return res.status(401).json({ error: "No token, authorization denied" });
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "fallback_secret",
    );
    req.user = decoded;
    console.log("Token is valid");
    next();
  } catch (error) {
    console.log("Token is not valid");
    res.status(401).json({ error: "Token is not valid" });
  }
};

export default auth;
