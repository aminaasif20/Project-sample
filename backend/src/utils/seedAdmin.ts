import bcrypt from 'bcryptjs';
import { User } from '../models/user.model';

export const seedDefaultAdmin = async (): Promise<void> => {
  try {
    const email = process.env.DEFAULT_ADMIN_EMAIL || 'admin@taskflow.com';
    const password = process.env.DEFAULT_ADMIN_PASSWORD || 'Admin123!';

    const existingAdmin = await User.findOne({ email });
    if (existingAdmin) {
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await User.create({
      name: 'System Admin',
      email,
      password: hashedPassword,
      role: 'super_admin',
      isVerified: true,
      isActive: true,
    });

    console.log(`Default admin created: ${email}`);
  } catch (error) {
    console.error('Failed to seed default admin', error);
  }
};
