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
    
    // Normalize the user ID field - token uses 'userId' but routes expect '_id'
    req.user = {
      ...decoded,
      _id: decoded.userId || decoded._id,
      id: decoded.userId || decoded.id || decoded._id
    };
    
    console.log("Token is valid, decoded user:", req.user);
    next();
  } catch (error) {
    console.log("Token is not valid:", error.message);
    res.status(401).json({ error: "Token is not valid" });
  }
};

export default auth;
