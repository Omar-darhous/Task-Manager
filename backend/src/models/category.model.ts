import { Schema, model, type Document, type Types } from 'mongoose'

export interface ICategory extends Document {
  name: string
  userId: Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

const categorySchema = new Schema<ICategory>(
  {
    name: {
      type: String,
      required: [true, 'Category name is required'],
      trim: true,
      minlength: [1, 'Category name cannot be empty'],
      maxlength: [50, 'Category name cannot exceed 50 characters'],
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
      index: true,
    },
  },
  {
    timestamps: true,
  }
)

// Prevent duplicate category names for the same user
categorySchema.index({ name: 1, userId: 1 }, { unique: true })

export const Category = model<ICategory>('Category', categorySchema)
