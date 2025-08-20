import mongoose from "mongoose";
import bcrypt from "bcryptjs";   // ✅ fixed import
import crypto from "crypto";

const addressSchema = new mongoose.Schema(
  {
    street: { type: String, trim: true, required: true },
    city: { type: String, trim: true, required: true },
    state: { type: String, trim: true },
    postalCode: { type: String, trim: true, required: true },
    country: { type: String, trim: true, required: true },
    isDefault: { type: Boolean, default: false }
  },
  { _id: true }
);

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 80 },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Please provide a valid email address"],
      index: true
    },

    password: {
      type: String,
      required: true,
      minlength: 8,
      select: false // never return by default
    },

    role: {
      type: String,
      enum: ["customer", "seller", "admin"],
      default: "customer",
      index: true
    },

    isVerified: { type: Boolean, default: false },
    emailVerificationToken: { type: String, select: false },
    emailVerificationExpire: { type: Date, select: false },

    resetPasswordToken: { type: String, select: false },
    resetPasswordExpire: { type: Date, select: false },

    passwordChangedAt: { type: Date, select: false },

    store: { type: mongoose.Schema.Types.ObjectId, ref: "Store" },
    cart: { type: mongoose.Schema.Types.ObjectId, ref: "Cart" },

    wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],
    followingStores: [{ type: mongoose.Schema.Types.ObjectId, ref: "Store" }],

    address: { type: [addressSchema], default: [] },   // ✅ embedded schema here

    phone: {
      type: String,
      trim: true,
      match: [/^\+?[1-9]\d{7,14}$/, "Please provide a valid phone (E.164)"]
    },

    loginAttempts: { type: Number, default: 0, select: false },
    lockUntil: { type: Date, select: false },

    isActive: { type: Boolean, default: true, index: true }
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret) => {
        delete ret.password;
        delete ret.resetPasswordToken;
        delete ret.resetPasswordExpire;
        delete ret.passwordChangedAt;
        delete ret.emailVerificationToken;
        delete ret.emailVerificationExpire;
        delete ret.loginAttempts;
        delete ret.lockUntil;
        return ret;
      }
    },
    toObject: { virtuals: true }
  }
);

/* ---------- Hooks ---------- */
userSchema.pre("validate", function (next) {
  if (!this.address) return next();
  const defaults = this.address.filter(a => a.isDefault);
  if (defaults.length > 1) {
    return next(new Error("Only one address can be marked as default."));
  }
  next();
});

userSchema.path("wishlist").validate(function (val) {
  if (!Array.isArray(val)) return true;
  const ids = val.map(v => String(v));
  return ids.length === new Set(ids).size;
}, "Duplicate items in wishlist are not allowed.");

userSchema.path("followingStores").validate(function (val) {
  if (!Array.isArray(val)) return true;
  const ids = val.map(v => String(v));
  return ids.length === new Set(ids).size;
}, "Duplicate stores are not allowed.");

userSchema.pre("save", function (next) {
  if (this.role !== "seller") {
    this.store = undefined;
  }
  next();
});

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  if (!this.isNew) {
    this.passwordChangedAt = new Date(Date.now() - 1000);
  }
  next();
});

/* ---------- Methods ---------- */
userSchema.methods.correctPassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (!this.passwordChangedAt) return false;
  const changedTimestamp = Math.floor(this.passwordChangedAt.getTime() / 1000);
  return changedTimestamp > JWTTimestamp;
};

userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString("hex");
  this.resetPasswordToken = crypto.createHash("sha256").update(resetToken).digest("hex");
  this.resetPasswordExpire = new Date(Date.now() + 15 * 60 * 1000);
  return resetToken;
};

userSchema.methods.createEmailVerificationToken = function () {
  const token = crypto.randomBytes(32).toString("hex");
  this.emailVerificationToken = crypto.createHash("sha256").update(token).digest("hex");
  this.emailVerificationExpire = new Date(Date.now() + 30 * 60 * 1000);
  return token;
};

userSchema.index({ email: 1 }, { unique: true });

export default mongoose.model("User", userSchema);
