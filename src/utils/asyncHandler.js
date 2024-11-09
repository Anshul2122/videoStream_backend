

const asyncHandler =(requestHandler)=>{
  (req, res,next)=>{
    Promise.resolve(requestHandler(req,res,next)).
    catch((error=>next(error)))
  }
}


// const asyncHandler = (fn)=> async (req, res, next)=>{
//   try {
//     await fn(req, res, next);
//   } catch (e) {
//     res.status(e.code || 500)
//     .json({success: false, message:  e.message});
//   }
// }
export { asyncHandler };