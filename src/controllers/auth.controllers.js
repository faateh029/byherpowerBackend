export const signupController = async (req, res, next) => {
  res.status(200).json({
    success: true,
    message: "Signup route is functional."
  });
};

export const loginController = async (req, res, next) => {
  res.status(200).json({
    success: true,
    message: "Login route is functional."
  });
};

export const logoutController = async (req, res, next) => {
  res.status(200).json({
    success: true,
    message: "Logout route is functional."
  });
};

export const forgotPasswordController = async (req, res, next) => {
  res.status(200).json({
    success: true,
    message: "Forgot password route is functional."
  });
};

export const resetPasswordController = async (req, res, next) => {
  res.status(200).json({
    success: true,
    message: "Reset password route is functional."
  });
};

export const changePasswordController = async (req, res, next) => {
  res.status(200).json({
    success: true,
    message: "Change password route is functional."
  });
};