import { db } from "./db";
import { sql } from "drizzle-orm";

async function createTables() {
  try {
    console.log("Creating tables...");

    // Create users table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(255) PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        first_name VARCHAR(255),
        last_name VARCHAR(255),
        telegram_username VARCHAR(255),
        profile_image_url TEXT,
        password_hash VARCHAR(255),
        role VARCHAR(50) NOT NULL DEFAULT 'client',
        is_active BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create logists table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS logists (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(255) REFERENCES users(id) ON DELETE CASCADE,
        location VARCHAR(255) NOT NULL,
        address TEXT NOT NULL,
        supports_lockers BOOLEAN NOT NULL DEFAULT false,
        supports_offices BOOLEAN NOT NULL DEFAULT false,
        is_active BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create packages table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS packages (
        id SERIAL PRIMARY KEY,
        unique_number VARCHAR(255) UNIQUE NOT NULL,
        client_id VARCHAR(255) REFERENCES users(id) ON DELETE CASCADE,
        logist_id INTEGER REFERENCES logists(id) ON DELETE SET NULL,
        recipient_name VARCHAR(255) NOT NULL,
        recipient_phone VARCHAR(255),
        item_name VARCHAR(255) NOT NULL,
        item_description TEXT,
        tracking_number VARCHAR(255),
        courier_service VARCHAR(255),
        delivery_method VARCHAR(50),
        payment_amount DECIMAL(10,2),
        payment_details TEXT,
        admin_comments TEXT,
        status VARCHAR(50) NOT NULL DEFAULT 'created_client',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create notifications table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(255) REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        type VARCHAR(50) NOT NULL,
        package_id INTEGER REFERENCES packages(id) ON DELETE SET NULL,
        is_read BOOLEAN NOT NULL DEFAULT false,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create messages table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS messages (
        id SERIAL PRIMARY KEY,
        package_id INTEGER REFERENCES packages(id) ON DELETE CASCADE,
        sender_id VARCHAR(255) REFERENCES users(id) ON DELETE CASCADE,
        message TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create package_files table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS package_files (
        id SERIAL PRIMARY KEY,
        package_id INTEGER REFERENCES packages(id) ON DELETE CASCADE,
        filename VARCHAR(255) NOT NULL,
        original_name VARCHAR(255) NOT NULL,
        mime_type VARCHAR(255),
        size INTEGER,
        uploaded_by VARCHAR(255) REFERENCES users(id) ON DELETE SET NULL,
        file_type VARCHAR(50) DEFAULT 'document',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create sessions table for session storage
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS sessions (
        sid VARCHAR NOT NULL COLLATE "default",
        sess JSON NOT NULL,
        expire TIMESTAMP(6) NOT NULL
      )
      WITH (OIDS=FALSE);
    `);

    await db.execute(sql`
      ALTER TABLE sessions ADD CONSTRAINT sessions_pkey PRIMARY KEY (sid) NOT DEFERRABLE INITIALLY IMMEDIATE;
    `);

    // Create demo users
    await db.execute(sql`
      INSERT INTO users (id, email, first_name, last_name, password_hash, role, is_active)
      VALUES 
        ('admin-001', 'admin@package.ru', 'Администратор', 'Системы', '123456', 'admin', true),
        ('logist-001', 'logist@package.ru', 'Логист', 'Системы', '123456', 'logist', true),
        ('client-001', 'client@package.ru', 'Клиент', 'Системы', '123456', 'client', true)
      ON CONFLICT (id) DO NOTHING;
    `);

    // Create demo logist
    await db.execute(sql`
      INSERT INTO logists (user_id, location, address, supports_lockers, supports_offices, is_active)
      VALUES ('logist-001', 'Москва', 'ул. Примерная, д. 123', true, true, true)
      ON CONFLICT DO NOTHING;
    `);

    console.log("Tables created successfully!");
  } catch (error) {
    console.error("Error creating tables:", error);
    throw error;
  }
}

createTables();