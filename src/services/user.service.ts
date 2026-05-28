import UserModel from "../models/user.model";
import { NotFoundException, UnauthorizedException } from "../utils/app-error";
import { ChangePasswordType, UpdateUserType } from "../validators/user.validator";
import { ErrorCodeEnum } from "../enums/error-code.enum";

export const findByIdUserService = async (userId: string) => {
  const user = await UserModel.findById(userId);
  return user?.omitPassword();
};

export const updateUserService = async (
  userId: string,
  body: UpdateUserType,
  profilePic?: Express.Multer.File
) => {
  const user = await UserModel.findById(userId);
  if (!user) throw new NotFoundException("User not found");

  if (profilePic) {
    user.profilePicture = profilePic.path;
  }

  user.set({
    name: body.name,
  });

  await user.save();

  return user.omitPassword();
};

export const changePasswordService = async (
  userId: string,
  body: ChangePasswordType
) => {
  const user = await UserModel.findById(userId).select("+password");
  if (!user) throw new NotFoundException("User not found");

  const isCurrentPasswordValid = await user.comparePassword(body.currentPassword);
  if (!isCurrentPasswordValid) {
    throw new UnauthorizedException(
      "Current password is incorrect",
      ErrorCodeEnum.ACCESS_UNAUTHORIZED
    );
  }

  user.set({ password: body.newPassword });
  await user.save();

  return { message: "Password changed successfully" };
};
