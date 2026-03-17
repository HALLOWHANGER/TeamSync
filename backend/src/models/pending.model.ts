
import mongoose, { Document, Schema } from "mongoose";
import { generateInviteCode } from "../utils/uuid";

export interface PendingDocument extends Document {
   inviteCode: string;
   workspaceId: string;
  createdAt: string;
  updatedAt: string;
}

const pendingSchema = new Schema<PendingDocument>(
  {
    inviteCode: {
      type: String,
      required: true,
      default: generateInviteCode,
      },

    workspaceId: {
      type: String,
      ref: "Workspace",
      required: true,
    },
    
  },
  {
    timestamps: true,
  }
);

const PendingModel = mongoose.model<PendingDocument>("Pending", pendingSchema);
export default PendingModel;
