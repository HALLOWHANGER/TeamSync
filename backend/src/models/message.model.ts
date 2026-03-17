import mongoose, { Document, Schema } from "mongoose";

export interface ReactionType {
  userId: mongoose.Types.ObjectId;
  emoji: string;
}

export interface FileAttachmentType {
  name: string;
  type: string;   // mime type
  size: number;   // bytes
  data: string;   // base64 data URI
}

export interface MessageDocument extends Document {
  chatId: mongoose.Types.ObjectId;
  sender: mongoose.Types.ObjectId;
  content?: string;
  image?: string;
  voiceNote?: string;         // base64 audio data URI
  fileAttachment?: FileAttachmentType;
  replyTo?: mongoose.Types.ObjectId;
  reactions: ReactionType[];
  readBy: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const reactionSchema = new Schema<ReactionType>(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    emoji: { type: String, required: true },
  },
  { _id: false }
);

const fileAttachmentSchema = new Schema<FileAttachmentType>(
  {
    name: { type: String, required: true },
    type: { type: String, required: true },
    size: { type: Number, required: true },
    data: { type: String, required: true },
  },
  { _id: false }
);

const messageSchema = new Schema<MessageDocument>(
  {
    chatId: { type: mongoose.Schema.Types.ObjectId, ref: "Chat", required: true },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    content: { type: String, trim: true },
    image: { type: String },
    voiceNote: { type: String },
    fileAttachment: { type: fileAttachmentSchema, default: null },
    replyTo: { type: mongoose.Schema.Types.ObjectId, ref: "Message", default: null },
    reactions: [reactionSchema],
    readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true }
);

const MessageModel = mongoose.model<MessageDocument>("Message", messageSchema);
export default MessageModel;
