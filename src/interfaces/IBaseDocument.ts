import { Document } from "mongoose";
export default interface IBaseDocument extends Document {
  createdAt: Date;
  updatedAt: Date;
}