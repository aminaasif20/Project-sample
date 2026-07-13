import mongoose, { Document, Schema, Types } from 'mongoose';

export interface ITask extends Document {
  title: string;
  description?: string;
  board: string;
  status: 'todo' | 'in_progress' | 'review' | 'blocked' | 'testing' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'critical';
  assignee?: Types.ObjectId;
  reporter?: Types.ObjectId;
  project: Types.ObjectId;
  dueDate?: Date;
  estimatedHours?: number;
  actualHours?: number;
  labels?: string[];
  createdAt: Date;
  updatedAt: Date;
}

const taskSchema = new Schema<ITask>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    board: { type: String, required: true, default: 'Development' },
    status: {
      type: String,
      enum: ['todo', 'in_progress', 'review', 'blocked', 'testing', 'completed', 'cancelled'],
      default: 'todo',
    },
    priority: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'medium' },
    assignee: { type: Schema.Types.ObjectId, ref: 'User' },
    reporter: { type: Schema.Types.ObjectId, ref: 'User' },
    project: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
    dueDate: { type: Date },
    estimatedHours: { type: Number },
    actualHours: { type: Number },
    labels: [{ type: String }],
  },
  { timestamps: true }
);

export const Task = mongoose.model<ITask>('Task', taskSchema);
