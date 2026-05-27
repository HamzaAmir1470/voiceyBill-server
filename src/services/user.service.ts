import UserModel from "../models/user.model";
import { NotFoundException, UnauthorizedException } from "../utils/app-error";
import { ChangePasswordType, UpdateUserType } from "../validators/user.validator";
import { ErrorCodeEnum } from "../enums/error-code.enum";
import TransactionModel from "../models/transaction.model";
import { resolveCurrencyConversion } from "./currency-conversion.service";

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
  const previousBaseCurrency = user.baseCurrency || "USD";
  const nextBaseCurrency = body.baseCurrency?.toUpperCase();

  if (profilePic) {
    user.profilePicture = profilePic.path;
  }

  user.set({
    ...(body.name && { name: body.name }),
    ...(nextBaseCurrency && { baseCurrency: nextBaseCurrency }),
  });

  if (nextBaseCurrency && nextBaseCurrency !== previousBaseCurrency) {
    await rebaseTransactionsToCurrency(
      userId,
      previousBaseCurrency,
      nextBaseCurrency,
    );
  }

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
async function rebaseTransactionsToCurrency(
  userId: string,
  previousBaseCurrency: string,
  nextBaseCurrency: string,
) {
  const transactions = await TransactionModel.find({ userId });

  for (const transaction of transactions) {
    const sourceAmount =
      transaction.originalAmount != null
        ? transaction.originalAmount
        : transaction.amount;
    const sourceCurrency =
      transaction.originalCurrency ||
      transaction.baseCurrencyAtTime ||
      previousBaseCurrency;

    const currencyFields = await resolveCurrencyConversion(
      nextBaseCurrency,
      Number(sourceAmount),
      sourceCurrency,
    );

    transaction.set({
      amount: currencyFields.amount,
      originalAmount: currencyFields.originalAmount,
      originalCurrency: currencyFields.originalCurrency,
      baseCurrencyAtTime: currencyFields.baseCurrencyAtTime,
      exchangeRate: currencyFields.exchangeRate,
      rateSource: currencyFields.rateSource,
      exchangeRateFetchedAt: currencyFields.exchangeRateFetchedAt,
    });

    await transaction.save();
  }
}
