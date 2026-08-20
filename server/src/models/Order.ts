import mongoose, { Schema, type Document, type Model, type Types } from 'mongoose'

export interface IOrderItem {
  ticketTypeId: Types.ObjectId
  name: string
  unitPrice: number
  quantity: number
  subtotal: number
}

export interface IOrder extends Document {
  reference: string
  event: Types.ObjectId
  eventTitle: string
  eventStartsAt: Date
  customer: { name: string; email: string; phone: string }
  items: IOrderItem[]
  subtotal: number
  total: number
  currency: string
  status: 'pending' | 'paid' | 'failed' | 'cancelled' | 'refunded'
  ticketsIssued: boolean
  stockReserved: boolean
  holdExpiresAt: Date | null
  paystack: {
    reference: string
    accessCode: string
    authorizationUrl: string
    channel: string | null
    paidAt: Date | null
    raw: unknown
  }
}

const orderItemSchema = new Schema<IOrderItem>(
  {
    ticketTypeId: { type: Schema.Types.ObjectId, required: true },
    name: { type: String, required: true },
    unitPrice: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 },
    subtotal: { type: Number, required: true, min: 0 },
  },
  { _id: false },
)

const orderSchema = new Schema<IOrder>(
  {
    reference: { type: String, required: true, unique: true, index: true },
    event: { type: Schema.Types.ObjectId, ref: 'Event', required: true, index: true },
    // Snapshotted so an order still reads correctly if the event is later edited.
    eventTitle: { type: String, required: true },
    eventStartsAt: { type: Date, required: true },

    customer: {
      name: { type: String, required: true, trim: true },
      email: { type: String, required: true, lowercase: true, trim: true, index: true },
      phone: { type: String, default: '', trim: true },
    },

    items: { type: [orderItemSchema], default: [] },
    subtotal: { type: Number, required: true, min: 0 },
    total: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'NGN' },

    status: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'cancelled', 'refunded'],
      default: 'pending',
      index: true,
    },
    /** Guards against a webhook and a verify call both minting tickets. */
    ticketsIssued: { type: Boolean, default: false },
    /** True while this order is holding stock that has not yet been paid for. */
    stockReserved: { type: Boolean, default: false },
    /** Abandoned checkouts release their hold after this moment. */
    holdExpiresAt: { type: Date, default: null, index: true },

    paystack: {
      reference: { type: String, default: '' },
      accessCode: { type: String, default: '' },
      authorizationUrl: { type: String, default: '' },
      channel: { type: String, default: null },
      paidAt: { type: Date, default: null },
      raw: { type: Schema.Types.Mixed, default: null },
    },
  },
  { timestamps: true, toJSON: { virtuals: true } },
)

orderSchema.index({ createdAt: -1 })
orderSchema.index({ event: 1, status: 1 })

orderSchema.virtual('totalQuantity').get(function (this: IOrder) {
  return this.items.reduce((sum, item) => sum + item.quantity, 0)
})

export const Order: Model<IOrder> =
  (mongoose.models.Order as Model<IOrder>) ?? mongoose.model<IOrder>('Order', orderSchema)
