import mongoose, { Schema } from "mongoose";
import bcrypt from "bcryptjs";
import IBaseDocument from "../interfaces/IBaseDocument";
import { IUser } from "@/interfaces/IUser";

export interface IUserDocument extends IUser, IBaseDocument {}

const userSchema = new Schema<IUserDocument>(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters"],
      maxlength: [50, "Name cannot exceed 50 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        "Please enter a valid email",
      ],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
      select: false, // Do not include password in queries
    },
    phone: {
      type: String,
      required: [true, "Phone is required"],
      trim: true,
      match: [/^\+?[\d\s\-\(\)]+$/, "Please enter a valid phone number"],
    },
    role: {
      type: String,
      enum: ["patient", "doctor"],
      required: [true, "Role is required"],
    },

    specialization: {
      type: String,
      required: function (this: IUserDocument) {
        return this.role === "doctor";
      },
      trim: true,
    },
    licenseNumber: {
      type: String,
      required: function (this: IUserDocument) {
        return this.role === "doctor";
      },
      unique: true,
      sparse: true,
      trim: true,
    },

    dateOfBirth: {
      type: Date,
      required: function (this: IUserDocument) {
        return this.role === "patient";
      },
    },
    address: {
      type: String,
      required: function (this: IUserDocument) {
        return this.role === "patient";
      },
      trim: true,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (doc, ret) {
        delete ret.password;
        delete ret.__v;
        return ret;
      },
    },
  }
);

userSchema.index({ role: 1 });

userSchema.pre<IUserDocument>("save", async function (next) {
  if (!this.isModified("password")) return next();

  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

userSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

export const User = mongoose.model<IUserDocument>("User", userSchema);
