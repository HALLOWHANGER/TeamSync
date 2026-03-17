import mongoose, { Document, Schema } from "mongoose";
import { RoleDocument } from "./roles-permission.model";

export interface MemberDocument extends Document {
  userId: mongoose.Types.ObjectId;
  workspaceId: mongoose.Types.ObjectId;
   role: RoleDocument;
  status: string;
  joinedAt: Date;
}

const statuses = {
   PENDING: "PENDING",
   APPROVED: "APPROVED",
   DENIED: "DENIED",
}

const PendingMemberSchema = new Schema<MemberDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    workspaceId: {
      type: Schema.Types.ObjectId,
      ref: "Workspace",
      required: true,
    },
    role: {
      type: Schema.Types.ObjectId,
      ref: "Role",
      required: true,
      },
    status: {
      type: String,
      enum: Object.values(statuses),
      default: "PENDING",
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

const PendingMemberModel = mongoose.model<MemberDocument>("PendingMember", PendingMemberSchema);
export default PendingMemberModel;
