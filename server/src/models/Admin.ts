import bcrypt from 'bcryptjs'
import mongoose, { Schema, type Document, type Model } from 'mongoose'

export interface IAdmin extends Document {
  name: string
  email: string
  passwordHash: string
  role: 'owner' | 'admin'
  lastLoginAt: Date | null
  comparePassword(candidate: string): Promise<boolean>
}

const adminSchema = new Schema<IAdmin>(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ['owner', 'admin'], default: 'admin' },
    lastLoginAt: { type: Date, default: null },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret: Record<string, unknown>) {
        delete ret.passwordHash
        delete ret.__v
        return ret
      },
    },
  },
)

adminSchema.methods.comparePassword = function comparePassword(candidate: string) {
  return bcrypt.compare(candidate, this.passwordHash)
}

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 12)
}

export const Admin: Model<IAdmin> =
  (mongoose.models.Admin as Model<IAdmin>) ?? mongoose.model<IAdmin>('Admin', adminSchema)
