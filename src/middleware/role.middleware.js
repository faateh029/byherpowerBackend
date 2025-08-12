
export const allowedRoles =  (...roles)=>{
     return (req , res,next)=>{
  if(roles.includes(req.user.role)){
        return next();
      }else{
        const error = new Error("Access denied");
        throw error;
      }
     } 
}

