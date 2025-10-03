import mongoose, { Schema, Document, Types, model, Model } from 'mongoose';

// User interface
export interface IUser extends Document {
  _id: Types.ObjectId;
  username: string;
  email: string;
  password: string;
  chats: Types.ObjectId[];
  lastSeen: Date;
  isOnline: boolean;
}

// Schema definition
const userSchema = new Schema<IUser>(
  {
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    chats: [{ type: Schema.Types.ObjectId, ref: 'Chat' }],
    lastSeen: { type: Date, default: Date.now },
    isOnline: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

const User: Model<IUser> = model<IUser>('User', userSchema);

export default User;
