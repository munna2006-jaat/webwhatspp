const roleCheck = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    // Check if user is owner of workspace
    const workspaceOwnerId = req.user.workspace?.owner?._id || req.user.workspace?.owner || req.user.workspace;
    const isOwner = workspaceOwnerId && workspaceOwnerId.toString() === req.user._id.toString();

    if (isOwner || roles.includes(req.user.role)) {
      return next();
    }

    return res.status(403).json({
      error: `Access denied. Requires one of: ${roles.join(', ')}`
    });
  };
};

module.exports = roleCheck;
