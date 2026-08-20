import mongoose, { Schema, type Document, type Model, type Types } from 'mongoose'

export interface ITicket extends Document {
  code: string
  order: Types.ObjectId
  orderReference: string
  event: Types.ObjectId
  eventTitle: string
  ticketTypeId: Types.ObjectId
  ticketTypeName: string
  price: number
  attendee: { name: string; email: string }
  status: 'valid' | 'used' | 'void'
  checkedInAt: Date | null
  checkedInBy: string
}

const ticketSchema = new Schema<ITicket>(
  {
    code: { type: String, required: true, unique: true, index: true, uppercase: true },
    order: { type: Schema.Types.ObjectId, ref: 'Order', required: true, index: true },
    orderReference: { type: String, required: true },
    event: { type: Schema.Types.ObjectId, ref: 'Event', required: true, index: true },
    eventTitle: { type: String, required: true },

    ticketTypeId: { type: Schema.Types.ObjectId, required: true },
    ticketTypeName: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },

    attendee: {
      name: { type: String, default: '', trim: true },
      email: { type: String, default: '', lowercase: true, trim: true },
    },

    status: { type: String, enum: ['valid', 'used', 'void'], default: 'valid', index: true },
    checkedInAt: { type: Date, default: null },
    checkedInBy: { type: String, default: '' },
  },
  { timestamps: true, toJSON: { virtuals: true } },
)

ticketSchema.index({ event: 1, status: 1 })

export const Ticket: Model<ITicket> =
  (mongoose.models.Ticket as Model<ITicket>) ?? mongoose.model<ITicket>('Ticket', ticketSchema)
