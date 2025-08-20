const jwt = require("jsonwebtoken");
const User = require("../models/User");

const protect = async (req, res, next) => {
  let token;

  // Check for token in headers
  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    try {
      // Get token from header
      token = req.headers.authorization.split(" ")[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from token
      const user = await User.findById(decoded.id).select("-password");
      
      if (!user) {
        return res.status(401).json({ msg: "User not found" });
      }

      // Set user in request object
      req.user = user;
      next();
    } catch (err) {
      console.error('Token verification error:', err);
      return res.status(401).json({ msg: "Token is not valid" });
    }
  }

  if (!token) {
    return res.status(401).json({ msg: "No token, authorization denied" });
  }
};

module.exports = { protect };